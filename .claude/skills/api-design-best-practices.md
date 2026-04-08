# API 设计最佳实践技能 (API Design Best Practices)

## 适用场景
- RESTful API 设计
- OpenAPI/Swagger 文档
- API 版本管理
- 前后端接口协作

## 核心规范

### RESTful API 设计原则

#### 1. 资源命名规范
```
# ✅ 推荐：使用名词复数，小写，连字符
GET  /api/v1/users
GET  /api/v1/user-roles
POST /api/v1/orders

# ❌ 不推荐
GET  /api/v1/getUsers      # 动词
GET  /api/v1/User         # 大写
GET  /api/v1/userRoles    # 驼峰
```

#### 2. HTTP 方法使用
| 方法 | 用途 | 幂等性 |
|------|------|--------|
| GET | 查询资源 | 是 |
| POST | 创建资源 | 否 |
| PUT | 更新资源 (全量) | 是 |
| PATCH | 更新资源 (部分) | 否 |
| DELETE | 删除资源 | 是 |

#### 3. 状态码使用
```java
// 2xx 成功
200 OK          // 请求成功
201 Created     // 资源创建成功
204 No Content  // 删除成功，无返回内容

// 4xx 客户端错误
400 Bad Request       // 请求参数错误
401 Unauthorized      // 未认证
403 Forbidden         // 无权限
404 Not Found         // 资源不存在
409 Conflict          // 资源冲突
422 Unprocessable     // 参数校验失败

// 5xx 服务端错误
500 Internal Server Error  // 服务器内部错误
503 Service Unavailable    // 服务不可用
```

## 统一响应格式

### 响应体结构
```java
@Data
public class ApiResponse<T> {
    
    /**
     * 状态码
     */
    private Integer code;
    
    /**
     * 消息
     */
    private String message;
    
    /**
     * 数据
     */
    private T data;
    
    /**
     * 时间戳
     */
    private Long timestamp;
    
    public static <T> ApiResponse<T> ok() {
        return ok(null);
    }
    
    public static <T> ApiResponse<T> ok(T data) {
        ApiResponse<T> resp = new ApiResponse<>();
        resp.setCode(200);
        resp.setMessage("success");
        resp.setData(data);
        resp.setTimestamp(System.currentTimeMillis());
        return resp;
    }
    
    public static <T> ApiResponse<T> error(String message) {
        return error(500, message);
    }
    
    public static <T> ApiResponse<T> error(Integer code, String message) {
        ApiResponse<T> resp = new ApiResponse<>();
        resp.setCode(code);
        resp.setMessage(message);
        resp.setTimestamp(System.currentTimeMillis());
        return resp;
    }
}
```

### 分页响应
```java
@Data
public class PageResult<T> {
    
    /**
     * 数据列表
     */
    private List<T> list;
    
    /**
     * 总数
     */
    private Long total;
    
    /**
     * 当前页
     */
    private Integer pageNum;
    
    /**
     * 每页大小
     */
    private Integer pageSize;
    
    public static <T> PageResult<T> of(List<T> list, Long total, 
                                        Integer pageNum, Integer pageSize) {
        PageResult<T> result = new PageResult<>();
        result.setList(list);
        result.setTotal(total);
        result.setPageNum(pageNum);
        result.setPageSize(pageSize);
        return result;
    }
}
```

## API 文档规范

### OpenAPI 3.0 示例
```yaml
openapi: 3.0.3
info:
  title: RuoYi-Vue-Plus API
  description: 企业级开发框架 API 文档
  version: 3.9.2
  contact:
    name: API Support
    email: support@ruoyi.vip

servers:
  - url: http://localhost:8080/api/v1
    description: 开发环境
  - url: https://api.ruoyi.vip/api/v1
    description: 生产环境

paths:
  /users:
    get:
      summary: 查询用户列表
      description: 支持分页、筛选、排序
      operationId: listUsers
      tags:
        - 用户管理
      parameters:
        - name: pageNum
          in: query
          schema:
            type: integer
            default: 1
        - name: pageSize
          in: query
          schema:
            type: integer
            default: 10
        - name: username
          in: query
          schema:
            type: string
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserPageResult'
        '401':
          description: 未认证
        '403':
          description: 无权限
    
    post:
      summary: 创建用户
      operationId: createUser
      tags:
        - 用户管理
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: 创建成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiResponse'
        '400':
          description: 参数错误

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
          format: int64
        username:
          type: string
        nickname:
          type: string
        email:
          type: string
          format: email
        status:
          type: string
          enum: [0, 1]
        createTime:
          type: string
          format: date-time
    
    CreateUserRequest:
      type: object
      required:
        - username
        - password
      properties:
        username:
          type: string
          minLength: 3
          maxLength: 20
        password:
          type: string
          minLength: 6
          maxLength: 20
        nickname:
          type: string
        email:
          type: string
          format: email
    
    ApiResponse:
      type: object
      properties:
        code:
          type: integer
        message:
          type: string
        data:
          type: object
        timestamp:
          type: integer
          format: int64
    
    UserPageResult:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data:
              $ref: '#/components/schemas/PageResult'
    
    PageResult:
      type: object
      properties:
        list:
          type: array
          items:
            $ref: '#/components/schemas/User'
        total:
          type: integer
        pageNum:
          type: integer
        pageSize:
          type: integer

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

## Controller 示例

### 标准 RESTful Controller
```java
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "用户管理", description = "用户 CRUD 操作")
public class UserController {

