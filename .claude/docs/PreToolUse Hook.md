# PreToolUse Hook - 安全防护层

## 功能概述

`pre-tool-use.js` 钩子在 AI 执行 Bash 命令或写入文件**之前**进行拦截和验证，形成安全防护层，防止危险操作和代码规范违规。

## 触发时机

- **当**: AI 准备调用工具时（Bash、Write、Edit 等）
- **位置**: `.claude/hooks/pre-tool-use.js`
- **执行**: 自动拦截并验证

---

## 核心功能

### 1. 危险命令拦截（黑名单机制）

#### 🚫 严重危险 - 直接阻止

| 命令模式 | 说明 |
|----------|------|
| `rm -rf` / `rm -fr` | 递归强制删除文件/目录 |
| `format` | 磁盘格式化命令 |
| `mkfs` | 创建文件系统 |
| `fdisk` | 磁盘分区操作 |
| `dd` | 底层磁盘操作 |
| `drop database` | 删除数据库 |
| `drop table` | 删除数据表 |
| `truncate` | 清空表数据 |
| `:(){ :|:& };:` | Fork 炸弹 |
| `chmod 777` | 设置完全权限 |

#### ⚠️ 警告 - 需要确认

| 命令模式 | 说明 |
|----------|------|
| `rm -r` | 递归删除文件/目录 |
| `rm -f` | 强制删除文件 |
| `wget` / `curl` | 下载外部文件 |
| `sudo` | 提权执行命令 |
| `eval` / `exec` | 动态代码执行 |
| `bash -c` / `sh -c` | 执行脚本 |
| `nmap` | 网络扫描工具 |
| `del /f` | Windows 强制删除 |

---

### 2. 敏感路径保护

以下路径的操作需要二次确认：

```javascript
const SENSITIVE_PATHS = [
  '/etc/',           // 系统配置
  '/usr/',           // 系统程序
  '/var/',           // 系统数据
  '/root/',          // 管理员家目录
  'C:\\Windows\\',   // Windows 系统
  '.env',            // 环境变量文件
  '.git/',           // Git 仓库
  'node_modules/',   // 依赖目录
  '.ssh/',           // SSH 密钥
  'id_rsa',          // RSA 私钥
  '.pem', '.key'     // 证书文件
];
```

---

### 3. 代码规范验证（RuoYi-Vue-Plus）

#### Java 包名检查

```javascript
// ❌ 阻止：包名不规范
package com.example.UserController;

// ✅ 允许：符合 RuoYi-Vue-Plus 规范
package org.dromara.system.controller;
package com.ruoyi.system.service;
```

#### 验证逻辑
- 所有 Java 文件包名必须以 `org.dromara` 或 `com.ruoyi` 开头
- 违反规范的文件创建/编辑会被阻止

---

### 4. 硬编码密钥检测

自动检测以下敏感信息模式：

| 模式 | 描述 |
|------|------|
| `sk-[a-zA-Z0-9]{32,}` | OpenAI API Key |
| `ghp_[a-zA-Z0-9]{36}` | GitHub Personal Token |
| `AKIA[0-9A-Z]{16}` | AWS Access Key |
| `password\s*[=:]\s*['"][^'"]+['"]` | 硬编码密码 |
| `api[_-]?key\s*[=:]\s*['"][^'"]+['"]` | 硬编码 API Key |
| `secret\s*[=:]\s*['"][^'"]+['"]` | 硬编码 Secret |
| `-----BEGIN.*PRIVATE KEY-----` | 私钥文件 |
| `eyJ...` | JWT Token |

---

## 使用示例

### 示例 1：危险命令被阻止

```bash
# 用户尝试执行
$ rm -rf /tmp/test

# Hook 拦截输出
🚫 危险：递归强制删除文件/目录
操作已被阻止，该命令可能导致数据丢失
```

### 示例 2：敏感路径需要确认

```bash
# 用户尝试执行
$ cat /etc/passwd

# Hook 拦截输出
⚠️ 操作涉及敏感路径：/etc/
请确认是否继续执行此操作
```

### 示例 3：代码规范违规

