# RuoYi 开发规范技能 (RuoYi Development Standards)

## 适用场景
- RuoYi-Vue-Plus 项目开发
- RuoYi-Vue-Pro 项目开发
- 若依框架二次开发
- 企业级后台管理系统

## 框架版本识别

### RuoYi 主要分支
| 版本 | 基础框架 | JDK | 特点 |
|------|----------|-----|------|
| RuoYi-Vue | Spring Boot 3.x | 17+ | 官方默认版本 |
| RuoYi-Vue-Plus | Spring Boot 3.5.x | 17+ | 集成 MyBatis-Plus、多租户、Sa-Token |
| RuoYi-Vue-Pro | Spring Boot 3.x | 17+ | 芋道源码，功能最全 |
| RuoYi-Cloud-Plus | Spring Cloud | 17+ | 微服务版本 |

## 项目结构规范

### 标准模块划分
```
RuoYi-Vue-Plus/
├── ruoyi-admin/          # 启动模块 (Undertow + HikariCP)
├── ruoyi-common/         # 通用模块 (24个: core/mybatis/redis/satoken...)
├── ruoyi-modules/        # 业务模块 (system/generator/workflow/demo/job)
├── ruoyi-extend/         # 扩展模块 (monitor-admin/snailjob-server)
└── script/               # SQL 脚本 & Shell 脚本
```

### 业务模块结构
```
[business-module]/
├── controller/           # 控制器层
├── service/              # 服务层
│   └── impl/            # 服务实现
├── mapper/              # 数据访问层
├── domain/              # 实体类
├── dto/                 # 数据传输对象
└── vo/                  # 视图对象
```

## 数据库规范

### 表命名规范
```sql
-- 系统表前缀
sys_user         -- 用户表
sys_role         -- 角色表
sys_menu         -- 菜单表

-- 业务表前缀 (按模块)
biz_order        -- 业务订单表
prod_product     -- 产品表

-- 关联表
sys_user_role    -- 用户角色关联表
```

### 字段命名规范
```sql
-- 主键
user_id          -- 表名_主键字段

-- 通用字段
create_time      -- 创建时间
update_time      -- 更新时间
create_by        -- 创建人
update_by        -- 更新人
del_flag         -- 删除标志 (0 正常 1 删除)
remark           -- 备注
```

### 建表模板
```sql
CREATE TABLE `sys_user` (
  `user_id` bigint NOT NULL COMMENT '用户 ID',
  `dept_id` bigint DEFAULT NULL COMMENT '部门 ID',
  `user_name` varchar(30) NOT NULL COMMENT '用户账号',
  `nick_name` varchar(30) NOT NULL COMMENT '用户昵称',
  `password` varchar(100) DEFAULT '' COMMENT '密码',
  `status` char(1) DEFAULT '0' COMMENT '帐号状态（0 正常 1 停用）',
  `del_flag` tinyint DEFAULT '0' COMMENT '删除标志（0 代表存在 1 代表删除）',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`user_id`),
  KEY `idx_dept` (`dept_id`),
  KEY `idx_user_name` (`user_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户信息表';
```

## 实体类规范

### 基础实体类
```java
@Data
@TableName("sys_user")
public class SysUser extends BaseEntity {
    
    private static final long serialVersionUID = 1L;

    @TableId(value = "user_id", type = IdType.ASSIGN_ID)
    private Long userId;

    @TableField("dept_id")
    private Long deptId;

    @TableField("user_name")
    private String userName;

    @TableField("nick_name")
    private String nickName;

    @TableField("password")
    private String password;

    @TableField("status")
    private String status;
}
```

### BaseEntity 基类
```java
@Data
public class BaseEntity implements Serializable {
    
    private static final long serialVersionUID = 1L;

    @TableField(fill = FieldFill.INSERT)
    private Date createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Date updateTime;

    @TableField(fill = FieldFill.INSERT)
    private Long createBy;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Long updateBy;

    @TableLogic
    @TableField(fill = FieldFill.INSERT)
    private Integer delFlag;
}
```

## Controller 规范

### 标准 Controller 模板
```java
@RestController
@RequestMapping("/system/user")
@RequiredArgsConstructor
public class SysUserController {

    private final ISysUserService userService;

