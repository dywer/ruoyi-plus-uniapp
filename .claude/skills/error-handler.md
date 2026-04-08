# Error Handler - 异常处理规范

## 职责范围

规范 RuoYi-Vue-Plus 项目中的异常处理机制，包括异常分类、自定义异常、全局异常处理器、日志记录等。

---

## 核心规范

### 1. 异常分类体系

```
┌─────────────────────────────────────────────────────────┐
│                    Exception (Throwable)                 │
└─────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          ▼                                 ▼
┌───────────────────┐              ┌───────────────────┐
│    Error          │              │    Exception      │
│  (系统错误)        │              │  (可处理异常)      │
└───────────────────┘              └───────────────────┘
                                              │
                              ┌───────────────┼───────────────┐
                              ▼               ▼               ▼
                       ┌──────────┐   ┌──────────┐   ┌──────────┐
                       │Checked   │   │Unchecked │   │ 自定义  │
                       │Exception │   │RuntimeException│ │Exception │
                       └──────────┘   └──────────┘   └──────────┘
```

### 2. ServiceException - 业务异常

```java
// ✅ 正确：使用 ServiceException 处理业务异常
public User getUserById(Long userId) {
    User user = userMapper.selectById(userId);
    if (user == null) {
        throw new ServiceException("用户不存在");
    }
    return user;
}

// ✅ 正确：带错误码的业务异常
public void checkPermission(Long userId, String permission) {
    if (!hasPermission(userId, permission)) {
        throw new ServiceException(ErrorCode.PERMISSION_DENIED, "没有操作权限");
    }
}

// ✅ 正确：带异常码枚举
public class ErrorCode {
    public static final int SUCCESS = 200;
    public static final int BAD_REQUEST = 400;
    public static final int UNAUTHORIZED = 401;
    public static final int FORBIDDEN = 403;
    public static final int NOT_FOUND = 404;
    public static final int INTERNAL_ERROR = 500;
    public static final int PERMISSION_DENIED = 403001;
    public static final int DATA_NOT_FOUND = 404001;
}

// ❌ 错误：使用通用 Exception
public User getUserById(Long userId) throws Exception {
    // ...
    throw new Exception("出错了");  // 过于模糊
}
```

### 3. 全局异常处理器

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // 处理业务异常
    @ExceptionHandler(ServiceException.class)
    public AjaxResult handleServiceException(ServiceException e) {
        log.error("业务异常：{}", e.getMessage());
        return AjaxResult.error(e.getCode(), e.getMessage());
    }

    // 处理参数校验异常
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public AjaxResult handleValidationException(MethodArgumentNotValidException e) {
        BindingResult result = e.getBindingResult();
        String message = result.getFieldError() != null 
            ? result.getFieldError().getDefaultMessage() 
            : "参数校验失败";
        log.warn("参数校验异常：{}", message);
        return AjaxResult.error(ErrorCode.BAD_REQUEST, message);
    }

    // 处理权限异常
    @ExceptionHandler(NotPermissionException.class)
    public AjaxResult handlePermissionException(NotPermissionException e) {
        log.warn("权限异常：{}", e.getMessage());
        return AjaxResult.error(ErrorCode.FORBIDDEN, "没有操作权限");
    }

    // 处理其他异常
    @ExceptionHandler(Exception.class)
    public AjaxResult handleException(Exception e) {
        log.error("系统异常", e);
        return AjaxResult.error(ErrorCode.INTERNAL_ERROR, "系统繁忙，请稍后再试");
    }
}
```

### 4. 自定义异常类

```java
// 基础业务异常
public class ServiceException extends RuntimeException {
    private Integer code;
    private String message;

    public ServiceException(String message) {
        this.code = ErrorCode.INTERNAL_ERROR;
        this.message = message;
    }

    public ServiceException(Integer code, String message) {
        this.code = code;
        this.message = message;
    }

    // Getters...
}

// 用户相关异常
public class UserException extends ServiceException {
    public UserException(String message) {
        super(ErrorCode.INTERNAL_ERROR, message);
    }
}

// 具体业务异常
public class UserNotFoundException extends UserException {
    public UserNotFoundException(Long userId) {
        super("用户不存在：" + userId);
    }
}

public class UserDisabledException extends UserException {
    public UserDisabledException(String username) {
        super("用户已禁用：" + username);
    }
}
```

### 5. 异常日志记录

```java
// ✅ 正确：记录完整异常栈
@ExceptionHandler(Exception.class)
public AjaxResult handleException(Exception e) {
    log.error("系统异常：{}", e.getMessage(), e);  // 第三个参数记录栈
    return AjaxResult.error("系统繁忙");
}

// ✅ 正确：记录关键上下文
public void processData(Long userId, String data) {
    try {
        // 业务逻辑
    } catch (Exception e) {
        log.error("处理数据失败，userId={}, data={}", userId, data, e);
        throw new ServiceException("数据处理失败");
    }
}

// ❌ 错误：只记录消息不记录栈
log.error("出错了：" + e.getMessage());  // 无法定位问题

