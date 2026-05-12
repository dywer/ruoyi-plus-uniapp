# Hooks 系统全景图

> RuoYi-Vue-Plus AI 开发助手 - 智能钩子系统

---

## 1. Hooks 架构概览

项目中的 Hooks 系统位于 `.claude/hooks/` 目录，包含 **4 个核心钩子**，形成完整的任务处理流水线：

```
┌─────────────────────────────────────────────────────────┐
│                    用户输入 Prompt                        │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  ① skill-forced-eval.js  - 技能匹配与注入                │
│     (before 钩子)                                        │
│     触发：用户输入分析阶段                                │
│     功能：检测关键词 → 推荐技能 → 注入提示               │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  ② session-start.js        - 项目状态面板                │
│     (onSessionStart 钩子)                                  │
│     触发：每次启动 Claude Code 会话时                       │
│     功能：Git 状态 | 待办事项 | 快捷命令菜单              │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  ③ pre-tool-use.js       - 安全防护层 ⭐                 │
│     (beforeToolUse / afterToolUse)                       │
│     触发：AI 执行工具之前                                   │
│     功能：危险命令拦截 | 代码规范验证 | 密钥检测         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  ④ stop.js                 - 总结反馈 + 下一步建议 ⭐      │
│     (onStop 钩子)                                        │
│     触发：AI 完成任务后                                   │
│     功能：完成音效 | 变更分析 | 智能推荐 | 临时文件清理  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 钩子详细清单

### 2.1 skill-forced-eval.js（技能强制评估）

| 属性 | 值 |
|------|------|
| **触发时机** | 用户输入分析阶段 |
| **核心功能** | 分析关键词 → 匹配技能 → 注入提示 |
| **保护级别** | 辅助增强 |

**技能匹配规则**:

| 关键词 | 推荐技能 |
|--------|----------|
| CRUD、增删改查 | `crud-development` |
| API、接口 | `api-development` |
| 数据库、SQL | `database-ops` |
| 安全、权限 | `security-guard` |
| Redis、缓存 | `redis-cache` |
| 流程、工作流 | `workflow-engine` |
| 租户、SaaS | `tenant-management` |

**注入示例**:
```
请优先考虑使用以下技能：api-development, crud-development
```

📖 **详细文档**: [skill-forced-eval.js](./skill-forced-eval.js)

---

### 2.2 session-start.js（会话启动 - 项目状态面板）

| 属性 | 值 |
|------|------|
| **触发时机** | 每次启动 Claude Code 会话时 |
| **核心功能** | Git 状态 | 待办事项 | 快捷命令菜单 |
| **保护级别** | 信息显示 |

**输出示例**:
```
============================================================
📋 项目状态面板 - Session Start
============================================================

📦 Git 状态
----------------------------------------
  分支：feature/user-management
  最近提交：a3f7b2c 添加用户导出功能
  未提交变更：3 个文件

📝 待办事项
----------------------------------------
  来源：.claude/todos.md
  ○ 实现用户导出功能
  ○ 添加批量删除接口

⚡ 快捷命令菜单
----------------------------------------
  /start        - 项目快速了解
  /dev          - 完整功能开发
  /crud         - 快速 CRUD 生成
  ...
```

📖 **详细文档**: [SessionStart Hook.md](./SessionStart Hook.md)

---

### 2.3 pre-tool-use.js（安全防护层）⭐

| 属性 | 值 |
|------|------|
| **触发时机** | AI 执行 Bash 命令或写入文件之前 |
| **核心功能** | 危险命令拦截 | 代码规范验证 | 密钥检测 |
| **保护级别** | **严重** |

**危险命令黑名单（部分）**:

| 级别 | 命令模式 | 说明 |
|------|----------|------|
| 🚫 严重 | `rm -rf` / `rm -fr` | 递归强制删除 |
| 🚫 严重 | `drop database` | 删除数据库 |
| 🚫 严重 | `format` | 磁盘格式化 |
| ⚠️ 警告 | `rm -r` | 递归删除 |
| ⚠️ 警告 | `wget` / `curl` | 下载外部文件 |
| ⚠️ 警告 | `sudo` | 提权执行 |
| ⚠️ 警告 | `eval` / `exec` | 动态代码执行 |

**敏感路径保护**:
```javascript
['/etc/', '/usr/', '/var/', '/root/', 
 'C:\\Windows\\', '.env', '.git/', '.ssh/', 
 'node_modules/', 'id_rsa', '.pem']
