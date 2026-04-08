# Spring Security 与认证授权技能 (Spring Security Guide)

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

### Spring Security 核心概念
```
┌─────────────────────────────────────────────────────────┐
│                    认证 (Authentication)                 │
│  - 用户名密码认证                                         │
│  - Token 认证                                            │
│  - OAuth2 认证                                           │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    授权 (Authorization)                  │
│  - 角色 (Role): ROLE_ADMIN, ROLE_USER                   │
│  - 权限 (Permission): user:add, user:edit               │
│  - 数据权限 (Data Scope)                                 │
└─────────────────────────────────────────────────────────┘
```

## Sa-Token 配置

### Maven 依赖
```xml
<dependencies>
    <!-- Sa-Token 权限认证 -->
    <dependency>
        <groupId>cn.dev33</groupId>
        <artifactId>sa-token-spring-boot3-starter</artifactId>
        <version>1.37.0</version>
    </dependency>
    
    <!-- Sa-Token + Redis -->
    <dependency>
        <groupId>cn.dev33</groupId>
        <artifactId>sa-token-dao-redis-jackson</artifactId>
        <version>1.37.0</version>
    </dependency>
    
    <!-- Sa-Token 接口文档集成 -->
    <dependency>
        <groupId>cn.dev33</groupId>
        <artifactId>sa-token-spring-aop</artifactId>
        <version>1.37.0</version>
    </dependency>
</dependencies>
```

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

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtTokenProvider jwtTokenProvider;
    private final RedisCache redisCache;

    /**
     * 登录验证
     */
    public LoginBody login(LoginBody loginBody) {
        String username = loginBody.getUsername();
        String password = loginBody.getPassword();
        String uuid = loginBody.getUuid();
        
        // 验证码校验
        /*String code = redisCache.getCacheObject(CAPTCHA_CODE_KEY + uuid);
        if (!code.equalsIgnoreCase(loginBody.getCode())) {
            throw new CaptchaException("验证码错误");
        }*/
        
        // 用户认证
        UsernamePasswordAuthenticationToken authenticationToken = 
            new UsernamePasswordAuthenticationToken(username, password);
        
        try {
            Authentication authentication = authenticationManager.authenticate(authenticationToken);
            LoginUser loginUser = (LoginUser) authentication.getPrincipal();
            
            // 生成 token
            String token = jwtTokenProvider.createToken(loginUser);
            
            // 记录登录信息
            recordLoginInfo(loginUser.getUser());
            
            return new LoginBody(token, loginUser.getUser());
        } catch (BadCredentialsException e) {
            throw new ServiceException("用户名或密码错误");
        } catch (AuthenticationException e) {
            throw new ServiceException("认证失败：" + e.getMessage());
        }
    }
    
    /**
     * 登出
     */
    public void logout(String token) {
        LoginUser loginUser = SecurityUtils.getLoginUser();
        if (loginUser != null) {
            // 删除 token
            SecurityUtils.logout();
            // 记录登出信息
            log.info("用户 {} 登出成功", loginUser.getUsername());
        }
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
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
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
        // 查询用户角色和权限
        Set<String> roles = permissionService.selectRoleKeys(user.getUserId());
        Set<String> permissions = permissionService.selectPermiKeys(user.getUserId());
        
        return new LoginUser(user.getUserId(), user.getDeptId(), user, roles, permissions);
    }
}
```

## JWT Token 管理

### JWT 工具类
```java
@Component
public class JwtTokenProvider {

    @Value("${token.secret}")
    private String secret;
    
    @Value("${token.expireTime}")
    private long expiration;

    /**
     * 生成 Token
     */
    public String createToken(LoginUser loginUser) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration * 60 * 1000);
        
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", loginUser.getUser().getUserId());
        claims.put("username", loginUser.getUsername());
        claims.put("deptId", loginUser.getDeptId());
        
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(loginUser.getUsername())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS512, secret)
                .compact();
    }
    
    /**
     * 从 Token 中获取用户名
     */
    public String getUsernameFromToken(String token) {
        return Jwts.parser()
                .setSigningKey(secret)
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }
    
    /**
     * 验证 Token 是否有效
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(secret).parseClaimsJws(token);
            return true;
        } catch (SignatureException e) {
            throw new ServiceException("Token 签名无效");
        } catch (ExpiredJwtException e) {
            throw new ServiceException("Token 已过期");
        } catch (Exception e) {
            throw new ServiceException("Token 无效");
        }
    }
    
    /**
     * 刷新 Token
     */
    public String refreshToken(String token) {
        String username = getUsernameFromToken(token);
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration * 60 * 1000);
        
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS512, secret)
                .compact();
    }
}
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
        return toAjax(userService.add(user));
    }
    
    /**
     * 修改用户 - 需要 system:user:edit 权限
     */
    @SaCheckPermission("system:user:edit")
    @PutMapping
    public R<Void> edit(@RequestBody SysUser user) {
        return toAjax(userService.edit(user));
    }
    
    /**
     * 删除用户 - 需要 system:user:remove 权限
     */
    @SaCheckPermission("system:user:remove")
    @DeleteMapping("/{userIds}")
    public R<Void> remove(@PathVariable Long[] userIds) {
        return toAjax(userService.remove(userIds));
    }
    
    /**
     * 导出用户 - 需要 system:user:export 权限
     */
    @SaCheckPermission("system:user:export")
    @PostMapping("/export")
    public void export(HttpServletResponse response, @RequestBody SysUser user) {
        userService.export(user, response);
    }
}
```

### 角色控制
```java
@RestController
@RequestMapping("/system/user")
public class SysUserController {

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
}
```

### 登录认证注解
```java
@RestController
@RequestMapping("/system/user")
public class SysUserController {

