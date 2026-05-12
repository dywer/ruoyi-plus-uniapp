# Redis 缓存与分布式锁技能 (Redis Cache & Distributed Lock)

## 适用场景
- 高频数据缓存
- 分布式锁实现
- 会话管理
- 发布/订阅消息
- 限流计数器

## 核心技术栈

### Redis 在 RuoYi 中的应用
| 用途 | 说明 | 实现方式 |
|------|------|----------|
| Token 存储 | 存储 JWT Token 和用户会话 | String 结构 |
| 权限缓存 | 缓存用户角色和权限信息 | Hash 结构 |
| 字典缓存 | 缓存系统字典数据 | Hash 结构 |
| 限流计数 | 接口限流计数器 | String + 过期时间 |
| 分布式锁 | 防止并发问题 | Redisson |

### Redis 数据结构选择
```
┌─────────────────────────────────────────────────────────┐
│  数据结构  │  适用场景            │  RuoYi 应用案例        │
├─────────────────────────────────────────────────────────┤
│  String    │  缓存简单值、计数器   │  Token、验证码、限流  │
│  Hash      │  缓存对象数据         │  用户信息、字典数据    │
│  List      │  消息队列、最新列表   │  操作日志队列         │
│  Set       │  去重、共同好友       │  在线用户集合         │
│  ZSet      │  排行榜、延时队列     │  用户积分排行         │
└─────────────────────────────────────────────────────────┘
```

## Maven 依赖

```xml
<dependencies>
    <!-- Spring Data Redis -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>
    
    <!-- Redisson 分布式锁 -->
    <dependency>
        <groupId>org.redisson</groupId>
        <artifactId>redisson-spring-boot-starter</artifactId>
        <version>3.52.0</version>
    </dependency>
    
    <!-- 连接池 -->
    <dependency>
        <groupId>org.apache.commons</groupId>
        <artifactId>commons-pool2</artifactId>
    </dependency>
</dependencies>
```

## Redis 配置

### application.yml 配置
```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      password: ruoyi123
      database: 0
      timeout: 10s
      ssl.enabled: false

# Redisson 配置
redisson:
  keyPrefix:
  threads: 4
  nettyThreads: 8
  singleServerConfig:
    clientName: RuoYi-Vue-Plus
    connectionMinimumIdleSize: 8
    connectionPoolSize: 32
    idleConnectionTimeout: 10000
    timeout: 3000
```

### RedisConfig 配置类
```java
@Configuration
@EnableCaching
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        
        // 使用 Jackson 序列化器
        Jackson2JsonRedisSerializer<Object> serializer = 
            new Jackson2JsonRedisSerializer<>(Object.class);
        ObjectMapper mapper = new ObjectMapper();
        mapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        mapper.activateDefaultTyping(LaissezFaireSubTypeValidator.instance, 
            ObjectMapper.DefaultTyping.NON_FINAL);
        serializer.setObjectMapper(mapper);
        
        // Key 使用 String 序列化
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        
        // Value 使用 JSON 序列化
        template.setValueSerializer(serializer);
        template.setHashValueSerializer(serializer);
        
        template.afterPropertiesSet();
        return template;
    }
    
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(30))  // 默认缓存 30 分钟
            .serializeKeysWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new GenericJackson2JsonRedisSerializer()));
        
        return RedisCacheManager.builder(factory)
            .cacheDefaults(config)
            .build();
    }
}
```

## 缓存工具类

### RedisCache 工具类
```java
@Component
public class RedisCache {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * 缓存基本的对象
     */
    public <T> void setCacheObject(final String key, final T value) {
        redisTemplate.opsForValue().set(key, value);
    }

    /**
     * 缓存基本的对象（带过期时间）
     */
    public <T> void setCacheObject(final String key, final T value, final long timeout, 
                                    final TimeUnit timeUnit) {
        redisTemplate.opsForValue().set(key, value, timeout, timeUnit);
    }

    /**
     * 获取基本的对象
     */
    public <T> T getCacheObject(final String key) {
        ValueOperations<String, Object> operations = redisTemplate.opsForValue();
        return (T) operations.get(key);
    }

    /**
     * 判断 key 是否存在
     */
    public boolean hasKey(final String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    /**
     * 删除缓存
     */
    public boolean deleteObject(final String key) {
        return Boolean.TRUE.equals(redisTemplate.delete(key));
    }

    /**
     * 设置过期时间
     */
    public boolean expire(final String key, final long timeout, final TimeUnit timeUnit) {
        return Boolean.TRUE.equals(redisTemplate.expire(key, timeout, timeUnit));
    }

    /**
     * 获取过期时间（秒）
     */
    public Long getExpire(final String key) {
        return redisTemplate.getExpire(key, TimeUnit.SECONDS);
    }

    /**
     * 缓存 Hash 结构
     */
    public void setCacheMap(final String key, final Map<String, Object> dataMap) {
        if (dataMap != null) {
            redisTemplate.opsForHash().putAll(key, dataMap);
        }
    }

    /**
     * 获取 Hash 结构
     */
    public Map<Object, Object> getCacheMap(final String key) {
        return redisTemplate.opsForHash().entries(key);
    }

    /**
     * 获取 Hash 单个值
     */
    public <T> T getCacheMapValue(final String key, final String hashKey) {
        return (T) redisTemplate.opsForHash().get(key, hashKey);
    }

    /**
     * 设置 Hash 单个值
     */
    public void setCacheMapValue(final String key, final String hashKey, final Object value) {
        redisTemplate.opsForHash().put(key, hashKey, value);
    }

    /**
     * 删除 Hash 多个字段
     */
    public void deleteMapKeys(final String key, final Object... hashKeys) {
        redisTemplate.opsForHash().delete(key, hashKeys);
    }

    /**
     * 递增计数
     */
    public Long increment(final String key, final long delta) {
        return redisTemplate.opsForValue().increment(key, delta);
    }

    /**
     * 递减计数
     */
    public Long decrement(final String key, final long delta) {
        return redisTemplate.opsForValue().decrement(key, delta);
    }
}
```

