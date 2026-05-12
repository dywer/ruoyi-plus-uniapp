# Spring Boot 最佳实践技能 (Spring Boot Best Practices)

## 适用场景
- Spring Boot 3.5.x 项目开发
- 企业级应用开发
- 微服务架构设计
- 代码质量优化

## 核心技术栈
- **Spring Boot**: 3.5.x (实际版本 3.5.14)
- **Spring Framework**: 6.x
- **Java**: 17/21+
- **MyBatis-Plus**: 3.5.16
- **Redisson**: 3.52.0
- **Sa-Token**: 1.44.0

## 项目配置规范

### 1. application.yml 分层配置
```yaml
# application.yml - 通用配置
spring:
  profiles:
    active: ${SPRING_PROFILE:dev}
  application:
    name: @project.artifactId@

# application-dev.yml - 开发环境
server:
  port: 8080
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/dev_db
  data:
    redis:
      host: localhost
      port: 6379

# application-prod.yml - 生产环境
server:
  port: 80
spring:
  datasource:
    url: jdbc:mysql://prod-db:3306/prod_db
    hikari:
      maximum-pool-size: 20
  data:
    redis:
      cluster:
        nodes:
          - redis1:6379
          - redis2:6379
```

### 2. 配置属性类
```java
@Data
@Configuration
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    
    private String name;
    private int maxUploadSize = 10;
    private Security security = new Security();
    
    @Data
    public static class Security {
        private String secretKey;
        private long tokenExpireTime = 1800;
    }
}
```

## 编码规范

### 1. 依赖注入
```java
// 推荐：构造器注入
@Service
@RequiredArgsConstructor
public class UserService {
    private final UserMapper userMapper;
    private final RedisTemplate<String, Object> redisTemplate;
}

// 不推荐：字段注入
@Service
public class UserService {
    @Autowired  // 避免使用
    private UserMapper userMapper;
}
```

### 2. 事务管理
```java
@Service
public class OrderServiceImpl implements OrderService {
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Order createOrder(CreateOrderDTO dto) {
        // 创建订单
        Order order = saveOrder(dto);
        
        // 扣减库存
        inventoryService.deductStock(dto.getItems());
        
        // 扣减余额
        accountService.deductBalance(dto.getUserId(), dto.getAmount());
        
        return order;
    }
    
    @Override
    @Transactional(readOnly = true)
    public Order getOrderById(Long id) {
        return orderMapper.selectById(id);
    }
}
```

### 3. 异常处理
```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    @ExceptionHandler(BusinessException.class)
    public R<Void> handleBusinessException(BusinessException e) {
        log.warn("业务异常：{}", e.getMessage());
        return R.fail(e.getCode(), e.getMessage());
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public R<Void> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult()
                .getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return R.fail(400, message);
    }
    
    @ExceptionHandler(Exception.class)
    public R<Void> handleException(Exception e) {
        log.error("系统异常", e);
        return R.fail("系统繁忙，请稍后再试");
    }
}
```

## REST API 设计规范

### 1. Controller 规范
```java
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    
    @PostMapping
    @SaCheckPermission("system:user:add")
    public R<Long> create(@Valid @RequestBody CreateUserDTO dto) {
        UserVO user = userService.createUser(dto);
        return R.ok(user.getId());
    }
    
    @GetMapping("/{id}")
    @SaCheckPermission("system:user:query")
    public R<UserVO> getById(@PathVariable Long id) {
        return R.ok(userService.getById(id));
    }
    
    @GetMapping("/list")
    @SaCheckPermission("system:user:query")
    public R<PageResult<UserVO>> list(PageQuery query) {
        return R.ok(userService.pageList(query));
    }
    
    @PutMapping("/{id}")
    @SaCheckPermission("system:user:edit")
    public R<Void> update(@PathVariable Long id, 
                          @Valid @RequestBody UpdateUserDTO dto) {
        userService.updateUser(id, dto);
        return R.ok();
    }
    
    @DeleteMapping("/{ids}")
    @SaCheckPermission("system:user:remove")
    public R<Void> delete(@PathVariable List<Long> ids) {
        userService.deleteUsers(ids);
        return R.ok();
    }
}
```

