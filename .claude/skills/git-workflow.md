# Git Workflow - Git 工作流规范

## 职责范围

规范 RuoYi-Vue-Plus 项目的 Git 使用实践，包括分支管理、提交规范、PR 流程、版本发布等团队协作流程。

---

## 核心规范

### 1. 分支管理策略

#### 1.1 分支模型

```
main/master          # 生产分支（受保护）
  ├── develop        # 开发分支
  │   ├── feature/user-login      # 功能分支
  │   ├── feature/order-module    # 功能分支
  │   └── bugfix/login-issue      # Bug 修复分支
  ├── release/v1.2.0 # 发布分支
  └── hotfix/urgent-fix # 热修复分支
```

#### 1.2 分支命名规范

| 分支类型 | 命名格式 | 示例 |
|----------|----------|------|
| 功能分支 | feature/功能简述 | feature/user-login |
| Bug 修复 | bugfix/问题简述 | bugfix/login-null-pointer |
| 发布分支 | release/版本号 | release/v1.2.0 |
| 热修复 | hotfix/问题简述 | hotfix/security-patch |
| 实验分支 | experiment/实验内容 | experiment/new-cache |

#### 1.3 分支操作指南

```bash
# 创建功能分支（从 develop 分支）
git checkout develop
git pull origin develop
git checkout -b feature/user-login

# 同步主分支最新代码
git checkout develop
git pull origin develop
git checkout feature/user-login
git merge develop

# 或者使用 rebase（保持线性历史）
git checkout feature/user-login
git rebase develop

# 功能完成后合并到 develop
git checkout develop
git merge --no-ff feature/user-login
git push origin develop

# 删除已合并的分支
git branch -d feature/user-login
git push origin --delete feature/user-login
```

### 2. 提交规范

#### 2.1 Conventional Commits 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### 2.2 Type 类型

| 类型 | 说明 | 示例 |
|------|------|------|
| feat | 新功能 | feat(user): 添加用户登录功能 |
| fix | Bug 修复 | fix(order): 修复订单金额计算错误 |
| docs | 文档更新 | docs(readme): 更新安装说明 |
| style | 格式调整（不影响代码逻辑） | style(format): 代码格式化 |
| refactor | 重构（非新功能非 bug 修复） | refactor(user): 重构用户服务 |
| perf | 性能优化 | perf(cache): 优化缓存策略 |
| test | 测试相关 | test(user): 添加用户测试用例 |
| chore | 构建/工具/配置 | chore(deps): 升级依赖版本 |
| ci | CI 配置 | ci(github): 更新 GitHub Actions |
| revert | 回滚 | revert: 回滚"feat: xxx" |

#### 2.3 提交示例

```bash
# 单行提交（简单变更）
git commit -m "feat(user): 添加用户注册功能"

# 完整提交（复杂变更）
git commit -m "feat(order): 实现订单创建和支付流程

主要变更：
- 新增 Order 实体和 OrderItem 实体
- 实现 OrderService 创建订单逻辑
- 集成微信支付和支付宝支付
- 添加订单状态机

关联需求：PROJ-123"

# 包含 Breaking Change
git commit -m "feat(api): 重构用户 API 接口

变更内容：
- 将/user/info 改为 GET /users/{id}
- 响应格式从 AjaxResult 改为统一 DTO

BREAKING CHANGE: API 路径变更，前端需要同步更新
Closes #456"
```

#### 2.4 提交检查

```bash
# 安装 commitlint 检查提交信息
npm install -g @commitlint/cli @commitlint/config-conventional

# commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor',
      'perf', 'test', 'chore', 'ci', 'revert'
    ]],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72]
  }
};

# Husky 预提交钩子
npx husky install
npx husky add .husky/commit-msg 'npx --no -- commitlint -e $1'
```

### 3. Pull Request 流程

#### 3.1 PR 模板

```markdown
<!-- .github/PULL_REQUEST_TEMPLATE.md -->

## 📝 变更说明

请描述此 PR 的主要变更内容和目的。

## 🔗 关联 Issue

- Fixes #123
- Related to #456

## ✅ 检查清单

- [ ] 代码已通过本地测试
- [ ] 已添加必要的单元测试
- [ ] 已更新相关文档
- [ ] 已完成自审

## 📸 截图（如适用）

<!-- 前端变更请提供截图 -->

## 🧪 测试计划

1. 测试步骤 1
2. 测试步骤 2
3. ...
```

#### 3.2 PR 审查要点

```markdown
## 代码审查检查单

### 功能正确性
- [ ] 功能是否按需求实现
- [ ] 边界条件是否处理
- [ ] 异常场景是否有妥善处理

### 代码质量
- [ ] 代码是否遵循项目规范
- [ ] 是否存在重复代码
- [ ] 命名是否清晰准确
- [ ] 方法是否过长（>50 行）

### 安全性
- [ ] 是否存在 SQL 注入风险
- [ ] 是否存在 XSS 漏洞
- [ ] 敏感数据是否加密
- [ ] 权限校验是否完善

### 性能
- [ ] 是否存在 N+1 查询
- [ ] 是否有合适的索引
- [ ] 是否存在内存泄漏风险
- [ ] 大数据量是否有分页/限流

### 测试
- [ ] 单元测试覆盖率是否达标
- [ ] 是否包含边界测试
- [ ] 是否包含异常测试
```

