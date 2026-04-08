# 性能优化与 SQL 调优技能 (Performance Optimization & SQL Tuning)

## 适用场景
- 系统性能瓶颈分析
- SQL 查询优化
- 数据库索引设计
- JVM 性能调优
- 接口响应优化

## 性能优化方法论

### 性能优化流程
```
┌─────────────────────────────────────────────────────────┐
│  1. 监控发现  →  2. 定位瓶颈  →  3. 分析原因            │
│                      ↓                                  │
│  6. 验证效果  ←  5. 实施优化  ←  4. 制定方案            │
└─────────────────────────────────────────────────────────┘
```

### 性能指标参考
| 指标 | 优秀 | 良好 | 需优化 |
|------|------|------|--------|
| API 响应时间 | < 100ms | < 500ms | > 1s |
| 数据库查询 | < 50ms | < 200ms | > 500ms |
| JVM GC 时间 | < 50ms | < 200ms | > 500ms |
| CPU 使用率 | < 50% | < 70% | > 80% |
| 内存使用率 | < 60% | < 80% | > 90% |

## SQL 优化

### 常见问题 SQL

#### ❌ 不推荐：SELECT *
```sql
-- 问题：查询所有字段，增加网络传输和内存开销
SELECT * FROM sys_user WHERE user_id = 1;

-- ✅ 推荐：只查询需要的字段
SELECT user_id, user_name, nick_name, email 
FROM sys_user 
WHERE user_id = 1;
```

#### ❌ 不推荐：隐式类型转换
```sql
-- 问题：phone_number 是字符串类型，使用数字比较会导致类型转换
SELECT * FROM sys_user WHERE phone_number = 13800138000;

-- ✅ 推荐：使用字符串比较
SELECT * FROM sys_user WHERE phone_number = '13800138000';
```

#### ❌ 不推荐：函数导致索引失效
```sql
-- 问题：对索引列使用函数，导致索引失效
SELECT * FROM sys_user WHERE DATE(create_time) = '2026-04-06';

-- ✅ 推荐：使用范围查询
SELECT * FROM sys_user 
WHERE create_time >= '2026-04-06 00:00:00' 
  AND create_time < '2026-04-07 00:00:00';
```

#### ❌ 不推荐：模糊查询左匹配
```sql
-- 问题：左模糊查询导致索引失效
SELECT * FROM sys_user WHERE user_name LIKE '%张%';

-- ✅ 推荐：使用全文索引或搜索引擎
-- 或者右模糊查询（可以使用索引）
SELECT * FROM sys_user WHERE user_name LIKE '张%';
```

#### ❌ 不推荐：OR 条件使用不当
```sql
-- 问题：OR 条件中有没有索引的字段，导致索引失效
SELECT * FROM sys_user 
WHERE user_name = 'admin' OR remark IS NOT NULL;

-- ✅ 推荐：使用 UNION ALL
SELECT * FROM sys_user WHERE user_name = 'admin'
UNION ALL
SELECT * FROM sys_user WHERE remark IS NOT NULL;
```

#### ❌ 不推荐：N+1 查询问题
```java
// 问题：循环查询数据库
List<Order> orders = orderMapper.selectList(wrapper);
for (Order order : orders) {
    User user = userMapper.selectById(order.getUserId());
    order.setUser(user);
}

// ✅ 推荐：批量查询
List<Order> orders = orderMapper.selectList(wrapper);
List<Long> userIds = orders.stream()
    .map(Order::getUserId)
    .collect(Collectors.toList());
List<User> users = userMapper.selectBatchIds(userIds);
```

### EXPLAIN 分析

#### EXPLAIN 结果解读
```sql
EXPLAIN SELECT * FROM sys_user WHERE user_name = 'admin';
```

| 字段 | 说明 | 重点关注 |
|------|------|----------|
| id | 查询序号，越小越先执行 | - |
| select_type | 查询类型 | SIMPLE, PRIMARY, SUBQUERY |
| type | 访问类型 | **system > const > eq_ref > ref > range > index > ALL** |
| possible_keys | 可能使用的索引 | - |
| key | 实际使用的索引 | NULL 表示未使用索引 |
| key_len | 索引使用长度 | 越短越好 |
| ref | 关联字段 | - |
| rows | 预计扫描行数 | **越少越好** |
| Extra | 额外信息 | **Using index**(好), **Using temporary**(差), **Using filesort**(差) |