```java
// 用户尝试创建文件
package com.example.MyController;

public class MyController {
    // ...
}

// Hook 拦截输出
代码规范违规：Java 包名必须以 'org.dromara' 或 'com.ruoyi' 开头，当前包名：com.example
```

### 示例 4：检测到硬编码密钥

```javascript
// 用户尝试写入
const apiKey = "sk-proj-abcdefghijklmnopqrstuvwxyz123456";

// Hook 拦截输出
⚠️ 检测到疑似硬编码密钥：OpenAI API Key
请使用环境变量代替：process.env.OPENAI_API_KEY
```

---

## 技术实现

### 验证流程

```
┌─────────────────────────────────────────────────────────┐
│                    AI 准备调用工具                        │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  ① 代码规范验证                                          │
│     - Java 包名检查 (org.dromara / com.ruoyi)            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  ② Bash 命令安全检查                                      │
│     - 危险命令黑名单匹配                                  │
│     - 敏感路径检查                                        │
│     - 管道/重定向分析                                     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  ③ 文件路径验证                                          │
│     - 敏感路径检查                                        │
│     - 系统目录保护                                        │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  ④ 密钥检测                                               │
│     - API Key 模式匹配                                    │
│     - 私钥/证书检测                                       │
│     - 密码/Secret 检测                                     │
└─────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          ▼                                  ▼
┌───────────────────┐              ┌───────────────────┐
│   ✅ 验证通过      │              │   ❌ 验证失败      │
│   允许执行工具     │              │   阻止/要求确认    │
└───────────────────┘              └───────────────────┘
```

### 返回格式

```javascript
// 允许执行
{
  allowed: true,
  action: 'allow',
  message: '工具使用验证通过'
}

// 阻止执行
{
  allowed: false,
  action: 'block',
  severity: 'critical',
  message: '🚫 危险：递归强制删除文件/目录',
  reason: '命令包含危险模式：rm -rf'
}

// 需要确认
{
  allowed: false,
  action: 'confirm',
  severity: 'warning',
  message: '⚠️ 操作涉及敏感路径：/etc/'
}
```

---

## 配置选项

### 自定义黑名单

编辑 `pre-tool-use.js` 中的 `DANGEROUS_COMMANDS` 对象：

```javascript
const DANGEROUS_COMMANDS = {
  // 添加自定义危险命令
  'my-dangerous-command': '自定义危险命令描述',
  // ...
};
```

### 自定义敏感路径

编辑 `SENSITIVE_PATHS` 数组：

```javascript
const SENSITIVE_PATHS = [
  '/your/sensitive/path',
  'your-secret-file.txt',
  // ...
];
```

---

## 与其他 Hook 的协同

```
┌─────────────────────────────────────────────────────────┐
│  skill-forced-eval.js                                    │
│  (用户输入分析 → 技能推荐)                               │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  pre-tool-use.js ← 当前文档                              │
│  (工具调用前 → 安全验证)                                 │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  stop.js                                                 │
│  (任务完成 → 清理/摘要)                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 故障排除

### 问题：正常命令被误拦截

**解决**: 将命令添加到白名单或调整黑名单规则

```javascript
// 在 validateBashCommand 函数中添加例外
if (command === 'your-safe-command') {
  return { allowed: true };
}
```

### 问题： Hook 未执行

**解决**: 检查文件名和导出格式

```javascript
// 确保导出格式正确
module.exports = {
  beforeToolUse: async (toolCall, context) => {
    // ...
  }
};
```

### 问题：需要查看拦截日志

**解决**: 启用详细日志

```javascript
function logToolUsage(toolResult, context) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Tool: ${toolResult?.toolCall?.name}`);
  console.log(`[${timestamp}] Result: ${JSON.stringify(toolResult)}`);
}
```

---

## 禁用钩子

如需临时禁用此钩子，可重命名文件：

```bash
mv pre-tool-use.js pre-tool-use.js.disabled
```

---

## 相关文件

- [skill-forced-eval.js](./skill-forced-eval.js) - 技能评估钩子
- [session-start.js](./session-start.js) - 会话启动钩子
- [stop.js](./stop.js) - 停止处理钩子
- [Hooks 系统全景](./hooks 全景.md)

---

*更新时间：2026-04-06*  
*RuoYi-Vue-Plus AI 开发助手*
