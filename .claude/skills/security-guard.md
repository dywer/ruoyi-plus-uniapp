# 安全开发技能 (Security Guard)

## 适用场景
- 实现认证授权功能
- 使用Sa-Token框架
- 遵循RuoYi-Vue-Plus安全规范

## 核心技术栈
- Sa-Token认证框架
- JWT Token管理
- RBAC权限模型
- 数据权限控制

## 认证实现

### 1. 登录认证
```java
// 使用Sa-Token进行登录认证
StpUtil.login(userId);
```

### 2. 权限检查
- 使用@SaCheckPermission注解
- 数据权限注解@SaCheckLogin
- 权限范围控制

### 3. Token管理
- Token生成与验证
- Token刷新机制
- Token安全传输

## 权限控制

### 1. 接口权限
```java
@SaCheckPermission("system:user:list")
@GetMapping("/list")
public R<List<SysUser>> list(SysUser sysUser) {
    // 业务逻辑
}
```

### 2. 数据权限
- 使用@Permission注解
- 数据权限过滤器
- 行级数据权限控制

## 安全措施

### 1. 防护措施
- 防止SQL注入
- 防止XSS攻击
- 防止CSRF攻击
- 接口限流保护

### 2. 敏感数据处理
- 密码加密存储
- 敏感信息脱敏
- 文件上传安全

## 配置要点

### 1. Sa-Token配置
- Token有效期设置
- Cookie安全性配置
- Header传递方式

### 2. 安全头设置
- CORS配置
- 安全响应头
- HTTPS强制使用

## 最佳实践
1. 权限注解使用规范
2. 认证异常处理
3. 安全日志记录
4. 安全漏洞防护