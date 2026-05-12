# Architecture Design - 架构设计模式

## 职责范围

规范 RuoYi-Vue-Plus 项目的架构设计实践，包括分层架构、领域驱动设计（DDD）、微服务拆分、模块设计原则、架构决策记录等。

---

## 核心规范

### 1. 分层架构

#### 1.1 标准四层架构

```
org.dromara.module/
├── controller/           # 控制层（Web 层）
│   ├── UserController.java
│   └── vo/              # 视图对象
│       ├── UserVO.java
│       └── CreateUserRequest.java
│
├── service/             # 业务逻辑层
│   ├── UserService.java
│   └── impl/
│       └── UserServiceImpl.java
│
├── mapper/              # 数据访问层
│   └── UserMapper.java
│
└── domain/              # 领域模型层
    ├── User.java
    └── enums/
        └── UserStatus.java
```

#### 1.2 各层职责

```java
/**
 * Controller 层：只负责请求处理和响应
 * - 参数校验
 * - 调用 Service
 * - 返回 VO
 */
@RestController
@RequestMapping("/system/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    @SaCheckPermission("system:user:add")
    public AjaxResult add(@Validated @RequestBody CreateUserRequest request) {
        UserVO user = userService.createUser(request);
        return AjaxResult.success(user);
    }

    @GetMapping("/{id}")
    public AjaxResult getById(@PathVariable Long id) {
        UserVO user = userService.getUserById(id);
        return AjaxResult.success(user);
    }
}

/**
 * Service 层：核心业务逻辑
 * - 业务规则校验
 * - 事务控制
 * - 调用 Mapper
 * - 领域对象转换
 */
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserVO createUser(CreateUserRequest request) {
        // 业务规则：用户名唯一性校验
        checkUsernameUnique(request.getUsername());
        
        // 构建领域对象
        User user = User.builder()
            .username(request.getUsername())
            .password(passwordEncoder.encode(request.getPassword()))
            .deptId(request.getDeptId())
            .status(UserStatus.NORMAL)
            .build();
        
        userMapper.insert(user);
        
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

    private UserVO convertToVO(User user) {
        UserVO vo = new UserVO();
        BeanUtils.copyProperties(user, vo);
        return vo;
    }
}

/**
 * Mapper 层：数据持久化
 * - 继承 MyBatis-Plus BaseMapper
 * - 复杂查询使用 XML 或 Wrapper
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {

    /**
     * 查询用户及其部门信息
     */
    @Select("SELECT u.*, d.dept_name " +
            "FROM sys_user u " +
            "LEFT JOIN sys_dept d ON u.dept_id = d.dept_id " +
            "WHERE u.user_id = #{userId}")
    UserWithDeptVO selectWithDept(Long userId);
}

/**
 * Domain 层：领域模型
 * - 纯 POJO，不含业务逻辑（贫血模型）
 * - 或使用 DDD 富血模型（见下文）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("sys_user")
public class User {

    @TableId(type = IdType.ASSIGN_ID)
    private Long userId;

    private String username;

    private String password;

    private Long deptId;

    @Enumerated(EnumType.STRING)
    private UserStatus status;

    private LocalDateTime createTime;
}
```

### 2. DDD 领域驱动设计

#### 2.1 领域对象设计

```java
/**
 * 富血模型：领域对象包含业务逻辑
 */
@Getter
@Builder(access = AccessLevel.PRIVATE)
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class Order extends BaseEntity {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    private Long userId;

    @Embedded
    private Money totalAmount;  // 值对象

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    @OneToMany(cascade = CascadeType.ALL)
    @JoinColumn(name = "order_id")
    private List<OrderItem> items;

    // ============ 领域行为 ============

    /**
     * 创建订单（工厂方法）
     */
    public static Order create(Long userId, List<OrderItem> items) {
        Order order = Order.builder()
            .userId(userId)
            .items(items)
            .status(OrderStatus.PENDING)
            .totalAmount(calculateTotal(items))
            .build();
        
        // 触发领域事件
        DomainEventPublisher.publish(new OrderCreatedEvent(order));
        
        return order;
    }

    /**
     * 支付订单
     */
    public void pay() {
        if (this.status != OrderStatus.PENDING) {
            throw new DomainException("订单状态不允许支付");
        }
        this.status = OrderStatus.PAID;
        DomainEventPublisher.publish(new OrderPaidEvent(this));
    }

    /**
     * 取消订单
     */
    public void cancel() {
        if (this.status != OrderStatus.PENDING) {
            throw new DomainException("只有待支付订单可以取消");
        }
        this.status = OrderStatus.CANCELLED;
        DomainEventPublisher.publish(new OrderCancelledEvent(this));
    }

    private static Money calculateTotal(List<OrderItem> items) {
        return items.stream()
            .map(OrderItem::getSubtotal)
            .reduce(Money.ZERO, Money::add);
    }
}

/**
 * 值对象：不可变对象
 */
@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Money implements Serializable {

    public static final Money ZERO = new Money(BigDecimal.ZERO);

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal amount;

    public Money(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("金额不能为负数");
        }
        this.amount = amount.setScale(2, RoundingMode.HALF_UP);
    }

    public Money add(Money other) {
        return new Money(this.amount.add(other.amount));
    }

    public Money subtract(Money other) {
        if (this.amount.compareTo(other.amount) < 0) {
            throw new IllegalArgumentException("余额不足");
        }
        return new Money(this.amount.subtract(other.amount));
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Money money = (Money) o;
        return amount.equals(money.amount);
    }

    @Override
    public int hashCode() {
        return Objects.hash(amount);
    }
}

/**
 * 领域事件
 */
@Getter
@Builder
public class OrderCreatedEvent implements DomainEvent {

    private final Order order;
    private final LocalDateTime occurredOn = LocalDateTime.now();

    @Override
    public Long getAggregateRootId() {
        return order.getId();
    }
}
```

