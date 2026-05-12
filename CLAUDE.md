# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 项目概述

**RuoYi-Vue-Plus 5.X** 是由 Dromara 社区维护的企业级快速开发平台，提供前后端分离的 SaaS 多租户解决方案。本项目集成了完整的 AI 编程助手配置（Claude Code）。

### 技术栈

| 模块 | 技术栈 |
|------|--------|
| **后端** | Spring Boot 3.5.x + MyBatis-Plus 3.5.16 + Sa-Token 1.44.0 + Redisson 3.52.0 + Undertow + JDK 17/21 |
| **前端** | Vue 3.5.x + TypeScript 5.9.x + Element Plus 2.13.x + Vite 7.x + Pinia 3.x |
| **移动端** | UniApp 3.x + Vue 3 + UView Plus + wxCropper |

---

## 目录结构

```
ruoyi-plus-uniapp/
├── .claude/                          # Claude Code AI 配置
│   ├── commands/                     # 10 个快捷命令
│   ├── skills/                       # 40+ 专业技能
│   ├── hooks/                        # 智能钩子
│   ├── agents/                       # AI 代理
│   ├── templates/                    # 文档模板
│   ├── docs/                         # 开发文档
│   └── settings.json                 # 全局配置
│
├── ruoyi-admin/                      # 启动入口模块 (Spring Boot)
│   ├── src/main/java/org/dromara/    # Java 源码 (org.dromara 包名)
│   ├── src/main/resources/           # 配置文件
│   └── Dockerfile                    # Docker 构建文件
│
├── ruoyi-common/                     # 通用模块 (24 个)
│   ├── ruoyi-common-core/            # 核心工具类、基础配置
│   ├── ruoyi-common-mybatis/         # MyBatis-Plus 配置
│   ├── ruoyi-common-redis/           # Redis / Redisson 配置
│   ├── ruoyi-common-satoken/         # Sa-Token 认证配置
│   ├── ruoyi-common-web/             # Web 通用配置
│   ├── ...                           # 其他 19 个通用模块
│
├── ruoyi-modules/                    # 业务模块 (5 个)
│   ├── ruoyi-system/                 # 系统管理
│   ├── ruoyi-generator/              # 代码生成器
│   ├── ruoyi-workflow/               # 工作流引擎 (WarmFlow)
│   ├── ruoyi-demo/                   # 示例模块
│   └── ruoyi-job/                    # 任务调度 (SnailJob)
│
├── ruoyi-extend/                     # 扩展模块
│   ├── ruoyi-monitor-admin/          # Spring Boot Admin 监控
│   └── ruoyi-snailjob-server/        # SnailJob 调度中心
│
├── script/                           # SQL 脚本 & Shell 脚本
├── pom.xml                           # Maven 父工程配置
├── plus-ui/                          # 前端源码 (Vue 3 + Element Plus)
├── ruo-yi-uni-app-plus/              # 移动端源码 (UniApp + Vue 3)
└── docker/                           # Docker 部署配置
```

---

## 后端模块结构

### ruoyi-common 通用模块 (24 个)

| 模块 | 说明 |
|------|------|
| `ruoyi-common-bom` | 依赖版本管理 |
| `ruoyi-common-core` | 核心工具类、枚举、基础实体 |
| `ruoyi-common-doc` | SpringDoc 接口文档 |
| `ruoyi-common-encrypt` | 数据加密模块 |
| `ruoyi-common-excel` | Excel 导入导出 (FastExcel) |
| `ruoyi-common-idempotent` | 幂等性处理 |
| `ruoyi-common-job` | SnailJob 定时任务 |
| `ruoyi-common-json` | JSON 序列化配置 |
| `ruoyi-common-log` | 操作日志 |
| `ruoyi-common-mail` | 邮件发送 (SMS4J) |
| `ruoyi-common-mybatis` | MyBatis-Plus 分页/多租户插件 |
| `ruoyi-common-oss` | 对象存储 (S3 兼容) |
| `ruoyi-common-ratelimiter` | 限流 (Redis + SpEL) |
| `ruoyi-common-redis` | Redis / Redisson 客户端 |
| `ruoyi-common-satoken` | Sa-Token 登录认证 |
| `ruoyi-common-security` | 密码安全加密 |
| `ruoyi-common-sensitive` | 数据脱敏 |
| `ruoyi-common-sms` | 短信发送 |
| `ruoyi-common-social` | 社交登录 (JustAuth) |
| `ruoyi-common-sse` | SSE 服务端推送 |
| `ruoyi-common-tenant` | 多租户支持 |
| `ruoyi-common-translation` | 数据翻译 |
| `ruoyi-common-web` | Web 通用配置 |
| `ruoyi-common-websocket` | WebSocket 模块 |

