# Bug Detective - Bug 排查指南

## 职责范围

规范 RuoYi-Vue-Plus 项目中 Bug 排查、问题定位、日志分析、异常追踪等调试实践，提供系统化的问题诊断方法论和工具使用指南。

---

## 核心规范

### 1. Bug 排查方法论

#### 1.1 问题定位五步法

```markdown
1. **复现问题**: 确定触发条件、环境、步骤
2. **收集信息**: 日志、堆栈、监控数据、用户反馈
3. **定位范围**: 缩小问题模块、组件、代码行
4. **分析根因**: 5 Why 分析法，找到根本原因
5. **验证修复**: 编写测试用例，确保问题彻底解决
```

#### 1.2 问题分类

| 类型 | 特征 | 排查重点 |
|------|------|----------|
| 功能 Bug | 功能未按预期工作 | 业务逻辑、条件判断、数据流 |
| 性能问题 | 响应慢、内存泄漏 | SQL 执行、缓存、线程池 |
| 数据问题 | 数据不一致、丢失 | 事务、并发、数据同步 |
| 集成问题 | 第三方服务调用失败 | 网络、认证、超时配置 |
| 环境问题 | 特定环境复现 | 配置、依赖、系统差异 |

### 2. 日志分析

#### 2.1 日志级别规范

```java
@Slf4j
public class UserService {

    public User getUserById(Long userId) {
        // DEBUG: 详细调试信息，开发环境使用
        log.debug("查询用户，userId: {}", userId);

        try {
            User user = userMapper.selectById(userId);

            // INFO: 正常业务信息
            log.info("查询用户成功，userId: {}, username: {}", userId, user.getUsername());

            return user;

        } catch (Exception e) {
            // ERROR: 错误信息，需要关注和处理
            log.error("查询用户失败，userId: {}", userId, e);
            throw new ServiceException("查询用户失败", e);
        }
    }

    public void batchImport(List<User> users) {
        // WARN: 警告信息，不影响主流程但需要关注
        if (CollectionUtils.isEmpty(users)) {
            log.warn("批量导入用户列表为空");
            return;
        }
    }
}
```

#### 2.2 日志配置

```yaml
# application.yml
logging:
  level:
    root: INFO
    org.dromara: DEBUG
    org.springframework.web: DEBUG
    org.dromara.common.mybatis.core.mapper: DEBUG  # MyBatis SQL 调试

  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"

  file:
    name: logs/ruoyi.log
    max-size: 100MB
    max-history: 30
```

#### 2.3 日志分析技巧

```bash
# 查看最近的错误日志
grep -i "ERROR\|Exception" logs/ruoyi.log | tail -100

# 查看特定用户的操作日志
grep "userId: 12345" logs/ruoyi.log

# 查看慢 SQL
grep "Slow SQL" logs/ruoyi.log

# 查看特定时间段日志
sed -n '/2024-01-15 10:00:00/,/2024-01-15 11:00:00/p' logs/ruoyi.log

# 统计错误类型
grep -oP "(\w+Exception)" logs/ruoyi.log | sort | uniq -c | sort -rn

# 实时跟踪日志
tail -f logs/ruoyi.log | grep --line-buffered "ERROR"
```

### 3. 异常堆栈分析

#### 3.1 异常堆栈解读

```java
// 典型异常堆栈
Caused by: org.springframework.jdbc.BadSqlGrammarException: 
### Error querying database. Cause: com.mysql.jdbc.exceptions.jdbc4.MySQLSyntaxErrorException: 
Table 'ruoyi.sys_user' doesn't exist

// 分析步骤：
1. 从下往上读，最下面是根本原因（表不存在）
2. 中间是框架层异常（JDBC 错误）
3. 最上面是应用层异常（Spring 封装）
```

#### 3.2 常见异常类型

