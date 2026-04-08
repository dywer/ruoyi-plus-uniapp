# 技术文档写作技能 (Technical Writing)

## 适用场景
- API 文档编写
- 技术架构文档
- 用户操作手册
- 开发规范文档
- 项目 README

## 文档分类

### 按受众分类
```
┌─────────────────────────────────────────────────────────┐
│  用户文档              │  面向最终用户                     │
│  - 产品使用手册                                         │
│  - 快速入门指南                                         │
│  - 常见问题解答                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  开发文档              │  面向开发人员                     │
│  - API 接口文档                                          │
│  - 架构设计文档                                         │
│  - 代码规范文档                                         │
│  - 部署运维文档                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  产品文档              │  面向产品/运营                    │
│  - 需求规格说明书                                       │
│  - 功能说明文档                                         │
│  - 版本发布说明                                         │
└─────────────────────────────────────────────────────────┘
```

### Diataxis 框架
```
┌─────────────────────────────────────────────────────────┐
│                     按学习目标分类                        │
├─────────────────────────────────────────────────────────┤
│  教程 (Tutorials)     │  实践导向，学习 + 实践              │
│                       │  帮助新手上手                      │
├─────────────────────────────────────────────────────────┤
│  指南 (How-to)        │  目标导向，解决问题                 │
│                       │  帮助用户完成具体任务               │
├─────────────────────────────────────────────────────────┤
│  参考 (Reference)     │  信息导向，描述事实                 │
│                       │  API 文档、配置手册                 │
├─────────────────────────────────────────────────────────┤
│  解释 (Explanation)   │  理解导向，阐述背景                 │
│                       │  架构决策、概念说明                 │
└─────────────────────────────────────────────────────────┘
```

## API 文档规范

### OpenAPI 示例
```yaml
openapi: 3.0.3
info:
  title: 用户管理 API
  description: 提供用户 CRUD 操作接口
  version: 1.0.0
  contact:
    name: API Support
    email: support@example.com

servers:
  - url: https://api.example.com/v1
    description: 生产环境
  - url: http://localhost:8080/v1
    description: 开发环境

paths:
  /users:
    get:
      summary: 查询用户列表
      description: |
        支持分页、筛选、排序功能
        
        **筛选条件:**
        - username: 用户名模糊匹配
        - status: 用户状态精确匹配
        - createTime: 创建时间范围
        
        **排序字段:**
        - createTime (默认降序)
        - username
        
      operationId: listUsers
      tags:
        - 用户管理
      parameters:
        - $ref: '#/components/parameters/PageNum'
        - $ref: '#/components/parameters/PageSize'
        - name: username
          in: query
          description: 用户名（模糊匹配）
          required: false
          schema:
            type: string
            minLength: 2
            maxLength: 50
        - name: status
          in: query
          description: 用户状态 (0-正常 1-停用)
          required: false
          schema:
            type: string
            enum: [0, 1]
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserListResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '500':
          $ref: '#/components/responses/ServerError'
```

### API 响应示例
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "userId": 1001,
        "username": "zhangsan",
        "nickname": "张三",
        "email": "zhangsan@example.com",
        "status": "0",
        "createTime": "2026-01-01T10:00:00+08:00"
      }
    ],
    "total": 100,
    "pageNum": 1,
    "pageSize": 10
  },
  "timestamp": 1744012800000
}
```

## README 文档模板

### 标准 README 结构
```markdown
# 项目名称

