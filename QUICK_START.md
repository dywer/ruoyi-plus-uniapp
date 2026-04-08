# RuoYi-Plus-UniApp 项目快速了解指南

> 新成员入门必看 - 项目概览与快速上手

**最后更新**: 2026-04-07

---

## 一、项目概述

### 1.1 项目简介

**RuoYi-Plus-UniApp** 是基于 **RuoYi-Vue-Plus 5.X** 的全栈开发项目，包含 AI 编程助手配置、完整源码和文档系统。项目采用前后端分离架构，支持 Web 管理端和移动端（UniApp）双端开发。

### 1.2 核心特性

- **AI 智能开发** - 内置 40+ 专业技能、10 大快捷命令、智能钩子系统
- **全栈开发支持** - 后端 Spring Boot + 前端 Vue 3 + 移动端 UniApp
- **企业级架构** - 多租户、数据权限、工作流、任务调度等开箱即用
- **完善文档体系** - 323+ 篇技术文档，代码即文档理念

### 1.3 技术栈总览

| 模块 | 技术栈 | 版本 |
|------|--------|------|
| **后端** | Spring Boot | 3.5.12 |
| | MyBatis-Plus | 3.5.16 |
| | Sa-Token | 1.44.0 |
| | Redisson | 3.52.0 |
| | JDK | 17/21 |
| **前端** | Vue 3 | 3.5.x |
| | TypeScript | 5.9.x |
| | Element Plus | 2.13.x |
| | Vite | 7.x |
| | Pinia | 3.x |
| **移动端** | UniApp | 3.x |
| | Vue 3 | 3.x |
| | UView Plus | - |
| | wxCropper | - |
| **文档** | VitePress | 1.6.x |

---

## 二、目录结构

### 2.1 项目根目录

```
ruoyi_plus_uniapp/
├── .claude/                          # Claude Code AI 配置
│   ├── commands/                     # 10 个快捷命令
│   ├── skills/                       # 40+ 专业技能
│   ├── hooks/                        # 智能钩子
│   ├── agents/                       # AI 代理
│   ├── templates/                    # 文档模板
│   └── docs/                         # 开发文档
│
├── ruoyi-plus-uniapp-workflow/       # 后端源码 (Spring Boot 3.5.x)
│   ├── ruoyi-admin/                  # 启动入口模块
│   ├── ruoyi-common/                 # 22 个通用模块
│   ├── ruoyi-modules/                # 5 个业务模块
│   ├── ruoyi-extend/                 # 扩展模块
│   ├── script/                       # 脚本文件
│   └── pom.xml                       # Maven 配置
│
├── plus-ui/                          # 前端源码 (Vue 3 + Element Plus)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── ruo-yi-uni-app-plus/              # 移动端源码 (UniApp + Vue 3)
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
└── ruoyi-plus-uniapp-docs/           # VitePress 文档项目
    ├── docs/                         # 323+ 篇技术文档
    └── PROJECT_PROGRESS.md           # 文档进度表
```

### 2.2 后端模块结构

#### ruoyi-common 通用模块 (22 个)

| 模块名称 | 说明 |
|---------|------|
| `ruoyi-common-bom` | 依赖版本管理 |
| `ruoyi-common-core` | 核心工具类、基础配置 |
| `ruoyi-common-doc` | 接口文档配置 (SpringDoc) |
| `ruoyi-common-encrypt` | 数据加密模块 |
| `ruoyi-common-excel` | Excel 导入导出 (FastExcel) |
| `ruoyi-common-idempotent` | 幂等性处理 |
| `ruoyi-common-job` | 定时任务 (SnailJob) |
| `ruoyi-common-json` | JSON 序列化配置 |
| `ruoyi-common-log` | 日志处理模块 |
| `ruoyi-common-mail` | 邮件发送模块 |
| `ruoyi-common-mybatis` | MyBatis-Plus 配置 |
| `ruoyi-common-oss` | 对象存储 (S3 兼容) |
| `ruoyi-common-ratelimiter` | 限流模块 |
| `ruoyi-common-redis` | Redis 缓存模块 (Redisson) |
| `ruoyi-common-satoken` | Sa-Token 认证配置 |
| `ruoyi-common-security` | 安全模块 |
| `ruoyi-common-sensitive` | 数据脱敏模块 |
| `ruoyi-common-sms` | 短信模块 (SMS4J) |
| `ruoyi-common-social` | 社交登录 (JustAuth) |
| `ruoyi-common-sse` | SSE 服务端推送 |
| `ruoyi-common-tenant` | 多租户模块 |
| `ruoyi-common-web` | Web 通用配置 |
| `ruoyi-common-websocket` | WebSocket 模块 |

