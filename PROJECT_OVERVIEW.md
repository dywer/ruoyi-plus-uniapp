# RuoYi-Vue 项目概览

> 新成员入门必看 - 快速了解项目架构与开发规范

---

## 1. 项目架构概述

### 1.1 项目简介

**RuoYi-Vue** 是一套基于 Spring Boot + Vue 的前后端分离快速开发框架，提供完善的企业级应用开发基础功能。

- **当前版本**: 3.9.2
- **基础版本**: Spring Boot 4.x (JDK 17+)
- **开源协议**: MIT

### 1.2 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                      前端层 (Vue)                        │
│                   Element UI + Vuex                      │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼ HTTP/REST API
┌─────────────────────────────────────────────────────────┐
│                      网关/安全层                          │
│            Spring Security + JWT Token                   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     应用服务层                            │
│  Controller → Service → Mapper (三层架构)                │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                      数据存储层                           │
│              MySQL 8.0+  +  Redis 6.0+                  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 技术栈说明

### 2.1 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Java | 17+ | 开发语言 |
| Spring Boot | 4.0.3 | 核心框架 |
| MyBatis | 4.0.1 | ORM 框架 |
| Druid | 1.2.28 | 数据库连接池 |
| Spring Security | 内置 | 安全认证 |
| JWT | 0.9.1 | Token 认证 |
| Redis | 6.0+ | 缓存中间件 |
| MySQL | 8.0+ | 关系数据库 |

### 2.2 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 2.x | 前端框架 |
| Element UI | 2.x | UI 组件库 |
| Axios | latest | HTTP 客户端 |
| Vuex | 3.x | 状态管理 |
| Vue Router | 3.x | 路由管理 |

### 2.3 开发工具

| 工具 | 用途 |
|------|------|
| IntelliJ IDEA | Java 开发 IDE |
| VS Code | 前端开发编辑器 |
| Maven 3.8+ | 构建工具 |
| Node.js 16+ | 前端运行环境 |
| Git | 版本控制 |

---

## 3. 目录结构介绍

### 3.1 后端项目结构

```
ruoyi-projects/RuoYi-Vue/
├── ruoyi-admin/          # 启动模块
│   └── src/main/java/com/ruoyi/
│       ├── RuoYiApplication.java    # 启动类
│       └── web/controller/          # 控制器
│
├── ruoyi-framework/      # 框架模块
│   └── src/main/java/com/ruoyi/framework/
│       ├── config/                  # 配置类
│       ├── web/service/             # 通用服务
│       └── web/domain/              # 领域对象
│
├── ruoyi-system/         # 系统业务模块
│   └── src/main/java/com/ruoyi/system/
│       ├── controller/              # 系统控制器
│       ├── service/                 # 系统服务
│       ├── mapper/                  # 系统 Mapper
│       └── domain/                  # 系统实体
│
├── ruoyi-quartz/         # 定时任务模块
│   └── com.ruoyi.quartz/
│
├── ruoyi-generator/      # 代码生成器
│   └── com.ruoyi.generator/
│
├── ruoyi-common/         # 通用工具模块
│   └── com/ruoyi/common/
│       ├── core/                    # 核心工具
│       ├── annotation/              # 注解定义
│       ├── utils/                   # 工具类
│       └── domain/                  # 通用实体
│
└── src/main/resources/
    ├── application.yml              # 主配置文件
    ├── application-druid.yml        # 数据库配置
    └── mapper/                      # MyBatis 映射文件
```

### 3.2 前端项目结构

```
ruoyi-ui/
├── src/
│   ├── api/              # API 接口
│   ├── assets/           # 静态资源
│   ├── components/       # 通用组件
│   ├── directive/        # 自定义指令
│   ├── router/           # 路由配置
│   ├── store/            # Vuex 状态管理
│   ├── utils/            # 工具函数
│   ├── views/            # 页面组件
│   ├── App.vue           # 根组件
│   └── main.js           # 入口文件
├── public/
└── package.json
```

---

## 4. 核心模块功能

### 4.1 系统管理 (ruoyi-system)