### 2. 统一响应格式
```java
@Data
public class R<T> {
    private Integer code;
    private String message;
    private T data;
    
    public static <T> R<T> ok() {
        return ok(null);
    }
    
    public static <T> R<T> ok(T data) {
        R<T> r = new R<>();
        r.setCode(200);
        r.setMessage("成功");
        r.setData(data);
        return r;
    }
    
    public static <T> R<T> fail(String msg) {
        return fail(500, msg);
    }
    
    public static <T> R<T> fail(Integer code, String msg) {
        R<T> r = new R<>();
        r.setCode(code);
        r.setMessage(msg);
        return r;
    }
}
```

## 缓存最佳实践

### 1. Spring Cache 使用
```java
@Service
public class DictService {
    
    @Cacheable(value = "dict", key = "#type", unless = "#result == null")
    public List<DictData> getDictByType(String type) {
        return dictMapper.selectByType(type);
    }
    
    @CachePut(value = "dict", key = "#dict.type")
    public List<DictData> updateDict(Dict dict) {
        dictMapper.updateById(dict);
        return dictMapper.selectByType(dict.getType());
    }
    
    @CacheEvict(value = "dict", key = "#type")
    public void removeDict(String type) {
        dictMapper.deleteByType(type);
    }
}
```

### 2. Redis 使用
```java
@Service
public class UserCacheService {
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    public void cacheUser(UserVO user) {
        String key = "user:" + user.getId();
        redisTemplate.opsForValue().set(key, user, 30, TimeUnit.MINUTES);
    }
    
    public UserVO getCachedUser(Long userId) {
        String key = "user:" + userId;
        return (UserVO) redisTemplate.opsForValue().get(key);
    }
    
    public void removeCachedUser(Long userId) {
        String key = "user:" + userId;
        redisTemplate.delete(key);
    }
}
```

## 日志规范

### 1. 日志级别使用
```java
@Slf4j
@Service
public class OrderService {
    
    public Order createOrder(CreateOrderDTO dto) {
        log.info("创建订单开始，userId={}, items={}", 
                 dto.getUserId(), dto.getItems().size());
        
        try {
            Order order = doCreateOrder(dto);
            log.info("创建订单成功，orderId={}", order.getId());
            return order;
        } catch (Exception e) {
            log.error("创建订单失败，userId={}", dto.getUserId(), e);
            throw new BusinessException("创建订单失败");
        }
    }
}
```

### 2. 日志配置
```yaml
logging:
  level:
    root: INFO
    com.example: DEBUG
    org.springframework: INFO
    com.example.mapper: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
  file:
    name: logs/app.log
    max-size: 100MB
    max-history: 30
```

## 性能优化

### 1. 数据库优化
- 使用连接池 (HikariCP)
- 合理使用索引
- 避免 N+1 查询
- 批量操作

### 2. 接口优化
- 使用异步处理
- 合理使用缓存
- 分页限制数据量
- 使用 DTO 减少数据传输

## 测试规范

### 1. 单元测试
```java
@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private UserService userService;
    
    @Test
    void testCreateUser() throws Exception {
        CreateUserDTO dto = new CreateUserDTO();
        dto.setUsername("test");
        
        whenuserService.createUser(dto)).thenReturn(new UserVO(1L, "test"));
        
        mockMvc.perform(post("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(JsonUtils.toJson(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }
}
```

## 检查清单

- [ ] 是否使用构造器注入
- [ ] 事务注解是否正确
- [ ] 异常处理是否统一
- [ ] API 设计是否符合 RESTful
- [ ] 缓存策略是否合理
- [ ] 日志记录是否规范
- [ ] 是否有合适的单元测试
- [ ] 配置是否按环境分离