    /**
     * 查询用户列表
     */
    @SaCheckPermission("system:user:list")
    @GetMapping("/list")
    public R<PageResult<UserVO>> list(PageQuery query) {
        return R.ok(userService.pageList(query));
    }

    /**
     * 查询用户详情
     */
    @SaCheckPermission("system:user:query")
    @GetMapping("/{userId}")
    public R<UserVO> getById(@PathVariable Long userId) {
        return R.ok(userService.getById(userId));
    }

    /**
     * 新增用户
     */
    @SaCheckPermission("system:user:add")
    @PostMapping
    public R<Void> add(@Valid @RequestBody UserDTO dto) {
        userService.add(dto);
        return R.ok();
    }

    /**
     * 修改用户
     */
    @SaCheckPermission("system:user:edit")
    @PutMapping("/{userId}")
    public R<Void> edit(@PathVariable Long userId, 
                        @Valid @RequestBody UserDTO dto) {
        userService.update(userId, dto);
        return R.ok();
    }

    /**
     * 删除用户
     */
    @SaCheckPermission("system:user:remove")
    @DeleteMapping("/{userIds}")
    public R<Void> remove(@PathVariable List<Long> userIds) {
        userService.remove(userIds);
        return R.ok();
    }

    /**
     * 导出用户
     */
    @SaCheckPermission("system:user:export")
    @PostMapping("/export")
    public void export(@RequestBody UserDTO dto, HttpServletResponse response) {
        userService.export(dto, response);
    }
}
```

### 权限注解使用
```java
// 单权限控制
@SaCheckPermission("system:user:add")
@PostMapping

// 多权限（满足其一即可）
@SaCheckPermission(value = {"system:user:add", "system:user:edit"}, logical = Logical.OR)
@PostMapping

// 角色控制
@SaCheckRole("admin")
@PostMapping
```

## Service 规范

### Service 接口
```java
public interface ISysUserService {
    
    /**
     * 查询用户分页列表
     */
    PageResult<UserVO> pageList(PageQuery query);
    
    /**
     * 查询用户详情
     */
    UserVO getById(Long userId);
    
    /**
     * 新增用户
     */
    void add(UserDTO dto);
    
    /**
     * 修改用户
     */
    void update(Long userId, UserDTO dto);
    
    /**
     * 删除用户
     */
    void remove(List<Long> userIds);
}
```

### Service 实现
```java
@Service
@RequiredArgsConstructor
public class SysUserServiceImpl implements ISysUserService {

    private final SysUserMapper userMapper;
    
    @Override
    public PageResult<UserVO> pageList(PageQuery query) {
        Page<User> page = userMapper.selectPage(query.toPage(), query.toWrapper());
        List<UserVO> voList = MapstructUtils.convert(page.getRecords(), UserVO.class);
        return PageResult.of(voList, page.getTotal());
    }
    