#### 3.3 PR 合并策略

```bash
# 1. Squash and Merge（推荐）
# 将多个提交压缩为一个，保持主分支历史清晰
# 适用于功能分支有多个"开发中"提交

# 2. Merge Commit
# 保留完整的分支历史和合并提交
# 适用于长期分支或需要保留详细历史的场景

# 3. Rebase and Merge
# 将提交变基后线性合并
# 适用于单提交 PR 或需要线性历史的场景
```

### 4. 版本发布流程

#### 4.1 语义化版本

```
主版本号。次版本号。修订号
MAJOR.MINOR.PATCH

- MAJOR: 不兼容的变更
- MINOR: 向后兼容的功能
- PATCH: 向后兼容的 bug 修复

示例：v1.2.3
```

#### 4.2 发布步骤

```bash
# 1. 创建发布分支
git checkout -b release/v1.2.0 develop

# 2. 版本号设置（更新版本号）
# 修改 pom.xml、package.json 等版本文件

# 3. 更新 CHANGELOG.md
# 使用 changelog 工具自动生成

# 4. 测试验证
mvn clean test
# 或运行集成测试

# 5. 合并到 main 和 develop
git checkout main
git merge --no-ff release/v1.2.0
git tag -a v1.2.0 -m "Release version 1.2.0"

git checkout develop
git merge --no-ff release/v1.2.0

# 6. 删除发布分支
git branch -d release/v1.2.0

# 7. 推送标签
git push origin v1.2.0
git push origin main
git push origin develop
```

#### 4.3 GitHub Release

```bash
# 使用 gh CLI 创建 Release
gh release create v1.2.0 \
  --title "Release v1.2.0" \
  --notes-file CHANGELOG.md \
  --target main
```

### 5. 常用 Git 命令

#### 5.1 日常操作

```bash
# 查看状态
git status
git status -s  # 简洁格式

# 查看变更
git diff
git diff --cached  # 查看暂存区

# 查看历史
git log --oneline --graph --all
git log -p  # 显示变更内容

# 撤销操作
git reset HEAD~1  # 撤销最后一次提交（保留变更）
git reset --hard HEAD~1  # 完全撤销（危险！）
git revert <commit>  # 通过新提交撤销
```

#### 5.2 分支操作

```bash
# 查看分支
git branch -a
git branch -vv  # 查看远程追踪

# 创建并切换
git checkout -b feature/new-feature
git checkout -b feature/new-feature origin/develop

# 合并分支
git merge --no-ff feature/new-feature

# 变基
git rebase -i HEAD~3  # 交互式变基最后 3 次提交

# 删除分支
git branch -d feature/name
git branch -D feature/name  # 强制删除
```

#### 5.3 标签操作

```bash
# 创建标签
git tag v1.0.0
git tag -a v1.0.0 -m "版本说明"

# 查看标签
git tag
git show v1.0.0

# 推送标签
git push origin v1.0.0
git push origin --tags

# 删除标签
git tag -d v1.0.0
git push origin --delete v1.0.0
```

### 6. 多人协作最佳实践

#### 6.1 避免冲突

```bash
# 开始工作前
git pull --rebase  # 变基拉取，保持线性

# 定期同步主分支
git fetch origin
git rebase origin/develop

# 小步提交，频繁推送
git add -p  # 交互式暂存
git commit -m "feat: 完成用户校验逻辑"
git push
```

#### 6.2 解决冲突

```bash
# 发生冲突时
git status  # 查看冲突文件
git diff    # 查看具体冲突

# 编辑文件解决冲突后
git add <resolved-file>
git commit  # 完成变基或合并
git push
```

#### 6.3 紧急修复

```bash
# 生产环境紧急 bug
git checkout main
git checkout -b hotfix/urgent-fix

# 修复并提交
git commit -m "fix: 紧急修复登录空指针问题"

# 合并到 main 和 develop
git checkout main
git merge hotfix/urgent-fix
git tag -a v1.2.1 -m "Hotfix for login issue"

git checkout develop
git merge hotfix/urgent-fix

git branch -d hotfix/urgent-fix
git push origin main develop --tags
```

---

## Git 配置建议

```bash
# 全局配置
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global core.editor "vim"
git config --global init.defaultBranch main

# 别名配置
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.lg 'log --oneline --graph --all'
```

---

## 触发关键词

- Git
- 版本控制
- 分支管理
- PR
- 代码审查
- 提交规范
- 发布流程

---

## 相关文件

- [technical-writing.md](./technical-writing.md) - 技术文档写作
- [code-review.md](./code-review.md) - 代码审查规范

---

*更新时间：2026-04-06*  
*RuoYi-Vue-Plus AI 开发助手*
