# Java 架构师技能 (Java Architect)

## 适用场景
- 企业级 Java 应用架构设计
- Spring Boot 3.x 微服务开发
- 系统重构和代码优化
- 架构决策和技术选型

## 核心技术栈
- **Java**: 17/21+
- **Spring Boot**: 3.x/4.x
- **Spring Cloud**: 微服务生态
- **MyBatis-Plus/JPA**: 持久层框架
- **Redis**: 分布式缓存

## 架构模式支持

### 1. 分层架构 (Layered Architecture)
```
┌─────────────────┐
│  Controller 层   │  HTTP 请求处理
├─────────────────┤
│   Service 层    │  业务逻辑
├─────────────────┤
│   Mapper 层     │  数据访问
├─────────────────┤
│   Database      │  数据存储
└─────────────────┘
```

### 2. 六边形架构 (Hexagonal Architecture)
- 核心域在中心，外部适配器环绕
- 端口和适配器模式
- 依赖倒置原则

### 3. DDD 领域驱动设计
- 实体 (Entity)
- 值对象 (Value Object)
- 聚合根 (Aggregate Root)
- 领域服务 (Domain Service)
- 仓储 (Repository)

### 4. Clean Architecture
- 实体层 (Entities)
- 用例层 (Use Cases)
- 接口适配器层 (Interface Adapters)
- 框架层 (Frameworks)

## Spring Boot 最佳实践

### 1. 项目结构规范
```
com.example.project/
├── Application.java          # 启动类
├── controller/               # REST 控制器
├── service/                  # 业务层
│   └── impl/                # 服务实现
├── mapper/                   # 数据访问层
├── domain/                   # 领域模型
├── dto/                      # 数据传输对象
├── vo/                       # 视图对象
├── config/                   # 配置类
└── common/                   # 通用组件
```

### 2. 实体类设计
```java
@Data
@TableName("sys_user")
public class SysUser {
    
    @TableId(value = "user_id", type = IdType.ASSIGN_ID)
    private Long userId;
    
    @TableField(fill = FieldFill.INSERT)
    private Date createTime;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Date updateTime;
    
    @TableLogic
    private Integer delFlag;
}
```

### 3. Service 层规范
```java
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    
    private final UserMapper userMapper;
    private final RedisTemplate<String, Object> redisTemplate;
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserVO createUser(CreateUserDTO dto) {
        // 参数校验
        ValidationUtils.validate(dto);
        
        // 业务逻辑
        User user = MapstructUtils.convert(dto, User.class);
        userMapper.insert(user);
        
        // 缓存处理
        cacheUser(user);
        
        return MapstructUtils.convert(user, UserVO.class);
    }
}
```

### 4. Controller 层规范
```java
@RestController
@RequestMapping("/system/user")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    
    @SaCheckPermission("system:user:add")
    @PostMapping
    public R<Void> add(@Valid @RequestBody CreateUserDTO dto) {
        userService.createUser(dto);
        return R.ok();
    }
    
    @SaCheckPermission("system:user:query")
    @GetMapping("/list")
    public R<PageResult<UserVO>> list(PageQuery query) {
        return R.ok(userService.pageList(query));
    }
}
```

## 设计模式应用

### 1. 策略模式 (Strategy Pattern)
```java
public interface PaymentStrategy {
    void pay(Order order);
}

@Service
public class AlipayStrategy implements PaymentStrategy {
    @Override
    public void pay(Order order) {
        // 支付宝支付逻辑
    }
}

@Service
public class WechatPayStrategy implements PaymentStrategy {
    @Override
    public void pay(Order order) {
        // 微信支付逻辑
    }
}
```

### 2. 模板方法模式 (Template Method)
```java
public abstract class DataImporter {
    
    public final void importData(File file) {
        validate(file);
        List<Data> data = parse(file);
        save(data);
        log(file);
    }
    
    protected abstract void validate(File file);
    protected abstract List<Data> parse(File file);
    protected abstract void save(List<Data> data);
}
```

### 3. 工厂模式 (Factory Pattern)
```java
@Component
public class NotificationFactory {
    
    private final Map<String, Notification> notifications = new HashMap<>();
    
    public Notification getNotification(String type) {
        return notifications.get(type);
    }
}
```

## 微服务架构

### 1. 服务拆分原则
- 单一职责
- 高内聚低耦合
- 按业务领域拆分
- 数据自治

### 2. 服务间通信
- REST API (同步)
- 消息队列 (异步)
- gRPC (高性能)

### 3. 服务治理
- 服务注册与发现
- 负载均衡
- 熔断降级
- 限流

## 性能优化实践

### 1. 缓存策略
```java
@Cacheable(value = "user", key = "#id", unless = "#result == null")
public UserVO getUserById(Long id) {
    return userMapper.selectById(id);
}

@CacheEvict(value = "user", key = "#user.id")
public void updateUser(User user) {
    userMapper.updateById(user);
}
```

### 2. 异步处理
```java
@Async("taskExecutor")
public CompletableFuture<Void> asyncSendNotification(User user) {
    // 异步发送通知
    return CompletableFuture.completedFuture(null);
}
```

### 3. 批量操作
```java
@Transactional
public void batchInsert(List<User> users) {
    int batchSize = 1000;
    for (int i = 0; i < users.size(); i++) {
        userMapper.insert(users.get(i));
        if (i % batchSize == 0) {
            sqlSession.flushStatements();
        }
    }
}
```

## 代码重构指南

### 1. 代码异味识别
- 过长的方法
- 过大的类
- 重复代码
- 过度耦合
- 不恰当的命名

### 2. 重构技巧
- 提取方法 (Extract Method)
- 提取类 (Extract Class)
- 移动方法 (Move Method)
- 引入参数对象 (Introduce Parameter Object)
- 以多态取代条件表达式

## 技术选型建议

### 1. 持久层选择
| 场景 | 推荐框架 |
|------|----------|
| 简单 CRUD | MyBatis-Plus |
| 复杂查询 | MyBatis XML |
| 领域驱动 | JPA/Hibernate |
| 读写分离 | ShardingSphere |

### 2. 缓存选择
| 场景 | 推荐方案 |
|------|----------|
| 本地缓存 | Caffeine |
| 分布式缓存 | Redis |
| 多级缓存 | Caffeine + Redis |

## 架构评审清单

- [ ] 分层是否清晰
- [ ] 职责是否单一
- [ ] 依赖方向是否正确
- [ ] 扩展性是否足够
- [ ] 性能是否有保障
- [ ] 安全是否考虑周全
- [ ] 监控是否完善
- [ ] 日志是否规范
