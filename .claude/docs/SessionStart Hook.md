# SessionStart Hook - 开工先看项目状态

## 功能概述

`session-start.js` 钩子在每次启动 Claude Code 会话时自动触发，帮助开发者快速了解项目当前状态，无需手动执行多个命令。

## 触发时机

- **当**: Claude Code 会话启动时
- **位置**: `.claude/hooks/session-start.js`
- **执行**: 自动执行，无需手动触发

## 核心功能

### 1. Git 状态显示

```
📦 Git 状态
----------------------------------------
  分支：feature/user-management
  最近提交：a3f7b2c 添加用户导出功能
  未提交变更：3 个文件
  变更文件:
    [修改] src/main/java/.../UserController.java
    [新增] src/main/java/.../UserExportService.java
    [修改] src/test/java/.../UserControllerTest.java
```

**显示内容**:
- 当前 Git 分支
- 最近一次提交信息
- 未提交的变更文件数量
- 变更文件列表（最多显示 8 个）

### 2. 待办事项加载

```
📝 待办事项
----------------------------------------
  来源：.claude/todos.md

  ○ 实现用户导出功能
  ○ 添加批量删除接口
  ○ 修复权限校验 bug
  ... 还有 2 项待办
```

**加载顺序**:
1. `.claude/todos.md`
2. `TODO.md`
3. `docs/待办清单.md`
4. 代码中的 TODO/FIXME 注释扫描

### 3. 快捷命令菜单

```
⚡ 快捷命令菜单
----------------------------------------
  /start        - 项目快速了解
  /dev          - 完整功能开发
  /crud         - 快速 CRUD 生成
  /check        - 代码规范检查
  /progress     - 项目进度分析
  /next         - 下一步建议
  /sync         - 全量状态同步
  /update-status - 增量状态更新
  /add-todo     - 添加待办事项
  /init-docs    - 文档初始化
```

## 使用示例

### 启动会话时

```bash
$ claude
```

**自动输出**:
```
============================================================
📋 项目状态面板 - Session Start
============================================================

📦 Git 状态
----------------------------------------
  分支：feature/user-management
  最近提交：a3f7b2c 添加用户导出功能
  未提交变更：3 个文件
  变更文件:
    [修改] src/main/java/org/dromara/system/controller/UserController.java
    [新增] src/main/java/org/dromara/system/service/UserExportService.java
    [修改] src/test/java/org/dromara/system/controller/UserControllerTest.java

📝 待办事项
----------------------------------------
  来源：.claude/todos.md

  ○ 实现用户导出功能
  ○ 添加批量删除接口
  ○ 修复权限校验 bug

⚡ 快捷命令菜单
----------------------------------------
  /start        - 项目快速了解
  /dev          - 完整功能开发
  /crud         - 快速 CRUD 生成
  ...

============================================================
💡 提示：使用 /start 查看项目概览，/progress 查看进度分析
```

## 配置选项

### 待办事项文件位置

支持以下位置的待办事项文件（按优先级）:

```
1. .claude/todos.md
2. TODO.md
3. docs/待办清单.md
4. .claude/templates/待办清单模板.md
```

### 代码注释扫描

当没有待办文件时，自动扫描代码中的注释:

```java
// TODO: 实现用户导出功能
// FIXME: 修复权限校验 bug
// XXX: 需要优化性能
// HACK: 临时解决方案
```

## 文件结构

```
.clause/hooks/
├── session-start.js      # SessionStart 钩子（新增）
├── skill-forced-eval.js  # 技能评估钩子
├── pre-tool-use.js       # 工具预处理钩子
└── stop.js               # 停止处理钩子
```

## 技术实现

### 依赖模块

```javascript
const { execSync } = require('child_process');  // 执行 Git 命令
const fs = require('fs');                        // 文件操作
const path = require('path');                    // 路径处理
```

### Git 命令

```javascript
// 获取当前分支
git branch --show-current

// 获取仓库状态
git status --porcelain

// 获取最近提交
git log -1 --format="%h %s"
```

## 扩展建议

### 可添加的功能

1. **TODO 优先级标记**
   ```javascript
   // 支持优先级标记
   // TODO[HIGH]: 紧急修复
   // TODO[LOW]: 优化建议
   ```

2. **分支保护检查**
   ```javascript
   // 检查是否在 main/master 分支直接开发
   if (branch === 'main' || branch === 'master') {
     console.warn('⚠️ 警告：在保护分支上开发');
   }
   ```

3. **未推送提交提醒**
   ```javascript
   // 检查本地有未推送的提交
   git rev-list HEAD @{upstream} --count
   ```

4. **CI/CD状态集成**
   ```javascript
   // 显示 GitHub Actions 状态
   // 显示最近构建结果
   ```

## 故障排除

### 问题：Git 状态显示"非 Git 仓库"

**解决**: 确认项目在 Git 仓库根目录

```bash
git rev-parse --git-dir
```

### 问题：待办事项无法加载

**解决**: 检查文件路径和权限

```bash
ls -la .claude/todos.md
cat .claude/todos.md
```

### 问题：钩子未执行

**解决**: 检查文件名和导出格式

```javascript
// 确保导出格式正确
module.exports = {
  onSessionStart: async (context) => {
    // ...
  }
};
```

## 禁用钩子

如需临时禁用此钩子，可重命名文件：

```bash
mv session-start.js session-start.js.disabled
```

## 相关文件

- [hooks 系统全景](./hooks 全景.md)
- [settings.json 配置](./settings.json)
- [commands 快捷命令](../commands/)

---

*创建时间：2026-04-06*  
*RuoYi-Vue-Plus AI 开发助手*