```

**代码规范验证（RuoYi-Vue-Plus）**:
- Java 包名必须以 `org.dromara` 开头
- 违反规范的文件创建/编辑会被阻止

**硬编码密钥检测**:
- OpenAI API Key 模式：`sk-[a-zA-Z0-9]{32,}`
- GitHub Token: `ghp_[a-zA-Z0-9]{36}`
- AWS Key: `AKIA[0-9A-Z]{16}`
- 密码/Secret 模式
- 私钥文件头：`-----BEGIN.*PRIVATE KEY-----`

**测试结果**:
```
✅ 测试 1 - 危险命令 rm -rf: 阻止
✅ 测试 2 - 敏感路径 /etc/: 需要确认
✅ 测试 3 - 正常命令 ls -la: 允许
✅ 测试 4 - Java 包名违规：阻止
✅ 测试 5 - Java 包名合规：允许
✅ 测试 6 - 硬编码 API Key: 需要确认
```

📖 **详细文档**: [PreToolUse Hook.md](./PreToolUse Hook.md)

---

### 2.4 stop.js（总结反馈 + 下一步建议）⭐

| 属性 | 值 |
|------|------|
| **触发时机** | AI 完成任务后 |
| **核心功能** | 完成音效 \| 变更分析 \| 智能推荐 \| 临时文件清理 |
| **保护级别** | 清理/反馈 |

**核心功能详解**:

#### 1. 🔔 完成音效
- 支持 macOS (`afplay`) / Windows (PowerShell) / Linux (`aplay`)
- 音效文件：`.claude/audio/completed.wav`

#### 2. 📊 变更分析
| 变更类型 | 识别条件 |
|----------|----------|
| API 接口变更 | 包含 `controller` / `api` |
| 前端变更 | `.vue`, `.tsx`, `.jsx` |
| 数据库变更 | `.sql`, `migration` |
| 测试代码 | 包含 `test` / `spec` |
| 配置变更 | `.yml`, `.yaml` |
| 文档更新 | `.md` |

#### 3. 💡 智能推荐
基于变更内容推荐下一步操作：
- Controller → 编写单元测试
- Service → 检查 @Transactional
- Mapper → 验证 SQL 映射
- 前端 → ESLint 检查
- 配置 → 验证版本控制

#### 4. 🗑️ 临时文件清理
- Windows 特殊文件：`nul`, `con`, `prn`, `aux`
- 临时文件：`*.tmp`

**输出示例**:
```
======================================================================
✅ 任务完成 - 执行清理和总结
======================================================================
🔔 完成音效已播放

📊 任务执行摘要
--------------------------------------------------
  状态：✅ 已完成
  变更类型：API 接口变更
  涉及语言：Java
  涉及模块：Controller, Service

💡 下一步建议
--------------------------------------------------
  🔴 1. 建议：检查是否添加了 @SaCheckPermission 权限注解
  🟢 2. 建议下一步：编写单元测试验证 API 功能
     命令：mvn test -Dtest=YourControllerTest
  🟢 3. 建议：提交代码到 Git
     命令：git add . && git commit -m "feat: ..."
======================================================================
```

📖 **详细文档**: [Stop Hook.md](./Stop%20Hook.md)

---

## 3. Hooks 执行流程示例

### 场景：用户请求「创建用户管理接口并执行测试」

```
1. 用户输入：「创建用户管理接口」
       ↓
2. skill-forced-eval.js 触发
   - 检测到「接口」→ 推荐 api-development
   - 检测到「用户管理」→ 推荐 crud-development
   - 注入：「请优先考虑使用以下技能：api-development, crud-development」
       ↓
3. session-start.js (下次会话时)
   - 显示 Git 状态
   - 加载待办事项
   - 展示快捷命令
       ↓
4. Claude 开始执行，准备调用 Write 工具创建文件
       ↓
5. pre-tool-use.js 触发 (beforeToolUse)
   - 检查文件路径：src/main/java/org/dromara/.../UserController.java ✓
   - 检查包名：org.dromara.system.controller ✓
   - 检查内容：无硬编码密钥 ✓
   - 验证通过，允许写入
       ↓
6. 文件写入完成
       ↓