```java
/**
 * 数据库相关异常
 */
// BadSqlGrammarException: SQL 语法错误
// DataIntegrityViolationException: 数据完整性违反（约束、唯一索引）
// CannotGetJdbcConnectionException: 数据库连接失败
// TransientDataAccessResourceException: 临时数据访问异常

/**
 * Spring 相关异常
 */
// BeanCreationException: Bean 创建失败
// NoSuchBeanDefinitionException: Bean 不存在
// TypeMismatchException: 类型不匹配
// MethodArgumentNotValidException: 参数校验失败

/**
 * 业务相关异常
 */
// ServiceException: 业务异常（自定义）
// UnauthorizedException: 未授权
// ForbiddenException: 禁止访问
```

#### 3.3 异常处理最佳实践

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * 处理业务异常
     */
    @ExceptionHandler(ServiceException.class)
    public AjaxResult handleServiceException(ServiceException e) {
        // 业务异常只记录警告日志
        log.warn("业务异常：code={}, message={}", e.getCode(), e.getMessage());
        return AjaxResult.error(e.getCode(), e.getMessage());
    }

    /**
     * 处理数据库异常
     */
    @ExceptionHandler({BadSqlGrammarException.class, DataIntegrityViolationException.class})
    public AjaxResult handleDatabaseException(Exception e) {
        // 数据库异常记录 ERROR 日志
        log.error("数据库异常", e);
        return AjaxResult.error("数据库操作失败");
    }

    /**
     * 处理通用异常
     */
    @ExceptionHandler(Exception.class)
    public AjaxResult handleException(Exception e, HttpServletRequest request) {
        // 记录完整堆栈和请求信息
        log.error("系统异常，URI: {}, Method: {}", 
            request.getRequestURI(), request.getMethod(), e);
        return AjaxResult.error("系统繁忙，请稍后再试");
    }
}
```

### 4. 调试技巧

#### 4.1 远程调试配置

```bash
# 启动参数添加 JPDA
JAVA_OPTS="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"

# IDEA 远程调试配置：
# 1. Run -> Edit Configurations -> + -> Remote
# 2. Host: 服务器 IP, Port: 5005
# 3. 启动应用后点击 Debug 连接
```

#### 4.2 Arthas 在线诊断

```bash
# 启动 Arthas
java -jar arthas-boot.jar

# 查看方法执行详情
trace org.dromara.system.service.UserService getUser '{id, returnObj}'

# 查看方法入参出参
monitor -b -s -n 5 org.dromara.system.service.UserService getUser '{params, returnObj}'

# 查看类加载信息
classloader -t

# 查看 JVM 信息
dashboard
thread -n 3  # 查看 CPU 最高的 3 个线程
heapdump /tmp/dump.hprof  # 堆转储
```

#### 4.3 数据库调试

```sql
-- 查看慢查询
SHOW VARIABLES LIKE 'slow_query%';
SHOW GLOBAL STATUS LIKE 'Slow_queries';

-- 查看正在执行的 SQL
SHOW PROCESSLIST;

-- 查看表锁
SHOW OPEN TABLES WHERE In_use > 0;

-- 查看索引使用情况
EXPLAIN SELECT * FROM sys_user WHERE user_id = 1;

-- 查看事务信息
SELECT * FROM information_schema.innodb_trx;
```

### 5. 问题排查清单

#### 5.1 启动问题

```markdown
- [ ] 检查 JDK 版本是否兼容
- [ ] 检查端口是否被占用
- [ ] 检查数据库连接配置
- [ ] 检查 Redis 连接配置
- [ ] 查看启动日志中的 Bean 创建错误
- [ ] 检查 @MapperScan 包路径是否正确
- [ ] 检查 application.yml 缩进格式
```

#### 5.2 登录认证问题

```markdown
- [ ] 检查用户名密码是否正确
- [ ] 检查用户状态是否正常（冻结/禁用）
- [ ] 检查 Sa-Token 配置
- [ ] 检查 Redis 是否可连接（Session 存储）
- [ ] 检查权限配置是否正确
- [ ] 检查 Token 是否过期
- [ ] 查看登录日志定位失败原因
```

#### 5.3 接口调用问题

```markdown
- [ ] 检查接口 URL 是否正确
- [ ] 检查请求方法（GET/POST）
- [ ] 检查请求参数格式
- [ ] 检查 Content-Type 头
- [ ] 检查认证 Token 是否携带
- [ ] 检查权限是否足够
- [ ] 查看接口入参和返回
- [ ] 检查防火墙/跨域配置
```

#### 5.4 数据问题

```markdown
- [ ] 检查 SQL 是否正确
- [ ] 检查事务是否提交
- [ ] 检查数据权限配置（@DataScope）
- [ ] 检查表名、字段名是否拼写错误
- [ ] 检查数据类型是否匹配
- [ ] 检查唯一约束是否违反
- [ ] 检查外键约束
- [ ] 检查数据是否为 NULL
```

### 6. 性能问题排查

#### 6.1 慢接口定位

```java
@Component
@Aspect
@Slf4j
public class PerformanceAspect {

