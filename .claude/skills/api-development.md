# API开发技能

## 适用场景
- 设计和开发RESTful API
- 遵循RuoYi-Vue-Plus API规范
- 构建高质量的API接口

## API设计规范

### 1. 路径规范
| 操作 | HTTP方法 | 路径 |
|------|----------|------|
| 分页查询 | GET | `/list` |
| 获取详情 | GET | `/{id}` |
| 新增 | POST | `/` |
| 修改 | PUT | `/` |
| 删除 | DELETE | `/{ids}` |
| 导出 | POST | `/export` |

### 2. 请求参数
- 路径参数使用`@PathVariable`
- 查询参数使用POJO接收
- 请求体使用`@RequestBody`
- 参数校验使用Bean Validation

### 3. 响应格式
- 使用R<T>统一响应格式
- 包含code、msg、data字段
- 错误信息统一处理

## Controller开发规范

### 1. 基础结构
```java
@RestController
@RequestMapping("/system/user")
public class SysUserController {
    
    @Autowired
    private ISysUserService userService;
    
    @SaCheckPermission("system:user:list")
    @GetMapping("/list")
    public R<List<SysUser>> list(SysUser sysUser) {
        // 业务逻辑
    }
}
```

### 2. 注解使用
- @RestController: REST风格控制器
- @RequestMapping: 映射请求路径
- @SaCheckPermission: 权限检查
- @Valid/@Validated: 参数校验

### 3. 参数校验
```java
@PostMapping
public R<Void> add(@Valid @RequestBody SysUser sysUser) {
    // 业务逻辑
}
```

## 最佳实践

### 1. 分页处理
- 使用PageQuery分页参数
- 返回分页结果Paging
- 处理排序和筛选

### 2. 异常处理
- 自定义业务异常
- 全局异常处理器
- 友好的错误信息

### 3. 数据转换
- 使用MapstructUtils
- DTO/VO/Entity转换
- 避免直接返回实体类

## 性能优化

### 1. 缓存策略
- 接口数据缓存
- 合理设置缓存时间
- 缓存失效策略

### 2. 查询优化
- 避免N+1查询
- 合理使用索引
- 分页合理设置

## 安全措施
1. 参数防注入
2. 接口访问频率限制
3. 敏感数据脱敏
4. 权限校验完整性

## 测试要点
1. 单元测试覆盖
2. 接口功能验证
3. 参数边界测试
4. 异常场景测试