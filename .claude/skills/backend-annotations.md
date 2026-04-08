# Backend Annotations - 后端注解使用规范

## 职责范围

规范 RuoYi-Vue-Plus 项目中后端注解的使用，包括 Spring 注解、MyBatis-Plus 注解、Sa-Token 权限注解等。

---

## 核心规范

### 1. 权限注解

#### @SaCheckPermission - 方法级权限控制

```java
// ✅ 正确：添加权限注解
@SaCheckPermission("system:user:add")
@PostMapping
public AjaxResult add(@RequestBody SysUser user) {
    return toAjax(userService.add(user));
}

// ✅ 正确：多个权限（OR 关系）
@SaCheckPermission(value = {"system:user:add", "system:user:edit"}, logical = Logical.OR)
@PostMapping
public AjaxResult save(@RequestBody SysUser user) {
    return toAjax(userService.save(user));
}

// ❌ 错误：缺少权限注解
@PostMapping
public AjaxResult add(@RequestBody SysUser user) {
    return toAjax(userService.add(user));
}
```

#### @SaCheckRole - 角色控制

```java
// 仅允许 admin 角色访问
@SaCheckRole("admin")
@DeleteMapping("/{ids}")
public AjaxResult remove(@PathVariable Long[] ids) {
    return toAjax(userService.removeByIds(Arrays.asList(ids)));
}
```

#### @SaCheckLogin - 登录验证

```java
// 必须登录后访问
@SaCheckLogin
@GetMapping("/profile")
public AjaxResult getProfile() {
    return AjaxResult.success(StpUtil.getTokenInfo());
}
```

---

### 2. MyBatis-Plus 注解

#### @TableName - 表名映射

```java
// ✅ 正确：指定表名
@TableName("sys_user")
public class SysUser extends TenantEntity {
    // ...
}

// ✅ 正确：使用自动驼峰转换
@TableName(value = "sys_user_config", autoResultMap = true)
public class SysUserConfig {
    // ...
}
```

#### @TableId - 主键策略

```java
// ✅ 正确：雪花 ID（推荐）
@TableId(value = "user_id", type = IdType.ASSIGN_ID)
private Long userId;

// ✅ 正确：自增 ID（遗留系统）
@TableId(value = "user_id", type = IdType.AUTO)
private Long userId;

// ❌ 错误：未指定主键类型
@TableId("user_id")
private Long userId;
```

#### @TableField - 字段映射

```java
// 自动填充（创建时间）
@TableField(fill = FieldFill.INSERT)
private Date createTime;

// 自动填充（更新时间）
@TableField(fill = FieldFill.INSERT_UPDATE)
private Date updateTime;

// 逻辑删除
@TableField(fill = FieldFill.INSERT)
@TableLogic
private Integer delFlag;

// 忽略该字段
@TableField(exist = false)
private transient String tempData;

// 条件为 true 时插入（动态）
@TableField(insertStrategy = FieldStrategy.NOT_NULL)
private String description;
```

#### @AutoMapper - Mapstruct 自动映射

```java
// ✅ 正确：BO 类使用 @AutoMapper
@Data
@AutoMapper(target = UserVo.class)
public class UserBO {
    private String username;
    private String email;
}

// 带排除字段的映射
@Data
@AutoMapper(target = UserVo.class, excludes = {"password", "salt"})
public class UserBO {
    private String username;
    private String password;  // 不会被映射到 VO
    private String email;
}
```

---

### 3. Spring 注解

#### @Transactional - 事务管理

```java
// ✅ 正确：Service 层添加事务
@Transactional(rollbackFor = Exception.class)
public int addUser(SysUser user) {
    int rows = userMapper.insert(user);
    // 其他操作...
    return rows;
}

// ✅ 正确：指定回滚异常
@Transactional(rollbackFor = {RuntimeException.class, BusinessException.class})
public void processBusiness() {
    // 业务逻辑
}

// ❌ 错误：事务加在 Controller 层
@Transactional  // 不应该在这里
@PostMapping
public AjaxResult add(@RequestBody SysUser user) {
    userService.add(user);
    return AjaxResult.success();
}
```

#### @Validated - 参数校验

```java
// ✅ 正确：Controller 层添加校验
@Validated
@RestController
public class UserController {
    
    @PostMapping
    public AjaxResult add(@Validated @RequestBody UserBO user) {
        // ...
    }
}

// ✅ 正确：分组校验
@PostMapping
public AjaxResult add(@Validated(AddGroup.class) @RequestBody UserBO user) {
    // ...
}

// 分组接口
public interface AddGroup {}
public interface UpdateGroup {}
```

#### JSR-303 校验注解

```java
@Data
public class UserBO {
    
    @NotNull(message = "用户 ID 不能为空", groups = UpdateGroup.class)
    private Long userId;
    
    @NotBlank(message = "用户名不能为空")
    @Size(min = 2, max = 20, message = "用户名长度必须在 2-20 之间")
    private String username;
    
    @Email(message = "邮箱格式不正确")
    private String email;
    
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phoneNumber;
    
    @Min(value = 0, message = "年龄不能小于 0")
    @Max(value = 150, message = "年龄不能大于 150")
    private Integer age;
}
```

