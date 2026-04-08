# RuoYi-Vue-Plus AI 智能开发助手配置

基于 **RuoYi-Vue-Plus 5.X** 企业级后端框架，深度定制的 **AI 智能编程助手配置包**。支持 **Claude Code**，内置 **40+ 专业开发技能**、**10 大快捷命令**、**智能钩子系统**，让 AI 真正理解您的项目架构和开发规范，实现 **10 倍开发效率提升**。

## 目录结构

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
│   │   ├── 前端开发指南.md
│   │   ├── 数据库设计规范.md
│   │   ├── 工具类使用指南.md
│   │   ├── 工作流开发指南.md
│   │   ├── 新功能开发流程规范.md
│   │   └── 新项目开发流程.md
│   │
│   ├── audio/                        # 音频资源
│   │   └── completed.wav
│   │
│   ├── settings.json                 # 全局配置
│   └── framework-config.json         # 框架配置
│
└── CLAUDE.md                         # 项目规范主文件
```

## 快捷命令说明

### 1. /dev - 完整功能开发
从零开始开发新功能，包含数据库设计、代码生成、菜单配置等全流程。

### 2. /crud - 快速CRUD生成
基于已有数据库表，一键生成后端7层代码。

### 3. /check - 代码规范检查
检查包名、API路径、权限注解、对象转换等10项规范。

### 4. /progress - 项目进度分析
扫描代码完整性，生成进度报告，统计TODO/FIXME。

### 5. /next - 下一步建议
分析项目状态，智能推荐开发优先级和方向。

### 6. /sync - 全量状态同步
同步代码与文档，生成综合报告（每周使用）。

### 7. /start - 项目快速了解
新成员入门必看，自动生成项目概览。

### 8. /init-docs - 文档初始化
一键创建完整的项目文档体系。

### 9. /update-status - 增量状态更新
功能完成后立即更新状态（日常使用）。

### 10. /add-todo - 添加待办事项
快速添加任务，支持优先级、模块、截止日期。

## 技术规范内置

### 架构规范
- ✅ 三层架构：Controller → Service → Mapper（无 DAO 层）
- ✅ 包名规范：`org.dromara.*`
- ✅ 实体基类：`TenantEntity`（多租户支持）
- ✅ 对象转换：`MapstructUtils.convert()`
- ✅ 主键策略：雪花 ID（非自增）

### API 规范
| 操作 | HTTP 方法 | 路径 |
| --- | --- | --- |
| 分页查询 | GET | `/list` |
| 获取详情 | GET | `/{id}` |
| 新增 | POST | `/` |
| 修改 | PUT | `/` |
| 删除 | DELETE | `/{ids}` |
| 导出 | POST | `/export` |

### 代码检查项
- 🔴 **严重**：包名必须是 `org.dromara.*`
- 🔴 **严重**：禁止完整类型引用
- 🔴 **严重**：API 路径必须规范
- 🟡 **警告**：必须使用 `@SaCheckPermission`
- 🟡 **警告**：必须使用 `MapstructUtils`
- 🟡 **警告**：BO 必须使用 `@AutoMapper`

## 使用方法

1. 将 `.claude/` 目录复制到您的 RuoYi-Vue-Plus 项目根目录
2. 将 `CLAUDE.md` 复制到项目根目录
3. 启动 Claude Code
4. 输入 `/start` 开始体验

## 环境要求

- **Claude Code**：需安装 [Claude Code CLI](https://claude.ai/claude-code)
- **RuoYi-Vue-Plus**：5.X 版本

## 文件统计

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

享受 AI 带来的 10 倍开发效率提升！
