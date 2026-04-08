# Performance Doctor - 性能优化指南

## 职责范围

规范 RuoYi-Vue-Plus 项目中的性能优化实践，包括 SQL 调优、缓存策略、JVM 调优、并发处理、接口响应优化等全链路性能提升方案。

---

## 核心规范

### 1. SQL 性能优化

#### 1.1 慢查询定位

```yaml
# application.yml
mybatis-plus:
  configuration:
    # 开启 SQL 日志
    log-impl: org.apache.ibatis.logging.slf4j.Slf4jImpl
    
# 开启慢 SQL 拦截
ruoyi:
  sql:
    slow-query-enabled: true
    slow-query-threshold: 1000  # 1 秒
```

```java
/**
 * SQL 性能拦截器
 */
@Intercepts({
    @Signature(type = StatementHandler.class, method = "query", args = {Statement.class}),
    @Signature(type = StatementHandler.class, method = "update", args = {Statement.class})
})
@Component
public class SqlPerformanceInterceptor implements Interceptor {

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        long startTime = System.currentTimeMillis();
        
        Object result = invocation.proceed();
        
        long elapsed = System.currentTimeMillis() - startTime;
        if (elapsed > 1000) {
            StatementHandler handler = (StatementHandler) invocation.getTarget();
            BoundSql boundSql = handler.getBoundSql();
            log.warn("慢 SQL 执行时间：{}ms, SQL: {}", elapsed, boundSql.getSql());
        }
        
        return result;
    }
}
```

#### 1.2 索引优化

```sql
-- 1. 查看当前索引
SHOW INDEX FROM sys_user;

-- 2. 使用 EXPLAIN 分析执行计划
EXPLAIN SELECT * FROM sys_user WHERE username = 'admin';

-- EXPLAIN 结果关注以下字段：
-- type: system > const > eq_ref > ref > range > index > ALL (至少达到 range 级别)
-- key: 实际使用的索引
-- rows: 扫描行数
-- Extra: Using index(好) / Using temporary(需要优化) / Using filesort(需要优化)

-- 3. 添加索引
-- 等值查询字段
CREATE INDEX idx_username ON sys_user(username);

-- 范围查询字段
CREATE INDEX idx_create_time ON sys_oper_log(oper_time);

-- 组合索引（最左前缀原则）
CREATE INDEX idx_dept_user ON sys_user(dept_id, status);

-- 覆盖索引（避免回表）
CREATE INDEX idx_username_id ON sys_user(username, user_id);

-- 4. 删除无用索引
DROP INDEX idx_unused ON sys_user;
```

#### 1.3 SQL 改写优化

```java
/**
 * ❌ 错误示例：N+1 查询问题
 */
public List<UserVO> listUsers() {
    List<User> users = userMapper.selectList(null);
    return users.stream().map(user -> {
        UserVO vo = new UserVO();
        vo.setUsername(user.getUsername());
        // N+1 问题：每个用户查询一次部门
        vo.setDeptName(deptMapper.selectById(user.getDeptId()).getDeptName());
        return vo;
    }).collect(Collectors.toList());
}

/**
 * ✅ 正确示例：JOIN 一次性查询
 */
public List<UserVO> listUsers() {
    return userMapper.selectListWithDept();
}

// Mapper XML
// <select id="selectListWithDept" resultType="UserVO">
//     SELECT u.user_id, u.username, d.dept_name
//     FROM sys_user u
//     LEFT JOIN sys_dept d ON u.dept_id = d.dept_id
//     WHERE u.deleted = 0
// </select>
```

```sql
-- ❌ 错误：对字段使用函数，索引失效
SELECT * FROM sys_user WHERE DATE(create_time) = '2024-01-15';

-- ✅ 正确：使用范围查询
SELECT * FROM sys_user 
WHERE create_time >= '2024-01-15 00:00:00' 
  AND create_time < '2024-01-16 00:00:00';

-- ❌ 错误：模糊查询 % 在前，索引失效
SELECT * FROM sys_user WHERE username LIKE '%admin%';

-- ✅ 正确：使用全文索引（MySQL 5.7+）
SELECT * FROM sys_user WHERE MATCH(username) AGAINST('admin');

-- ❌ 错误：OR 条件导致索引失效
SELECT * FROM sys_user WHERE username = 'admin' OR phone = '13800138000';

-- ✅ 正确：使用 UNION ALL
SELECT * FROM sys_user WHERE username = 'admin'
UNION ALL
SELECT * FROM sys_user WHERE phone = '13800138000' AND username != 'admin';

-- ❌ 错误：IN 列表过大
SELECT * FROM sys_user WHERE user_id IN (1,2,3,...,1000);

-- ✅ 正确：分批查询
-- 应用层分批，每批 100-200 条
```

