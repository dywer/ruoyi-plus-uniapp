# Project Navigator - 项目导航指南

## 职责范围

帮助开发者快速理解 RuoYi-Vue-Plus 项目结构、模块划分、核心流程、关键类图等项目导航信息，降低新人学习成本，提高开发效率。

---

## 核心规范

### 1. 项目结构全景

#### 1.1 后端目录结构

```
ruoyi/
├── ruoyi-admin/                  # 启动模块
│   └── src/main/java/
│       └── org/dromara/
│           └── RuoYiApplication.java
│
├── ruoyi-common/                 # 公共模块
│   ├── ruoyi-common-core/       # 核心工具
│   │   ├── src/main/java/
│   │   │   └── org/dromara/common/core/
│   │   │       ├── constant/    # 常量定义
│   │   │       ├── exception/   # 异常处理
│   │   │       ├── utils/       # 工具类
│   │   │       └── domain/      # 领域模型
│   │   └── src/main/resources/
│   │       └── i18n/            # 国际化
│   │
│   ├── ruoyi-common-redis/      # Redis 封装
│   ├── ruoyi-common-security/   # 安全封装
│   ├── ruoyi-common-log/        # 日志封装
│   └── ruoyi-common-mybatis/    # MyBatis 封装
│
├── ruoyi-modules/                # 业务模块
│   ├── system/                  # 系统模块
│   │   ├── src/main/java/
│   │   │   └── org/dromara/system/
│   │   │       ├── controller/  # 控制层
│   │   │       ├── service/     # 服务层
│   │   │       ├── mapper/      # 数据访问层
│   │   │       ├── domain/      # 领域模型
│   │   │       └── vo/          # 视图对象
│   │   └── src/main/resources/
│   │       ├── mapper/          # MyBatis XML
│   │       └── application.yml  # 模块配置
│   │
│   ├── job/                     # 定时任务模块
│   ├── generator/               # 代码生成模块
│   └── demo/                    # 示例模块
│
├── ruoyi-auth/                   # 认证模块
├── ruoyi-gateway/                # 网关模块（微服务版）
└── pom.xml                       # 父 POM
```

#### 1.2 前端目录结构

```
ruoyi-ui/
├── src/
│   ├── api/                     # API 接口
│   │   ├── system/             # 系统管理 API
│   │   │   ├── user.js         # 用户管理
│   │   │   ├── role.js         # 角色管理
│   │   │   └── menu.js         # 菜单管理
│   │   └── modules/            # 业务模块 API
│   │
│   ├── assets/                  # 静态资源
│   │   ├── images/             # 图片
│   │   ├── styles/             # 样式
│   │   └── svg/                # SVG 图标
│   │
│   ├── components/              # 公共组件
│   │   ├── RTable/             # 表格组件
│   │   ├── RForm/              # 表单组件
│   │   ├── RDialog/            # 对话框组件
│   │   └── RUpload/            # 上传组件
│   │
│   ├── layout/                  # 布局组件
│   │   ├── Header.vue          # 顶部导航
│   │   ├── Sidebar.vue         # 侧边栏
│   │   └── TagsView.vue        # 标签页
│   │
│   ├── router/                  # 路由配置
│   │   └── index.js
│   │
│   ├── store/                   # 状态管理（Pinia）
│   │   ├── modules/
│   │   │   ├── user.js         # 用户状态
│   │   │   ├── app.js          # 应用状态
│   │   │   └── permission.js   # 权限状态
│   │   └── index.js
│   │
│   ├── utils/                   # 工具函数
│   │   ├── request.js          # Axios 封装
│   │   ├── auth.js             # 认证工具
│   │   └── permission.js       # 权限工具
│   │
│   ├── views/                   # 页面组件
│   │   ├── system/             # 系统管理页面
│   │   │   ├── user/
│   │   │   │   ├── index.vue   # 用户列表
│   │   │   │   └── form.vue    # 用户表单
│   │   │   ├── role/
│   │   │   └── menu/
│   │   └── modules/            # 业务模块页面
│   │
│   ├── App.vue                  # 根组件
│   └── main.js                  # 入口文件
│
├── public/
├── package.json
└── vite.config.js
```

### 2. 核心模块详解

#### 2.1 系统模块（system）

