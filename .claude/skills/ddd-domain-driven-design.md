# DDD 领域驱动设计技能 (Domain-Driven Design)

## 适用场景
- 复杂业务系统架构设计
- 微服务边界划分
- 遗留系统重构
- 业务建模分析
- 战略战术模式落地

## 核心概念

### DDD 战略设计
```
┌─────────────────────────────────────────────────────────┐
│  统一语言 (Ubiquitous Language)                          │
│  - 开发人员和业务人员使用相同的术语                       │
│  - 代码中的类名、方法名直接反映业务概念                   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  限界上下文 (Bounded Context)                            │
│  - 明确业务边界，每个上下文有独立的模型                   │
│  - 上下文映射定义协作关系                                 │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  上下文映射 (Context Mapping)                            │
│  - Partnership: 两个团队协作                               │
│  - Shared Kernel: 共享内核                                │
│  - Customer-Supplier: 客户 - 供应商                       │
│  - Conformist: 追随者                                     │
│  - ACL: 防腐层                                            │
│  - OHS: 开放主机服务                                      │
│  - PL: 发布语言                                           │
└─────────────────────────────────────────────────────────┘
```

### DDD 战术设计
```
┌─────────────────────────────────────────────────────────┐
│  实体 (Entity)      │  有唯一标识，有生命周期             │
│  值对象 (Value Obj) │  无唯一标识，不可变                 │
│  聚合 (Aggregate)   │  实体 + 值对象的集合，有业务一致性   │
│  聚合根 (Root)      │  聚合的入口，外部只能引用聚合根     │
│  领域服务 (Domain)  │  不属于单一实体的业务逻辑           │
│  领域事件 (Event)   │  业务中发生的重要事情               │
└─────────────────────────────────────────────────────────┘
```

## 分层架构

### 标准分层结构
```
┌─────────────────────────────────────────────────────────┐
│                    用户界面层                              │
│                 (Controller / API)                        │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    应用层                                 │
│              (Application Service)                        │
│         协调领域对象，不包含业务逻辑                       │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    领域层                                 │
│           (Domain Entity / Value Object)                 │
│              核心业务逻辑，不依赖其他层                    │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  基础设施层                                │
│          (Repository Impl / ORM / MQ)                    │
│              技术实现细节                                  │
└─────────────────────────────────────────────────────────┘
```

### Maven 模块划分
```xml
<modules>
    <!-- 领域层 - 核心业务 -->
    <module>order-domain</module>
    
    <!-- 应用层 - 业务用例 -->
    <module>order-application</module>
    
    <!-- 接口层 - 控制器 -->
    <module>order-interfaces</module>
    
    <!-- 基础设施层 - 技术实现 -->
    <module>order-infrastructure</module>
</modules>
```

## 代码实现

### 实体类
```java
package com.ruoyi.order.domain.entity;

/**
 * 订单实体 - 聚合根
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order extends BaseEntity {

    private OrderId orderId;
    private UserId userId;
    private Money totalAmount;
    private OrderStatus status;
    private Address shippingAddress;
    
    // 订单项集合
    private List<OrderItem> items;
    
    // 领域行为：创建订单
    public static Order create(UserId userId, List<OrderItem> items, Address address) {
        Order order = new Order();
        order.orderId = OrderId.generate();
        order.userId = userId;
        order.items = items;
        order.shippingAddress = address;
        order.status = OrderStatus.CREATED;
        order.totalAmount = calculateTotal(items);
        
        // 记录领域事件
        order.registerEvent(new OrderCreatedEvent(order));
        
        return order;
    }
    
    // 领域行为：支付订单
    public void pay() {
        if (this.status != OrderStatus.CREATED) {
            throw new DomainException("只有待支付订单才能支付");
        }
        this.status = OrderStatus.PAID;
        this.registerEvent(new OrderPaidEvent(this));
    }
    
    // 领域行为：取消订单
    public void cancel(String reason) {
        if (this.status != OrderStatus.CREATED) {
            throw new DomainException("只有待支付订单才能取消");
        }
        this.status = OrderStatus.CANCELLED;
        this.registerEvent(new OrderCancelledEvent(this, reason));
    }
}

/**
 * 订单项实体
 */
@Data
public class OrderItem {
    private ProductId productId;
    private String productName;
    private Integer quantity;
    private Money unitPrice;
    private Money totalPrice;
    
    public OrderItem(ProductId productId, String productName, 
                     Integer quantity, Money unitPrice) {
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalPrice = unitPrice.multiply(quantity);
    }
}
```