### 2. 缓存优化

#### 2.1 Redis 缓存策略

```java
@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * 缓存热点数据
     */
    @Override
    public User getById(Long userId) {
        String cacheKey = "user:" + userId;
        
        // 1. 先查缓存
        User user = (User) redisTemplate.opsForValue().get(cacheKey);
        if (user != null) {
            log.debug("缓存命中：userId={}", userId);
            return user;
        }
        
        // 2. 缓存未命中，查数据库
        user = userMapper.selectById(userId);
        
        // 3. 写入缓存（带随机过期时间，防止缓存雪崩）
        if (user != null) {
            int ttl = 3600 + new Random().nextInt(600);  // 1-1.1 小时
            redisTemplate.opsForValue().set(cacheKey, user, ttl, TimeUnit.SECONDS);
        }
        
        return user;
    }

    /**
     * 更新时删除缓存（Cache Aside 模式）
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(User user) {
        // 1. 先更新数据库
        userMapper.updateById(user);
        
        // 2. 删除缓存（下次读取时重建）
        String cacheKey = "user:" + user.getUserId();
        redisTemplate.delete(cacheKey);
    }
}
```

#### 2.2 缓存穿透/击穿/雪崩防护

```java
@Service
public class CacheService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * 缓存穿透防护：布隆过滤器 + 空值缓存
     */
    public User getUserWithPenetrationProtection(Long userId) {
        String cacheKey = "user:" + userId;
        
        // 1. 布隆过滤器检查（Redisson 实现）
        RBloomFilter<Long> bloomFilter = redissonClient.getBloomFilter("user:bloom");
        if (!bloomFilter.contains(userId)) {
            log.warn("布隆过滤器拦截：userId={}", userId);
            return null;  // 肯定不存在
        }
        
        // 2. 查缓存
        User user = (User) redisTemplate.opsForValue().get(cacheKey);
        if (user != null) {
            return user;
        }
        
        // 3. 查数据库
        user = userMapper.selectById(userId);
        
        // 4. 数据库也没有，缓存空值（防止穿透）
        if (user == null) {
            redisTemplate.opsForValue().set(cacheKey, null, 60, TimeUnit.SECONDS);
            return null;
        }
        
        // 5. 写入正常缓存
        redisTemplate.opsForValue().set(cacheKey, user, 3600, TimeUnit.SECONDS);
        return user;
    }

    /**
     * 缓存击穿防护：互斥锁
     */
    public User getUserWithBreakProtection(Long userId) {
        String cacheKey = "user:" + userId;
        String lockKey = "lock:user:" + userId;
        
        // 1. 查缓存
        User user = (User) redisTemplate.opsForValue().get(cacheKey);
        if (user != null) {
            return user;
        }
        
        // 2. 尝试获取分布式锁
        Boolean locked = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, "1", 10, TimeUnit.SECONDS);
        
        if (Boolean.TRUE.equals(locked)) {
            try {
                // 3. 双重检查缓存
                user = (User) redisTemplate.opsForValue().get(cacheKey);
                if (user != null) {
                    return user;
                }
                
                // 4. 查数据库并缓存
                user = userMapper.selectById(userId);
                redisTemplate.opsForValue().set(cacheKey, user, 3600, TimeUnit.SECONDS);
                
            } finally {
                // 5. 释放锁（Lua 脚本保证原子性）
                String unlockScript = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
                redisTemplate.execute(
                    new DefaultRedisScript<>(unlockScript, Long.class),
                    Collections.singletonList(lockKey),
                    "1"
                );
            }
        } else {
            // 6. 未获取到锁，等待重试
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return getUserWithBreakProtection(userId);  // 递归重试
        }
        
        return user;
    }
}
```

#### 2.3 本地缓存（Caffeine）

```java
@Configuration
public class CaffeineConfig {

    /**
     * 本地缓存配置
     */
    @Bean
    public Cache<String, Object> localCache() {
        return Caffeine.newBuilder()
            .maximumSize(10000)  // 最多 10000 条
            .expireAfterWrite(5, TimeUnit.MINUTES)  // 5 分钟过期
            .recordStats()  // 开启统计
            .build();
    }
}

@Service
public class DictService {

    @Autowired
    private Cache<String, Object> localCache;

    /**
     * 字典数据：本地缓存 + Redis 二级缓存
     */
    public String getDictValue(String dictType, String dictValue) {
        String key = "dict:" + dictType + ":" + dictValue;
        
        // 1. 本地缓存（L1）
        Object cached = localCache.getIfPresent(key);
        if (cached != null) {
            return (String) cached;
        }
        
        // 2. Redis 缓存（L2）
        // ... Redis 查询逻辑
        
        // 3. 写入本地缓存
        localCache.put(key, value);
        
        return value;
    }
}
```

