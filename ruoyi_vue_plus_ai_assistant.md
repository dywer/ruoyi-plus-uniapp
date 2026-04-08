***

### 商品简介

基于 **RuoYi-Vue-Plus 5.X** 企业级后端框架，深度定制的 **AI 智能编程助手配置包**。支持 **Claude Code**，内置 **40+ 专业开发技能**、**10 大快捷命令**、**智能钩子系统**，让 AI 真正理解您的项目架构和开发规范，实现 **10 倍开发效率提升**。

***

### 核心亮点

#### 🎯 40+ 专业开发技能

AI 不再是通用助手，而是**深度理解 RuoYi-Vue-Plus 架构**的专业开发伙伴。

#### ⚡ 10 大快捷命令

一键执行复杂开发任务，告别重复劳动。

#### 🔧 智能钩子系统

自动评估用户需求，精准匹配技能，确保每次响应都符合项目规范。

***

### 完整功能清单

#### 一、快捷命令（10 个）

> 路径：`.claude/commands/`

| 命令 | 功能 | 使用场景 |
| --- | --- | --- |
| `/dev` | 🔥 **完整功能开发** | 从零开始开发新功能，包含数据库设计、代码生成、菜单配置 |
| `/crud` | ⚡ **快速 CRUD 生成** | 基于已有数据库表，一键生成后端 7 层代码 |
| `/check` | 🔍 **代码规范检查** | 检查包名、API 路径、权限注解、对象转换等 10 项规范 |
| `/progress` | 📊 **项目进度分析** | 扫描代码完整性，生成进度报告，统计 TODO/FIXME |
| `/next` | 💡 **下一步建议** | 分析项目状态，智能推荐开发优先级和方向 |
| `/sync` | 🔄 **全量状态同步** | 同步代码与文档，生成综合报告（每周使用） |
| `/start` | 👋 **项目快速了解** | 新成员入门必看，自动生成项目概览 |
| `/init-docs` | 📝 **文档初始化** | 一键创建完整的项目文档体系 |
| `/update-status` | 📈 **增量状态更新** | 功能完成后立即更新状态（日常使用） |
| `/add-todo` | ✅ **添加待办事项** | 快速添加任务，支持优先级、模块、截止日期 |

***

#### 二、专业技能库（40+ 个）

> 路径：`.claude/skills/`

##### 🏗️ 核心开发技能（8 个）

| 技能 | 触发词 | 功能描述 |
| --- | --- | --- |
| `crud-development` | CRUD、Entity、Service、Controller | 三层架构 CRUD 开发规范 |
| `api-development` | API、RESTful、接口规范 | API 设计与开发规范 |
| `database-ops` | 数据库、SQL、建表、字典 | 数据库设计与操作 |
| `backend-annotations` | 注解、@RateLimiter、@DataScope | 后端注解使用指南 |
| `utils-toolkit` | 工具类、StringUtils、MapstructUtils | 工具类使用手册 |
| `error-handler` | 异常、ServiceException | 异常处理规范 |
| `test-development` | 测试、JUnit5、Mockito | 单元测试开发 |
| `code-patterns` | 规范、命名、Git 提交 | 代码规范速查 |

##### 🔐 安全与权限（4 个）

| 技能 | 触发词 | 功能描述 |
| --- | --- | --- |
| `security-guard` | 安全、Sa-Token、认证授权 | 安全开发规范 |
| `data-permission` | 数据权限、@DataPermission | 行级数据权限实现 |
| `tenant-management` | 多租户、租户隔离、SaaS | 多租户开发指南 |
| `social-login` | 第三方登录、OAuth、微信登录 | 社交登录集成 |

##### ⚙️ 基础设施（6 个）

| 技能 | 触发词 | 功能描述 |
| --- | --- | --- |
| `redis-cache` | Redis、缓存、@Cacheable、分布式锁 | Redis 缓存开发 |
| `scheduled-jobs` | 定时任务、SnailJob、@Scheduled | 任务调度开发 |
| `file-oss-management` | 文件上传、OSS、MinIO | 文件存储管理 |
| `websocket-sse` | WebSocket、SSE、实时推送 | 实时通信开发 |
| `sms-mail` | 短信、邮件、验证码 | 消息通知开发 |
| `workflow-engine` | 工作流、审批流、WarmFlow | 工作流引擎开发 |

##### 🔧 辅助工具（8 个）

