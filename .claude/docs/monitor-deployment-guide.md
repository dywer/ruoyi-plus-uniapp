# Admin 监控和任务调度中心部署指南

## 问题说明

系统中有两个菜单项显示 404：
- **Admin 监控** - 需要 Spring Boot Admin 服务（端口 9090）
- **任务调度中心** - 需要 SnailJob 服务（端口 8800）

这两个页面是 iframe 内嵌外部服务，需要单独部署对应服务。

## 当前状态

- 两个菜单已暂时禁用（status = '1'）
- 前端环境变量已修改为 `about:blank`
- 不影响系统其他功能使用

## 部署方案

### 方案一：Docker Compose 部署（推荐）

已配置在 `docker-compose.all.yml` 中，取消注释即可：

```yaml
# SnailJob 任务调度中心
snailjob-server:
  image: registry.cn-hangzhou.aliyuncs.com/snail-job/snail-job-server:1.6.0
  container_name: ry-snailjob
  environment:
    TZ: Asia/Shanghai
    SJ_DB_HOST: ry-mysql
    SJ_DB_PORT: 3306
    SJ_DB_USER: root
    SJ_DB_PASSWORD: root
    SJ_DB_NAME: ry-vue
    SJ_REDIS_HOST: ry-redis
    SJ_REDIS_PORT: 6379
    SJ_REDIS_PASSWORD: ruoyi123
    SERVER_PORT: 8800
  ports:
    - "8800:8800"
  networks:
    - ruoyi-network

# Spring Boot Admin 监控
spring-boot-admin:
  image: hapray/spring-boot-admin:2.7.10
  container_name: ry-admin
  environment:
    TZ: Asia/Shanghai
    SERVER_PORT: 9090
  ports:
    - "9090:9090"
  networks:
    - ruoyi-network
```

### 方案二：使用官方提供的 Docker 镜像

**SnailJob:**
```bash
# 查看可用镜像
docker pull registry.cn-baiyin.aliyuncs.com/snail-job/snail-job-server:1.6.0
# 或从其他镜像源获取
```

**Spring Boot Admin:**
```bash
# 可自行构建或使用以下镜像
docker pull dromara/spring-boot-admin:latest
```

### 方案三：本地开发环境运行

如果只需本地开发测试，可以：

1. **Spring Boot Admin** - 创建简单的 Spring Boot 项目，添加 @EnableAdmin 注解
2. **SnailJob** - 参考官方文档 https://www.snailjob.com/ 部署

## 启用步骤

1. 部署对应服务
2. 修改 `plus-ui/.env.development`:
   ```bash
   VITE_APP_MONITOR_ADMIN = 'http://localhost:9090/admin/applications'
   VITE_APP_SNAILJOB_ADMIN = 'http://localhost:8800/snail-job'
   ```
3. 重新构建前端：`cd plus-ui && npm run build:prod`
4. 重启前端容器：`docker restart ry-frontend`
5. 数据库中启用菜单：
   ```sql
   UPDATE sys_menu SET status = '0' WHERE menu_id IN (117, 120);
   ```
6. 刷新浏览器

## 相关资源

- SnailJob 官网：https://www.snailjob.com/
- SnailJob 文档：https://www.snailjob.com/docs/install/docker
- Spring Boot Admin 官网：https://github.com/codecentric/spring-boot-admin