### 3. 并发优化

#### 3.1 线程池配置

```java
@Configuration
public class ThreadPoolConfig {

    /**
     * 业务线程池
     */
    @Bean
    public ThreadPoolTaskExecutor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);  // 核心线程数
        executor.setMaxPoolSize(20);   // 最大线程数
        executor.setQueueCapacity(100); // 队列容量
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("biz-executor-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }

    /**
     * 异步线程池
     */
    @Bean
    public ThreadPoolTaskExecutor asyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("async-executor-");
        executor.initialize();
        return executor;
    }
}
```

#### 3.2 异步处理

```java
@Service
public class OrderService {

    @Autowired
    @Qualifier("asyncExecutor")
    private ThreadPoolTaskExecutor asyncExecutor;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    /**
     * 方式 1：@Async 异步
     */
    @Async("asyncExecutor")
    public void sendOrderEmail(Order order) {
        // 异步发送邮件，不阻塞主流程
        emailService.send(order);
    }

    /**
     * 方式 2：事件驱动异步
     */
    public void createOrder(Order order) {
        // 1. 创建订单（主流程）
        orderMapper.insert(order);
        
        // 2. 发布事件（异步处理）
        eventPublisher.publishEvent(new OrderCreatedEvent(order));
    }

    @EventListener
    @Async("asyncExecutor")
    public void handleOrderCreated(OrderCreatedEvent event) {
        // 异步处理：发送邮件、短信、积分等
        sendOrderEmail(event.getOrder());
        sendSmsNotification(event.getOrder());
        addRewardPoints(event.getOrder());
    }

    /**
     * 方式 3：CompletableFuture 并行
     */
    public OrderDetailVO getOrderDetail(Long orderId) {
        // 并行查询多个数据源
        CompletableFuture<Order> orderFuture = 
            CompletableFuture.supplyAsync(() -> orderMapper.selectById(orderId));
        
        CompletableFuture<User> userFuture = 
            CompletableFuture.supplyAsync(() -> userMapper.selectById(orderId));
        
        CompletableFuture<List<OrderItem>> itemsFuture = 
            CompletableFuture.supplyAsync(() -> orderItemMapper.selectByOrderId(orderId));

        // 等待所有查询完成
        CompletableFuture.allOf(orderFuture, userFuture, itemsFuture).join();

        // 组装结果
        OrderDetailVO vo = new OrderDetailVO();
        vo.setOrder(orderFuture.get());
        vo.setUser(userFuture.get());
        vo.setItems(itemsFuture.get());
        
        return vo;
    }
}
```

#### 3.3 限流保护

```java
@Service
public class RateLimiterService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * 令牌桶限流
     */
    public boolean tryAcquire(String key, int permits, long timeout) {
        String script = 
            "local key = KEYS[1] " +
            "local now = tonumber(ARGV[1]) " +
            "local window = tonumber(ARGV[2]) " +
            "local maxRequests = tonumber(ARGV[3]) " +
            "local requestId = ARGV[4] " +
            "redis.call('ZREMRANGEBYSCORE', key, 0, now - window) " +
            "local current = redis.call('ZCARD', key) " +
            "if current < maxRequests then " +
            "  redis.call('ZADD', key, now, requestId) " +
            "  redis.call('EXPIRE', key, window) " +
            "  return 1 " +
            "else " +
            "  return 0 " +
            "end";

        Long result = (Long) redisTemplate.execute(
            new DefaultRedisScript<>(script, Long.class),
            Collections.singletonList("ratelimit:" + key),
            String.valueOf(System.currentTimeMillis()),
            "60",  // 时间窗口 60 秒
            "100", // 最多 100 次请求
            UUID.randomUUID().toString()
        );

        return result == 1;
    }
}

// 使用示例
@RestController
public class ApiController {

    @Autowired
    private RateLimiterService rateLimiterService;

    @GetMapping("/api/data")
    public AjaxResult getData(HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        
        if (!rateLimiterService.tryAcquire(ip, 1, 60)) {
            return AjaxResult.error("请求过于频繁，请稍后再试");
        }
        
        return AjaxResult.success(service.getData());
    }
}
```

### 4. JVM 调优

#### 4.1 JVM 参数配置

```bash
# 生产环境推荐配置（4GB 内存）
JAVA_OPTS="-Xms2g -Xmx2g \
  -XX:NewSize=512m -XX:MaxNewSize=512m \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/data/logs/heapdump.hprof \
  -XX:+PrintGCDetails -XX:+PrintGCDateStamps \
  -Xloggc:/data/logs/gc.log \
  -XX:+UseGCLogFileRotation \
  -XX:NumberOfGCLogFiles=5 \
  -XX:GCLogFileSize=10M"
```