| 技能 | 触发词 | 功能描述 |
| --- | --- | --- |
| `json-serialization` | JSON、序列化、BigDecimal | JSON 处理规范 |
| `performance-doctor` | 性能、慢查询、优化 | 性能诊断与优化 |
| `bug-detective` | Bug、报错、异常 | Bug 排查助手 |
| `git-workflow` | Git、提交、分支 | Git 工作流规范 |
| `project-navigator` | 项目结构、文件定位 | 项目导航指南 |
| `architecture-design` | 架构、模块划分 | 系统架构设计 |
| `tech-decision` | 技术选型、方案对比 | 技术决策辅助 |
| `brainstorm` | 头脑风暴、创意 | 方案探索助手 |

##### 🤖 AI 集成（2 个）

| 技能 | 触发词 | 功能描述 |
| --- | --- | --- |
| `collaborating-with-gemini` | Gemini、前端原型 | Gemini 协同开发 |
| `banana-image` | 生成图片、AI 图片、海报 | AI 图片生成（4K 支持） |

##### 📋 项目管理（3 个）

| 技能 | 触发词 | 功能描述 |
| --- | --- | --- |
| `task-tracker` | 任务跟踪、记录进度 | 任务进度追踪 |
| `add-skill` | 添加技能、创建技能 | 技能开发指南 |
| `store-pc` | PC Store、Pinia | 状态管理指南 |

***

#### 三、智能钩子系统（3 个）

> 路径：`.claude/hooks/`

| 钩子 | 功能 | 说明 |
| --- | --- | --- |
| `skill-forced-eval.js` | **技能强制评估** | 用户提问时自动匹配技能，确保规范遵循 |
| `pre-tool-use.js` | **工具预处理** | 工具调用前的拦截和验证 |
| `stop.js` | **停止处理** | 任务完成时的清理和通知 |

**核心机制**：每次用户提问，钩子自动注入技能评估提示，AI 必须先匹配技能、激活技能、再执行任务，确保每次响应都符合项目规范。

***

#### 四、智能代理（2 个）

> 路径：`.claude/agents/`

| 代理 | 功能 | 使用场景 |
| --- | --- | --- |
| `project-manager` | 项目管理助手 | 创建需求文档、跟踪进度、管理待办 |
| `code-reviewer` | 代码审查助手 | 自动检查代码规范、发现潜在问题 |

***

#### 五、文档模板（3 个）

> 路径：`.claude/templates/`

| 模板 | 用途 |
| --- | --- |
| `待办清单模板.md` | 标准化待办事项格式 |
| `需求文档模板.md` | 标准化需求文档格式 |
| `项目状态模板.md` | 标准化项目状态格式 |

***

#### 六、开发文档（8 篇）

> 路径：`.claude/docs/`

| 文档 | 内容 |
| --- | --- |
| `框架说明.md` | 框架整体介绍 |
| `后端开发指南.md` | 后端开发规范 |
| `前端开发指南.md` | 前端开发规范 |
| `数据库设计规范.md` | 数据库设计标准 |
| `工具类使用指南.md` | 工具类速查手册 |
| `工作流开发指南.md` | 工作流集成指南 |
| `新功能开发流程规范.md` | 开发流程标准 |
| `新项目开发流程.md` | 项目启动指南 |

***

#### 七、配置文件（2 个）

| 文件 | 用途 |
| --- | --- |
| `.claude/settings.json` | Claude Code 全局配置 |
| `.claude/framework-config.json` | 框架配置信息 |

***

#### 八、音频资源

| 文件 | 用途 |
| --- | --- |
| `.claude/audio/completed.wav` | 任务完成提示音 |

***

### 目录结构总览