    @Around("@annotation(org.springframework.web.bind.annotation.RequestMapping)")
    public Object logExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        Object result = joinPoint.proceed();
        long elapsed = System.currentTimeMillis() - start;

        if (elapsed > 1000) {
            log.warn("慢接口：{}, 耗时：{}ms", 
                joinPoint.getSignature().toShortString(), elapsed);
        }

        return result;
    }
}
```

#### 6.2 SQL 性能分析

```sql
-- 开启 SQL 执行时间统计
SET GLOBAL log_slow_queries = ON;
SET GLOBAL long_query_time = 1;  -- 超过 1 秒视为慢查询

-- 查看慢查询日志
mysqldumpslow /var/log/mysql/slow.log

-- 分析单条 SQL
EXPLAIN FORMAT=JSON SELECT * FROM ...;

-- 查看索引建议
SELECT * FROM sys.user WHERE username = 'admin';  -- 执行后
SHOW INDEX FROM sys_user;
```

#### 6.3 内存泄漏排查

```bash
# 查看 JVM 内存使用
jstat -gcutil <pid> 1000

# 堆转储分析
jmap -dump:format=b,file=heap.hprof <pid>
# 使用 MAT 或 JVisualVM 分析

# 查看线程状态
jstack <pid> > thread_dump.txt

# 查看是否有死锁
jstack <pid> | grep -A 20 "deadlock" -i
```

### 7. 生产环境问题排查

#### 7.1 日志收集

```bash
# 收集最近 1 小时日志
journalctl --since "1 hour ago" > last_hour.log

# 收集特定进程日志
ps aux | grep java
kill -3 <pid>  # 输出线程堆栈到日志文件

# 收集系统信息
top -b -n 1 > top_snapshot.txt
free -m > memory_snapshot.txt
df -h > disk_snapshot.txt
```

#### 7.2 紧急恢复

```bash
# 回滚到上一个版本
git reset --hard HEAD~1
mvn clean package -DskipTests
systemctl restart ruoyi

# 降级配置（关闭新功能）
# 修改 application.yml，关闭问题功能
# 重启应用

# 临时扩容
# 增加 JVM 内存
# 增加线程池大小
# 调整数据库连接池
```

---

## 常用排查工具

| 工具 | 用途 | 命令示例 |
|------|------|----------|
| arthas | 在线诊断 | `trace com.example.Service method` |
| jstack | 线程分析 | `jstack <pid> > thread.txt` |
| jmap | 内存分析 | `jmap -dump:file=heap.hprof <pid>` |
| jstat | GC 监控 | `jstat -gcutil <pid> 1000` |
| tcpdump | 网络抓包 | `tcpdump -i eth0 port 8080 -w capture.pcap` |
| strace | 系统调用跟踪 | `strace -p <pid> -o trace.log` |

---

## 触发关键词

- Bug
- 排查
- 调试
- 问题定位
- 日志分析
- 异常处理
- 堆栈跟踪
- 性能问题
- 生产问题

---

## 相关文件

- [error-handler.md](./error-handler.md) - 异常处理规范
- [performance-optimization.md](./performance-optimization.md) - 性能优化
- [springboot-best-practices.md](./springboot-best-practices.md) - Spring Boot 实践

---

*更新时间：2026-04-06*  
*RuoYi-Vue-Plus AI 开发助手*
