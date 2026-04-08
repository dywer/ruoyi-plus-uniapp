# Code Patterns - 代码模式库

## 职责范围

收集和整理 RuoYi-Vue-Plus 项目中的优秀代码模式、最佳实践、常见反模式（Anti-Patterns）及重构建议，帮助开发者识别和编写高质量代码。

---

## 核心规范

### 1. 优秀代码模式

#### 1.1 服务层模式

```java
/**
 * 模式：服务层标准结构
 * 适用场景：所有 Service 实现类
 */
@Service
@RequiredArgsConstructor  // Lombok 生成 final 字段构造函数
@Slf4j
public class UserServiceImpl implements UserService {

    // 使用 final + @Autowired 确保依赖不可变
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserVO createUser(CreateUserRequest request) {
        // 1. 参数校验（前置条件检查）
        Assert.notNull(request, "请求参数不能为空");
        Assert.hasText(request.getUsername(), "用户名不能为空");
        
        // 2. 业务规则校验
        checkUsernameUnique(request.getUsername());
        
        // 3. 构建实体
        User user = buildUserFromRequest(request);
        
        // 4. 持久化
        userMapper.insert(user);
        
        // 5. 返回 VO（不直接返回实体）
        return convertToVO(user);
    }

    private void checkUsernameUnique(String username) {
        Long count = userMapper.selectCount(
            new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username)
        );
        if (count > 0) {
            throw new ServiceException("用户名已存在");
        }
    }

    private User buildUserFromRequest(CreateUserRequest request) {
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setDeptId(request.getDeptId());
        user.setStatus(UserStatus.NORMAL.getCode());
        return user;
    }

    private UserVO convertToVO(User user) {
        UserVO vo = new UserVO();
        BeanUtils.copyProperties(user, vo);
        return vo;
    }
}
```

#### 1.2 构建器模式

```java
/**
 * 模式：链式构建复杂对象
 * 适用场景：构建参数较多的对象
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PageResult<T> {
    
    private List<T> records;
    private Long total;
    private Long pageNum;
    private Long pageSize;
    
    /**
     * 静态工厂方法
     */
    public static <T> PageResult<T> of(List<T> records, Long total, Page page) {
        return PageResult.<T>builder()
            .records(records)
            .total(total)
            .pageNum(page.getPageNum())
            .pageSize(page.getPageSize())
            .build();
    }
}

// 使用示例
PageResult<UserVO> result = PageResult.of(userVOs, total, page);
```

#### 1.3 策略模式

```java
/**
 * 模式：策略模式消除 if-else
 * 适用场景：多种支付方式、多种通知渠道等
 */

// 1. 定义策略接口
public interface PaymentStrategy {
    PaymentType getType();
    PayResponse pay(PayRequest request);
    RefundResponse refund(RefundRequest request);
}

// 2. 实现具体策略
@Component
@RequiredArgsConstructor
public class WechatPayStrategy implements PaymentStrategy {
    
    @Override
    public PaymentType getType() {
        return PaymentType.WECHAT;
    }

    @Override
    public PayResponse pay(PayRequest request) {
        // 微信支付实现
    }

    @Override
    public RefundResponse refund(RefundRequest request) {
        // 微信退款实现
    }
}

@Component
@RequiredArgsConstructor
public class AlipayStrategy implements PaymentStrategy {
    
    @Override
    public PaymentType getType() {
        return PaymentType.ALIPAY;
    }

    @Override
    public PayResponse pay(PayRequest request) {
        // 支付宝支付实现
    }
}

// 3. 策略上下文
@Component
@RequiredArgsConstructor
public class PaymentContext {
    
    // Spring 自动注入所有策略实现
    private final List<PaymentStrategy> strategies;
    
    private Map<PaymentType, PaymentStrategy> strategyMap;

    @PostConstruct
    public void init() {
        strategyMap = strategies.stream()
            .collect(Collectors.toMap(
                PaymentStrategy::getType,
                strategy -> strategy
            ));
    }

    public PayResponse pay(PaymentType type, PayRequest request) {
        PaymentStrategy strategy = strategyMap.get(type);
        if (strategy == null) {
            throw new ServiceException("不支持的支付方式：" + type);
        }
        return strategy.pay(request);
    }
}
```

