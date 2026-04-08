# GitHub Workflow 自动化技能 (GitHub Workflow Automation)

## 适用场景
- CI/CD 流水线设计
- GitHub Actions 自动化
- PR 自动化处理
- Issue 自动管理
- Release 发布流程

## 核心技术栈

### GitHub Actions 组件
| 组件 | 用途 | 说明 |
|------|------|------|
| Workflow | 工作流定义 | YAML 文件定义自动化流程 |
| Job | 任务单元 | 工作流中的执行单元 |
| Step | 步骤 | 任务中的具体执行步骤 |
| Action | 可复用动作 | 预定义的 Step 模板 |
| Runner | 执行器 | 运行工作流的服务器 |

### 常见自动化场景
```
┌─────────────────────────────────────────────────────────┐
│  CI/CD 流水线：代码提交 → 构建 → 测试 → 部署             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  PR 自动化：PR 创建 → 自动审查 → 标签分配 → 通知         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Issue 管理：Issue 创建 → 自动分类 → 分配负责人 → 提醒   │
└─────────────────────────────────────────────────────────┘
```

## Maven 项目 CI 配置

### 基础 CI 工作流
```yaml
# .github/workflows/ci.yml
name: Java CI with Maven

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        java: [17, 21]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up JDK ${{ matrix.java }}
      uses: actions/setup-java@v4
      with:
        java-version: ${{ matrix.java }}
        distribution: 'temurin'
        cache: maven
    
    - name: Build with Maven
      run: mvn -B package --file pom.xml
    
    - name: Run tests
      run: mvn test
    
    - name: Upload test results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: test-results-${{ matrix.java }}
        path: target/surefire-reports/
    
    - name: Upload coverage reports
      uses: actions/upload-artifact@v4
      if: success()
      with:
        name: jacoco-report-${{ matrix.java }}
        path: target/site/jacoco/
```

### 带缓存优化的构建
```yaml
# .github/workflows/ci-optimized.yml
name: Optimized Java CI

on:
  push:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Cache Maven dependencies
      uses: actions/cache@v4
      with:
        path: |
          ~/.m2/repository
          !~/.m2/repository/com/ruoyi
        key: ${{ runner.os }}-maven-${{ hashFiles('**/pom.xml') }}
        restore-keys: |
          ${{ runner.os }}-maven-
    
    - name: Cache SonarQube packages
      uses: actions/cache@v4
      with:
        path: ~/.sonar/cache
        key: ${{ runner.os }}-sonar-${{ hashFiles('**/pom.xml') }}
        restore-keys: |
          ${{ runner.os }}-sonar-
    
    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
        cache: maven
    
    - name: Build and analyze
      run: |
        mvn -B verify \
          -DskipTests \
          -Dsonar.projectKey=${{ secrets.SONAR_PROJECT_KEY }} \
          -Dsonar.host.url=${{ secrets.SONAR_HOST_URL }} \
          -Dsonar.token=${{ secrets.SONAR_TOKEN }}
    
    - name: Run tests with coverage
      run: mvn test jacoco:report
    
    - name: Upload JAR
      uses: actions/upload-artifact@v4
      with:
        name: application-jar
        path: target/*.jar
        retention-days: 7
```

## PR 自动化

### PR 自动审查
```yaml
# .github/workflows/pr-review.yml
name: PR Automation

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  # 自动分配审查人
  assign-reviewers:
    runs-on: ubuntu-latest
    steps:
    - name: Auto assign reviewers
      uses: blunderbuss-app/blunderbuss@v1
      with:
        reviewers: |
          senior-dev-1
          senior-dev-2
    
    # 或者基于文件变更自动分配
    - name: Assign based on files
      uses: actions/github-script@v7
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
        script: |
          const { owner, repo, number } = context.issue;
          const { data: files } = await github.rest.pulls.listFiles({ owner, repo, pull_number: number });
          
          const teamMap = {
            'src/main/java/com/ruoyi/system/': 'system-team',
            'src/main/java/com/ruoyi/common/': 'core-team',
            'ruoyi-ui/': 'frontend-team'
          };
          
          for (const file of files) {
            for (const [path, team] of Object.entries(teamMap)) {
              if (file.filename.startsWith(path)) {
                await github.rest.issues.addAssignees({
                  owner, repo, issue_number: number,
                  assignees: [team]
                });
              }
            }
          }

  # 自动标签分类
  auto-label:
    runs-on: ubuntu-latest
    steps:
    - name: Label based on branch
      uses: actions/github-script@v7
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
        script: |
          const { owner, repo, number } = context.issue;
          const pr = await github.rest.pulls.get({ owner, repo, pull_number: number });
          const branch = pr.data.head.ref;
          
          const labels = [];
          if (branch.startsWith('feat/')) labels.push('feature');
          if (branch.startsWith('fix/')) labels.push('bug');
          if (branch.startsWith('docs/')) labels.push('documentation');
          if (branch.startsWith('refactor/')) labels.push('refactor');
          if (branch.startsWith('test/')) labels.push('testing');
          
          if (labels.length > 0) {
            await github.rest.issues.addLabels({
              owner, repo, issue_number: number,
              labels
            });
          }

  # 代码质量检查
  code-quality:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
    
    - name: Run Spotless check
      run: mvn spotless:check
    
    - name: Run PMD
      run: mvn pmd:check
    
    - name: Comment PMD results
      uses: github-actions-up-and-running/pmd-report@v1
      if: always()
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
```