```
RuoYi-Vue-Plus/
├── .claude/                          # Claude Code 配置
│   ├── commands/                     # 10 个快捷命令
│   │   ├── dev.md                   # 完整功能开发
│   │   ├── crud.md                  # 快速 CRUD 生成
│   │   ├── check.md                 # 代码规范检查
│   │   ├── progress.md              # 项目进度分析
│   │   ├── next.md                  # 下一步建议
│   │   ├── sync.md                  # 全量状态同步
│   │   ├── start.md                 # 项目快速了解
│   │   ├── init-docs.md             # 文档初始化
│   │   ├── update-status.md         # 增量状态更新
│   │   └── add-todo.md              # 添加待办事项
│   │
│   ├── skills/                       # 40+ 专业技能
│   │   ├── crud-development/        # CRUD 开发
│   │   ├── api-development/         # API 开发
│   │   ├── database-ops/            # 数据库操作
│   │   ├── security-guard/          # 安全开发
│   │   ├── redis-cache/             # Redis 缓存
│   │   ├── workflow-engine/         # 工作流引擎
│   │   ├── ... (40+ 技能)
│   │   └── banana-image/            # AI 图片生成
│   │
│   ├── hooks/                        # 智能钩子
│   │   ├── skill-forced-eval.js     # 技能强制评估
│   │   ├── pre-tool-use.js          # 工具预处理
│   │   └── stop.js                  # 停止处理
│   │
│   ├── agents/                       # 智能代理
│   │   ├── project-manager.md       # 项目管理助手
│   │   └── code-reviewer.md         # 代码审查助手
│   │
│   ├── templates/                    # 文档模板
│   │   ├── 待办清单模板.md
│   │   ├── 需求文档模板.md
│   │   └── 项目状态模板.md
│   │
│   ├── docs/                         # 开发文档
│   │   ├── 框架说明.md
│   │   ├── 后端开发指南.md
│   │   └── ... (8 篇文档)
│   │
│   ├── audio/                        # 音频资源
│   │   └── completed.wav
│   │
│   ├── settings.json                 # 全局配置
│   └── framework-config.json         # 框架配置
│
└── CLAUDE.md                         # 项目规范主文件
```

***

### 技术规范内置

本配置包深度集成 RuoYi-Vue-Plus 开发规范：

#### 架构规范

* ✅ 三层架构：Controller → Service → Mapper（无 DAO 层）
* ✅ 包名规范：`org.dromara.*`
* ✅ 实体基类：`TenantEntity`（多租户支持）
* ✅ 对象转换：`MapstructUtils.convert()`
* ✅ 主键策略：雪花 ID（非自增）

#### API 规范

| 操作 | HTTP 方法 | 路径 |
| --- | --- | --- |
| 分页查询 | GET | `/list` |
| 获取详情 | GET | `/{id}` |
| 新增 | POST | `/` |
| 修改 | PUT | `/` |
| 删除 | DELETE | `/{ids}` |
| 导出 | POST | `/export` |

#### 代码检查项

* 🔴 **严重**：包名必须是 `org.dromara.*`
* 🔴 **严重**：禁止完整类型引用
* 🔴 **严重**：API 路径必须规范
* 🟡 **警告**：必须使用 `@SaCheckPermission`
* 🟡 **警告**：必须使用 `MapstructUtils`
* 🟡 **警告**：BO 必须使用 `@AutoMapper`

***

### 使用效果对比

| 场景 | 传统开发 | 使用本配置包 |
| --- | --- | --- |
| 新建 CRUD 模块 | 2-4 小时 | `/crud` 5 分钟 |
| 代码规范检查 | 人工审查 1 小时 | `/check` 1 分钟 |
| 了解项目结构 | 阅读文档 2 小时 | `/start` 30 秒 |
| 项目进度统计 | 手动统计半天 | `/progress` 1 分钟 |
| 新功能开发 | 边查边写 1 天 | `/dev` 自动引导 2 小时 |

**效率提升：5-10 倍**

***

### 适用人群

* ✅ **RuoYi-Vue-Plus 开发者**：提升开发效率，规范代码质量
* ✅ **企业开发团队**：统一开发规范，降低沟通成本
* ✅ **AI 编程爱好者**：学习如何定制专业 AI 编程助手
* ✅ **独立开发者**：快速上手企业级项目开发

***

### 环境要求

* **Claude Code**：需安装 [Claude Code CLI](https://claude.ai/claude-code)
* **RuoYi-Vue-Plus**：5.X 版本

***

### 使用方法

1. 将 `.claude/` 目录复制到您的 RuoYi-Vue-Plus 项目根目录
2. 将 `CLAUDE.md` 复制到项目根目录
3. 启动 Claude Code
4. 输入 `/start` 开始体验

***

### 文件统计

| 类别 | 数量 |
| --- | --- |
| 快捷命令 | 10 个 |
| 专业技能 | 40+ 个 |
| 智能钩子 | 3 个 |
| 智能代理 | 2 个 |
| 文档模板 | 3 个 |
| 开发文档 | 8 篇 |
| 配置文件 | 2 个 |
| **总文件数** | **80+ 个** |