#### ruoyi-modules 业务模块 (5 个)

| 模块名称 | 说明 |
|---------|------|
| `ruoyi-system` | 系统管理模块 |
| `ruoyi-generator` | 代码生成器模块 |
| `ruoyi-workflow` | 工作流模块 (WarmFlow) |
| `ruoyi-demo` | 示例模块 |
| `ruoyi-job` | 任务调度模块 |

---

## 三、核心模块功能

### 3.1 认证授权模块

基于 **Sa-Token** 实现轻量级权限认证：

- **登录认证**: JWT Token 认证
- **权限控制**: `@SaCheckPermission` 注解
- **角色控制**: `@SaCheckRole` 注解
- **会话管理**: Redis 分布式会话

```java
// 权限控制示例
@SaCheckPermission("system:user:add")
@PostMapping
public R<Boolean> add(@RequestBody SysUser user) {
    return R.op(userService.add(user));
}
```

### 3.2 多租户模块

支持 SaaS 多租户数据隔离：

- **租户隔离**: `@TenantColumn` 注解
- **数据权限**: `@DataScope` 注解
- **租户管理**: 租户开通、配置、管理

```java
@TableName("sys_user")
@TenantColumn("dept_id")
public class SysUser extends TenantEntity {
    // 租户隔离字段
}
```

### 3.3 Redis 缓存模块

基于 **Redisson** 的 Redis 客户端：

- **分布式锁**: Lock4j 集成
- **缓存注解**: `@Cacheable`、`@CacheEvict`
- **Redis 工具**: `RedisUtils` 工具类

```java
@Cacheable(value = "sysUser", key = "#userId")
public SysUser getById(Long userId) {
    return baseMapper.selectById(userId);
}
```

### 3.4 工作流模块

基于 **WarmFlow** 的工作流引擎：

- **流程定义**: 流程设计、发布、管理
- **流程实例**: 发起、审批、撤回
- **任务管理**: 待办、已办、抄送

### 3.5 任务调度模块

基于 **SnailJob** 的分布式任务调度：

- **任务管理**: 定时任务配置
- **任务执行**: 分布式执行
- **任务监控**: 执行日志、状态监控

---

## 四、开发环境搭建

### 4.1 环境要求

#### 核心环境

| 软件 | 版本要求 | 说明 |
|------|---------|------|
| **JDK** | 17+ | 推荐 JDK 17 |
| **Maven** | 3.8+ | 构建工具 |
| **MySQL** | 8.0+ | 数据库 |
| **Redis** | 6.0+ | 缓存（禁止使用 7.4） |
| **Node.js** | 20.19.0+ | 前端运行环境 |
| **Git** | 2.x+ | 版本控制 |

#### 开发工具

| 工具 | 版本 | 说明 |
|------|------|------|
| **IntelliJ IDEA** | 2025.1+ | 后端开发（推荐） |
| **VS Code** | 最新版 | 前端开发 |
| **HBuilderX** | 最新版 | 移动端开发（可选） |

### 4.2 环境搭建步骤

#### 步骤 1：安装 JDK 17

```bash
# macOS (Homebrew)
brew install openjdk@17

# Windows
# 下载：https://adoptium.net/temurin/releases/?version=17
```

#### 步骤 2：安装 Maven

```bash
# macOS (Homebrew)
brew install maven

# Windows
# 下载：https://maven.apache.org/download.cgi
```

#### 步骤 3：安装 MySQL 8.0

```bash
# macOS (Homebrew)
brew install mysql@8.0

# Windows
# 下载：https://dev.mysql.com/downloads/mysql/
```

#### 步骤 4：安装 Redis

```bash
# macOS (Homebrew)
brew install redis@6.2

# Windows
# 下载：https://github.com/redis-windows/redis-windows
```

#### 步骤 5：安装 Node.js

```bash
# macOS
brew install node@20

# Windows
# 下载：https://nodejs.org/
```

---

## 五、配置文件说明

### 5.1 后端配置文件

配置文件位于 `ruoyi-admin/src/main/resources/`:

| 文件 | 环境 | 说明 |
|------|------|------|
| `application.yml` | 通用配置 | 基础配置 |
| `application-dev.yml` | 开发环境 | 本地开发使用 |
| `application-prod.yml` | 生产环境 | 生产部署使用 |

### 5.2 开发环境配置 (application-dev.yml)

#### 数据库配置

```yaml
spring:
  datasource:
    dynamic:
      primary: master
      strict: true
      datasource:
        master:
          type: com.zaxxer.hikari.HikariDataSource
          driverClassName: com.mysql.cj.jdbc.Driver
          url: jdbc:mysql://localhost:3306/ry-vue?useUnicode=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&useSSL=true&serverTimezone=GMT%2B8&autoReconnect=true&rewriteBatchedStatements=true&allowPublicKeyRetrieval=true&nullCatalogMeansCurrent=true
          username: root
          password: root
```

#### Redis 配置

```yaml
spring.data:
  redis:
    host: localhost
    port: 6379
    database: 0
    password: ruoyi123
    timeout: 10s
    ssl.enabled: false
```

#### SnailJob 配置

```yaml
snail-job:
  enabled: true
  group: "ruoyi_group"
  token: "SJ_cKqBTPzCsWA3VyuCfFoccmuIEGXjr5KT"
  server:
    host: 127.0.0.1
    port: 17888
  namespace: ${spring.profiles.active}
```

### 5.3 前端配置文件

配置文件位于 `plus-ui/.env.development`:

```bash
# 开发环境配置
VITE_APP_BASE_API=/dev-api
VITE_APP_BASE_URL=http://localhost:8080
```

### 5.4 移动端配置文件

配置文件位于 `ruo-yi-uni-app-plus/manifest.json`:

```json
{
  "name": "RuoYi-Plus-UniApp",
  "appid": "__UNI__xxxxx",
  "versionName": "1.0.0",
  "versionCode": "100"
}
```

---

## 六、常用命令

### 6.1 后端命令 (Spring Boot)

```bash
# 进入后端目录
cd ruoyi-plus-uniapp-workflow

# 安装依赖 (需要 JDK 17+, Maven 3.8+)
mvn clean install

# 启动后端 (dev 环境)
cd ruoyi-admin
mvn spring-boot:run -Pdev

# 打包部署
mvn clean package -DskipTests -Pprod

# 运行单测
mvn test -pl ruoyi-common/ruoyi-common-core

# 代码格式化
mvn spotless:apply
```

### 6.2 前端命令 (Vue 3 + Element Plus)

```bash
# 进入前端目录
cd plus-ui

# 安装依赖 (Node >=20.19.0)
npm install --registry=https://registry.npmmirror.com

# 开发模式 (http://localhost:80)
npm run dev

# 生产构建
npm run build:prod

# 代码检查
npm run lint:eslint

# 代码格式化
npm run prettier
```

### 6.3 移动端命令 (UniApp)

```bash
# 进入移动端目录
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

### 6.4 文档命令 (VitePress)

```bash
# 进入文档目录
cd ruoyi-plus-uniapp-docs

# 安装依赖
pnpm install

# 本地开发
pnpm dev

# 生产构建
pnpm build

# 部署
pnpm deploy
```

### 6.5 AI 快捷命令

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

## 七、快速启动

### 7.1 数据库初始化

```bash
# 导入 SQL 脚本
mysql -u root -p < ruoyi-plus-uniapp-workflow/script/sql.sql
```

### 7.2 启动步骤

#### 步骤 1：启动后端

```bash
cd ruoyi-plus-uniapp-workflow/ruoyi-admin
mvn spring-boot:run -Pdev
```

#### 步骤 2：启动前端

```bash
cd plus-ui
npm run dev
```

#### 步骤 3：访问系统

| 服务 | 地址 | 说明 |
|------|------|------|
| **前端** | http://localhost:80 | Vue 3 管理端 |
| **后端** | http://localhost:8080 | Spring Boot API |
| **接口文档** | http://localhost:8080/swagger-ui/index.html | Swagger UI |

---

## 八、开发规范

### 8.1 包名规范

```java
// 后端包名
plus.ruoyi.*
```

### 8.2 代码架构

#### 三层架构

```
Controller -> Service -> Mapper
```

#### 目录结构

```java
plus/ruoyi/
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

### 8.3 API 规范