#### 1.4 模板方法模式

```java
/**
 * 模式：模板方法定义处理流程
 * 适用场景：固定流程，部分步骤可定制
 */
public abstract class DataImportTemplate {

    /**
     * 模板方法：定义导入流程
     */
    public final ImportResult importData(MultipartFile file) {
        try {
            // 1. 校验文件
            validateFile(file);
            
            // 2. 解析数据（子类实现）
            List<?> data = parseData(file);
            
            // 3. 数据校验（子类可选实现）
            validateData(data);
            
            // 4. 执行导入（子类实现）
            doImport(data);
            
            // 5. 记录日志
            logImport(data.size());
            
            return ImportResult.success(data.size());
            
        } catch (Exception e) {
            return ImportResult.failure(e.getMessage());
        }
    }

    protected void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new ServiceException("文件不能为空");
        }
        // 校验文件大小、类型等
    }

    protected abstract List<?> parseData(MultipartFile file) throws IOException;

    protected void validateData(List<?> data) {
        // 默认空实现，子类可选择性重写
    }

    protected abstract void doImport(List<?> data);

    protected void logImport(int count) {
        log.info("导入完成，记录数：{}", count);
    }
}

// 使用示例
@Component
public class UserImportTemplate extends DataImportTemplate {
    
    @Override
    protected List<User> parseData(MultipartFile file) throws IOException {
        // 使用 EasyExcel 解析
        return EasyExcel.read(file.getInputStream())
            .head(User.class)
            .sheet()
            .doReadSync();
    }

    @Override
    protected void validateData(List<?> data) {
        List<User> users = (List<User>) data;
        for (User user : users) {
            if (StringUtils.isBlank(user.getUsername())) {
                throw new ServiceException("用户名不能为空");
            }
        }
    }

    @Override
    protected void doImport(List<?> data) {
        List<User> users = (List<User>) data;
        userMapper.insertBatch(users);
    }
}
```

### 2. 常见反模式（Anti-Patterns）

#### 2.1 事务滥用

```java
/**
 * ❌ 反模式：大事务
 * 问题：事务内包含 RPC 调用、耗时操作，导致连接池耗尽
 */
@Service
public class BadTransactionExample {

    @Transactional  // 问题：整个方法在事务中
    public void createUser(CreateUserRequest request) {
        User user = saveUser(request);           // 数据库操作（快）
        sendWelcomeEmail(user);                  // RPC 调用（慢，3 秒）
        sendSmsNotification(user);               // RPC 调用（慢，2 秒）
        syncToCrmSystem(user);                   // HTTP 调用（慢，5 秒）
        // 事务执行时间 = 10 秒 +，连接被长时间占用
    }
}

/**
 * ✅ 正确做法：缩小事务范围
 */
@Service
@RequiredArgsConstructor
public class GoodTransactionExample {

    private final UserMapper userMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(rollbackFor = Exception.class)
    public void createUser(CreateUserRequest request) {
        User user = saveUser(request);  // 只在事务内做数据库操作
        eventPublisher.publishEvent(new UserCreatedEvent(user));  // 发布事件
    }

    @EventListener
    @Async  // 异步处理非数据库操作
    public void handleUserCreated(UserCreatedEvent event) {
        sendWelcomeEmail(event.getUser());
        sendSmsNotification(event.getUser());
        syncToCrmSystem(event.getUser());
    }
}
```

#### 2.2 N+1 查询问题