### 值对象
```java
package com.ruoyi.order.domain.valueobject;

/**
 * 金额值对象 - 不可变
 */
@Value
public class Money {
    
    BigDecimal amount;
    Currency currency;
    
    public Money(BigDecimal amount, Currency currency) {
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new DomainException("金额不能为负数");
        }
        this.amount = amount;
        this.currency = currency;
    }
    
    public Money add(Money other) {
        checkCurrency(other);
        return new Money(this.amount.add(other.amount), this.currency);
    }
    
    public Money multiply(int factor) {
        return new Money(this.amount.multiply(BigDecimal.valueOf(factor)), this.currency);
    }
    
    private void checkCurrency(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new DomainException("货币类型不一致");
        }
    }
    
    public static Money zero(Currency currency) {
        return new Money(BigDecimal.ZERO, currency);
    }
}

/**
 * 地址值对象
 */
@Value
public class Address {
    String province;
    String city;
    String district;
    String street;
    String zipCode;
    
    public String getFullAddress() {
        return String.format("%s%s%s%s", province, city, district, street);
    }
}

/**
 * 订单 ID 值对象
 */
@Value
public class OrderId {
    String value;
    
    public static OrderId generate() {
        return new OrderId("ORD" + System.currentTimeMillis() + 
                          UUID.randomUUID().toString().substring(0, 8));
    }
}
```

### 领域服务
```java
package com.ruoyi.order.domain.service;

/**
 * 订单领域服务
 * 处理跨聚合的业务逻辑
 */
@Service
@RequiredArgsConstructor
public class OrderDomainService {

    private final OrderRepository orderRepository;
    private final ProductService productService;
    private final InventoryService inventoryService;

    /**
     * 创建订单 - 复杂业务逻辑
     */
    @Transactional
    public Order createOrder(CreateOrderCommand command) {
        // 1. 验证商品
        List<Product> products = productService.getProducts(command.getProductIds());
        
        // 2. 检查库存
        inventoryService.checkAvailability(command.getProductQuantities());
        
        // 3. 创建订单
        Order order = Order.create(
            new UserId(command.getUserId()),
            buildOrderItems(products, command.getQuantities()),
            command.getShippingAddress()
        );
        
        // 4. 预占库存
        inventoryService.reserveStock(order.getItems(), order.getOrderId());
        
        // 5. 保存订单
        orderRepository.save(order);
        
        // 6. 发布领域事件（异步扣减库存）
        DomainEventPublisher.publish(new OrderCreatedEvent(order));
        
        return order;
    }
    
    /**
     * 取消订单 - 恢复库存
     */
    @Transactional
    public void cancelOrder(OrderId orderId, String reason) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new DomainException("订单不存在"));
        
        order.cancel(reason);
        orderRepository.save(order);
        
        // 释放预占库存
        inventoryService.releaseReservedStock(order.getItems(), orderId);
    }
    
    private List<OrderItem> buildOrderItems(List<Product> products, 
                                             Map<Long, Integer> quantities) {
        return products.stream()
            .map(p -> new OrderItem(
                new ProductId(p.getId()),
                p.getName(),
                quantities.get(p.getId()),
                new Money(p.getPrice(), Currency.CNY)
            ))
            .collect(Collectors.toList());
    }
}
```

### 仓储接口
```java
package com.ruoyi.order.domain.repository;

/**
 * 订单仓储接口 - 定义在领域层
 */
public interface OrderRepository {
    
    Order findById(OrderId orderId);
    
    List<Order> findByUserId(UserId userId);
    
    List<Order> findByStatus(OrderStatus status);
    
    void save(Order order);
    
    void delete(OrderId orderId);
}

/**
 * 商品仓储接口
 */
public interface ProductRepository {
    
    List<Product> findByIds(List<Long> productIds);
    
    void save(Product product);
}
```

### 仓储实现
```java
package com.ruoyi.order.infrastructure.repository;

/**
 * 订单仓储实现 - 基础设施层
 */
@Repository
@RequiredArgsConstructor
public class OrderRepositoryImpl implements OrderRepository {

    private final OrderMapper orderMapper;
    private final OrderItemMapper itemMapper;

    @Override
    public Order findById(OrderId orderId) {
        OrderDO orderDO = orderMapper.selectById(orderId.getValue());
        if (orderDO == null) {
            return null;
        }
        
        List<OrderItemDO> itemDOs = itemMapper.selectByOrderId(orderId.getValue());
        
        // DO 转 Entity
        return OrderConverter.toEntity(orderDO, itemDOs);
    }
    
    @Override
    public List<Order> findByUserId(UserId userId) {
        List<OrderDO> orderDOs = orderMapper.selectByUserId(userId.getValue());
        return OrderConverter.toEntities(orderDOs);
    }
    
    @Override
    public void save(Order order) {
        OrderDO orderDO = OrderConverter.toDO(order);
        if (orderDO.getId() == null) {
            orderMapper.insert(orderDO);
        } else {
            orderMapper.update(orderDO);
        }
        
        // 保存订单项
        saveOrderItems(order);
    }
    
    private void saveOrderItems(Order order) {
        List<OrderItemDO> itemDOs = OrderItemConverter.toDOs(order.getItems());
        itemDOs.forEach(item -> {
            if (item.getId() == null) {
                itemMapper.insertItem(item);
            } else {
                itemMapper.updateItem(item);
            }
        });
    }
}
```

