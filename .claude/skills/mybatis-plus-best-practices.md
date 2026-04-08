# MyBatis-Plus 最佳实践技能 (MyBatis-Plus Best Practices)

## 适用场景
- MyBatis-Plus 项目开发
- RuoYi-Vue-Plus/Pro 项目
- 需要高效 ORM 框架的 Java 项目

## 核心技术栈
- **MyBatis-Plus**: 3.5.x
- **Spring Boot**: 3.x/4.x
- **Java**: 17+
- **MySQL**: 8.0+

## 实体类规范

### 完整实体类模板
```java
@Data
@TableName("sys_user")
@ApiDescription("用户信息")
public class SysUser extends BaseEntity {

    private static final long serialVersionUID = 1L;

    @TableId(value = "user_id", type = IdType.ASSIGN_ID)
    @ApiModelProperty(value = "用户 ID", example = "1234567890")
    private Long userId;

    @TableField("dept_id")
    @ApiModelProperty(value = "部门 ID")
    private Long deptId;

    @TableField("user_name")
    @ApiModelProperty(value = "用户名")
    private String userName;

    @TableField("nick_name")
    @ApiModelProperty(value = "昵称")
    private String nickName;

    @TableField("email")
    @ApiModelProperty(value = "邮箱")
    private String email;

    @TableField("phonenumber")
    @ApiModelProperty(value = "手机号")
    private String phonenumber;

    @TableField("status")
    @ApiModelProperty(value = "状态 (0 正常 1 停用)")
    private String status;

    @TableField(exist = false)
    @ApiModelProperty(value = "部门对象")
    private Dept dept;

    @TableField(exist = false)
    @ApiModelProperty(value = "角色列表")
    private List<Role> roles;
}
```

### 主键策略
```java
// 雪花 ID (推荐)
@TableId(type = IdType.ASSIGN_ID)
private Long id;

// 分布式 ID
@TableId(type = IdType.ID_WORKER)
private Long id;

// UUID
@TableId(type = IdType.ASSIGN_UUID)
private String id;

// 数据库自增
@TableId(type = IdType.AUTO)
private Long id;
```

## CRUD 操作

### BaseMapper 使用
```java
@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {
    // 继承 BaseMapper 获得基础 CRUD 能力
}
```

```java
@Service
public class UserServiceImpl implements UserService {
    
    @Autowired
    private SysUserMapper userMapper;
    
    // 插入
    public void insert() {
        User user = new User();
        user.setUserName("test");
        userMapper.insert(user);  // 自动返回主键
        Long id = user.getId();
    }
    
    // 删除
    public void delete(Long id) {
        userMapper.deleteById(id);
        // 批量删除
        userMapper.deleteBatchIds(Arrays.asList(1L, 2L, 3L));
    }
    
    // 更新
    public void update(Long id) {
        User user = new User();
        user.setId(id);
        user.setNickName("newNick");
        userMapper.updateById(user);  // 动态更新非 null 字段
    }
    
    // 查询
    public User getById(Long id) {
        return userMapper.selectById(id);
    }
    
    public List<User> list() {
        return userMapper.selectList(null);
    }
}
```

### Wrapper 条件构造

#### LambdaQueryWrapper (推荐)
```java
// 单条件查询
LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
wrapper.eq(User::getDeptId, deptId);
List<User> list = userMapper.selectList(wrapper);

// 多条件组合
wrapper.eq(User::getDeptId, deptId)
       .like(User::getUserName, userName)
       .in(User::getStatus, "0", "1")
       .orderByDesc(User::getCreateTime);
List<User> list = userMapper.selectList(wrapper);

// 范围查询
wrapper.between(User::getCreateTime, startTime, endTime);
List<User> list = userMapper.selectList(wrapper);

// 模糊查询
wrapper.like(User::getUserName, "张");
// 左模糊
wrapper.likeLeft(User::getUserName, "张");
// 右模糊
wrapper.likeRight(User::getUserName, "张");
```

#### 静态方法导入 (简化写法)
```java
import static com.baomidou.mybatisplus.core.toolkit.Wrappers.*;

// 链式调用
List<User> list = lambdaQuery()
    .eq(User::getDeptId, deptId)
    .like(User::getUserName, userName)
    .list();

// 单条查询
User user = lambdaQuery()
    .eq(User::getId, id)
    .one();

// 计数
Long count = lambdaQuery()
    .eq(User::getStatus, "0")
    .count();
```

## 分页查询

### 分页配置
```java
@Configuration
public class MybatisPlusConfig {
    
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // 分页插件
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }
}
```