7. Claude 准备执行测试命令
       ↓
8. pre-tool-use.js 触发 (beforeToolUse)
   - 检查命令：mvn test -pl ruoyi-system ✓
   - 非危险命令，允许执行
       ↓
9. 任务完成
       ↓
10. stop.js 触发 (onStop)
    - 播放完成音效 🔔
    - 分析代码变更类型 📊
    - 智能推荐下一步操作 💡
    - 清理临时文件 🗑️
    - 输出完整报告
```

---

## 4. 配置与自定义

### 4.1 文件结构

```
.clause/hooks/
├── session-start.js      # 会话启动钩子（新增）
├── skill-forced-eval.js  # 技能评估钩子
├── pre-tool-use.js       # 工具预处理钩子（增强）
└── stop.js               # 停止处理钩子
```

### 4.2 自定义危险命令

编辑 `pre-tool-use.js`:

```javascript
const DANGEROUS_COMMANDS = {
  // 添加自定义危险命令
  'my-dangerous-command': '自定义危险命令描述',
  // ...
};
```

### 4.3 自定义敏感路径

编辑 `pre-tool-use.js`:

```javascript
const SENSITIVE_PATHS = [
  '/your/sensitive/path',
  'your-secret-file.txt',
  // ...
];
```

### 4.4 添加新技能触发词

编辑 `skill-forced-eval.js`:

```javascript
function analyzeSkills(input) {
  // 添加新规则
  if (input.toLowerCase().includes('你的关键词')) {
    skills.push('your-skill-name');
  }
}
```

---

## 5. 与其他系统的协同

```
┌─────────────────────────────────────────────────────────┐
│  Commands（10 个快捷命令）                               │
│  /start, /crud, /dev, /check...                         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Skills（40+ 专业技能）                                  │
│  crud-development, api-development...                   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Hooks（4 个钩子）← 当前文档                              │
│  • session-start - 项目状态面板                          │
│  • skill-forced-eval - 技能匹配                         │
│  • pre-tool-use - 安全防护 ⭐                            │
│  • stop - 任务清理                                      │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Agents（2 个代理）                                      │
│  project-manager, code-reviewer                         │
└─────────────────────────────────────────────────────────┘
```

---

## 6. 故障排除

### 问题：Hook 未执行

**解决**:
1. 检查文件名是否正确：`ls -la .claude/hooks/`
2. 检查导出格式：
```javascript
module.exports = {
  beforeToolUse: async (toolCall, context) => { /* ... */ }
};
```
3. 测试模块加载：`node -e "require('./.claude/hooks/pre-tool-use.js')"`

### 问题：正常命令被误拦截

**解决**: 在 `validateBashCommand` 中添加例外：
```javascript
if (command === 'your-safe-command') {
  return { allowed: true };
}
```

### 问题：需要调试日志

**解决**: 在钩子中添加：
```javascript
console.log('[HOOK] beforeToolUse:', toolCall.name, toolCall.args);
```

### 问题：临时禁用钩子

**解决**: 重命名文件
```bash
mv pre-tool-use.js pre-tool-use.js.disabled
```

---

## 7. 安全最佳实践

### 7.1 分层防护

```
用户输入 → 技能评估 → 工具调用 → 安全验证 → 执行
              ↓                        ↓
         技能推荐                  危险拦截
                                   规范验证
                                   密钥检测
```

### 7.2 最小权限原则

- 默认阻止危险操作
- 敏感路径需要确认
- 提权命令需要二次验证

### 7.3 审计日志

```javascript
// 记录所有工具使用
function logToolUsage(toolResult, context) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Tool: ${toolResult?.toolCall?.name}`);
}
```

---

## 8. 文件索引

| 文件 | 功能 | 详细文档 |
|------|------|----------|
| `session-start.js` | 会话启动/项目状态 | [SessionStart Hook.md](./SessionStart%20Hook.md) |
| `skill-forced-eval.js` | 技能评估 | 见源码注释 |
| `pre-tool-use.js` | 安全防护层 | [PreToolUse Hook.md](./PreToolUse%20Hook.md) |
| `stop.js` | 总结反馈 + 下一步建议 | [Stop Hook.md](./Stop%20Hook.md) |

---

*更新时间：2026-04-06*  
*RuoYi-Vue-Plus AI 开发助手*
