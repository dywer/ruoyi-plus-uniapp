# MySQL 中文乱码问题根因分析与预防指南

## 问题概述

在 Docker 容器化部署 RuoYi-Vue-Plus 项目时，出现大面积中文乱码（乱码形如：`ç³»ç»Ÿç®¡ç†`、`å·¥ä½œæµ` 等）。

## 受影响的表和字段

| 表名 | 受影响字段 |
|------|-----------|
| sys_menu | menu_name |
| sys_user | nick_name |
| sys_dept | dept_name |
| sys_post | post_name |
| sys_tenant | company_name |
| sys_role | role_name |
| sys_dict_type | dict_name, remark |
| sys_dict_data | dict_label, remark |
| flow_category | category_name |
| flow_definition | flow_name |
| flow_node | node_name |
| flow_spel | component_name, method_name, remark |
| test_demo | test_key, value |
| test_tree | tree_name |

## 乱码形因分析

### 根本原因

**MySQL 客户端连接字符集配置缺失**导致 UTF-8 数据在存储和读取时被错误地解释为 Latin1。

### 乱码形成过程

```
原始 UTF-8 数据：系统管理 (E7 B3 BB E7 BB 9F E7 AE A1 E7 90 86)
     ↓
MySQL 客户端使用 Latin1 连接（默认）
     ↓
每个字节被当作 Latin1 字符存储
     ↓
查询时按 UTF-8 解读 Latin1 字节
     ↓
显示为：ç³»ç»Ÿç®¡ç†
```

### 具体原因

1. **Docker MySQL 容器缺少字符集配置**
   - 没有在 `/etc/mysql/conf.d/my.cnf` 中配置 `[client]`、`[mysql]`、`[mysqld]` 的 `default-character-set = utf8mb4`
   - MySQL 8.0 默认 Latin1 连接，而非 utf8mb4

2. **SQL 初始化脚本在字符集错误时执行**
   - 导入 SQL 时 MySQL 连接使用 Latin1
   - UTF-8 编码的 SQL 文件被错误解释

3. **三重编码问题**
   - 部分数据经过多次错误编码转换
   - 形如 `C3A6C2B5E280B9` 的 Hex 值无法通过简单转换修复

## 解决方案

### 1. Docker MySQL 配置（必须）

创建或修改 `docker/mysql/conf/my.cnf`：

```ini
[client]
default-character-set = utf8mb4

[mysql]
default-character-set = utf8mb4

[mysqld]
character-set-server = utf8mb4
collation-server = utf8mb4_general_ci
```

### 2. 后端 Spring Boot 配置（必须）

在 `application.yml` 中添加：

```yaml
spring:
  http:
    encoding:
      charset: UTF-8
      enabled: true
      force: true
```

在 Dockerfile 中添加 JVM 参数：

```dockerfile
ENV JAVA_OPTS="-Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8"
```

### 3. Nginx 配置（前端容器）

在 `nginx.conf` 中添加：

```nginx
charset utf-8;
charset_types text/plain text/css text/javascript application/javascript application/json;

location / {
    add_header Cache-Control "no-store, no-cache, must-revalidate";
    add_header Pragma "no-cache";
}
```

### 4. Java 代码层面

确保响应包含 charset：

```java
response.setContentType(MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8");
```

配置 MessageConverter：

```java
@Override
public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
    converters.add(new StringHttpMessageConverter(StandardCharsets.UTF_8));
}
```

## 数据修复 SQL

### 标准修复（适用于大多数情况）

```sql
UPDATE table_name SET column_name = 
  CONVERT(CONVERT(CONVERT(column_name USING latin1) USING binary) USING utf8mb4) 
  WHERE column_name LIKE 'å%' OR column_name LIKE 'ä%' OR column_name LIKE 'ç%';
```

### 三重编码修复（特殊情况）

对于 Hex 值为 `C3A6...` 格式的数据，需要手动修复：

```sql
UPDATE table_name SET column_name = '正确中文' WHERE id = xxx;
```

## 预防措施（Checklist）

### 项目初始化阶段

- [ ] `docker/mysql/conf/my.cnf` 配置 utf8mb4
- [ ] Docker Compose 中 MySQL 服务添加 `--default-authentication-plugin=mysql_native_password` 和字符集参数
- [ ] SQL 脚本文件保存为 UTF-8 无 BOM 格式
- [ ] 后端 `application.yml` 配置 Spring HTTP encoding
- [ ] 后端 Dockerfile 添加 `-Dfile.encoding=UTF-8` JVM 参数
- [ ] 前端 Nginx 配置 charset utf-8

### 开发阶段

- [ ] IDE 文件编码设置为 UTF-8
- [ ] Java 文件头不添加 encoding 声明（默认 UTF-8）
- [ ] 数据库连接 URL 包含 `?useUnicode=true&characterEncoding=utf8&useSSL=false`
- [ ] API 响应 Content-Type 包含 `charset=UTF-8`

### 测试阶段

- [ ] 检查数据库中中文数据是否正确存储
- [ ] 检查 API 响应中中文是否正确传输
- [ ] 检查前端页面中中文是否正确显示

### 部署阶段

- [ ] 清除 MySQL 数据卷后重新导入 SQL（避免旧数据污染）
- [ ] 清除 Redis 缓存（避免缓存旧数据）
- [ ] 清除浏览器缓存或使用硬刷新

## 快速诊断命令

```bash
# 检查数据库字符集
docker exec -i ry-mysql mysql -uroot -proot -e "SHOW VARIABLES LIKE 'character%';"

# 检查表字符集
docker exec -i ry-mysql mysql -uroot -proot -e "USE ry-vue; SHOW TABLE STATUS WHERE Name='sys_menu';"

# 检查列字符集
docker exec -i ry-mysql mysql -uroot -proot -e "USE ry-vue; SHOW FULL COLUMNS FROM sys_menu WHERE Field='menu_name';"

# 检查数据 Hex 值（判断编码问题）
docker exec -i ry-mysql mysql -uroot -proot -e "USE ry-vue; SELECT menu_name, HEX(menu_name) FROM sys_menu LIMIT 5;"

# 查找乱码数据
docker exec -i ry-mysql mysql -uroot -proot -e "USE ry-vue; SELECT * FROM table_name WHERE column_name LIKE 'å%' OR column_name LIKE 'ä%' OR column_name LIKE 'ç%';"
```

## 经验教训

1. **字符集配置必须在数据写入前完成** - 事后修复比事前预防复杂 10 倍
2. **Docker 容器化不改变字符集原则** - 容器内外字符集配置同样重要
3. **全链路 UTF-8** - 数据库、应用、前端、Nginx、浏览器每一层都必须正确配置
4. **缓存是第二大问题源** - 修复数据后必须清除 Redis 缓存和浏览器缓存