    @Override
    public UserVO getById(Long userId) {
        User user = userMapper.selectById(userId);
        return MapstructUtils.convert(user, UserVO.class);
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void add(UserDTO dto) {
        // 检查用户名是否存在
        long count = userMapper.selectCount(new LambdaQueryWrapper<User>()
            .eq(User::getUserName, dto.getUserName()));
        if (count > 0) {
            throw new BusinessException("用户名已存在");
        }
        
        // 密码加密
        dto.setPassword(SecureUtils.encrypt(dto.getPassword()));
        
        User user = MapstructUtils.convert(dto, User.class);
        userMapper.insert(user);
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(Long userId, UserDTO dto) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        
        MapstructUtils.copy(dto, user);
        userMapper.updateById(user);
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void remove(List<Long> userIds) {
        userMapper.deleteBatchIds(userIds);
    }
}
```

## 对象转换规范

### DTO 定义
```java
@Data
public class UserDTO {
    
    @NotBlank(message = "用户名不能为空")
    private String userName;
    
    @NotBlank(message = "密码不能为空")
    private String password;
    
    private String nickName;
    
    private Long deptId;
}
```

### VO 定义
```java
@Data
public class UserVO {
    
    private Long userId;
    
    private String userName;
    
    private String nickName;
    
    private DeptVO dept;
    
    private List<RoleVO> roles;
}
```

### Mapstruct 转换
```java
@Mapper
public interface UserConvert {
    
    UserConvert INSTANCE = Mappers.getMapper(UserConvert.class);
    
    User toEntity(UserDTO dto);
    
    UserVO toVO(User user);
    
    @Mapping(target = "deptName", source = "dept.deptName")
    UserVO toVOWithDept(User user);
}
```

## 常用工具类

### SecureUtils - 安全工具
```java
// 密码加密
String encrypted = SecureUtils.encrypt(password);

// 密码匹配
boolean match = SecureUtils.matches(rawPassword, encrypted);

// 生成随机字符串
String token = SecureUtils.randomToken();
```

### MapstructUtils - 对象转换
```java
// 简单转换
UserVO vo = MapstructUtils.convert(user, UserVO.class);

// 列表转换
List<UserVO> voList = MapstructUtils.convert(users, UserVO.class);

// 指定映射
UserVO vo = MapstructUtils.convert(user, UserVO.class, 
    mapping -> mapping.with("deptName", user.getDept().getDeptName()));
```

### StringUtils - 字符串工具
```java
// 判断是否为空
boolean isEmpty = StringUtils.isEmpty(str);
boolean isNotEmpty = StringUtils.isNotEmpty(str);

// 首字母大写
String capitalized = StringUtils.capitalize(str);

// 驼峰转下划线
String snakeCase = StringUtils.toUnderScore("userName");
```

## 配置文件规范

### application.yml 模板
```yaml
# 项目配置
ruoyi:
  name: RuoYi
  version: 5.6.1
  copyrightYear: 2026

# 服务器配置 (Undertow)
server:
  port: 8080
  servlet:
    context-path: /
  undertow:
    max-http-post-size: 1GB
    buffer-size: 512
    threads:
      io: 8
      worker: 256

# 数据源配置 (HikariCP + dynamic-datasource)
spring:
  datasource:
    type: com.zaxxer.hikari.HikariDataSource
    dynamic:
      primary: master
      strict: true
      datasource:
        master:
          type: ${spring.datasource.type}
          driverClassName: com.mysql.cj.jdbc.Driver
          url: jdbc:mysql://localhost:3306/ry-vue?useUnicode=true&characterEncoding=utf8&zeroDateTimeBehavior=convertToNull&useSSL=true&serverTimezone=GMT%2B8&autoReconnect=true&rewriteBatchedStatements=true&allowPublicKeyRetrieval=true&nullCatalogMeansCurrent=true
          username: root
          password: root
      hikari:
        maxPoolSize: 20
        minIdle: 10
        connectionTimeout: 30000
        validationTimeout: 5000
        idleTimeout: 600000
        maxLifetime: 1800000

# Redis 配置
  data:
    redis:
      host: localhost
      port: 6379
      database: 0
      password: ruoyi123
      timeout: 10s

# Redisson 配置
redisson:
  keyPrefix:
  threads: 4
  nettyThreads: 8
  singleServerConfig:
    clientName: RuoYi-Vue-Plus
    connectionMinimumIdleSize: 8
    connectionPoolSize: 32
    idleConnectionTimeout: 10000
    timeout: 3000

# MyBatis 配置
mybatis-plus:
  typeAliasesPackage: org.dromara.**.domain
  mapperLocations: classpath*:mapper/**/*Mapper.xml
  configLocation: classpath:mybatis/mybatis-config.xml
```

## 开发检查清单

### 开发前
- [ ] 数据库表设计完成
- [ ] 实体类创建完成
- [ ] DTO/VO 定义完成
- [ ] 菜单权限配置申请

### 开发中
- [ ] Controller 权限注解添加
- [ ] Service 事务注解添加
- [ ] 参数校验添加
- [ ] 异常处理完善
- [ ] 日志记录添加

### 开发后
- [ ] 单元测试编写
- [ ] 代码规范检查
- [ ] 接口文档完善
- [ ] 自测通过

## 常见问题

### Q1: 如何选择 RuoYi 版本？
- 简单项目：RuoYi-Vue (官方版本)
- 企业项目：RuoYi-Vue-Plus (功能增强)
- 复杂项目：RuoYi-Vue-Pro (功能最全)
- 微服务：RuoYi-Cloud-Plus

### Q2: 主键策略如何选择？
- 推荐使用雪花 ID (IdType.ASSIGN_ID)
- 自增 ID 仅用于特殊场景

### Q3: 如何处理多租户？
- 实体继承 TenantEntity
- 自动填充租户 ID
- 查询自动添加租户条件