### PR 模板
```markdown
<!-- .github/PULL_REQUEST_TEMPLATE.md -->

## 📝 变更描述

请简要描述本 PR 的目的和变更内容

## 🎫 关联 Issue

- Closes #

## ✅ 检查清单

请确保完成以下项：

- [ ] 代码通过本地测试
- [ ] 单元测试已添加/更新
- [ ] 代码符合项目规范
- [ ] 文档已更新（如适用）
- [ ] 变更已添加到 CHANGELOG（如适用）

## 📸 截图（如适用）

如有 UI 变更，请提供截图

## 🧪 测试计划

请描述如何测试这些变更
```

## Issue 自动化

### Issue 自动分类
```yaml
# .github/workflows/issue-auto-triage.yml
name: Issue Auto Triage

on:
  issues:
    types: [opened]

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
    # 基于模板自动分类
    - name: Categorize issue
      uses: actions/github-script@v7
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
        script: |
          const issue = context.issue;
          const body = issue.body || '';
          
          // 检测 Issue 类型
          let type = 'general';
          if (body.includes('[X] Bug')) type = 'bug';
          if (body.includes('[X] Feature')) type = 'feature';
          if (body.includes('[X] Documentation')) type = 'docs';
          
          // 添加标签
          await github.rest.issues.addLabels({
            owner: issue.owner,
            repo: issue.repo,
            issue_number: issue.number,
            labels: [type, 'triage-needed']
          });
          
          // 自动分配负责人（基于标签）
          const assigneeMap = {
            'bug': 'dev-lead',
            'feature': 'product-owner',
            'docs': 'tech-writer'
          };
          
          if (assigneeMap[type]) {
            await github.rest.issues.addAssignees({
              owner: issue.owner,
              repo: issue.repo,
              issue_number: issue.number,
              assignees: [assigneeMap[type]]
            });
          }
          
          // 添加响应模板
          const responseTemplate = `
  感谢您的反馈！
  
  - **类型**: ${type}
  - **状态**: 待确认
  - **优先级**: 待评估
  
  我们会尽快处理您的问题。如需补充信息，请直接回复。
  `;
          
          await github.rest.issues.createComment({
            owner: issue.owner,
            repo: issue.repo,
            issue_number: issue.number,
            body: responseTemplate
          });

  # 检测重复 Issue
  check-duplicate:
    runs-on: ubuntu-latest
    steps:
    - name: Find similar issues
      uses: actions/github-script@v7
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
        script: |
          const issue = context.issue;
          const { data: issues } = await github.rest.issues.listForRepo({
            owner: issue.owner,
            repo: issue.repo,
            state: 'open',
            per_page: 100
          });
          
          const titleWords = issue.title.toLowerCase().split(/\s+/);
          const similarIssues = [];
          
          for (const existing of issues) {
            if (existing.number === issue.number) continue;
            
            const existingTitle = existing.title.toLowerCase();
            let matchCount = 0;
            
            for (const word of titleWords) {
              if (word.length > 3 && existingTitle.includes(word)) {
                matchCount++;
              }
            }
            
            if (matchCount >= 3) {
              similarIssues.push(existing);
            }
          }
          
          if (similarIssues.length > 0) {
            const comment = `
  发现以下可能重复的 Issue：
  
  ${similarIssues.map(i => `- #${i.number}: ${i.title}`).join('\n')}
  
  如果这些问题与您的问题相同，请在原 Issue 下回复补充信息。
  `;
            
            await github.rest.issues.createComment({
              owner: issue.owner,
              repo: issue.repo,
              issue_number: issue.number,
              body: comment
            });
          }
```

