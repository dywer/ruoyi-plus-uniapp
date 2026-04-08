---
name: MySQL 中文编码配置规范
description: Docker MySQL utf8mb4 字符集配置和全链路 UTF-8 编码规范，预防中文乱码
type: project
---

## 核心规则

**在 Docker 容器化部署 MySQL 时，必须配置 utf8mb4 字符集，否则会导致中文乱码。**

## 必须配置清单

### 1. MySQL 配置文件

**文件**: `docker/mysql/conf/my.cnf`

```ini
[client]
default-character-set = utf8mb4

[mysql]
default-character-set = utf8mb4

[mysqld]
character-set-server = utf8mb4
collation-server = utf8mb4_general_ci
```

**Why**: MySQL 8.0 默认使用 Latin1 连接，不配置 utf8mb4 会导致 UTF-8 数据被错误存储。

**How to apply**: 
- 项目初始化时创建此文件
- 在导入任何 SQL 脚本之前完成配置
- 删除旧的 MySQL 数据卷后重启容器

### 2. 后端 Spring Boot 配置

**文件**: `ruoyi-admin/src/main/resources/application.yml`

```yaml
spring:
  http:
    encoding:
      charset: UTF-8
      enabled: true
      force: true
```

**Why**: 确保 Spring MVC 处理 HTTP 请求和响应时使用 UTF-8 编码。

### 3. 后端 Dockerfile 配置

**文件**: `ruoyi-admin/Dockerfile`

```dockerfile
ENV JAVA_OPTS="-Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8"
```

**Why**: JVM 默认编码可能不是 UTF-8，需显式指定。

### 4. 前端 Nginx 配置

**文件**: `plus-ui/nginx.conf`

```nginx
http {
    charset utf-8;
    charset_types text/plain text/css text/javascript application/javascript application/json;
    
    location / {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        add_header Pragma "no-cache";
    }
}
```

**Why**: 确保 Nginx 响应头包含正确的字符集声明。

### 5. 数据库连接 URL

**配置项**: JDBC 连接字符串

```properties
jdbc:mysql://host:3306/database?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
```

**Why**: 确保 JDBC 驱动使用 UTF-8 编码进行数据传输。

## 数据修复方案

如果已经出现乱码，使用以下 SQL 修复：

```sql
UPDATE table_name SET column_name = 
  CONVERT(CONVERT(CONVERT(column_name USING latin1) USING binary) USING utf8mb4) 
  WHERE column_name LIKE 'å%' OR column_name LIKE 'ä%' OR column_name LIKE 'ç%';
```

对于三重编码的顽固数据，需要手动修复：

```sql
UPDATE table_name SET column_name = '正确值' WHERE id = xxx;
```

## 诊断命令

```bash
# 检查数据库字符集
docker exec -i ry-mysql mysql -uroot -proot -e "SHOW VARIABLES LIKE 'character%';"

# 检查数据 Hex 值（判断编码问题）
docker exec -i ry-mysql mysql -uroot -proot -e "USE ry-vue; SELECT column_name, HEX(column_name) FROM table_name LIMIT 5;"

# 查找乱码数据
docker exec -i ry-mysql mysql -uroot -proot -e "USE ry-vue; SELECT * FROM table_name WHERE column_name LIKE 'å%' OR column_name LIKE 'ä%' OR column_name LIKE 'ç%';"
```

## 修复后操作

1. 清除 Redis 缓存：`docker exec -i ry-redis redis-cli FLUSHDB`
2. 重启后端服务：`docker restart ry-server`
3. 浏览器硬刷新：`Cmd+Shift+R` 或 `Ctrl+Shift+R`

## 参考文档

详细文档：`.claude/docs/encoding-issue-lesson.md`
