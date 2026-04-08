# RuoYi-Vue-Plus Docker 部署指南

本指南介绍如何使用 Docker 进行本地开发和生产部署。

---

## 目录结构

```
ruoyi_plus_uniapp/
├── docker-compose.dev.yml      # 开发环境配置
├── docker-compose.prod.yml     # 生产环境配置
├── docker-build.sh             # 构建脚本
├── docker-start.sh             # 启动脚本
├── .env.example                # 环境变量模板
├── docker/
│   ├── mysql/
│   │   ├── conf/               # MySQL 配置文件
│   │   ├── data/               # MySQL 数据目录
│   │   └── init/               # 初始化 SQL
│   ├── redis/
│   │   ├── conf/               # Redis 配置文件
│   │   └── data/               # Redis 数据目录
│   ├── minio/
│   │   ├── data/               # MinIO 数据目录
│   │   └── config/             # MinIO 配置目录
│   ├── nginx/
│   │   ├── conf/               # Nginx 主配置
│   │   ├── conf.d/             # Nginx 虚拟主机
│   │   ├── html/               # 前端静态文件
│   │   ├── log/                # Nginx 日志
│   │   └── cert/               # SSL 证书
│   ├── server/
│   │   ├── logs/               # 后端日志
│   │   └── temp/               # 临时文件
│   └── snailjob/
│       └── logs/               # SnailJob 日志
```

---

## 快速开始

### 1. 环境要求

- Docker 20.10+
- Docker Compose 2.0+
- 8GB+ 内存
- 50GB+ 磁盘空间

### 2. 克隆项目

```bash
# 克隆项目
git clone https://github.com/your-repo/ruoyi-plus-unapp.git
cd ruoyi-plus-unapp

# 克隆后端源码（如未包含）
git submodule update --init --recursive
```

### 3. 配置环境变量

```bash
# 复制环境配置模板
cp .env.example .env

# 编辑配置（修改密码等敏感信息）
vim .env
```

### 4. 构建后端镜像

```bash
# 方式一：使用构建脚本（推荐）
./docker-build.sh

# 方式二：手动构建
cd ruoyi-plus-uniapp-workflow
mvn clean package -DskipTests
docker build -t ruoyi/ruoyi-server:5.6.0 ruoyi-admin/
```

### 5. 启动服务

```bash
# 开发环境
./docker-start.sh dev

# 生产环境
./docker-start.sh prod
```

---

## 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| Nginx | 80/443 | 前端访问 |
| RuoYi Server | 8080 | 后端 API |
| MySQL | 3306 | 数据库 |
| Redis | 6379 | 缓存 |
| MinIO | 9000/9001 | 对象存储 |
| SnailJob | 8800/17888 | 任务调度 |

---

## 常用命令

### 服务管理

```bash
# 启动所有服务
docker compose -f docker-compose.dev.yml up -d

# 停止所有服务
docker compose -f docker-compose.dev.yml down

# 重启服务
docker compose -f docker-compose.dev.yml restart

# 查看服务状态
docker compose -f docker-compose.dev.yml ps

# 查看日志
docker compose -f docker-compose.dev.yml logs -f

# 查看特定服务日志
docker compose -f docker-compose.dev.yml logs -f ruoyi-server
```

### 容器操作

```bash
# 进入后端容器
docker compose -f docker-compose.dev.yml exec ruoyi-server bash

# 进入数据库容器
docker compose -f docker-compose.dev.yml exec mysql bash

# 进入 Redis 容器
docker compose -f docker-compose.dev.yml exec redis redis-cli -a ruoyi123456
```

### 数据管理

```bash
# 数据库备份
docker compose -f docker-compose.dev.yml exec mysql mysqldump -uroot -proot ry-vue > backup.sql

# 数据库恢复
docker compose -f docker-compose.dev.yml exec -T mysql mysql -uroot -proot ry-vue < backup.sql

# 清理所有数据（谨慎使用）
docker compose -f docker-compose.dev.yml down -v
```

---

## 配置说明

### MySQL 配置

配置文件位置：`docker/mysql/conf/`

```ini
# 自定义配置添加到 my.cnf
[mysqld]
max_connections=1000
innodb_buffer_pool_size=1G
```

### Redis 配置

配置文件位置：`docker/redis/conf/redis.conf`

主要配置项：
- `maxmemory`: 最大内存限制
- `appendonly`: AOF 持久化
- `requirepass`: 密码（在 docker-compose 中设置）

### Nginx 配置

配置文件位置：`docker/nginx/conf.d/`

- `ruoyi.conf`: 前端代理配置
- 支持 HTTPS 需要证书文件放到 `docker/nginx/cert/`

### MinIO 配置

- 访问地址：http://localhost:9000
- 控制台：http://localhost:9001
- 默认账号：ruoyi / ruoyi123456

---

## 生产部署

### 1. 修改环境变量

编辑 `.env` 文件，修改为生产环境配置：

```bash
# 强密码
MYSQL_ROOT_PASSWORD=YourSecurePassword123!
REDIS_PASSWORD=YourRedisPassword123!
MINIO_ROOT_PASSWORD=YourMinioPassword123!

# 域名配置
MINIO_SERVER_URL=https://oss.yourdomain.com
MINIO_BROWSER_REDIRECT_URL=https://minio.yourdomain.com
```

### 2. 配置 HTTPS

```bash
# 将证书文件复制到证书目录
cp your-domain.crt docker/nginx/cert/
cp your-domain.key docker/nginx/cert/

# 修改 nginx.conf.d/ruoyi.conf 启用 HTTPS 配置
```

### 3. 启动生产环境

```bash
./docker-start.sh prod
```

### 4. 资源限制

生产环境配置已包含资源限制，可根据服务器配置调整：

```yaml
deploy:
  resources:
    limits:
      cpus: '4.0'
      memory: 2G
```

---

## 故障排查

### 容器无法启动

```bash
# 查看容器日志
docker compose logs ruoyi-server

# 检查配置文件
docker compose config
```

### 数据库连接失败

```bash
# 检查 MySQL 是否启动
docker compose ps mysql

# 查看 MySQL 日志
docker compose logs mysql

# 测试连接
docker compose exec mysql mysql -uroot -proot -e "SHOW DATABASES;"
```

### 内存不足

```bash
# 查看资源使用
docker stats

# 调整 JVM 参数
JAVA_OPTS: -Xms256m -Xmx512m
```

---

## 健康检查

```bash
# 检查所有服务
curl http://localhost/actuator/health
curl http://localhost:8080/actuator/health
curl http://localhost:9000/minio/health/live
```

---

## 更新升级

```bash
# 拉取最新镜像
docker compose pull

# 停止服务
docker compose down

# 启动服务
docker compose up -d

# 清理旧镜像
docker image prune -f
```

---

## 默认账号

| 系统 | 用户名 | 密码 |
|------|--------|------|
| 管理系统 | admin | admin123 |
| MySQL | root | (见.env 文件) |
| Redis | - | (见.env 文件) |
| MinIO | ruoyi | (见.env 文件) |
| SnailJob | admin | admin123 |

---

## 安全建议

1. **修改默认密码**：所有服务的默认密码必须修改
2. **启用 HTTPS**：生产环境必须使用 HTTPS
3. **限制端口暴露**：仅暴露必要的端口
4. **定期备份**：配置自动备份策略
5. **日志审计**：定期检查日志文件