#### type 访问类型详解
```
system     : 只有一行数据，const 的特例
const      : 主键或唯一索引查询
eq_ref     : 主键或唯一索引关联
ref        : 普通索引查询
range      : 索引范围查询
index      : 全索引扫描
ALL        : 全表扫描（最差）
```

### 索引设计原则

#### ✅ 适合建立索引的场景
```sql
-- 1. 频繁查询的字段
CREATE INDEX idx_user_name ON sys_user(user_name);

-- 2.  WHERE 条件中的字段
CREATE INDEX idx_status ON sys_user(status);

-- 3.   ORDER BY 排序字段
CREATE INDEX idx_create_time ON sys_user(create_time DESC);

-- 4.  分组字段
CREATE INDEX idx_dept_id ON sys_user(dept_id);

-- 5.  联合索引（注意字段顺序）
CREATE INDEX idx_dept_status ON sys_user(dept_id, status);
```

#### ❌ 不适合建立索引的场景
```sql
-- 1. 数据量小的表（< 1000 行）

-- 2. 频繁更新的字段
ALTER TABLE sys_user ADD INDEX idx_update_time (update_time); -- 不推荐

-- 3. 区分度低的字段（如性别）
ALTER TABLE sys_user ADD INDEX idx_sex (sex); -- 不推荐

-- 4. 有 NULL 值的字段（影响索引效率）
-- 字段设计时使用 NOT NULL DEFAULT ''
```

#### 联合索引最左前缀原则
```sql
-- 创建联合索引
CREATE INDEX idx_dept_status_user ON sys_user(dept_id, status, user_name);

-- ✅ 可以使用索引
WHERE dept_id = 1
WHERE dept_id = 1 AND status = '0'
WHERE dept_id = 1 AND status = '0' AND user_name = 'admin'

-- ❌ 不能使用完整索引
WHERE status = '0'              -- 跳过 dept_id
WHERE user_name = 'admin'        -- 跳过 dept_id, status
WHERE dept_id = 1 AND user_name  -- 跳过 status
```

## 分页优化

### 深分页问题
```sql
-- ❌ 不推荐：深分页性能差
SELECT * FROM sys_user LIMIT 100000, 10;

-- ✅ 推荐 1：使用子查询
SELECT * FROM sys_user 
WHERE user_id >= (SELECT user_id FROM sys_user LIMIT 100000, 1)
LIMIT 10;

-- ✅ 推荐 2：使用覆盖索引 + JOIN
SELECT u.* FROM sys_user u
INNER JOIN (
    SELECT user_id FROM sys_user LIMIT 100000, 10
) tmp ON u.user_id = tmp.user_id;

-- ✅ 推荐 3：游标分页（适用于连续浏览场景）
SELECT * FROM sys_user 
WHERE user_id > 100000 
ORDER BY user_id 
LIMIT 10;
```

### MyBatis-Plus 分页
```java
// 配置分页插件
@Configuration
public class MybatisPlusConfig {
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }
}

// 使用分页查询
Page<SysUser> page = new Page<>(1, 10);
IPage<SysUser> result = userMapper.selectPage(page, wrapper);
```

## 慢查询优化

### 慢查询日志配置
```yaml
# MySQL 配置
my.cnf:
[mysqld]
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 1  # 超过 1 秒的查询记录为慢查询
log_queries_not_using_indexes = 1
```

### 慢查询分析步骤
```bash
# 1. 查看慢查询日志
tail -f /var/log/mysql/slow.log

# 2. 使用 mysqldumpslow 分析
mysqldumpslow -s t -t 10 /var/log/mysql/slow.log

# 3. 使用 pt-query-digest 分析（更详细）
pt-query-digest /var/log/mysql/slow.log
```