### ruoyi-modules 业务模块 (5 个)

- `ruoyi-system` — 系统管理（用户、角色、菜单、部门、岗位、字典等）
- `ruoyi-generator` — 代码生成器
- `ruoyi-workflow` — 工作流引擎 (WarmFlow)
- `ruoyi-demo` — 功能示例
- `ruoyi-job` — 分布式任务调度

### ruoyi-extend 扩展模块 (2 个)

- `ruoyi-monitor-admin` — Spring Boot Admin 服务监控
- `ruoyi-snailjob-server` — SnailJob 调度中心

---

## 常用命令

### 后端 (Java/Spring Boot)

```bash
# 安装依赖 (需要 JDK 17+, Maven 3.8+)
mvn clean install

# 启动后端 (dev 环境, http://localhost:8080)
cd ruoyi-admin
mvn spring-boot:run -Pdev

# 打包部署
mvn clean package -DskipTests -Pprod

# 运行单测
mvn test -pl ruoyi-common/ruoyi-common-core

# 代码格式化
mvn spotless:apply
```

### 前端 (Vue 3 + Element Plus)

```bash
cd plus-ui

# 安装依赖 (Node >=20.19.0)
npm install --registry=https://registry.npmmirror.com

# 开发模式 (http://localhost:80)
npm run dev

# 生产构建
npm run build:prod

# 代码检查与格式化
npm run lint:eslint
npm run prettier
```

### 移动端 (UniApp)

```bash
cd ruo-yi-uni-app-plus

# 安装依赖
npm install --registry=https://registry.npmmirror.com

# H5 开发
npm run dev:h5

# 微信小程序开发
npm run dev:mp-weixin

# 生产构建
npm run build:h5
npm run build:mp-weixin

# 类型检查
npm run type-check
```

---

## 快速启动指南

### 1. 环境准备

```bash
# 后端环境
JDK 17+
Maven 3.8+
MySQL 8.0+
Redis 6.0+

# 前端环境
Node.js >=20.19.0
npm >=8.19.0
```

### 2. 数据库初始化

```bash
mysql -u root -p < script/sql/sql.sql
```

### 3. 配置修改

```bash
# 后端配置
编辑 ruoyi-admin/src/main/resources/application-dev.yml
- 修改数据库连接
- 修改 Redis 连接
- 修改文件上传路径

# 前端配置
编辑 plus-ui/.env.development
- VITE_APP_BASE_API=/dev-api
- VITE_APP_BASE_URL=http://localhost:8080
```

### 4. 启动服务

```bash
# 1. 启动后端
cd ruoyi-admin
mvn spring-boot:run -Pdev

# 2. 启动前端
cd plus-ui
npm run dev

# 3. 访问系统
前端地址：http://localhost:80
后端地址：http://localhost:8080
接口文档：http://localhost:8080/swagger-ui/index.html
```

---

## 开发规范

### 包名规范

- 后端：`org.dromara.*`（以 `org.dromara.ruo yi` 为根包）
- 前端/移动端：`@/` 路径别名

### 代码架构

**后端三层架构：**

```
Controller -> Service -> Mapper
```

**目录结构约定：**

```java
org/dromara/
├── common/         // 通用模块
│   ├── core/       // 核心工具
│   ├── annotation/ // 自定义注解
│   ├── domain/     // 基础实体
│   ├── utils/      // 工具类
│   └── config/     // 配置类
├── system/         // 系统模块
│   ├── controller/
│   ├── service/
│   ├── mapper/
│   └── domain/
```

### API 规范

| 操作 | HTTP 方法 | 路径 |
|------|----------|------|
| 分页查询 | GET | `/list` |
| 获取详情 | GET | `/{id}` |
| 新增 | POST | `/` |
| 修改 | PUT | `/` |
| 删除 | DELETE | `/{ids}` |
| 导出 | POST | `/export` |

### 统一响应格式

```java
R<T> {
    int code;       // 状态码 200=成功
    String msg;     // 消息
    T data;         // 数据
}
```

### 常用注解

```java
// 权限控制
@SaCheckPermission("system:user:add")
@SaCheckRole("admin")

// 数据脱敏
@Sensitive(strategy = SensitiveStrategy.PHONE)

// 数据翻译
@Translate(table = "sys_user", result = "nickName")

// 幂等性
@Idempotent(key = "重复提交 key", expire = 5000)
```