| 功能 | 说明 |
|------|------|
| 用户管理 | 系统用户配置、账户管理 |
| 部门管理 | 组织机构配置、树形结构 |
| 岗位管理 | 用户职务配置 |
| 菜单管理 | 系统菜单、按钮权限配置 |
| 角色管理 | 角色权限分配、数据权限 |
| 字典管理 | 系统字典数据维护 |
| 参数管理 | 系统参数配置 |
| 通知公告 | 系统通知发布 |
| 操作日志 | 操作行为记录 |
| 登录日志 | 登录信息记录 |

### 4.2 监控模块 (ruoyi-admin)

| 功能 | 说明 |
|------|------|
| 在线用户 | 活跃用户监控 |
| 定时任务 | 任务调度管理 |
| 系统监控 | CPU、内存、磁盘监控 |
| 缓存监控 | Redis 缓存信息 |
| 连接池监控 | Druid 连接池监控 |

### 4.3 代码生成 (ruoyi-generator)

- 数据库表逆向工程
- 一键生成前后端代码
- 支持自定义模板

### 4.4 通用模块 (ruoyi-common)

- 统一响应封装 (`AjaxResult`, `R`)
- 通用实体类 (`BaseEntity`, `TreeEntity`)
- 工具类集合
- 注解定义

---

## 5. 开发环境搭建指南

### 5.1 环境要求

| 软件 | 版本 | 必须 |
|------|------|------|
| JDK | 17+ | 是 |
| Maven | 3.8+ | 是 |
| Node.js | 16+ | 是 |
| MySQL | 8.0+ | 是 |
| Redis | 6.0+ | 是 |
| Git | latest | 是 |

### 5.2 数据库初始化

```sql
-- 1. 创建数据库
CREATE DATABASE ruoyi 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- 2. 导入 SQL 脚本
-- 执行 sql/ry_20260406.sql (具体文件名以实际为准)
```

### 5.3 后端配置

编辑 `ruoyi-admin/src/main/resources/application-druid.yml`:

```yaml
spring:
  datasource:
    druid:
      master:
        url: jdbc:mysql://localhost:3306/ry-vue?useUnicode=true&characterEncoding=utf8&serverTimezone=GMT%2B8
        username: root
        password: your_password  # 修改为实际密码
```

编辑 `ruoyi-admin/src/main/resources/application.yml`:

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      password:  # 如有密码则配置
```

### 5.4 启动后端

```bash
cd ruoyi-projects/RuoYi-Vue
mvn clean install
cd ruoyi-admin
mvn spring-boot:run
```

访问：http://localhost:8080

### 5.5 前端配置

```bash
cd ruoyi-ui
npm install

# 配置 .env.development
VUE_APP_BASE_API = 'http://localhost:8080'

# 启动前端
npm run dev
```

访问：http://localhost:80

### 5.6 默认账号

```
账号：admin
密码：admin123
```

---

## 6. 配置文件说明

### 6.1 主配置文件 (application.yml)

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| server.port | 服务端口 | 8080 |
| ruoyi.name | 项目名称 | RuoYi |
| ruoyi.version | 项目版本 | 3.9.2 |
| user.password.maxRetryCount | 密码最大错误次数 | 5 |
| user.password.lockTime | 密码锁定时间 (分钟) | 10 |
| token.expireTime | Token 有效期 (分钟) | 30 |

### 6.2 数据库配置 (application-druid.yml)

| 配置项 | 说明 |
|--------|------|
| spring.datasource.url | 数据库连接 URL |
| spring.datasource.username | 数据库用户名 |
| spring.datasource.password | 数据库密码 |
| spring.datasource.druid.initialSize | 初始连接数 (5) |
| spring.datasource.druid.minIdle | 最小空闲连接 (10) |
| spring.datasource.druid.maxActive | 最大活跃连接 (20) |
| spring.datasource.druid.statViewServlet.login-username | Druid 控制台用户名 |
| spring.datasource.druid.statViewServlet.login-password | Druid 控制台密码 |

### 6.3 其他配置

- **MyBatis 配置**: mapper 扫描路径、类型别名包
- **PageHelper 配置**: 分页方言、参数
- **Springdoc 配置**: Swagger UI 开启、API 文档路径
- **XSS 配置**: 过滤器开关、排除链接

---

## 7. 常用命令汇总

### 7.1 Maven 命令

```bash
# 编译项目
mvn clean compile

# 打包 (跳过测试)
mvn clean package -DskipTests

# 安装到本地仓库
mvn clean install