## 缓存注解使用

### @Cacheable - 缓存查询结果
```java
@Service
public class UserServiceImpl implements UserService {

    /**
     * 根据 ID 查询用户 - 自动缓存结果
     * key: user::123
     * value: User 对象
     */
    @Cacheable(value = "user", key = "#userId", unless = "#result == null")
    @Override
    public UserVO getById(Long userId) {
        // 缓存未命中时执行数据库查询
        SysUser user = userMapper.selectById(userId);
        return MapstructUtils.convert(user, UserVO.class);
    }
}
```

### @CachePut - 更新缓存
```java
@Service
public class UserServiceImpl implements UserService {

    /**
     * 更新用户 - 同时更新缓存
     * 保证缓存与数据库一致
     */
    @CachePut(value = "user", key = "#userId")
    @Override
    @Transactional
    public UserVO update(Long userId, UserDTO dto) {
        SysUser user = userMapper.selectById(userId);
        MapstructUtils.copy(dto, user);
        userMapper.updateById(user);
        return MapstructUtils.convert(user, UserVO.class);
    }
}
```

### @CacheEvict - 删除缓存
```java
@Service
public class UserServiceImpl implements UserService {

    /**
     * 删除用户 - 删除缓存
     */
    @CacheEvict(value = "user", key = "#userId")
    @Override
    @Transactional
    public void remove(Long userId) {
        userMapper.deleteById(userId);
    }

    /**
     * 批量删除用户 - 删除所有缓存
     */
    @CacheEvict(value = "user", allEntries = true)
    @Override
    @Transactional
    public void removeBatch(List<Long> userIds) {
        userMapper.deleteBatchIds(userIds);
    }
}
```

## 分布式锁实现

### Redisson 配置
```java
@Configuration
public class RedissonConfig {

    @Value("${spring.data.redis.host}")
    private String host;
    
    @Value("${spring.data.redis.port}")
    private int port;
    
    @Value("${spring.data.redis.password:}")
    private String password;

    @Bean
    public RedissonClient redissonClient() {
        Config config = new Config();
        config.useSingleServer()
            .setAddress("redis://" + host + ":" + port);
        
        if (StringUtils.hasText(password)) {
            config.useSingleServer().setPassword(password);
        }
        
        return Redisson.create(config);
    }
}
```

### 分布式锁工具类
```java
@Component
public class DistributedLock {

    @Autowired
    private RedissonClient redissonClient;

    /**
     * 尝试获取锁
     * 
     * @param lockKey 锁的 key
     * @param waitTime 等待时间
     * @param leaseTime 锁持有时间
     * @param unit 时间单位
     * @return 是否获取成功
     */
    public boolean tryLock(String lockKey, long waitTime, long leaseTime, TimeUnit unit) 
            throws InterruptedException {
        RLock lock = redissonClient.getLock(lockKey);
        return lock.tryLock(waitTime, leaseTime, unit);
    }

    /**
     * 释放锁
     */
    public void unlock(String lockKey) {
        RLock lock = redissonClient.getLock(lockKey);
        if (lock.isHeldByCurrentThread()) {
            lock.unlock();
        }
    }

    /**
     * 执行带锁的操作
     */
    public <T> T executeWithLock(String lockKey, long waitTime, long leaseTime, 
                                  TimeUnit unit, Supplier<T> supplier) throws InterruptedException {
        RLock lock = redissonClient.getLock(lockKey);
        boolean locked = false;
        try {
            locked = lock.tryLock(waitTime, leaseTime, unit);
            if (!locked) {
                throw new BusinessException("获取锁失败，请稍后重试");
            }
            return supplier.get();
        } finally {
            if (locked && lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }
}
```