---

## AI 技能系统

本配置包内置 40+ 专业技能，通过 `.claude/skills/` 目录下的 Markdown 文件定义。

### 核心技能

| 技能 | 触发词 | 用途 |
|------|-------|------|
| `crud-development` | CRUD、Entity、Service | 三层架构 CRUD 开发 |
| `api-development` | API、RESTful | API 设计开发规范 |
| `database-ops` | 数据库、SQL、建表 | 数据库设计与操作 |
| `security-guard` | 安全、Sa-Token | 安全开发规范 |
| `redis-cache` | Redis、缓存 | Redis 缓存开发 |
| `workflow-engine` | 工作流、审批 | 工作流引擎开发 |

### 快捷命令

| 命令 | 用途 |
|------|------|
| `/dev` | 完整功能开发 |
| `/crud` | 快速 CRUD 生成 |
| `/check` | 代码规范检查 |
| `/progress` | 项目进度分析 |
| `/next` | 下一步建议 |
| `/sync` | 全量状态同步 |
| `/start` | 项目快速了解 |
| `/init-docs` | 文档初始化 |
| `/update-status` | 增量状态更新 |
| `/add-todo` | 添加待办事项 |

---

## 架构设计

### 多租户架构

框架支持 SaaS 多租户，基于 MyBatis-Plus 租户插件自动注入租户条件：

```java
@TableName("sys_user")
public class SysUser extends TenantEntity {
    // 租户隔离由插件自动处理
}
```

### 数据权限

基于注解的数据权限控制：

```java
@DataScope(deptAlias = "u", userAlias = "u")
public List<SysUser> list(SysUser user) {
    return baseMapper.selectList(user);
}
```

### 缓存架构

基于 Spring Cache 注解的缓存机制：

```java
@Cacheable(value = "sysUser", key = "#userId")
public SysUser getById(Long userId) {
    return baseMapper.selectById(userId);
}
```

---

## 特性对比

相比原版 RuoYi 的主要升级：

| 特性 | RuoYi-Vue-Plus | 原版 RuoYi |
|------|---------------|-----------|
| 前端框架 | Vue 3 + TS + Element Plus | Vue 2/3 + JS |
| Web 容器 | Undertow | Tomcat |
| 权限框架 | Sa-Token | Spring Security |
| ORM | MyBatis-Plus | MyBatis (XML) |
| Redis 客户端 | Redisson | Lettuce + RedisTemplate |
| 序列化 | Jackson | FastJSON |
| 连接池 | HikariCP | Druid |
| 主键策略 | 雪花 ID | 数据库自增 |
| 多租户 | 原生支持 | 不支持 |
| 数据权限 | MyBatis-Plus 插件 | 手写 AOP |
| 工作流 | WarmFlow | 不支持 |
| 任务调度 | SnailJob | Quartz |

---

## 参考资源

- **官方文档**: https://plus-doc.dromara.org
- **Gitee**: https://gitee.com/dromara/RuoYi-Vue-Plus (16,077 stars)
- **GitHub**: https://github.com/dromara/RuoYi-Vue-Plus (2,104 stars)
- **前端项目**: https://gitee.com/JavaLionLi/plus-ui

---

## 重要教训：MySQL 中文乱码预防

### 问题根因

Docker MySQL 容器缺少字符集配置，导致 UTF-8 数据被错误存储为 Latin1 编码。

### 必须配置（项目初始化时检查）

**1. docker/mysql/conf/my.cnf 必须包含：**
```ini
[client]
default-character-set = utf8mb4

[mysql]
default-character-set = utf8mb4

[mysqld]
character-set-server = utf8mb4
collation-server = utf8mb4_general_ci
```

**2. 后端 application.yml 必须包含：**
```yaml
spring:
  http:
    encoding:
      charset: UTF-8
      enabled: true
      force: true
```

**3. 后端 Dockerfile 必须包含：**
```dockerfile
ENV JAVA_OPTS="-Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8"
```

### 数据修复 SQL

```sql
UPDATE table_name SET column_name = 
  CONVERT(CONVERT(CONVERT(column_name USING latin1) USING binary) USING utf8mb4) 
  WHERE column_name LIKE 'å%' OR column_name LIKE 'ä%' OR column_name LIKE 'ç%';
```

### 详细文档

- `.claude/docs/encoding-issue-lesson.md` - 完整根因分析和预防指南
- `memory/mysql-encoding-config.md` - 长期记忆配置规范