### 常见慢查询原因
| 原因 | 特征 | 解决方案 |
|------|------|----------|
| 全表扫描 | type=ALL, rows 大 | 添加合适索引 |
| 文件排序 | Extra=Using filesort | 优化 ORDER BY |
| 临时表 | Extra=Using temporary | 优化 GROUP BY |
| 锁等待 | Waiting for table lock | 优化事务大小 |
| 数据量过大 | rows>100000 | 分库分表、归档历史数据 |

## JVM 性能调优

### JVM 参数配置
```bash
# 生产环境推荐配置
java -Xms2g -Xmx2g \
     -XX:NewRatio=2 \
     -XX:SurvivorRatio=8 \
     -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=200 \
     -XX:+HeapDumpOnOutOfMemoryError \
     -XX:HeapDumpPath=/data/logs/heap.hprof \
     -jar app.jar
```

### JVM 参数说明
| 参数 | 说明 | 推荐值 |
|------|------|--------|
| -Xms | 初始堆大小 | 与-Xmx 相同，避免动态扩容 |
| -Xmx | 最大堆大小 | 物理内存的 1/2~2/3 |
| -XX:NewRatio | 新生代/老年代比例 | 2 (新生代占 1/3) |
| -XX:SurvivorRatio | Eden/Survivor 比例 | 8 (Eden 占 80%) |
| -XX:+UseG1GC | 使用 G1 垃圾收集器 | 推荐 |
| -XX:MaxGCPauseMillis | 最大 GC 停顿时间目标 | 200ms |

### GC 日志分析
```bash
# 添加 GC 日志参数
-XX:+PrintGCDetails -XX:+PrintGCDateStamps -Xloggc:/data/logs/gc.log

# 使用 GCViewer 分析
# 关注指标：
# - GC 频率
# - GC 停顿时间
# - 堆内存使用趋势
```

## 应用层优化

### 接口优化

#### 异步处理
```java
@Configuration
@EnableAsync
public class AsyncConfig {
    @Bean
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("async-");
        executor.initialize();
        return executor;
    }
}

@Service
public class OrderService {
    @Async
    public void sendOrderNotification(Long orderId) {
        // 异步发送订单通知
    }
}
```

#### 批量处理
```java
// ❌ 不推荐：逐条处理
for (Order order : orders) {
    orderService.process(order);
}

// ✅ 推荐：批量处理
orderService.processBatch(orders);
```

#### 缓存热点数据
```java
@Service
public class DictService {
    
    @Cacheable(value = "dict", key = "#dictType")
    public List<DictData> getDictData(String dictType) {
        return dictDataMapper.selectByType(dictType);
    }
}
```

### 连接池优化

#### Druid 连接池配置
```yaml
spring:
  datasource:
    druid:
      initial-size: 5              # 初始连接数
      min-idle: 10                 # 最小空闲连接
      max-active: 20               # 最大活跃连接
      max-wait: 60000              # 获取连接最大等待时间 (ms)
      time-between-eviction-runs-millis: 60000  # 检测间隔
      min-evictable-idle-time-millis: 300000    # 最小空闲时间
      test-while-idle: true        # 空闲时检测
      test-on-borrow: false        # 获取时不检测
      test-on-return: false        # 归还时不检测
      validation-query: SELECT 1   # 验证查询
```

## 性能监控

### Spring Boot Actuator
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,httpexchanges
  metrics:
    export:
      prometheus:
        enabled: true
```

### 关键监控指标
- 接口响应时间 (P95, P99)
- QPS/TPS
- 错误率
- 数据库连接池使用率
- JVM 内存使用率
- GC 频率和停顿时间

## 检查清单

### SQL 优化
- [ ] 避免 SELECT *
- [ ] 索引使用正确
- [ ] 避免 N+1 查询
- [ ] 分页优化处理
- [ ] 慢查询已分析和优化

### 应用优化
- [ ] 热点数据缓存
- [ ] 批量操作实现
- [ ] 异步处理使用
- [ ] 连接池配置合理

### JVM 优化
- [ ] 堆内存设置合理
- [ ] GC 收集器选择正确
- [ ] GC 日志分析正常
- [ ] 无内存泄漏

### 监控告警
- [ ] 关键指标监控
- [ ] 告警阈值设置
- [ ] 告警通知畅通