```java
/**
 * ❌ 反模式：N+1 查询
 * 问题：1 次主查询 + N 次关联查询 = N+1 次数据库交互
 */
public List<OrderVO> listOrders() {
    List<Order> orders = orderMapper.selectList(null);  // 1 次查询
    
    return orders.stream().map(order -> {
        OrderVO vo = new OrderVO();
        vo.setOrder(order);
        // N 次查询：每个订单查一次用户
        vo.setUser(userMapper.selectById(order.getUserId()));
        // N 次查询：每个订单查一次订单项
        vo.setItems(orderItemMapper.selectByOrderId(order.getId()));
        return vo;
    }).collect(Collectors.toList());
}

/**
 * ✅ 正确做法：JOIN 或批量查询
 */
public List<OrderVO> listOrders() {
    // 方式 1：JOIN 一次性查询
    return orderMapper.selectListWithUserAndItems();
    
    // 方式 2：批量查询
    List<Order> orders = orderMapper.selectList(null);
    List<Long> userIds = orders.stream().map(Order::getUserId).toList();
    List<Long> orderIds = orders.stream().map(Order::getId).toList();
    
    // 2 次批量查询代替 N 次单独查询
    Map<Long, User> userMap = userMapper.selectBatchIds(userIds)
        .stream().collect(Collectors.toMap(User::getId, u -> u));
    Map<Long, List<OrderItem>> itemMap = orderItemMapper
        .selectBatchIds(orderIds)
        .stream().collect(Collectors.groupingBy(OrderItem::getOrderId));
    
    // 组装结果
    return orders.stream().map(order -> {
        OrderVO vo = new OrderVO();
        vo.setOrder(order);
        vo.setUser(userMap.get(order.getUserId()));
        vo.setItems(itemMap.get(order.getId()));
        return vo;
    }).collect(Collectors.toList());
}
```

#### 2.3 异常处理不当

```java
/**
 * ❌ 反模式：生吞异常
 * 问题：异常被捕获后不做处理，导致问题难以排查
 */
public void processOrder(Order order) {
    try {
        doSomething(order);
    } catch (Exception e) {
        // 只打印堆栈，不做其他处理
        e.printStackTrace();
        // 或者空 catch，完全生吞异常
    }
}

/**
 * ❌ 反模式：过度泛化的异常
 */
public User getUser(Long id) {
    try {
        return userMapper.selectById(id);
    } catch (Exception e) {  // 捕获所有异常，丢失语义
        throw new Exception("系统错误", e);  // 继续向上抛泛化异常
    }
}

/**
 * ✅ 正确做法：精确异常处理
 */
public void processOrder(Order order) {
    try {
        doSomething(order);
    } catch (OrderNotFoundException e) {
        log.warn("订单不存在：orderId={}", order.getId());
        throw e;  // 重新抛出
    } catch (PaymentException e) {
        log.error("支付失败：orderId={}", order.getId(), e);
        order.setStatus(OrderStatus.PAYMENT_FAILED);
        orderMapper.updateById(order);
        throw e;
    } catch (Exception e) {
        log.error("订单处理失败：orderId={}", order.getId(), e);
        throw new ServiceException("订单处理失败", e);
    }
}
```

#### 2.4 魔法值

```java
/**
 * ❌ 反模式：魔法值散落在代码中
 */
public void checkStatus(Integer status) {
    if (status == 0) {
        // ...
    } else if (status == 1) {
        // ...
    } else if (status == 2) {
        // ...
    }
}

/**
 * ✅ 正确做法：使用枚举
 */
@Getter
@AllArgsConstructor
public enum OrderStatus {
    PENDING(0, "待支付"),
    PAID(1, "已支付"),
    SHIPPED(2, "已发货"),
    COMPLETED(3, "已完成"),
    CANCELLED(4, "已取消");

    private final Integer code;
    private final String desc;

    public static OrderStatus fromCode(Integer code) {
        return Arrays.stream(values())
            .filter(s -> s.code.equals(code))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("无效状态：" + code));
    }
}

// 使用
public void checkStatus(OrderStatus status) {
    if (status == OrderStatus.PENDING) {
        // ...
    }
}
```

### 3. 代码重构建议

#### 3.1 过长方法重构