> 简短的项目描述，说明项目的用途和价值

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/owner/repo/ci.yml)](../../actions)
[![JDK](https://img.shields.io/badge/JDK-17+-green.svg)](https://adoptium.net/)

## 目录

- [特性](#特性)
- [快速开始](#快速开始)
- [文档](#文档)
- [架构说明](#架构说明)
- [开发指南](#开发指南)
- [常见问题](#常见问题)
- [贡献指南](#贡献指南)
- [许可证](#许可证)

## 特性

- **特性 1**: 描述
- **特性 2**: 描述
- **特性 3**: 描述

## 快速开始

### 环境要求

| 软件 | 版本 | 必须 |
|------|------|------|
| JDK | 17+ | 是 |
| Maven | 3.8+ | 是 |
| MySQL | 8.0+ | 是 |
| Redis | 6.0+ | 是 |

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/owner/repo.git
cd repo

# 2. 编译项目
mvn clean install -DskipTests

# 3. 配置数据库
# 编辑 application-druid.yml

# 4. 启动应用
cd ruoyi-admin
mvn spring-boot:run
```

### 验证安装

访问 http://localhost:8080 确认服务启动

默认账号：
- 用户名：admin
- 密码：admin123

## 文档

| 文档类型 | 链接 | 说明 |
|----------|------|------|
| API 文档 | [查看](docs/api.md) | 接口定义和使用 |
| 架构文档 | [查看](docs/architecture.md) | 系统架构说明 |
| 部署文档 | [查看](docs/deployment.md) | 部署和运维指南 |

## 架构说明

```
┌─────────────────────────────────────────────────────────┐
│                      前端层 (Vue)                        │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  Spring Boot 应用层                       │
│  Controller → Service → Mapper                          │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   数据存储层                              │
│            MySQL + Redis                                │
└─────────────────────────────────────────────────────────┘
```

## 开发指南

### 代码规范

本项目遵循 [阿里巴巴 Java 开发手册](https://github.com/alibaba/p3c)

### 提交规范

```bash
# 提交格式：<type>: <description>
git commit -m "feat: 新增用户管理功能"
git commit -m "fix: 修复登录超时问题"
git commit -m "docs: 更新 API 文档"
```

### 运行测试

```bash
# 运行所有测试
mvn test

# 运行特定测试类
mvn test -Dtest=UserServiceTest

# 生成测试覆盖率报告
mvn test jacoco:report
```

## 常见问题

### Q: 启动时报数据库连接失败？

A: 检查以下几点:
1. MySQL 服务是否启动
2. 数据库配置是否正确
3. 网络连接是否正常

### Q: 如何修改默认端口？

A: 编辑 `application.yml`:
```yaml
server:
  port: 8081  # 修改端口
```

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

本项目采用 MIT 协议开源

Copyright (c) 2026

## 联系方式

- 项目主页：https://github.com/owner/repo
- Issue 反馈：https://github.com/owner/repo/issues
- 邮箱：support@example.com
```

## 架构设计文档模板

```markdown
# 系统架构设计文档

## 1. 概述

### 1.1 文档目的

本文档描述系统的整体架构设计，包括技术选型、模块划分、接口定义等。

### 1.2 背景说明

描述项目的业务背景和技术背景。

### 1.3 术语定义

| 术语 | 定义 |
|------|------|
| SaaS | 软件即服务 |
| RBAC | 基于角色的访问控制 |

## 2. 架构设计

### 2.1 架构目标

- 高性能：支持 XXX QPS
- 高可用：99.9% 可用性
- 可扩展：支持水平扩展

### 2.2 架构分层

```
[架构图]
```

### 2.3 技术选型

| 层次 | 技术 | 选型理由 |
|------|------|----------|
| 前端 | Vue 3 | 轻量、易上手 |
| 后端 | Spring Boot | 生态完善 |
| 数据库 | MySQL | 成熟稳定 |
| 缓存 | Redis | 高性能 |

## 3. 模块设计

### 3.1 模块划分

| 模块 | 职责 | 接口 |
|------|------|------|
| 用户模块 | 用户管理、认证 | /api/user/* |
| 订单模块 | 订单处理 | /api/order/* |

### 3.2 接口设计

[接口定义]

## 4. 数据设计

### 4.1 数据库设计

[ER 图]

### 4.2 缓存策略

[缓存设计]

## 5. 部署架构

[部署图]

## 6. 附录

### 6.1 参考资料

### 6.2 修订历史
```

## 写作规范

### 文档格式
- 使用 Markdown 格式
- 标题层级清晰（# → ## → ###）
- 代码块使用反引号
- 列表使用 - 或 1.

### 语言风格
- 简洁明了，避免长句
- 使用主动语态
- 术语使用一致
- 提供示例代码

### 版本管理
- 文档头部标注版本
- 记录修订历史
- 过期内容及时更新或删除

## 检查清单

### 内容完整
- [ ] 目标读者明确
- [ ] 核心概念解释清晰
- [ ] 示例代码完整可运行
- [ ] 常见问题包含在内
- [ ] 联系方式提供

### 格式规范
- [ ] 标题层级清晰
- [ ] 图表编号和引用正确
- [ ] 代码块语法高亮
- [ ] 链接有效

### 维护更新
- [ ] 版本号已更新
- [ ] 修订记录完整
- [ ] 过期内容已清理