```
系统模块是 RuoYi 的核心基础模块，包含用户、角色、菜单、部门等基础功能。

核心功能：
├── 用户管理 (sys_user)
│   ├── 用户 CRUD
│   ├── 用户导入导出
│   ├── 用户状态管理
│   └── 密码重置
│
├── 角色管理 (sys_role)
│   ├── 角色 CRUD
│   ├── 角色权限分配
│   └── 数据权限配置
│
├── 菜单管理 (sys_menu)
│   ├── 菜单 CRUD
│   ├── 菜单权限分配
│   └── 按钮权限配置
│
├── 部门管理 (sys_dept)
│   ├── 部门 CRUD
│   └── 部门树形结构
│
├── 岗位管理 (sys_post)
├── 字典管理 (sys_dict_type/sys_dict_data)
├── 参数管理 (sys_config)
└── 操作日志 (sys_oper_log)
```

#### 2.2 认证流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   前端登录   │ ──▶ │   /auth/login │ ──▶ │ 认证服务    │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  返回 Token  │ ◀── │  生成 Token   │ ◀── │ 验证用户信息 │
└─────────────┘     └─────────────┘     └─────────────┘

关键类：
- SysLoginController: 登录接口
- SysLoginService: 登录业务逻辑
- SysPermissionService: 权限验证
- SaTokenUtil: Token 工具

登录接口：
POST /login
Request: { username, password, code, uuid }
Response: { token, userInfo }
```

#### 2.3 权限流程

```
┌────────────────────────────────────────────────────────────┐
│                      请求到达 Controller                      │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│              @PreAuthorize("@ss.hasPermi('xxx')")          │
│                    或 @SaCheckPermission("xxx")            │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────┐
│              StpUtil.checkPermission()                     │
│              检查当前登录用户是否有权限                      │
└────────────────────────────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
         ┌─────────┐            ┌─────────┐
         │ 有权限   │            │ 无权限   │
         │ 继续执行 │            │ 抛异常   │
         └─────────┘            └─────────┘
```

### 3. 数据模型关系

#### 3.1 核心 ER 图

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  sys_user    │      │  sys_role    │      │  sys_menu    │
├──────────────┤      ├──────────────┤      ├──────────────┤
│ user_id PK   │◀────▶│ role_id PK   │◀────▶│ menu_id PK   │
│ username     │      │ role_name    │      │ menu_name    │
│ password     │      │ role_key     │      │ path         │
│ dept_id FK   │      │ role_scope   │      │ component    │
│ status       │      │ status       │      │ perms        │
└──────────────┘      └──────────────┘      └──────────────┘
       │                      │                      │
       │                      │                      │
       ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  sys_dept    │      │ sys_user_role│      │sys_role_menu│
├──────────────┤      ├──────────────┤      ├──────────────┤
│ dept_id PK   │      │ user_id PK,FK│      │ role_id PK,FK│
│ dept_name    │      │ role_id PK,FK│      │ menu_id PK,FK│
│ parent_id FK │      └──────────────┘      └──────────────┘
│ ancestors    │
│ order_num    │
└──────────────┘

关系说明：
- 用户 - 部门：多对一（一个部门有多个用户）
- 用户 - 角色：多对多（通过 user_role 关联表）
- 角色 - 菜单：多对多（通过 role_menu 关联表）
```

#### 3.2 业务 ER 图示例

```
订单模块核心表关系：

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  pay_order   │      │ pay_order_item│      │  p_product  │
├──────────────┤      ├──────────────┤      ├──────────────┤
│ order_id PK  │◀────▶│ order_item_id│      │ product_id PK│
│ order_no UK  │      │ order_id FK  │◀────▶│ product_name │
│ user_id FK   │      │ product_id FK│      │ price        │
│ total_amount │      │ quantity     │      │ stock        │
│ status       │      │ price        │      │ status       │
│ pay_time     │      └──────────────┘      └──────────────┘
└──────────────┘
       │
       │
       ▼
┌──────────────┐
│  sys_user    │
├──────────────┤
│ user_id PK   │
│ username     │
└──────────────┘
```

### 4. 核心服务依赖

#### 4.1 服务调用关系