### 使用示例 - 防止重复提交
```java
@Service
public class OrderService {

    @Autowired
    private DistributedLock distributedLock;

    /**
     * 创建订单 - 防止重复提交
     */
    public OrderVO createOrder(CreateOrderDTO dto) {
        String lockKey = "order:create:" + dto.getUserId();
        
        try {
            return distributedLock.executeWithLock(lockKey, 3, 10, 
                TimeUnit.SECONDS, () -> {
                // 1. 检查库存
                checkStock(dto.getProductId(), dto.getQuantity());
                
                // 2. 创建订单
                Order order = new Order();
                order.setUserId(dto.getUserId());
                order.setProductId(dto.getProductId());
                order.setQuantity(dto.getQuantity());
                orderMapper.insert(order);
                
                // 3. 扣减库存
                decreaseStock(dto.getProductId(), dto.getQuantity());
                
                return MapstructUtils.convert(order, OrderVO.class);
            });
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException("操作被中断");
        }
    }
}
```

### 使用示例 - 定时任务防重
```java
@Component
public class ScheduledTask {

    @Autowired
    private DistributedLock distributedLock;

    @Scheduled(cron = "0 0 2 * * ?")  // 每天凌晨 2 点执行
    public void dailyStatistics() {
        String lockKey = "task:daily:statistics";
        
        try {
            boolean locked = distributedLock.tryLock(lockKey, 0, 30, TimeUnit.MINUTES);
            if (!locked) {
                log.warn("定时任务正在执行，跳过本次执行");
                return;
            }
            
            log.info("开始执行每日统计任务");
            
            // 执行业务逻辑
            // ...
            
            log.info("每日统计任务执行完成");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("定时任务被中断", e);
        } finally {
            distributedLock.unlock(lockKey);
        }
    }
}
```

## 限流实现

### 固定窗口限流
```java
@Component
public class RateLimiter {

    @Autowired
    private RedisCache redisCache;

    /**
     * 固定窗口限流
     * 
     * @param key 限流 key
     * @param maxCount 最大请求数
     * @param windowSeconds 窗口大小（秒）
     * @return 是否允许通过
     */
    public boolean tryAcquire(String key, int maxCount, int windowSeconds) {
        String redisKey = "rate:limit:" + key;
        
        // 递增计数
        Long count = redisCache.increment(redisKey, 1);
        
        // 如果是第一次请求，设置过期时间
        if (count == 1) {
            redisCache.expire(redisKey, windowSeconds, TimeUnit.SECONDS);
        }
        
        // 判断是否超过限流阈值
        return count <= maxCount;
    }
}
```

### 滑动窗口限流
```java
@Component
public class SlidingWindowRateLimiter {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * 滑动窗口限流（使用 ZSet 实现）
     * 
     * @param key 限流 key
     * @param maxCount 最大请求数
     * @param windowSeconds 窗口大小（秒）
     * @return 是否允许通过
     */
    public boolean tryAcquire(String key, int maxCount, int windowSeconds) {
        String redisKey = "rate:sliding:" + key;
        long now = System.currentTimeMillis();
        long windowStart = now - windowSeconds * 1000;
        
        // 移除窗口外的请求
        redisTemplate.opsForZSet().removeRangeByScore(redisKey, 0, windowStart);
        
        // 获取当前窗口内的请求数
        Long count = redisTemplate.opsForZSet().zCard(redisKey);
        
        if (count != null && count >= maxCount) {
            return false;
        }
        
        // 添加当前请求
        redisTemplate.opsForZSet().add(redisKey, String.valueOf(now), now);
        redisTemplate.expire(redisKey, windowSeconds, TimeUnit.SECONDS);
        
        return true;
    }
}
```

### 限流注解
```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RateLimit {
    /**
     * 限流 key 前缀
     */
    String prefix() default "";
    
    /**
     * 时间窗口（秒）
     */
    int timeWindow() default 60;
    
    /**
     * 最大请求数
     */
    int maxRequests() default 100;
}
```

### 限流切面
```java
@Aspect
@Component
public class RateLimitAspect {

    @Autowired
    private RateLimiter rateLimiter;

    @Around("@annotation(rateLimit)")
    public Object around(ProceedingJoinPoint point, RateLimit rateLimit) throws Throwable {
        // 生成限流 key
        String key = rateLimit.prefix() + ":" + 
            point.getSignature().toShortString();
        
        // 尝试获取许可
        if (!rateLimiter.tryAcquire(key, rateLimit.maxRequests(), rateLimit.timeWindow())) {
            throw new BusinessException("请求过于频繁，请稍后再试");
        }
        
        return point.proceed();
    }
}
```

## 检查清单

### 缓存使用
- [ ] 缓存 Key 命名规范统一
- [ ] 设置合理的过期时间
- [ ] 避免缓存穿透（查询不存在的数据）
- [ ] 避免缓存雪崩（大量 Key 同时过期）
- [ ] 避免缓存击穿（热点 Key 过期）

### 分布式锁
- [ ] 设置合理的锁超时时间
- [ ] 确保锁一定会释放（finally 块）
- [ ] 验证锁的持有者（避免误删）
- [ ] 处理锁等待超时情况

### 限流
- [ ] 选择合适的限流算法
- [ ] 设置合理的限流阈值
- [ ] 限流提示友好
- [ ] 支持动态调整阈值

### 性能优化
- [ ] 使用批量操作减少网络开销
- [ ] 合理设置连接池参数
- [ ] 监控 Redis 内存使用
- [ ] 定期清理无用 Key