# 启动应用
mvn spring-boot:run

# 只编译某个模块
mvn clean install -pl ruoyi-system -am
```

### 7.2 NPM 命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint
```

### 7.3 Git 命令

```bash
# 克隆项目
git clone <repository-url>

# 查看状态
git status

# 提交更改
git add .
git commit -m "feat: 描述"

# 推送代码
git push
```

### 7.4 快捷命令 (AI 助手)

| 命令 | 说明 |
|------|------|
| `/start` | 项目快速了解 |
| `/dev` | 完整功能开发 |
| `/crud` | 快速 CRUD 生成 |
| `/check` | 代码规范检查 |
| `/progress` | 项目进度分析 |
| `/next` | 下一步建议 |
| `/sync` | 全量状态同步 |
| `/init-docs` | 文档初始化 |
| `/update-status` | 增量状态更新 |
| `/add-todo` | 添加待办事项 |

---

## 8. 项目约定和规范

### 8.1 包名规范

- 基础包名：`com.ruoyi.*`
- 系统模块：`com.ruoyi.system.*`
- 通用模块：`com.ruoyi.common.*`
- 框架模块：`com.ruoyi.framework.*`

---

## 9. AI 辅助开发技能包

> 基于 GitHub RuoYi 生态最新的 AI 辅助开发实践，集成 **Skills + Commands + Hooks + Agents** 协同机制。

### 9.1 快捷命令 (Commands)

| 命令 | 功能描述 | 使用场景 |
|------|----------|----------|
| `/dev` | 完整功能开发 | 从零开始开发新业务模块，包含数据库设计、代码生成、菜单配置全流程 |
| `/crud` | 快速 CRUD 生成 | 基于已有数据库表，一键生成后端 7 层代码 |
| `/check` | 代码规范检查 | 检查包名、API 路径、权限注解、对象转换等 10 项规范 |
| `/progress` | 项目进度分析 | 扫描代码完整性，生成进度报告，统计 TODO/FIXME |
| `/next` | 下一步建议 | 分析项目状态，智能推荐开发优先级和方向 |
| `/sync` | 全量状态同步 | 同步代码与文档，生成综合报告（建议每周执行） |
| `/start` | 项目快速了解 | 新成员入门必看，自动生成项目概览 |
| `/init-docs` | 文档初始化 | 一键创建完整的项目文档体系 |
| `/update-status` | 增量状态更新 | 功能完成后立即更新状态（日常使用） |
| `/add-todo` | 添加待办事项 | 快速添加任务，支持优先级、模块、截止日期 |

### 9.2 专业技能 (Skills)

#### 核心技能 (内置)
| 技能 | 适用场景 | 核心能力 |
|------|----------|----------|
| **crud-development** | CRUD 开发 | 三层架构、实体规范、Mapstruct 转换、权限注解 |
| **api-development** | API 设计开发 | RESTful 规范、参数校验、统一响应、分页处理 |
| **database-ops** | 数据库操作 | MyBatis-Plus、表设计规范、自动填充、软删除 |
| **security-guard** | 安全开发 | Sa-Token 认证、RBAC 权限、数据权限、Token 管理 |
| **redis-cache** | Redis 缓存 | 缓存策略、分布式锁、缓存穿透防护、监控告警 |
| **workflow-engine** | 工作流引擎 | WarmFlow 引擎、流程设计、任务处理、业务集成 |
| **tenant-management** | 多租户管理 | 租户隔离、TenantEntity 基类、数据过滤 |