### 分页使用
```java
// 简单分页
Page<User> page = new Page<>(1, 10);
LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
wrapper.eq(User::getDeptId, deptId);
IPage<User> result = userMapper.selectPage(page, wrapper);
List<User> records = result.getRecords();
long total = result.getTotal();

// 封装分页结果
public PageResult<UserVO> pageList(PageQuery query) {
    Page<User> page = query.toPage();
    IPage<User> result = userMapper.selectPage(page, query.toWrapper());
    List<UserVO> voList = MapstructUtils.convert(result.getRecords(), UserVO.class);
    return PageResult.of(voList, result.getTotal());
}
```

## 批量操作

### 批量插入
```java
@Transactional
public void batchInsert(List<User> userList) {
    int batchSize = 1000;
    int size = userList.size();
    
    for (int i = 0; i < size; i++) {
        if (i % batchSize == 0) {
            sqlSession.flushStatements();
        }
        userMapper.insert(userList.get(i));
    }
}
```

### 批量更新
```java
@Transactional
public void batchUpdate(List<User> userList) {
    userList.forEach(userMapper::updateById);
}
```

## 多表关联

### 一对多查询
```java
// 使用 @TableField(exist = false) + 手动关联
@Data
public class User extends BaseEntity {
    
    @TableField(exist = false)
    private List<Role> roles;
}

// Service 层关联查询
public UserVO getByIdWithRoles(Long userId) {
    User user = userMapper.selectById(userId);
    List<Role> roles = roleMapper.selectRolesByUserId(userId);
    UserVO vo = MapstructUtils.convert(user, UserVO.class);
    vo.setRoles(roles);
    return vo;
}
```

### 多对一查询
```java
@Data
public class Order extends BaseEntity {
    
    @TableField("user_id")
    private Long userId;
    
    @TableField(exist = false)
    private User user;
}

// 查询后手动填充
List<Order> orders = orderMapper.selectList(wrapper);
for (Order order : orders) {
    User user = userMapper.selectById(order.getUserId());
    order.setUser(user);
}
```

## 逻辑删除

### 全局配置
```yaml
mybatis-plus:
  global-config:
    db-config:
      logic-delete-field: delFlag
      logic-delete-value: 1
      logic-not-delete-value: 0
```

### 使用注解
```java
@Data
public class User {
    
    @TableLogic  // 逻辑删除注解
    private Integer delFlag;
}
```

### 自动填充
```java
@Component
public class MetaObjectHandler implements AutoFillObjectHandler {
    
    @Override
    public void insertFill(MetaObject metaObject) {
        this.strictInsertFill(metaObject, "delFlag", Integer.class, 0);
        this.strictInsertFill(metaObject, "createTime", Date.class, new Date());
    }
    
    @Override
    public void updateFill(MetaObject metaObject) {
        this.strictUpdateFill(metaObject, "updateTime", Date.class, new Date());
    }
}
```

## 乐观锁

### 配置
```java
@Bean
public MybatisPlusInterceptor optimisticLockerInterceptor() {
    MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
    interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());
    return interceptor;
}
```

### 使用
```java
@Data
public class Product {
    
    @Version  // 乐观锁注解
    private Integer version;
}

// 更新时自动检查版本
@Transactional
public void update(Product product) {
    productMapper.updateById(product);  // version 自动 +1，如果版本不一致则更新失败
}
```

## 通用枚举

### 枚举类型处理
```java
@EnumValue
@Getter
public enum UserStatus {
    NORMAL("0", "正常"),
    DISABLED("1", "停用");
    
    private final String code;
    private final String desc;
}

@Data
public class User {
    private UserStatus status;  // 自动转换
}
```

## 常用注解

| 注解 | 说明 |
|------|------|
| `@TableName` | 表名注解 |
| `@TableId` | 主键注解 |
| `@TableField` | 字段注解 |
| `@TableLogic` | 逻辑删除 |
| `@Version` | 乐观锁 |
| `@EnumValue` | 枚举值 |
| `@SqlParser(filter = true)` | 忽略 SQL 解析 |

## 性能优化

### 避免 N+1 问题
```java
// ❌ 错误：循环查询
for (User user : userList) {
    Dept dept = deptMapper.selectById(user.getDeptId());
}

// ✅ 正确：批量查询
List<Long> deptIds = userList.stream()
    .map(User::getDeptId)
    .collect(Collectors.toList());
List<Dept> depts = deptMapper.selectBatchIds(deptIds);
```

### 选择性查询字段
```java
// 只查询需要的字段
List<User> list = lambdaQuery()
    .select(User::getId, User::getUserName, User::getNickName)
    .eq(User::getDeptId, deptId)
    .list();
```

### 使用缓存
```java
@Cacheable(value = "user", key = "#id")
public User getById(Long id) {
    return this.getById(id);
}
```

## 检查清单

- [ ] 实体类注解是否完整
- [ ] 主键策略是否正确
- [ ] Wrapper 是否使用 Lambda 形式
- [ ] 分页是否配置插件
- [ ] 逻辑删除是否生效
- [ ] 是否避免 N+1 查询
- [ ] 批量操作是否使用事务
- [ ] 敏感字段是否脱敏