// ❌ 错误：吞掉异常不处理
try {
    doSomething();
} catch (Exception e) {
    // 空 catch，什么都不做
}
```

### 6. 事务回滚配置

```java
// ✅ 正确：指定回滚所有异常
@Transactional(rollbackFor = Exception.class)
public void saveData() {
    // 业务逻辑
}

// ✅ 正确：指定特定异常回滚
@Transactional(rollbackFor = {RuntimeException.class, BusinessException.class})
public void processBusiness() {
    // 业务逻辑
}

// ✅ 正确：指定不回滚的异常
@Transactional(rollbackFor = Exception.class, noRollbackFor = OptimisticLockException.class)
public void updateWithLock() {
    // 乐观锁异常不回滚
}

// ❌ 错误：默认只回滚 RuntimeException
@Transactional  // 默认不回滚 Checked Exception
public void saveData() throws IOException {
    // IOException 不会回滚
}
```

---

## 异常处理最佳实践

### 1. 快速失败原则

```java
// ✅ 正确：提前校验，快速失败
public void updateUser(User user) {
    validateUser(user);  // 前置校验
    // 业务逻辑
}

private void validateUser(User user) {
    if (user == null) {
        throw new ServiceException("用户不能为空");
    }
    if (StringUtils.isBlank(user.getUsername())) {
        throw new ServiceException("用户名不能为空");
    }
}
```

### 2. 异常包装

```java
// ✅ 正确：包装底层异常为业务异常
public User loadUser(Long userId) {
    try {
        return userMapper.selectById(userId);
    } catch (PersistenceException e) {
        log.error("加载用户失败，userId={}", userId, e);
        throw new ServiceException("加载用户失败", e);
    }
}

// ✅ 正确：保留原始异常栈
try {
    remoteService.call();
} catch (RemoteException e) {
    throw new ServiceException("远程服务调用失败", e);
}
```

### 3. 资源清理

```java
// ✅ 正确：使用 try-with-resources
try (InputStream is = new FileInputStream(file);
     OutputStream os = new FileOutputStream(output)) {
    // 自动关闭资源
}

// ✅ 正确：finally 中清理
InputStream is = null;
try {
    is = new FileInputStream(file);
    // 业务逻辑
} finally {
    if (is != null) {
        try { is.close(); } catch (IOException e) {
            log.warn("关闭流失败", e);
        }
    }
}
```

---

## 统一响应格式

```java
@Data
public class AjaxResult {
    private Integer code;
    private String msg;
    private Object data;

    public static AjaxResult success() {
        return new AjaxResult(ErrorCode.SUCCESS, "操作成功", null);
    }

    public static AjaxResult success(Object data) {
        return new AjaxResult(ErrorCode.SUCCESS, "操作成功", data);
    }

    public static AjaxResult error(String msg) {
        return new AjaxResult(ErrorCode.INTERNAL_ERROR, msg, null);
    }

    public static AjaxResult error(Integer code, String msg) {
        return new AjaxResult(code, msg, null);
    }
}
```

---

## 异常处理检查清单

在提交代码前确认：

- [ ] 业务异常使用 `ServiceException`
- [ ] 全局异常处理器已捕获所有异常类型
- [ ] 异常日志记录了完整栈
- [ ] 事务配置了正确的回滚规则
- [ ] 资源已正确清理
- [ ] 返回了统一的响应格式
- [ ] 敏感信息未在异常中暴露

---

## 常见错误

### 错误 1：吞掉异常

```java
// ❌ 错误
try {
    doSomething();
} catch (Exception e) {
    // 什么都不做
}

// ✅ 正确
try {
    doSomething();
} catch (Exception e) {
    log.error("操作失败", e);
    throw new ServiceException("操作失败", e);
}
```

### 错误 2：异常信息泄露

```java
// ❌ 错误：暴露数据库结构
catch (SQLException e) {
    return AjaxResult.error("SQL 错误：" + e.getMessage());
}

// ✅ 正确：友好提示
catch (SQLException e) {
    log.error("数据库错误", e);
    return AjaxResult.error("系统繁忙，请稍后再试");
}
```

### 错误 3：事务不回滚

```java
// ❌ 错误：Checked Exception 不会回滚
@Transactional
public void save() throws IOException {
    // IOException 发生不会回滚
}

// ✅ 正确
@Transactional(rollbackFor = Exception.class)
public void save() throws IOException {
    // 所有异常都会回滚
}
```

---

## 触发关键词

- 异常
- Exception
- 错误处理
- ServiceException
- 事务回滚
- 异常捕获

---

## 相关文件

- [crud-development.md](./crud-development.md) - CRUD 开发规范
- [api-development.md](./api-development.md) - API 开发规范
- [backend-annotations.md](./backend-annotations.md) - 注解使用规范
- [springboot-best-practices.md](./springboot-best-practices.md) - Spring Boot 规范

---

*更新时间：2026-04-06*  
*RuoYi-Vue-Plus AI 开发助手*