    /**
     * 需要登录才能访问
     */
    @SaCheckLogin
    @GetMapping("/info")
    public R<SysUser> getInfo() {
        return R.ok(SecurityUtils.getLoginUser().getUser());
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
}
```

## 数据权限

### 数据权限注解
```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @class DataScope {
    /**
     * 部门别名
     */
    String deptAlias() default "";
    
    /**
     * 用户别名
     */
    String userAlias() default "";
    
    /**
     * 权限表达式
     */
    String permission() default "";
}
```

### 数据权限处理
```java
@Component
public class DataScopeInterceptor implements MybatisPlusInterceptor {

    @Override
    public void beforeQuery(MappedStatement ms, Object parameter) {
        // 获取方法上的@DataScope 注解
        DataScope dataScope = getDataScope(ms);
        if (dataScope == null) {
            return;
        }
        
        // 获取当前用户
        LoginUser loginUser = SecurityUtils.getLoginUser();
        if (loginUser == null) {
            return;
        }
        
        // 根据用户角色获取数据范围
        String dataScopeSql = getDataScopeSql(loginUser, dataScope);
        
        // 追加到 SQL
        appendDataScopeSql(parameter, dataScopeSql);
    }
    
    private String getDataScopeSql(LoginUser loginUser, DataScope dataScope) {
        // 超级管理员不受数据权限限制
        if (loginUser.getUser().isAdmin()) {
            return "";
        }
        
        // 根据角色获取数据范围
        Set<String> roles = loginUser.getRoles();
        if (roles.contains("admin")) {
            return ""; // 管理员查看所有数据
        }
        
        // 部门数据权限
        if (roles.contains("dept_manager")) {
            return " AND dept_id = " + loginUser.getDeptId();
        }
        
        // 个人数据权限
        return " AND create_by = " + loginUser.getUserId();
    }
}
```

### 使用示例
```java
@Service
public class UserServiceImpl implements UserService {

    /**
     * 查询用户列表 - 带数据权限
     */
    @DataScope(deptAlias = "d", userAlias = "u")
    @Override
    public PageResult<SysUserVO> pageList(PageQuery query) {
        Page<SysUser> page = userMapper.selectPage(query.toPage(), query.toWrapper());
        return PageResult.of(
            MapstructUtils.convert(page.getRecords(), SysUserVO.class),
            page.getTotal()
        );
    }
}
```

## 安全配置

### SecurityConfig 配置
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 禁用 CSRF
            .csrf(csrf -> csrf.disable())
            // 禁用 Session
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // 配置请求授权
            .authorizeHttpRequests(auth -> auth
                // 静态资源和公开接口免认证
                .requestMatchers("/login", "/register", "/captcha").permitAll()
                .requestMatchers("/common/**").permitAll()
                .requestMatchers("/webjars/**", "/favicon.ico").permitAll()
                // 其他请求需要认证
                .anyRequest().authenticated()
            )
            // 添加 JWT 过滤器
            .addFilterBefore(jwtAuthenticationTokenFilter, UsernamePasswordAuthenticationFilter.class)
            // 配置异常处理
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                .accessDeniedHandler(jwtAccessDeniedHandler)
            );
        
        return http.build();
    }
    
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

## 检查清单

### 认证安全
- [ ] 密码使用 BCrypt 加密
- [ ] Token 设置合理有效期
- [ ] Token 刷新机制完善
- [ ] 登录失败次数限制
- [ ] 验证码防护

### 授权控制
- [ ] 所有接口都有权限控制
- [ ] 权限注解使用正确
- [ ] 角色划分合理
- [ ] 数据权限生效

### Token 管理
- [ ] Token 签名算法安全 (HS512)
- [ ] Token 过期时间合理
- [ ] Token 刷新流程完整
- [ ] Token 黑名单机制

### 日志审计
- [ ] 登录日志完整记录
- [ ] 操作日志记录
- [ ] 异常日志记录
- [ ] 审计日志可追溯