#### 新增技能 (从 skill-hub 引入)
| 技能 | 适用场景 | 核心能力 |
|------|----------|----------|
| **vue-best-practices** | Vue 3 开发 | Composition API、TypeScript、Pinia、Vite |
| **java-architect** | Java 架构设计 | Spring Boot 3.x、DDD、微服务、架构模式 |
| **springboot-best-practices** | Spring Boot 开发 | 企业级实践、配置规范、异常处理、性能优化 |
| **code-review** | 代码审查 | 代码规范、安全性、性能、异常处理审查 |
| **ruoyi-development** | RuoYi 开发 | RuoYi-Vue-Plus/Pro 规范、框架使用、最佳实践 |
| **mybatis-plus-best-practices** | MyBatis-Plus | CRUD、Wrapper、分页、批量操作、性能优化 |
| **testing-best-practices** | 测试开发 | JUnit 5、Mockito、Vitest、Playwright E2E |
| **api-design-best-practices** | API 设计 | RESTful、OpenAPI、统一响应、版本管理 |
| **multi-agent-workflow** | 多智能体协作 | 角色定义、协作模式、并行评审、接力开发 |
| **devops-ci-cd** | DevOps | GitHub Actions、Docker、K8s、监控告警 |
| **spring-security-guide** | 安全认证 | Sa-Token、JWT、RBAC 权限、数据权限 |
| **redis-cache-guide** | Redis 缓存 | 缓存策略、分布式锁、限流、发布订阅 |
| **performance-optimization** | 性能优化 | SQL 调优、索引设计、JVM 调优、慢查询分析 |
| **ai-llm-integration** | AI 集成 | RAG、向量数据库、LangChain4j、Spring AI |
| **github-workflow-automation** | GitHub 自动化 | CI/CD、PR 自动化、Issue 管理、Release 发布 |
| **ddd-domain-driven-design** | DDD 架构 | 战略设计、战术设计、聚合、限界上下文 |
| **technical-writing** | 技术文档 | API 文档、README、架构文档、写作规范 |

### 9.3 智能钩子 (Hooks)

| 钩子 | 触发时机 | 功能说明 |
|------|----------|----------|
| **skill-forced-eval** | 用户输入分析 | 自动识别用户需求，推荐相关技能 |
| **pre-tool-use** | 工具调用前 | 工具调用的预处理和验证 |
| **stop** | 停止处理 | 中断当前处理流程 |

### 9.4 智能代理 (Agents)

| 代理 | 职责 | 使用场景 |
|------|------|----------|
| **project-manager** | 项目管理助手 | 进度跟踪、任务分配、风险评估 |
| **code-reviewer** | 代码审查助手 | 代码质量检查、规范验证、改进建议 |

### 9.5 技能触发关键词

| 关键词 | 推荐技能 |
|--------|----------|
| "新增功能"、"开发模块" | crud-development, api-development |
| "数据库表"、"建表" | database-ops |
| "权限"、"登录"、"认证" | security-guard |
| "缓存"、"Redis" | redis-cache |
| "审批"、"流程" | workflow-engine |
| "多租户"、"SaaS" | tenant-management |

### 9.6 AI 开发最佳实践

1. **技能优先**：优先使用 Skills 中的预定义能力，避免重复造轮子
2. **命令驱动**：使用 Commands 快捷命令触发标准化流程
3. **钩子增强**：Hooks 自动识别意图，推荐合适的技能
4. **代理协同**：复杂任务使用多 Agent 协作完成

### 9.7 推荐的外部技能资源

基于 GitHub skill-hub 生态，以下是值得集成的额外技能：

#### Java/SpringBoot 开发技能
| 技能名称 | 来源 | 功能描述 |
|----------|------|----------|
| `spring-boot-engineer` | jeffallan/claude-skills | 资深 Spring Boot 工程师技能，专精 Spring Boot 3.x + Java 17+、响应式编程、微服务 |
| `java-architect` | jeffallan/claude-skills | 企业级 Java 架构技能，支持 DDD、六边形架构、Clean Architecture |
| `dr-jskill` | jdubois/dr-jskill | 专门用于创建 Spring Boot + Vue/React/Angular 全栈应用 |

#### Vue 前端开发技能
| 技能名称 | 来源 | 功能描述 |
|----------|------|----------|
| `vue-best-practices` | vuejs-ai/skills | Vue 3 官方推荐实践，覆盖 Composition API、TypeScript、Pinia、Vite |
| `vue-expert` | VoltAgent/awesome-claude-code-subagents | Vue 3 专家技能，精通响应式优化、Nuxt 3 开发 |
| `vue-development` | alexanderop/claude-skill-vue-development | TypeScript 优先的 Vue 3 生产级代码开发 |

