# CRUD开发技能

## 适用场景
- 遵循RuoYi-Vue-Plus三层架构（Controller -> Service -> Mapper）
- 标准CRUD操作的开发
- 遵循框架代码生成规范

## 开发规范

### 1. 包名规范
- 必须以`org.dromara`开头
- 错误示例：`com.example.project.module`
- 正确示例：`org.dromara.system.user`

### 2. 实体类规范
- 继承TenantEntity（如需要多租户支持）
- 主键使用雪花ID策略
- 时间字段使用自动填充注解

```java
@TableName("sys_user")
@Data
@EqualsAndHashCode(callSuper = true)
public class SysUser extends TenantEntity {
    
    @TableId(value = "user_id", type = IdType.ASSIGN_ID)
    private Long userId;
    
    @TableField(fill = FieldFill.INSERT)
    private Date createTime;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Date updateTime;
}
```

### 3. Service层规范
- 接口和实现类分离
- 使用Mapstruct进行对象转换
- 异常处理规范

### 4. Controller层规范
- API路径遵循RESTful风格
- 使用@SaCheckPermission进行权限控制
- 返回值使用R<T>封装

### 5. 代码示例
- 使用MapstructUtils进行对象转换
- 正确的注解使用方式
- 合适的异常处理

## 检查要点
1. 包名是否符合`org.dromara.*`规范
2. 是否正确使用了基类
3. 权限注解是否添加
4. 对象转换是否使用MapstructUtils
5. 主键策略是否正确