### Issue 模板
```yaml
# .github/ISSUE_TEMPLATE/bug_report.yml
name: Bug Report
description: 报告一个 Bug
labels: [bug, triage-needed]
body:
  - type: markdown
    attributes:
      value: |
        感谢您报告问题！请填写以下信息。
        
  - type: textarea
    id: description
    attributes:
      label: 问题描述
      description: 请详细描述问题现象
    validations:
      required: true
      
  - type: textarea
    id: reproduction
    attributes:
      label: 复现步骤
      description: 请提供复现问题的步骤
      placeholder: |
        1. 执行...
        2. 输入...
        3. 出现...
    validations:
      required: true
      
  - type: input
    id: environment
    attributes:
      label: 环境信息
      description: |
        - JDK 版本：
        - 项目版本：
        - 操作系统：
    validations:
      required: true
      
  - type: textarea
    id: logs
    attributes:
      label: 日志信息
      description: 如有错误日志，请粘贴
      render: shell

---

# .github/ISSUE_TEMPLATE/feature_request.yml
name: Feature Request
description: 提出一个新功能建议
labels: [feature, triage-needed]
body:
  - type: textarea
    id: problem
    attributes:
      label: 相关痛点
      description: 这个功能解决了什么问题？
    validations:
      required: true
      
  - type: textarea
    id: solution
    attributes:
      label: 建议方案
      description: 请描述你期望的解决方案
    validations:
      required: true
    
  - type: textarea
    id: alternatives
    attributes:
      label: 替代方案
      description: 是否有其他替代方案？
      
  - type: textarea
    id: context
    attributes:
      label: 补充信息
      description: 其他相关信息或截图
```

## Release 发布自动化

### Release 工作流
```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.get_version.outputs.version }}
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up JDK 17
      uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
    
    - name: Get version from tag
      id: get_version
      run: echo "version=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT
    
    - name: Build with Maven
      run: mvn -B package -DskipTests
    
    - name: Publish JAR to Maven Central
      run: |
        mvn deploy -Prelease \
          -Dmaven.test.skip=true \
          -Dgpg.keyname=${{ secrets.GPG_KEYNAME }} \
          -Dgpg.passphrase=${{ secrets.GPG_PASSPHRASE }}
      env:
        MAVEN_USERNAME: ${{ secrets.OSSRH_USERNAME }}
        MAVEN_PASSWORD: ${{ secrets.OSSRH_TOKEN }}
    
    - name: Upload artifact
      uses: actions/upload-artifact@v4
      with:
        name: release-${{ steps.get_version.outputs.version }}
        path: target/*.jar

  release-notes:
    runs-on: ubuntu-latest
    needs: build
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    
    - name: Generate release notes
      uses: actions/github-script@v7
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
        script: |
          const { owner, repo } = context.repo;
          const tag = context.ref.replace('refs/tags/', '');
          const { data: release } = await github.rest.repos.getReleaseByTag({
            owner, repo, tag
          });
          
          // 获取上一个 tag
          const { data: tags } = await github.rest.repos.listTags({
            owner, repo, per_page: 10
          });
          const prevTag = tags[1]?.name;
          
          // 生成 changelog
          const { data: commits } = await github.rest.repos.compareCommits({
            owner, repo, base: prevTag, head: tag
          });
          
          const changelog = commits.commits.map(c => {
            const message = c.commit.message.split('\n')[0];
            const sha = c.sha.substring(0, 7);
            return `- ${message} ([${sha}](${c.html_url}))`;
          }).join('\n');
          
          await github.rest.repos.updateRelease({
            owner, repo, release_id: release.id,
            body: `## 更新内容\n\n${changelog}`
          });

  notify:
    runs-on: ubuntu-latest
    needs: [build, release-notes]
    steps:
    - name: Notify DingTalk
      uses: zcong1993/actions-ding@master
      with:
        dingToken: ${{ secrets.DINGTALK_ROBOT_TOKEN }}
        body: |
          {
            "msgtype": "markdown",
            "markdown": {
              "title": "新版本发布：v${{ needs.build.outputs.version }}",
              "text": "## 新版本发布 🎉\n\n**版本**: v${{ needs.build.outputs.version }}\n\n**发布人**: ${{ github.actor }}\n\n**查看详情**: ${{ github.event.release.html_url }}"
            }
          }
```

## 检查清单

### CI/CD
- [ ] 构建流程自动化
- [ ] 测试覆盖率检查
- [ ] 代码质量检查
- [ ] 产物归档完整
- [ ] 部署流程可靠

### PR 流程
- [ ] PR 模板完整
- [ ] 自动标签分类
- [ ] 审查人自动分配
- [ ] 质量检查通过
- [ ] 通知机制正常

### Issue 管理
- [ ] Issue 模板完善
- [ ] 自动分类生效
- [ ] 重复检测正常
- [ ] 负责人分配合理
- [ ] 响应及时