```
┌─────────────────────────────────────────────────────────────┐
│                        Controller 层                         │
├─────────────────────────────────────────────────────────────┤
│  SysUserController  ──▶  SysUserService                     │
│  SysRoleController  ──▶  SysRoleService                     │
│  SysMenuController  ──▶  SysMenuService                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Service 层                            │
├─────────────────────────────────────────────────────────────┤
│  SysUserService  ──▶  UserMapper                            │
│  SysUserService  ──▶  SysRoleMapper（查询用户角色）             │
│  SysRoleService  ──▶  RoleMapper                            │
│  SysRoleService  ──▶  RoleMenuMapper                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                          Mapper 层                            │
├─────────────────────────────────────────────────────────────┤
│  UserMapper extends BaseMapper<User>                        │
│  RoleMapper extends BaseMapper<Role>                        │
│  MenuMapper extends BaseMapper<Menu>                        │
└─────────────────────────────────────────────────────────────┘
```

#### 4.2 外部服务依赖

```yaml
# RuoYi 外部依赖
Redis:
  用途：缓存、Session 存储、分布式锁
  端口：6379
  
MySQL:
  用途：主数据库
  端口：3306
  
Nacos: (微服务版)
  用途：服务注册发现、配置中心
  端口：8848
  
RabbitMQ/Kafka: (可选)
  用途：消息队列、异步处理
  端口：5672/9092
  
MinIO/OSS: (可选)
  用途：对象存储、文件上传
  端口：9000/HTTPS
```

### 5. 常用命令速查

#### 5.1 开发命令

```bash
# 后端命令
cd ruoyi

# 清理编译
mvn clean

# 编译打包
mvn package -DskipTests

# 只编译不打包
mvn compile

# 运行应用
java -jar ruoyi-admin/target/ruoyi-admin.jar

# 查看依赖树
mvn dependency:tree

# 前端命令
cd ruoyi-ui

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 生产构建
npm run build
```

#### 5.2 代码生成

```bash
# 使用内置代码生成器
1. 数据库创建表
2. 访问：系统工具 -> 代码生成
3. 导入表 -> 编辑生成配置 -> 下载代码
4. 解压到对应模块目录
```

### 6. 配置速查

#### 6.1 核心配置

```yaml
# application.yml 核心配置
ruoyi:
  # 项目名称
  name: RuoYi
  
  # 版本
  version: 5.X.X
  
  # 版权年份
  copyrightYear: 2024
  
  # 实例演示开关（演示环境用）
  demo:
    enabled: false

# 文件上传配置
ruoyi:
  file:
    # 上传路径
    path: /data/upload
    # 最大大小
    maxSize: 10MB

# MyBatis-Plus 配置
mybatis-plus:
  mapper-locations: classpath*:mapper/**/*.xml
  type-aliases-package: org.dromara.*.domain
  global-config:
    banner: false
    db-config:
      id-type: assign_id  # 雪花算法 ID

# Sa-Token 配置
sa-token:
  token-name: Authorization
  timeout: 86400  # 24 小时
  active-timeout: -1
  is-concurrent: true
  is-share: true
```

#### 6.2 环境配置

```yaml
# application-dev.yml (开发环境)
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/ruoyi?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: root
    
  redis:
    host: localhost
    port: 6379
    password:
    database: 0

# application-prod.yml (生产环境)
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}?...
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    
  redis:
    host: ${REDIS_HOST}
    port: ${REDIS_PORT}
    password: ${REDIS_PASSWORD}
```

---

## 新人上手指南

### 第一周：熟悉基础

```
Day 1-2: 环境搭建
- 安装 JDK、Maven、Node.js
- 克隆项目、导入 IDE
- 配置数据库、Redis
- 启动前后端

Day 3-4: 阅读核心代码
- 阅读 User 模块 CRUD 代码
- 理解登录认证流程
- 理解权限控制流程

Day 5: 动手实践
- 尝试添加一个简单的 CRUD 功能
- 使用代码生成器生成代码
```

### 第二周：深入理解

```
Day 1-2: 深入源码
- 阅读 Sa-Token 集成源码
- 阅读 MyBatis-Plus 配置
- 阅读全局异常处理

Day 3-4: 理解架构
- 理解模块划分
- 理解依赖关系
- 阅读工具类源码

Day 5: 综合实践
- 完成一个小需求
- 编写单元测试
```

---

## 触发关键词

- 项目结构
- 模块介绍
- 新人指南
- 代码导航
- ER 图
- 流程图

---

## 相关文件

- [crud-development.md](./crud-development.md) - CRUD 开发
- [api-development.md](./api-development.md) - API 开发
- [git-workflow.md](./git-workflow.md) - Git 工作流

---

*更新时间：2026-04-06*  
*RuoYi-Vue-Plus AI 开发助手*
