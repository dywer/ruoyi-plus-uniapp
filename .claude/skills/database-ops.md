# 数据库操作技能 (Database Operations)

## 适用场景
- 设计和操作数据库表
- 使用MyBatis-Plus进行ORM操作
- 遵循RuoYi-Vue-Plus数据库规范

## 数据库设计规范

### 1. 命名规范
- 表名使用小写加下划线
- 表名前缀统一（如sys_, gen_, monitor_）
- 字段名使用小写加下划线
- 关键字避免作为字段名

### 2. 字段规范
- 主键统一使用user_id、dept_id等形式
- 创建时间createTime，更新时间updateTime
- 创建人createBy，更新人updateBy
- 删除标志delFlag（软删除）

### 3. 索引策略
- 主键自动建立索引
- 常用查询字段建立索引
- 外键关系建立索引
- 避免过多索引影响写性能

## MyBatis-Plus使用规范

### 1. 实体类设计
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

### 2. 字段填充
- 使用@TableField(fill = FieldFill.INSERT)自动填充
- 实现MetaObjectHandler处理器
- 统一管理自动填充逻辑

### 3. 逻辑删除
- 全局配置逻辑删除
- 使用@TableLogic注解
- 统一删除标志处理

## SQL开发规范

### 1. 查询优化
- 避免SELECT *
- 合理使用分页
- 注意JOIN操作性能
- 使用批量操作处理大量数据

### 2. 条件构造
- 使用QueryWrapper/UpdateWrapper
- 避免SQL注入风险
- 合理使用动态SQL

### 3. 事务处理
- 正确使用@Transactional注解
- 控制事务范围
- 处理事务异常

## 数据库操作最佳实践

### 1. 分页查询
```java
// 使用分页插件
IPage<SysUser> page = new Page<>(pageNum, pageSize);
QueryWrapper<SysUser> wrapper = new QueryWrapper<>();
return userService.page(page, wrapper);
```

### 2. 批量操作
- 使用batch方法进行批量插入
- 批量更新和删除
- 注意内存使用情况

### 3. 关联查询
- 使用@ResultMap处理复杂关联
- 考虑性能影响
- 避免深度关联查询

## 数据库维护

### 1. 字典管理
- 系统字典表设计
- 字典缓存策略
- 字典数据更新

### 2. 数据迁移
- 使用Flyway进行版本管理
- 数据备份策略
- 迁移回滚计划

### 3. 性能监控
- SQL执行时间监控
- 慢查询分析
- 索引使用情况

## 安全措施
1. SQL注入防护
2. 敏感数据加密
3. 数据访问权限控制
4. 数据库连接安全

## 注意事项
1. 所有实体继承TenantEntity（如需多租户支持）
2. 主键使用雪花算法生成
3. 时间字段使用自动填充
4. 遵循软删除规范