#### 2.2 仓储模式

```java
/**
 * 仓储接口：定义领域对象的存取契约
 */
public interface OrderRepository {

    Order findById(Long id);

    List<Order> findByUserId(Long userId);

    void save(Order order);

    void delete(Order order);

    long count();
}

/**
 * 仓储实现
 */
@Repository
@RequiredArgsConstructor
public class OrderRepositoryImpl implements OrderRepository {

    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;

    @Override
    public Order findById(Long id) {
        Order order = orderMapper.selectById(id);
        if (order == null) {
            return null;
        }
        // 加载关联对象
        List<OrderItem> items = orderItemMapper.selectByOrderId(id);
        order.setItems(items);
        return order;
    }

    @Override
    public List<Order> findByUserId(Long userId) {
        return orderMapper.selectList(
            new LambdaQueryWrapper<Order>()
                .eq(Order::getUserId, userId)
                .orderByDesc(Order::getCreateTime)
        );
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void save(Order order) {
        if (order.getId() == null) {
            orderMapper.insert(order);
            // 保存关联对象
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    item.setOrderId(order.getId());
                    orderItemMapper.insert(item);
                }
            }
        } else {
            orderMapper.updateById(order);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Order order) {
        // 先删除关联对象
        orderItemMapper.delete(
            new LambdaQueryWrapper<OrderItem>()
                .eq(OrderItem::getOrderId, order.getId())
        );
        orderMapper.deleteById(order.getId());
    }

    @Override
    public long count() {
        return orderMapper.selectCount(null);
    }
}
```

### 3. 模块设计原则

#### 3.1 高内聚低耦合

```java
/**
 * ❌ 错误：模块间直接依赖实现类
 */
@Service
public class OrderService {
    @Autowired
    private UserServiceImpl userService;  // 依赖实现类
}

/**
 * ✅ 正确：依赖接口
 */
@Service
@RequiredArgsConstructor
public class OrderService {
    private final UserService userService;  // 依赖接口
}

/**
 * ✅ 更好：使用事件解耦
 */
@Service
@RequiredArgsConstructor
public class OrderService {
    private final ApplicationEventPublisher eventPublisher;

    public void createOrder(CreateOrderRequest request) {
        Order order = createOrderInternal(request);
        // 发布事件，解耦下游服务
        eventPublisher.publishEvent(new OrderCreatedEvent(order));
    }
}
```

#### 3.2 包结构设计

```
org.dromara/
├── common/               # 公共模块
│   ├── core/            # 核心工具类
│   ├── exception/       # 异常处理
│   ├── utils/           # 通用工具
│   └── constants/       # 常量定义
│
├── system/              # 系统模块
│   ├── user/           # 用户管理
│   ├── role/           # 角色管理
│   ├── menu/           # 菜单管理
│   └── dept/           # 部门管理
│
├── business/            # 业务模块
│   ├── order/          # 订单管理
│   ├── product/        # 商品管理
│   └── customer/       # 客户管理
│
└── framework/           # 框架模块
    ├── aspect/         # 切面
    ├── config/         # 配置
    ├── security/       # 安全
    └── web/            # Web 配置
```

### 4. 架构决策记录（ADR）

```markdown
# ADR-001: 选择 MyBatis-Plus 作为 ORM 框架

## 状态
已采纳

## 背景
需要选择一个 ORM 框架来简化数据库操作，提高开发效率。

## 选项

### 选项 1：MyBatis-Plus
优点：
- 与 RuoYi 框架深度集成
- 学习成本低，团队熟悉
- 丰富的 CRUD 封装
- 支持 Lambda 表达式，类型安全

缺点：
- 复杂查询仍需写 SQL
- 动态 SQL 能力较弱

### 选项 2：JPA/Hibernate
优点：
- 全功能 ORM
- 对象关系映射更完善

缺点：
- 学习曲线陡峭
- 性能调优复杂
- 与 RuoYi 集成度低

## 决策
选择 MyBatis-Plus

## 后果
- 需要编写部分 SQL
- 保持与 RuoYi 的一致性
- 团队快速上手
```

---

## 架构模式

| 模式 | 适用场景 | 示例 |
|------|----------|------|
| 分层架构 | 大多数业务系统 | Controller-Service-Mapper |
| DDD 领域驱动 | 复杂业务逻辑 | Order.pay(), Order.cancel() |
| CQRS | 读写分离场景 | 查询用 MP Wrapper，命令用 Domain |
| 事件驱动 | 模块解耦 | ApplicationEvent |
| 策略模式 | 多种算法/策略 | PaymentStrategy |

---

## 触发关键词

- 架构设计
- DDD
- 领域驱动
- 分层架构
- 模块化
- 架构决策

---

## 相关文件

- [java-architect.md](./java-architect.md) - Java 架构设计模式
- [ddd-domain-driven-design.md](./ddd-domain-driven-design.md) - DDD 详解
- [code-patterns.md](./code-patterns.md) - 代码模式库

---

*更新时间：2026-04-06*  
*RuoYi-Vue-Plus AI 开发助手*