#### 全栈技能集合
| 项目名称 | 链接 | 说明 |
|----------|------|------|
| **full-stack-skills** | [partme-ai/full-stack-skills](https://github.com/partme-ai/full-stack-skills) | 免费全栈技能市场，覆盖设计、开发、架构、测试 |
| **claude-skills** | [jeffallan/claude-skills](https://github.com/jeffallan/claude-skills) | 66 个专业全栈技能，覆盖 12 个类别 |
| **awesome-claude-skills** | [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | 精选 Claude Skills 资源列表 |
| **awesome-agent-skills** | [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) | 1000+ Agent 技能集合 |
| **claude-skills** | [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) | 220+ Claude Code 技能 |

#### DevOps 与微服务技能
| 技能名称 | 来源 | 功能描述 |
|----------|------|------|
| `microservices-architect` | VoltAgent/awesome-claude-code-subagents | 微服务架构师，支持云原生原则、服务边界定义、通信模式 |
| `database-optimizer` | lst97/claude-code-sub-agents | 数据库性能优化专家，SQL 调优、索引策略、慢查询分析 |
| `backend-developer` | VoltAgent/awesome-claude-code-subagents | 后端开发专家，RESTful API、数据库设计、认证授权 |
| `performance-engineer` | rohig/awesome-claude-code-toolkit | 性能测试工程师，负载测试、性能分析、瓶颈定位 |

### 9.8 技能安装和使用

#### 安装外部技能
```bash
# 克隆技能仓库到本地
git clone https://github.com/jeffallan/claude-skills.git
git clone https://github.com/vuejs-ai/skills.git

# 复制技能文件到项目 .claude/skills/ 目录
cp -r claude-skills/skills/spring-boot-engineer ~/.claude/skills/
cp -r claude-skills/skills/java-architect ~/.claude/skills/
```

#### 使用技能触发词
| 触发词 | 推荐技能 |
|--------|----------|
| "Spring Boot 项目"、"微服务" | spring-boot-engineer |
| "架构设计"、"DDD"、"重构" | java-architect |
| "Vue 3"、"Pinia"、"Vite" | vue-best-practices |
| "全栈开发"、"前后端分离" | dr-jskill |
| "代码审查"、"CR 检查" | code-review |
| "RuoYi"、"若依框架" | ruoyi-development |
| "MyBatis-Plus"、"MP" | mybatis-plus-best-practices |

### 10. 项目约定和规范

#### 10.1 包名规范

- 基础包名：`com.ruoyi.*`
- 系统模块：`com.ruoyi.system.*`
- 通用模块：`com.ruoyi.common.*`
- 框架模块：`com.ruoyi.framework.*`

### 10.2 三层架构

```
Controller 层  →  Service 层  →  Mapper 层
   (HTTP)      (业务逻辑)    (数据访问)
```

**注意**: 无 DAO 层设计

### 10.3 实体规范

```java
@Data
public class SysUser extends BaseEntity {
    
    @TableId(value = "user_id", type = IdType.ASSIGN_ID)
    private Long userId;  // 雪花 ID，非自增
    
    @TableField(fill = FieldFill.INSERT)
    private Date createTime;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Date updateTime;
}
```

### 10.4 API 规范

| 操作 | HTTP 方法 | 路径示例 |
|------|----------|---------|
| 分页查询 | GET | `/system/user/list` |
| 获取详情 | GET | `/system/user/{id}` |
| 新增 | POST | `/system/user` |
| 修改 | PUT | `/system/user` |
| 删除 | DELETE | `/system/user/{ids}` |
| 导出 | POST | `/system/user/export` |

### 10.5 权限注解

```java
// 方法级权限控制
@SaCheckPermission("system:user:add")
@PostMapping
public AjaxResult add(@RequestBody SysUser user) {
    return toAjax(userService.add(user));
}
```

### 10.6 对象转换

```java
// 使用 MapstructUtils 进行转换
UserVo userVo = MapstructUtils.convert(user, UserVo.class);
List<UserVo> list = MapstructUtils.convert(users, UserVo.class);
```

### 10.7 统一响应

```java
// 成功响应
return AjaxResult.success(data);

// 失败响应
return AjaxResult.error("错误信息");

// 带状态码
return AjaxResult.toAjax(rows);
```

---

## 11. 常见问题解答

### Q1: 启动时报数据库连接失败？

**A**: 检查以下几点:
1. MySQL 服务是否启动
2. 数据库是否存在
3. application-druid.yml 中的用户名密码是否正确
4. 时区配置 `serverTimezone=GMT%2B8`

### Q2: Redis 连接失败？

**A**: 检查:
1. Redis 服务是否启动 (`redis-server`)
2. 防火墙是否阻止 6379 端口
3. application.yml 中 Redis 配置是否正确

### Q3: 前端跨域问题？

**A**: 后端已配置 CORS，如仍有问题检查:
1. .env.development 中 API 代理配置
2. vue.config.js 中的 proxy 配置

### Q4: 登录后的 Token 过期？

**A**: 
1. 默认 Token 有效期 30 分钟
2. 可在 application.yml 修改 `token.expireTime`
3. 前端会自动刷新 Token

### Q5: 代码生成器如何使用？

**A**:
1. 数据库中创建表
2. 访问：系统工具 → 代码生成
3. 导入表结构 → 编辑生成配置 → 生成代码
4. 下载代码到对应目录

### Q6: 如何使用 AI 辅助开发命令？

**A**:
1. 在 Claude Code 中输入 `/命令名` 执行快捷命令
2. Skills 会自动根据上下文触发
3. 使用 `/check` 检查代码规范
4. 使用 `/crud` 快速生成 CRUD 代码

### Q7: AI Skills 如何手动触发？

**A**:
- 在请求中明确提及相关技能名称
- 例如："请使用 crud-development 技能生成用户管理代码"
- 或使用关键词触发：「CRUD」、「权限」、「缓存」、「工作流」等

---

## 12. 快速开始 Checklist

- [ ] JDK 17+ 已安装
- [ ] Maven 3.8+ 已安装
- [ ] MySQL 8.0+ 已安装并创建数据库
- [ ] Redis 6.0+ 已安装并启动
- [ ] 后端配置文件已修改
- [ ] 前端配置文件已修改
- [ ] 后端启动成功 (http://localhost:8080)
- [ ] 前端启动成功 (http://localhost:80)
- [ ] 能够使用 admin/admin123 登录
- [ ] AI 辅助开发技能包已配置

---

## 附录：核心文件索引

| 文件 | 路径 | 说明 |
|------|------|------|
| 启动类 | `ruoyi-admin/src/main/java/com/ruoyi/RuoYiApplication.java` | 应用入口 |
| 主配置 | `ruoyi-admin/src/main/resources/application.yml` | 主配置文件 |
| 数据库配置 | `ruoyi-admin/src/main/resources/application-druid.yml` | 数据源配置 |
| MyBatis 配置 | `ruoyi-admin/src/main/resources/mybatis/mybatis-config.xml` | MyBatis 全局配置 |
| 安全配置 | `ruoyi-framework/src/main/java/com/ruoyi/framework/web/service/SysLoginService.java` | 登录认证服务 |
| 权限服务 | `ruoyi-framework/src/main/java/com/ruoyi/framework/web/service/PermissionService.java` | 权限校验服务 |
| AI 配置 | `.claude/settings.json` | AI 助手全局配置 |
| 技能配置 | `.claude/skills/` | 7 个专业开发技能 |
| 命令配置 | `.claude/commands/` | 10 个快捷命令 |

---

## 附录：AI 辅助开发资源

### 相关开源项目

| 项目 | 地址 | 说明 |
|------|------|------|
| RuoYi-Vue-Pro | [YunaiV/ruoyi-vue-pro](https://github.com/YunaiV/ruoyi-vue-pro) | 官方推荐 Pro 版本，集成 AI 大模型功能 |
| RuoYi-Vue-Plus | [dromara/RuoYi-Vue-Plus](https://github.com/dromara/RuoYi-Vue-Plus) | 基于 RuoYi-Vue 集成 Lombok+MyBatis-Plus |
| RuoYi-AI | [ageerle/ruoyi-ai](https://github.com/ageerle/ruoyi-ai) | 面向企业级市场的一站式 AI 应用开发框架 |

### 参考资料

- [RuoYi-Plus Claude Code Skills 开发指南](https://ruoyi.plus/practices/engineering/claude-code-skills.html)
- [Hooks + Commands + Agents 协同激活 AI 全部能力](https://zhuanlan.zhihu.com/p/1986884838813373041)
- [RuoYi 全栈 AI 平台开源了](https://javabetter.cn/sidebar/itwanger/ai/ruoyi-ai-review.html)

---

*文档生成时间：2026-04-06*  
*基于 RuoYi-Vue 3.9.2 版本*  
*AI 辅助开发技能包版本：1.0*