---

### 4. RuoYi 专用注解

#### @Log - 操作日志

```java
// 记录操作日志
@Log(title = "用户管理", businessType = BusinessType.INSERT)
@SaCheckPermission("system:user:add")
@PostMapping
public AjaxResult add(@RequestBody SysUser user) {
    return toAjax(userService.add(user));
}

// 业务类型枚举
BusinessType.INSERT      // 新增
BusinessType.UPDATE      // 修改
BusinessType.DELETE      // 删除
BusinessType.IMPORT      // 导入
BusinessType.EXPORT      // 导出
```

#### @DataScope - 数据权限

```java
// 部门数据权限
@DataScope(deptAlias = "d", userAlias = "u")
public List<SysUser> selectUserList(SysUser user) {
    return baseMapper.selectUserList(user);
}

// 仅本人数据权限
@DataScope(scopedScope = DataScope.SELF)
public List<SysUser> selectMyUsers(SysUser user) {
    return baseMapper.selectList(user);
}
```

#### @RepeatSubmit - 防止重复提交

```java
// 5 秒内防止重复提交
@RepeatSubmit(interval = 5000, message = "请勿重复提交")
@PostMapping
public AjaxResult add(@RequestBody SysUser user) {
    return toAjax(userService.add(user));
}
```

#### @RateLimiter - 限流

```java
// 每秒最多 5 次请求
@RateLimiter(count = 5, time = 1)
@GetMapping("/list")
public AjaxResult list(SysUser user) {
    return getData(userService.selectUserList(user));
}
```

---

### 5. 文档注解

#### @ApiOperation - Swagger 文档

```java
@RestController
@RequestMapping("/system/user")
@Tag(name = "用户管理", description = "用户 CRUD 操作")
public class UserController {
    
    @Operation(summary = "用户列表", description = "分页查询用户列表")
    @GetMapping("/list")
    public AjaxResult list(SysUser user) {
        return getData(userService.selectUserList(user));
    }
    
    @Operation(summary = "新增用户")
    @SaCheckPermission("system:user:add")
    @PostMapping
    public AjaxResult add(@RequestBody SysUser user) {
        return toAjax(userService.add(user));
    }
}
```

#### @Parameter - 请求参数说明

```java
@Operation(summary = "删除用户")
@DeleteMapping("/{userIds}")
public AjaxResult remove(
    @Parameter(description = "用户 ID 数组", required = true)
    @PathVariable Long[] userIds) {
    return toAjax(userService.removeByIds(userIds));
}
```

---

## 注解优先级检查清单

在提交代码前，确认以下注解已正确添加：

### Controller 层
- [ ] `@Tag` / `@ApiOperation` - API 文档
- [ ] `@SaCheckPermission` - 权限检查
- [ ] `@Log` - 操作日志
- [ ] `@Validated` - 参数校验（类级别）
- [ ] `@RepeatSubmit` - 防止重复提交（如需要）
- [ ] `@RateLimiter` - 限流（如需要）

### Service 层
- [ ] `@Transactional` - 事务管理
- [ ] `@DataScope` - 数据权限（如需要）

### Entity/BO 层
- [ ] `@TableName` - 表名映射
- [ ] `@TableId` - 主键策略
- [ ] `@TableField` - 字段映射
- [ ] `@AutoMapper` - Mapstruct 映射（BO 类）
- [ ] JSR-303 校验注解（BO 类）

---

## 常见错误

### 错误 1：事务未生效

```java
// ❌ 错误：同类方法调用，事务不生效
public void process() {
    saveUser();  // 事务不会生效
}

@Transactional
public void saveUser() {
    // ...
}

// ✅ 正确：注入 Service 调用
@Autowired
private UserService userService;

public void process() {
    userService.saveUser();  // 事务生效
}
```

### 错误 2：权限注解位置错误

```java
// ❌ 错误：权限注解在 URL 映射上
@SaCheckPermission("system:user:list")
@GetMapping("/list")
public AjaxResult list() { }

// ✅ 正确：权限注解在方法上
@GetMapping("/list")
@SaCheckPermission("system:user:list")
public AjaxResult list() { }
```

### 错误 3：校验注解未生效

```java
// ❌ 错误：缺少 @Validated
@PostMapping
public AjaxResult add(@RequestBody @Valid UserBO user) { }

// ✅ 正确：Controller 添加 @Validated
@Validated
@RestController
public class UserController {
    @PostMapping
    public AjaxResult add(@Validated @RequestBody UserBO user) { }
}
```

---

## 触发关键词

- 注解
- @Transactional
- @SaCheckPermission
- @TableId
- @AutoMapper
- 权限注解
- 事务注解
- 校验注解

---

## 相关文件

- [crud-development.md](./crud-development.md) - CRUD 开发规范
- [api-development.md](./api-development.md) - API 开发规范
- [security-guard.md](./security-guard.md) - 安全认证规范
- [mybatis-plus-best-practices.md](./mybatis-plus-best-practices.md) - MyBatis-Plus 规范

---

*更新时间：2026-04-06*  
*RuoYi-Vue-Plus AI 开发助手*