```java
/**
 * 重构前：方法过长（超过 50 行）
 */
public Order createOrder(CreateOrderRequest request) {
    // 1. 校验参数
    if (request == null) {
        throw new ServiceException("请求参数为空");
    }
    if (request.getUserId() == null) {
        throw new ServiceException("用户 ID 不能为空");
    }
    if (CollectionUtils.isEmpty(request.getItems())) {
        throw new ServiceException("订单商品不能为空");
    }
    
    // 2. 校验商品
    for (OrderItemRequest item : request.getItems()) {
        if (item.getProductId() == null) {
            throw new ServiceException("商品 ID 不能为空");
        }
        if (item.getQuantity() <= 0) {
            throw new ServiceException("商品数量必须大于 0");
        }
        Product product = productMapper.selectById(item.getProductId());
        if (product == null) {
            throw new ServiceException("商品不存在");
        }
        if (product.getStock() < item.getQuantity()) {
            throw new ServiceException("商品库存不足");
        }
    }
    
    // 3. 计算金额
    BigDecimal totalAmount = BigDecimal.ZERO;
    for (OrderItemRequest item : request.getItems()) {
        Product product = productMapper.selectById(item.getProductId());
        BigDecimal itemAmount = product.getPrice()
            .multiply(new BigDecimal(item.getQuantity()));
        totalAmount = totalAmount.add(itemAmount);
    }
    
    // 4. 创建订单
    Order order = new Order();
    order.setOrderNo(generateOrderNo());
    order.setUserId(request.getUserId());
    order.setTotalAmount(totalAmount);
    order.setStatus(OrderStatus.PENDING.getCode());
    orderMapper.insert(order);
    
    // 5. 创建订单项
    for (OrderItemRequest item : request.getItems()) {
        OrderItem orderItem = new OrderItem();
        orderItem.setOrderId(order.getId());
        orderItem.setProductId(item.getProductId());
        orderItem.setQuantity(item.getQuantity());
        Product product = productMapper.selectById(item.getProductId());
        orderItem.setPrice(product.getPrice());
        orderItemMapper.insert(orderItem);
        
        // 6. 扣减库存
        product.setStock(product.getStock() - item.getQuantity());
        productMapper.updateById(product);
    }
    
    return order;
}

/**
 * 重构后：拆分为多个小方法
 */
public Order createOrder(CreateOrderRequest request) {
    validateRequest(request);
    List<Product> products = validateProducts(request.getItems());
    BigDecimal totalAmount = calculateTotalAmount(products, request.getItems());
    
    Order order = createOrderEntity(request, totalAmount);
    createOrderItems(order, request.getItems(), products);
    deductStock(request.getItems(), products);
    
    return order;
}

private void validateRequest(CreateOrderRequest request) {
    Assert.notNull(request, "请求参数为空");
    Assert.notNull(request.getUserId(), "用户 ID 不能为空");
    Assert.notEmpty(request.getItems(), "订单商品不能为空");
}

private List<Product> validateProducts(List<OrderItemRequest> items) {
    List<Long> productIds = items.stream()
        .map(OrderItemRequest::getProductId)
        .filter(Objects::nonNull)
        .toList();
    
    List<Product> products = productMapper.selectBatchIds(productIds);
    if (products.size() != productIds.size()) {
        throw new ServiceException("存在不存在的商品");
    }
    
    // 校验库存
    for (OrderItemRequest item : items) {
        Product product = products.stream()
            .filter(p -> p.getId().equals(item.getProductId()))
            .findFirst()
            .orElseThrow(() -> new ServiceException("商品不存在"));
        
        if (item.getQuantity() <= 0) {
            throw new ServiceException("商品数量必须大于 0");
        }
        if (product.getStock() < item.getQuantity()) {
            throw new ServiceException("商品库存不足");
        }
    }
    
    return products;
}

// ... 其他私有方法
```

---

## 触发关键词

- 代码模式
- 最佳实践
- 重构
- 反模式
- 代码质量
- 设计模式

---

## 相关文件

- [java-architect.md](./java-architect.md) - 架构设计模式
- [code-review.md](./code-review.md) - 代码审查规范
- [ddd-domain-driven-design.md](./ddd-domain-driven-design.md) - DDD 设计

---

*更新时间：2026-04-06*  
*RuoYi-Vue-Plus AI 开发助手*