### 领域事件
```java
package com.ruoyi.order.domain.event;

/**
 * 订单创建事件
 */
@Data
public class OrderCreatedEvent implements DomainEvent {
    
    private final Order order;
    private final long timestamp;
    
    public OrderCreatedEvent(Order order) {
        this.order = order;
        this.timestamp = System.currentTimeMillis();
    }
}

/**
 * 订单支付事件
 */
@Data
public class OrderPaidEvent implements DomainEvent {
    
    private final Order order;
    private final long timestamp;
    
    public OrderPaidEvent(Order order) {
        this.order = order;
        this.timestamp = System.currentTimeMillis();
    }
}

/**
 * 事件处理器 - 应用层
 */
@Component
@RequiredArgsConstructor
public class OrderEventHandlers {
    
    private final InventoryService inventoryService;
    private final NotificationService notificationService;
    
    /**
     * 处理订单创建事件 - 扣减库存
     */
    @Async
    @Transactional
    @EventListener(OrderCreatedEvent.class)
    public void handleOrderCreated(OrderCreatedEvent event) {
        Order order = event.getOrder();
        inventoryService.deductStock(order.getItems());
        notificationService.sendOrderCreatedNotice(order);
    }
    
    /**
     * 处理订单支付事件 - 通知仓库发货
     */
    @Async
    @EventListener(OrderPaidEvent.class)
    public void handleOrderPaid(OrderPaidEvent event) {
        Order order = event.getOrder();
        notificationService.sendShipNotice(order);
    }
}
```

## 上下文映射示例

### 订单上下文与库存上下文
```
┌──────────────────────┐         ┌──────────────────────┐
│    订单上下文         │         │    库存上下文         │
│  ------------------- │         │  ------------------- │
│  Order (聚合根)       │         │  Stock (聚合根)       │
│  OrderItem           │         │  Warehouse           │
│  OrderStatus         │         │  StockLevel          │
└──────────────────────┘         └──────────────────────┘
            │                             │
            │      防腐层 (ACL)            │
            └───────────┬─────────────────┘
                        │
            ┌───────────▼───────────┐
            │  InventoryAdapter     │
            │  - checkAvailability  │
            │  - reserveStock       │
            │  - releaseStock       │
            └───────────────────────┘
```

### ACL 实现
```java
package com.ruoyi.order.interfaces.adapter;

/**
 * 防腐层 - 隔离外部上下文
 */
@Component
@RequiredArgsConstructor
public class InventoryAdapter {

    private final InventoryFeignClient inventoryClient;

    /**
     * 检查库存可用性
     */
    public boolean checkAvailability(List<ProductQuantity> products) {
        InventoryCheckRequest request = new InventoryCheckRequest();
        request.setProducts(products.stream()
            .map(p -> com.ruoyi.inventory.api.ProductQuantity.builder()
                .productId(p.getProductId())
                .quantity(p.getQuantity())
                .build())
            .collect(Collectors.toList()));
        
        InventoryCheckResponse response = inventoryClient.check(request);
        return response.isAvailable();
    }
    
    /**
     * 预占库存
     */
    public void reserveStock(List<OrderItem> items, OrderId orderId) {
        ReserveStockRequest request = new ReserveStockRequest();
        request.setOrderId(orderId.getValue());
        request.setItems(convertToInventoryItems(items));
        
        inventoryClient.reserve(request);
    }
    
    /**
     * 释放预占库存
     */
    public void releaseStock(List<OrderItem> items, OrderId orderId) {
        ReleaseStockRequest request = new ReleaseStockRequest();
        request.setOrderId(orderId.getValue());
        request.setItems(convertToInventoryItems(items));
        
        inventoryClient.release(request);
    }
}
```

## 检查清单

### 战略设计
- [ ] 统一语言已定义
- [ ] 限界上下文划分清晰
- [ ] 上下文映射关系明确
- [ ] 业务边界合理

### 战术设计
- [ ] 实体设计合理
- [ ] 值对象不可变
- [ ] 聚合根职责清晰
- [ ] 领域服务无状态
- [ ] 领域事件使用适当

### 架构规范
- [ ] 分层架构清晰
- [ ] 依赖方向正确（指向领域层）
- [ ] 仓储接口定义在领域层
- [ ] 基础设施层实现细节