    private final UserService userService;

    @GetMapping
    @SaCheckPermission("system:user:list")
    @Operation(summary = "查询用户列表")
    public R<PageResult<UserVO>> list(
            @Parameter(description = "当前页") @RequestParam(defaultValue = "1") Integer pageNum,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "10") Integer pageSize,
            @Parameter(description = "用户名") @RequestParam(required = false) String username) {
        
        PageQuery query = PageQuery.of(pageNum, pageSize)
            .addCondition("username", username);
        return R.ok(userService.pageList(query));
    }

    @GetMapping("/{id}")
    @SaCheckPermission("system:user:query")
    @Operation(summary = "查询用户详情")
    public R<UserVO> getById(@PathVariable Long id) {
        return R.ok(userService.getById(id));
    }

    @PostMapping
    @SaCheckPermission("system:user:add")
    @Operation(summary = "创建用户")
    @ResponseStatus(HttpStatus.CREATED)
    public R<Void> create(@Valid @RequestBody CreateUserDTO dto) {
        userService.createUser(dto);
        return R.ok();
    }

    @PutMapping("/{id}")
    @SaCheckPermission("system:user:edit")
    @Operation(summary = "更新用户")
    public R<Void> update(@PathVariable Long id, 
                          @Valid @RequestBody UpdateUserDTO dto) {
        userService.updateUser(id, dto);
        return R.ok();
    }

    @DeleteMapping("/{ids}")
    @SaCheckPermission("system:user:remove")
    @Operation(summary = "删除用户")
    public R<Void> delete(@PathVariable List<Long> ids) {
        userService.remove(ids);
        return R.ok();
    }
}
```

## API 版本管理

### URL 版本化 (推荐)
```
GET /api/v1/users
GET /api/v2/users
```

### Header 版本化
```
GET /users
Accept-Version: v1
```

### 参数版本化
```
GET /users?version=v1
```

## 安全规范

### 认证方式
```java
// JWT Bearer Token
Authorization: Bearer <token>

// API Key
X-API-Key: <key>
```

### 权限控制
```java
// 方法级权限
@SaCheckPermission("system:user:add")
@PostMapping

// 角色控制
@SaCheckRole("admin")
@PostMapping

// 组合控制
@SaCheckPermission(value = {"system:user:add", "system:user:edit"}, logical = Logical.OR)
@PostMapping
```

### 限流保护
```java
// 接口限流
@RateLimiter(value = 10, timeout = 60)  // 60 秒内最多 10 次
@PostMapping
public R<Void> login(@RequestBody LoginDTO dto) {
    // ...
}
```

## API 设计检查清单

### 设计审查
- [ ] 资源命名是否使用名词复数
- [ ] HTTP 方法使用是否正确
- [ ] 状态码使用是否恰当
- [ ] 响应格式是否统一
- [ ] 错误信息是否清晰

### 文档审查
- [ ] OpenAPI 文档是否完整
- [ ] 请求参数是否有说明
- [ ] 响应示例是否提供
- [ ] 错误码是否列举

### 安全审查
- [ ] 是否实现认证机制
- [ ] 是否实现授权控制
- [ ] 是否有限流保护
- [ ] 敏感数据是否脱敏

## 常见错误处理

### 错误响应格式
```json
{
  "code": 400,
  "message": "参数校验失败",
  "errors": [
    {
      "field": "username",
      "message": "用户名不能为空"
    },
    {
      "field": "password", 
      "message": "密码长度至少 6 位"
    }
  ],
  "timestamp": 1712401234567,
  "path": "/api/v1/users"
}
```

### 全局异常处理
```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public R<Void> handleBusinessException(BusinessException e) {
        log.warn("业务异常：{}", e.getMessage());
        return R.fail(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public R<Map<String, String>> handleValidationException(
            MethodArgumentNotValidException e) {
        Map<String, String> errors = new HashMap<>();
        e.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );
        return R.fail(400, "参数校验失败", errors);
    }

    @ExceptionHandler(Exception.class)
    public R<Void> handleException(Exception e) {
        log.error("系统异常", e);
        return R.fail("系统繁忙，请稍后再试");
    }
}
```