| 操作 | HTTP 方法 | 路径 |
|------|----------|------|
| 分页查询 | GET | `/list` |
| 获取详情 | GET | `/{id}` |
| 新增 | POST | `/` |
| 修改 | PUT | `/` |
| 删除 | DELETE | `/{ids}` |
| 导出 | POST | `/export` |

### 8.4 统一响应格式

```java
public class R<T> {
    private int code;       // 状态码 200=成功
    private String msg;     // 消息
    private T data;         // 数据
}
```

### 8.5 常用注解

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

### 8.6 Git 提交规范

```bash
# 提交格式
<type>(<scope>): <subject>

# 类型 (type)
feat      # 新功能
fix       # 修复
docs      # 文档
style     # 格式
refactor  # 重构
test      # 测试
chore     # 构建/工具

# 示例
git commit -m "feat(system): 新增用户管理功能"
git commit -m "fix(core): 修复空指针异常"
git commit -m "docs(readme): 更新项目说明"
```

---

## 九、架构设计

### 9.1 多租户架构

框架支持 SaaS 多租户，通过 `@TenantColumn` 注解实现数据隔离：

```java
@TableName("sys_user")
@TenantColumn("dept_id")
public class SysUser extends TenantEntity {
    // 租户隔离字段
}
```

### 9.2 数据权限

基于注解的数据权限控制：

```java
@DataScope(deptAlias = "u", userAlias = "u")
public List<SysUser> list(SysUser user) {
    return baseMapper.selectList(user);
}
```

### 9.3 缓存架构

基于 Spring Cache 注解的缓存机制：

```java
@Cacheable(value = "sysUser", key = "#userId")
public SysUser getById(Long userId) {
    return baseMapper.selectById(userId);
}
```

---

## 十、特性对比

### 相比原版 RuoYi 的主要升级

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

## 十一、参考资源

### 官方文档

- **RuoYi-Vue-Plus 官方文档**: https://plus-doc.dromara.org
- **Gitee**: https://gitee.com/dromara/RuoYi-Vue-Plus (16,077 stars)
- **GitHub**: https://github.com/dromara/RuoYi-Vue-Plus (2,104 stars)
- **前端项目**: https://gitee.com/JavaLionLi/plus-ui

### 技术文档

- **Spring Boot**: https://spring.io/projects/spring-boot
- **MyBatis-Plus**: https://baomidou.com/
- **Sa-Token**: https://sa-token.dev33.cn/
- **Vue 3**: https://vuejs.org/
- **Element Plus**: https://element-plus.org/
- **UniApp**: https://uniapp.dcloud.net.cn/

---

## 十二、常见问题

### Q1: 依赖下载失败

**问题原因:**
- Maven 仓库连接超时
- npm 镜像源不可用

**解决方案:**

```bash
# Maven 使用阿里云镜像
# 在 settings.xml 中添加:
<mirror>
  <id>aliyun</id>
  <mirrorOf>central</mirrorOf>
  <url>https://maven.aliyun.com/repository/public</url>
</mirror>

# npm 使用淘宝镜像
npm config set registry https://registry.npmmirror.com
```

### Q2: 端口被占用

**问题原因:**
- 8080 端口已被其他应用占用

**解决方案:**

```yaml
# 修改 application-dev.yml 中的端口
server:
  port: 8081  # 修改为其他端口
```

### Q3: 数据库连接失败

**问题原因:**
- MySQL 服务未启动
- 数据库名称或密码错误
- 时区配置问题

**解决方案:**

```yaml
# 检查数据库配置
spring:
  datasource:
    dynamic:
      datasource:
        master:
          url: jdbc:mysql://localhost:3306/ry-vue?serverTimezone=GMT%2B8
          username: root
          password: your_password
```

---

## 十三、下一步

完成环境搭建后，建议继续学习:

1. **阅读核心文档** - 查看 `ruoyi-plus-uniapp-docs/docs/` 目录下的详细文档
2. **了解 AI 技能系统** - 学习使用 `/dev`、`/crud` 等快捷命令
3. **熟悉开发规范** - 掌握代码架构、API 规范、Git 工作流
4. **实践 CRUD 开发** - 尝试使用 `/crud` 命令生成简单功能

---

**文档生成完成!** 🎉

您已成功完成项目快速了解，现在可以开始开发了。如需更多帮助，请使用 `/next` 命令获取下一步建议。
