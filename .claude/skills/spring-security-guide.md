# 认证与授权开发指南 (Authentication & Authorization Guide)

## 适用场景
- 用户认证系统开发
- RBAC 权限控制
- JWT Token 管理
- OAuth2 第三方登录
- 方法级权限控制

## 核心技术栈

### RuoYi-Vue-Plus 认证方案
| 组件 | 技术 | 说明 |
|------|------|------|
| 认证框架 | Sa-Token | 轻量级 Java 权限认证框架 |
| Token 类型 | JWT | JSON Web Token |
| 密码加密 | BCrypt | 强哈希密码加密 |
| 权限模型 | RBAC | 基于角色的访问控制 |

### Sa-Token 核心概念
```
┌─────────────────────────────────────────────────────────┐
│                    认证 (Login)                          │
│  - StpUtil.login(userId)                                │
│  - StpUtil.isLogin()                                    │
│  - StpUtil.getTokenValue()                              │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    授权 (Permission)                     │
│  - @SaCheckPermission("system:user:add")                │
│  - @SaCheckRole("admin")                                │
│  - 数据权限 (@DataScope)                                 │
└─────────────────────────────────────────────────────────┘
```

## Sa-Token 配置

### application.yml 配置
```yaml
sa-token:
  # token 名称 (同时也是 cookie 名称)
  token-name: Authorization
  # token 有效期，单位 s (默认 30 分钟，-1 代表永不过期)
  timeout: 1800
  # token 临时有效期 (指定时间内无操作就视为 token 过期)
  active-timeout: -1
  # 是否允许同一账号并发登录
  is-concurrent: true
  # 在多人登录同一账号时，是否共用一个 token
  is-share: false
  # token 风格
  token-style: uuid
  # 是否输出操作日志
  is-log: true
  # 是否从 cookie 中读取 token
  is-read-cookie: false
  # 是否从 header 中读取 token
  is-read-header: true
  # token 前缀
  token-prefix: "Bearer"
```

## 登录认证

### 登录服务实现
```java
@Service
@RequiredArgsConstructor
public class SysLoginService {

    private final SysUserService userService;
    private final SysLicenseService sysLicenseService;
    private final RedisCache redisCache;
    private final SocialAuthProperties socialAuthProperties;

    /**
     * 登录验证
     */
    public String login(SysLogin sysLogin) {
        String username = sysLogin.getUsername();
        String password = sysLogin.getPassword();
        String code = sysLogin.getCode();
        String uuid = sysLogin.getUuid();

        // 验证码校验
        String captcha = redisCache.getCacheObject(CAPTCHA_CODE_KEY + uuid);
        redisCache.deleteObject(CAPTCHA_CODE_KEY + uuid);
        if (captcha == null) {
            throw new ServiceException("验证码已失效");
        }
        if (!code.equalsIgnoreCase(captcha)) {
            throw new ServiceException("验证码错误");
        }

        // 用户查询
        SysUser user = userService.selectUserByUserName(username);
        if (user == null) {
            throw new ServiceException("用户不存在");
        }

        // 判断密码
        if (!passwordEncoder.encode(password).equals(user.getPassword())) {
            throw new ServiceException("用户密码错误");
        }

        // 记录登录信息
        recordLoginInfo(user.getUserId());

        // 生成 token
        return StpUtil.getTokenSession().getTokenValue();
    }

    /**
     * 登出
     */
    public void logout() {
        StpUtil.logout();
    }
}
```

### 用户详情服务
```java
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final SysUserService userService;
    private final SysPermissionService permissionService;

    @Override
    public LoginUser loadUserByUsername(String username) throws UsernameNotFoundException {
        SysUser user = userService.selectUserByUserName(username);
        if (user == null) {
            throw new UsernameNotFoundException("用户不存在");
        }

        if (SysUser.STATUS_DISABLE.equals(user.getStatus())) {
            throw new DisabledException("用户已停用");
        }

        return createLoginUser(user);
    }

    private LoginUser createLoginUser(SysUser user) {
        Set<String> roles = permissionService.selectRoleKeys(user.getUserId());
        Set<String> permissions = permissionService.selectPermiKeys(user.getUserId());
        return new LoginUser(user, roles, permissions);
    }
}
```

## JWT Token 管理

RuoYi-Vue-Plus 使用 Sa-Token 内置的 JWT 模式管理 Token：

```java
// Sa-Token 的 TokenSession 自动处理序列化
StpUtil.getTokenSession().set("key", "value");
String tokenValue = StpUtil.getTokenValue();

// Token 验证由 Sa-Token 过滤器自动完成
// 无需手动解析或验证 JWT
```

## 权限控制

### 方法级权限注解
```java
@RestController
@RequestMapping("/system/user")
@RequiredArgsConstructor
public class SysUserController {

    /**
     * 新增用户 - 需要 system:user:add 权限
     */
    @SaCheckPermission("system:user:add")
    @PostMapping
    public R<Void> add(@RequestBody SysUser user) {
        return userService.insertUser(user);
    }

    /**
     * 修改用户 - 需要 system:user:edit 权限
     */
    @SaCheckPermission("system:user:edit")
    @PutMapping
    public R<Void> edit(@RequestBody SysUser user) {
        return userService.updateUser(user);
    }

    /**
     * 删除用户 - 需要 system:user:remove 权限
     */
    @SaCheckPermission("system:user:remove")
    @DeleteMapping("/{userIds}")
    public R<Void> remove(@PathVariable Long[] userIds) {
        return userService.deleteUserByIds(userIds);
    }

    /**
     * 导出用户 - 需要 system:user:export 权限
     */
    @SaCheckPermission("system:user:export")
    @PostMapping("/export")
    public void export(HttpServletResponse response, SysUser user) {
        userService.export(user, response);
    }
}
```