#### 4.2 GC 日志分析

```bash
# 使用 GCViewer 分析 GC 日志
# 关注指标：
# - GC 频率：Minor GC 每秒不超过 1 次
# - GC 停顿时间：Minor GC < 50ms, Major GC < 500ms
# - 老年代增长速度：过快可能表示内存泄漏

# 查看 GC 统计
jstat -gcutil <pid> 1000 10

# 输出示例：
# S0     S1     E      O      M     CCS    YGC     YGCT    FGC    FGCT     GCT
# 0.00   12.50  45.67  34.21  98.76  12.34   156    2.345    12    1.234   3.579
```

#### 4.3 内存泄漏排查

```bash
# 1. 查看内存使用
jmap -heap <pid>

# 2. 查看对象直方图
jmap -histo:live <pid> | head -50

# 3. 导出堆转储
jmap -dump:format=b,file=/tmp/heap.hprof <pid>

# 4. 使用 MAT 分析：
# - 查看 Dominator Tree 找到占用内存最大的对象
# - 查看 Histogram 按类统计实例数量和大小
# - 使用 OQL 查询特定对象
```

### 5. 接口响应优化

#### 5.1 分页查询优化

```java
/**
 * 分页查询优化：避免深度分页
 */
public List<User> listUsers(Page<User> page) {
    // ❌ 错误：深度分页性能差
    // SELECT * FROM sys_user LIMIT 100000, 10
    
    // ✅ 正确：使用游标分页
    Long lastId = page.getLastId();  // 上一页最后一条记录的 ID
    if (lastId != null) {
        return userMapper.selectByIdGreaterThan(lastId, page.getSize());
        // SELECT * FROM sys_user WHERE user_id > ? ORDER BY user_id LIMIT ?
    }
    
    return userMapper.selectList(page);
}
```

#### 5.2 大数据量导出优化

```java
@Service
public class ExportService {

    /**
     * 流式导出，避免 OOM
     */
    public void exportLargeData(HttpServletResponse response) throws IOException {
        // 使用 EasyExcel 流式写入
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setCharacterEncoding("utf-8");
        
        String fileName = "export_" + System.currentTimeMillis() + ".xlsx";
        response.setHeader("Content-Disposition", 
            "attachment; filename=" + URLEncoder.encode(fileName, "UTF-8"));

        // 流式导出，每次查 1000 条
        EasyExcel.write(response.getOutputStream(), ExportData.class)
            .inMemory(Boolean.FALSE)
            .sheet("数据导出")
            .doWrite(() -> {
                long current = 0;
                long size = 1000;
                List<ExportData> data = dataMapper.selectLimit(current, size);
                
                while (!data.isEmpty()) {
                    yield data;
                    current += size;
                    data = dataMapper.selectLimit(current, size);
                }
            });
    }
}
```

---

## 性能监控

### 1. 应用监控

```java
@Component
public class PerformanceMonitor {

    private final MeterRegistry meterRegistry;

    public PerformanceMonitor(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    // 记录方法执行时间
    public void recordExecutionTime(String methodName, long timeMs) {
        meterRegistry.timer("method.execution.time", 
            "method", methodName).record(timeMs, TimeUnit.MILLISECONDS);
    }

    // 记录缓存命中率
    public void recordCacheHit(String cacheName, boolean hit) {
        meterRegistry.counter("cache.operation", 
            "cache", cacheName, 
            "result", hit ? "hit" : "miss").increment();
    }
}
```

### 2. 数据库监控

```sql
-- 查看当前连接数
SHOW STATUS LIKE 'Threads_connected';

-- 查看慢查询数量
SHOW GLOBAL STATUS LIKE 'Slow_queries';

-- 查看表锁等待
SELECT * FROM sys.innodb_lock_waits;

-- 查看缓冲池命中率
SHOW STATUS LIKE 'Innodb_buffer_pool_read%';
-- 命中率 = (reads - read_requests) / reads * 100%
```

---

## 触发关键词

- 性能优化
- SQL 优化
- 缓存优化
- JVM 调优
- 并发处理
- 慢查询
- 性能监控
- 响应时间

---

## 相关文件

- [mybatis-plus-best-practices.md](./mybatis-plus-best-practices.md) - MyBatis-Plus 实践
- [redis-cache-guide.md](./redis-cache-guide.md) - Redis 缓存
- [bug-detective.md](./bug-detective.md) - Bug 排查

---

*更新时间：2026-04-06*  
*RuoYi-Vue-Plus AI 开发助手*
