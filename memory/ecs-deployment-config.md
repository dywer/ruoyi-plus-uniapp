---
name: ECS 部署配置与优化
description: 阿里云 ECS 部署配置、内存优化和资源限制设置
type: reference
---

# 阿里云 ECS 部署配置

## 服务器规格
- **CPU**: 2 核 Intel Xeon Platinum
- **内存**: 1.6GB
- **磁盘**: 40GB
- **Swap**: 2GB

## 资源限制配置

### Docker Compose 资源限制

```yaml
# MySQL 配置
deploy:
  resources:
    limits:
      memory: 512M
      cpus: "1.0"

# Redis 配置
deploy:
  resources:
    limits:
      memory: 256M
      cpus: "0.5"

# 后端配置
deploy:
  resources:
    limits:
      memory: 768M
      cpus: "1.0"

# 前端配置
deploy:
  resources:
    limits:
      memory: 128M
      cpus: "0.25"
```

### JVM 内存配置
```bash
JAVA_OPTS="-Xms256m -Xmx512m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/ruoyi/server/logs/heapdump.hprof -Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8 -Dserver.port=8081"
```

### MySQL 优化配置
```ini
[mysqld]
innodb-buffer-pool-size = 256M
innodb-log-buffer-size = 16M
innodb-flush-log-at-trx-commit = 2
innodb-flush-method = O_DIRECT
max-connections = 100
table-open-cache = 1000
thread-cache-size = 16
tmp-table-size = 32M
max-heap-table-size = 32M
sort-buffer-size = 2M
read-buffer-size = 2M
read-rnd-buffer-size = 1M
key-buffer-size = 16M
max-allowed-packet = 64M
```

### Redis 内存限制
```bash
redis-server --requirepass ruoyi123 --appendonly yes --maxmemory 128mb --maxmemory-policy allkeys-lru
```

## 内存使用参考

正常运行时内存使用（2026-04-08 优化后）：
- **ry-frontend**: ~3MiB / 128MiB (2-3%)
- **ry-server**: ~400-460MiB / 768MiB (52-60%)
- **ry-mysql**: ~350-400MiB / 512MiB (70-80%)
- **ry-redis**: ~6-12MiB / 256MiB (2-5%)

系统总内存使用约 60-65%，预留 35-40% 缓冲空间。

### 优化历史

#### 2026-04-08 模块移除优化

**移除模块**:
- `ruoyi-job`: SnailJob 任务调度模块 (无需任务调度)
- `spring-boot-admin-client`: 监控客户端 (无监控中心)

**保留模块**:
- `ruoyi-system`: 系统管理核心模块
- `ruoyi-workflow`: 工作流引擎 (核心业务)
- `ruoyi-generator`: 代码生成器 (开发工具)
- `ruoyi-demo`: 示例模块 (开发调试)

**优化效果**:
- Jar 包大小：156MB → 132MB (减少 24MB, 15.4%)
- 后端内存：475MB → 405MB (减少 70MB, 14.7%)
- 系统内存：72% → 60% (降低 12%)

#### 内存超配问题修复

**问题**: 初始配置后端内存限制 512MB，JVM Xmx 384MB，导致内存使用率 99%，API 响应超时。

**解决**: 
- 增加后端容器内存限制到 768MB
- 增加 JVM 堆内存到 512MB (Xmx512m)
- 优化后内存使用率降至 52-60%

## 监控命令

```bash
# 查看容器内存使用
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}"

# 查看系统内存
free -h

# 查看 OOM 日志
dmesg | grep -i "out of memory|oom|killed"
```

## 访问地址
- **前端**: http://47.117.247.215/
- **后端 API**: http://47.117.247.215:8081/
- **MySQL**: 47.117.247.215:3306
- **Redis**: 47.117.247.215:6379

## 注意事项

1. **内存限制**: 1.6GB 内存较小，建议升级到 2GB 或 4GB 以获得更好的性能
2. **OOM 风险**: 后端 Java 应用接近内存限制时可能触发 OOM，已配置 HeapDump 用于问题诊断
3. **GC 配置**: 使用默认 GC 策略，避免指定多个 GC 导致冲突
4. **MySQL 优化**: 降低 innodb-buffer-pool-size 以适应小内存环境