### 角色控制
```java
/**
 * 仅管理员可访问
 */
@SaCheckRole("admin")
@GetMapping("/admin")
public R<Void> adminOnly() {
    return R.ok("仅管理员可访问");
}

/**
 * 管理员或普通用户都可访问
 */
@SaCheckRole(value = {"admin", "common"}, logical = Logical.OR)
@GetMapping("/common")
public R<Void> commonAccess() {
    return R.ok("管理员或普通用户都可访问");
}

/**
 * 需要同时满足多个角色
 */
@SaCheckRole(value = {"admin", "manager"}, logical = Logical.AND)
@GetMapping("/manager")
public R<Void> managerAccess() {
    return R.ok("需要同时满足多个角色");
}
```

### 登录认证注解
```java
/**
 * 需要登录才能访问
 */
@SaCheckLogin
@GetMapping("/info")
public R<SysUser> getInfo() {
    return R.ok(StpUtil.getLoginObject(SysUser.class));
}

/**
 * 可选登录（登录和未登录返回不同内容）
 */
@SaCheckLogin(mode = SaMode.OR_IS_LOGIN)
@GetMapping("/optional")
public R<Object> optionalAuth() {
    if (StpUtil.isLogin()) {
        return R.ok("已登录：" + StpUtil.getLoginId());
    } else {
        return R.ok("未登录访客");
    }
}
```

## 数据权限

### 数据权限注解
```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface DataScope {
    /** 部门别名 */
    String deptAlias() default "";
    /** 用户别名 */
    String userAlias() default "";
    /** 权限表达式 */
    String permission() default "";
}
```

### 数据权限实现
RuoYi-Vue-Plus 使用 MyBatis-Plus 拦截器实现数据权限，无需手写 AOP：

```java
// 在 Mapper 方法上添加 @DataScope 注解
@DataScope(deptAlias = "d", userAlias = "u")
public List<SysUser> selectUserList(SysUser user) {
    return baseMapper.selectList(buildQueryWrapper(user));
}
```

MyBatis-Plus 数据权限插件会自动根据当前用户的角色范围拼接 SQL 条件：
- 超级管理员：不限制
- 部门管理员：`AND dept_id = ?`
- 普通用户：`AND create_by = ?`

### 数据权限工具类
```java
@Component
public class DataPermissions {
    /** 全部权限标识 */
    public static final String ALL_PERMISSION = "*:*:*";

    /**
     * 判断是否拥有所有权限
     */
    public static boolean hasPermissions(String... permissions) {
        if (ArrayUtil.isEmpty(permissions)) {
            return true;
        }
        return StpUtil.checkPermission(ALL_PERMISSION);
    }
}
```

### 使用示例
```java
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, SysUser> implements UserService {

    /**
     * 查询用户列表 - 带数据权限
     */
    @DataScope(deptAlias = "d", userAlias = "u")
    @Override
    public PageResult<SysUserVO> pageList(PageQuery query) {
        Page<SysUser> page = baseMapper.selectPage(query.toPage(), buildQueryWrapper(query.getUser()));
        return PageResult.of(
            MapstructUtils.convert(page.getRecords(), SysUserVO.class),
            page.getTotal()
        );
    }
}
```

## 安全配置

### CORS 跨域配置
```java
@Configuration
@RequiredArgsConstructor
public class CorsConfiguration {

    @Bean
    public CorsWebFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOrigin("*");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        config.setMaxAge(Duration.ofHours(1));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsWebFilter(source);
    }
}
```

### 请求解密/响应加密过滤器
```java
@Bean
public GlobalRequestDecryptFilter globalRequestDecryptFilter() {
    return new GlobalRequestDecryptFilter();
}

@Bean
public GlobalResponseEncryptFilter globalResponseEncryptFilter() {
    return new GlobalResponseEncryptFilter();
}
```

## 社交登录

```java
// JustAuth 集成
@Autowired
private AuthFactory authFactory;

/**
 * 获取第三方登录 URL
 */
@GetMapping("/auth/{source}")
public R<String> renderCode(@PathVariable String source) throws IOException {
    AuthRequest authRequest = authFactory.get(AuthSource.valueOf(source.toUpperCase()));
    return R.ok(authRequest.authorize(AuthStateGenerator.makeUUid()));
}
```

## 检查清单

### 认证安全
- [ ] 密码使用 BCrypt 加密
- [ ] Token 设置合理有效期
- [ ] 登录失败次数限制
- [ ] 验证码防护

### 授权控制
- [ ] 所有接口都有 @SaCheckPermission 权限控制
- [ ] 权限注解使用正确
- [ ] 角色划分合理
- [ ] 数据权限注解生效

### Token 管理
- [ ] Token 通过 Sa-Token 统一管理
- [ ] Token 过期时间合理
- [ ] Token 刷新机制完整
- [ ] Token 黑名单机制完善

### 日志审计
- [ ] 登录日志完整记录
- [ ] 操作日志通过 @Log 注解记录
- [ ] 异常日志记录
- [ ] 审计日志可追溯
