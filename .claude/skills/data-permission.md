# Data Permission - 数据权限设计

## 职责范围

规范 RuoYi-Vue-Plus 项目中的数据权限设计，包括 `@DataScope` 注解使用、数据范围配置、SQL 拦截器实现等。

---

## 核心规范

### 1. 数据权限范围

#### 1.1 数据范围枚举

```java
public enum DataScope {
    /**
     * 全部数据权限
     */
    ALL("1", "全部数据"),

    /**
     * 自定数据权限（通过角色配置部门）
     */
    CUSTOM("2", "自定义数据权限"),

    /**
     * 本部门数据权限
     */
    DEPT("3", "本部门数据"),

    /**
     * 本部门及以下数据权限
     */
    DEPT_AND_CHILD("4", "本部门及以下数据"),

    /**
     * 仅本人数据权限
     */
    SELF("5", "仅本人数据");

    private final String code;
    private final String info;

    DataScope(String code, String info) {
        this.code = code;
        this.info = info;
    }
}
```

---

### 2. @DataScope 注解

#### 2.1 注解定义

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface DataScope {
    /**
     * 部门别名（用于 SQL JOIN）
     */
    String deptAlias() default "dept";

    /**
     * 用户别名（用于 SQL JOIN）
     */
    String userAlias() default "user";

    /**
     * 数据范围类型
     */
    String scopeType() default "";
}
```

#### 2.2 使用示例

```java
// 全部数据权限
@DataScope
public List<SysUser> selectUserList(SysUser user) {
    return baseMapper.selectUserList(user);
}

// 自定义部门别名
@DataScope(deptAlias = "d", userAlias = "u")
public List<SysUser> selectUserList(SysUser user) {
    return baseMapper.selectUserList(user);
}

// 仅本人数据
@DataScope(scopedScope = DataScope.SELF)
public List<SysUser> selectMyUsers(SysUser user) {
    return baseMapper.selectList(user);
}
```

---

### 3. SQL 拦截器实现

```java
@Component
public class DataScopeInterceptor implements Interceptor {

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        Statement stmt = (Statement) invocation.getArgs()[0];
        MappedStatement mappedStatement = (MappedStatement) invocation.getArgs()[0];
        
        // 获取方法上的@DataScope 注解
        Method method = getMethod(mappedStatement);
        if (method == null) {
            return invocation.proceed();
        }

        DataScope dataScope = method.getAnnotation(DataScope.class);
        if (dataScope == null) {
            return invocation.proceed();
        }

        // 获取当前用户的数据范围
        LoginUser user = SecurityUtils.getLoginUser();
        if (user == null || user.getSysUser() == null) {
            return invocation.proceed();
        }

        // 构建数据权限 SQL
        String dataScopeSql = getDataScopeSql(user, dataScope);
        if (StringUtils.isNotEmpty(dataScopeSql)) {
            // 追加到原有 SQL
            String originalSql = ((BoundSql) invocation.getArgs()[0]).getSql();
            String newSql = originalSql + " " + dataScopeSql;
            // 替换 SQL
            ReflectUtil.setFieldValue(((BoundSql) invocation.getArgs()[0]), "sql", newSql);
        }

        return invocation.proceed();
    }

    /**
     * 获取数据范围 SQL
     */
    private String getDataScopeSql(LoginUser user, DataScope dataScope) {
        SysUser sysUser = user.getSysUser();
        
        // 超级管理员拥有全部数据权限
        if (SysUser.ADMIN.equals(sysUser.getUserId())) {
            return "";
        }

        StringBuilder sql = new StringBuilder();
        
        // 获取用户的所有角色
        List<SysRole> roles = sysUser.getRoles();
        if (CollectionUtils.isEmpty(roles)) {
            // 无角色，仅本人数据
            sql.append(" AND ").append(dataScope.userAlias()).append(".user_id = ").append(sysUser.getUserId());
            return sql.toString();
        }

        boolean hasAll = false;
        boolean hasCustom = false;
        boolean hasDept = false;
        boolean hasDeptAndChild = false;
        boolean hasSelf = false;

        Set<Long> customDeptIds = new HashSet<>();

        for (SysRole role : roles) {
            String scope = role.getDataScope();
            switch (scope) {
                case "1":  // 全部数据
                    hasAll = true;
                    break;
                case "2":  // 自定义数据
                    hasCustom = true;
                    // 获取角色关联的部门
                    List<Long> deptIds = roleMapper.selectDeptListByRoleId(role.getRoleId());
                    customDeptIds.addAll(deptIds);
                    break;
                case "3":  // 本部门数据
                    hasDept = true;
                    break;
                case "4":  // 本部门及以下
                    hasDeptAndChild = true;
                    break;
                case "5":  // 仅本人数据
                    hasSelf = true;
                    break;
            }
        }

        // 按优先级构建 SQL
        if (hasAll) {
            return "";  // 全部数据，不追加条件
        }

        if (hasDeptAndChild) {
            // 本部门及以下（优先级高于本部门）
            sql.append(" AND (");
            sql.append(dataScope.deptAlias()).append(".ancestors LIKE '%")
               .append(sysUser.getDeptId()).append("%'");
            sql.append(" OR ").append(dataScope.deptAlias()).append(".dept_id = ")
               .append(sysUser.getDeptId());
            sql.append(")");
            return sql.toString();
        }

        if (hasDept) {
            // 本部门数据
            sql.append(" AND ").append(dataScope.deptAlias()).append(".dept_id = ")
               .append(sysUser.getDeptId());
            return sql.toString();
        }

        if (hasCustom) {
            // 自定义数据
            if (!customDeptIds.isEmpty()) {
                sql.append(" AND ").append(dataScope.deptAlias()).append(".dept_id IN (");
                sql.append(customDeptIds.stream().map(String::valueOf)
                       .collect(Collectors.joining(",")));
                sql.append(")");
            } else {
                // 自定义但无部门，仅本人
                sql.append(" AND ").append(dataScope.userAlias()).append(".user_id = ")
                   .append(sysUser.getUserId());
            }
            return sql.toString();
        }

        if (hasSelf) {
            // 仅本人数据
            sql.append(" AND ").append(dataScope.userAlias()).append(".user_id = ")
               .append(sysUser.getUserId());
            return sql.toString();
        }

        // 默认仅本人
        sql.append(" AND ").append(dataScope.userAlias()).append(".user_id = ")
           .append(sysUser.getUserId());
        return sql.toString();
    }
}
```

---

### 4. Mapper XML 配置

```xml
<!-- SysUserMapper.xml -->
<mapper namespace="org.dromara.system.mapper.SysUserMapper">

    <!-- 用户列表查询（自动数据权限） -->
    <select id="selectUserList" parameterType="org.dromara.system.domain.SysUser" resultMap="SysUserResult">
        SELECT u.user_id, u.dept_id, u.login_name, u.user_name, u.email, u.phonenumber, u.status,
               d.dept_id, d.dept_name, d.parent_id, d.ancestors
        FROM sys_user u
        LEFT JOIN sys_dept d ON u.dept_id = d.dept_id
        WHERE u.del_flag = '0'
        <!-- 数据权限条件由拦截器自动追加 -->
        <if test="userName != null and userName != ''">
            AND u.user_name LIKE CONCAT('%', #{userName}, '%')
        </if>
        <if test="status != null and status != ''">
            AND u.status = #{status}
        </if>
        <if test="deptId != null">
            AND (d.dept_id = #{deptId} OR d.ancestors LIKE CONCAT('%', #{deptId}, '%'))
        </if>
    </select>

</mapper>
```

---

### 5. 角色数据权限配置

```java
@Service
public class SysRoleService {

    /**
     * 新增角色并配置数据权限
     */
    @Transactional
    public int insertRole(SysRole role) {
        // 插入角色
        int rows = roleMapper.insert(role);
        
        // 插入角色 - 部门关联
        if (role.getDataScope().equals("2") && role.getDeptIds() != null) {
            for (Long deptId : role.getDeptIds()) {
                SysRoleDept rd = new SysRoleDept();
                rd.setRoleId(role.getRoleId());
                rd.setDeptId(deptId);
                roleDeptMapper.insert(rd);
            }
        }
        
        return rows;
    }

    /**
     * 修改角色数据权限
     */
    @Transactional
    public int updateRole(SysRole role) {
        // 删除原有的角色 - 部门关联
        roleDeptMapper.deleteByRoleId(role.getRoleId());
        
        // 重新插入
        if (role.getDataScope().equals("2") && role.getDeptIds() != null) {
            for (Long deptId : role.getDeptIds()) {
                SysRoleDept rd = new SysRoleDept();
                rd.setRoleId(role.getRoleId());
                rd.setDeptId(deptId);
                roleDeptMapper.insert(rd);
            }
        }
        
        return roleMapper.updateById(role);
    }
}
```

---

### 6. 数据权限测试

```java
@SpringBootTest
public class DataScopeTest {

    @Autowired
    private SysUserMapper userMapper;

    @Test
    public void testAllDataScope() {
        // 模拟超级管理员
        SecurityUtils.loginAsAdmin();
        
        List<SysUser> users = userMapper.selectUserList(null);
        // 应该返回所有用户
        assertTrue(users.size() > 0);
    }

    @Test
    public void testSelfDataScope() {
        // 模拟普通用户（仅本人权限）
        LoginUser user = createTestUser(DataScope.SELF);
        SecurityUtils.loginAs(user);
        
        List<SysUser> users = userMapper.selectUserList(null);
        // 应该只返回自己
        assertEquals(1, users.size());
        assertEquals(user.getUserId(), users.get(0).getUserId());
    }

    @Test
    public void testDeptDataScope() {
        // 模拟部门用户
        LoginUser user = createTestUser(DataScope.DEPT);
        SecurityUtils.loginAs(user);
        
        List<SysUser> users = userMapper.selectUserList(null);
        // 应该返回本部门所有用户
        assertTrue(users.size() > 0);
        assertTrue(users.stream().allMatch(u -> 
            u.getDeptId().equals(user.getSysUser().getDeptId())
        ));
    }
}
```

---

## 数据权限优先级

```
全部数据 (1) > 自定义数据 (2) > 本部门及以下 (4) > 本部门 (3) > 仅本人 (5)

角色拥有的数据权限取优先级最高的：
- 角色 A: 仅本人 (5)
- 角色 B: 本部门 (3)
- 结果：本部门 (3)
```

---

## 常见错误

### 错误 1：忘记在 Mapper 中配置关联表

```xml
<!-- ❌ 错误：没有关联 sys_dept 表 -->
SELECT * FROM sys_user WHERE del_flag = '0'

<!-- ✅ 正确 -->
SELECT u.*, d.dept_name
FROM sys_user u
LEFT JOIN sys_dept d ON u.dept_id = d.dept_id
WHERE u.del_flag = '0'
```

### 错误 2：数据范围 SQL 未正确追加

```java
// ❌ 错误：直接在方法中写死条件
public List<SysUser> selectUserList() {
    return baseMapper.selectList(new QueryWrapper<SysUser>()
        .eq("user_id", SecurityUtils.getUserId()));  // 硬编码仅本人
}

// ✅ 正确：使用@DataScope 注解，由拦截器处理
@DataScope
public List<SysUser> selectUserList(SysUser user) {
    return baseMapper.selectUserList(user);
}
```

---

## 触发关键词

- 数据权限
- @DataScope
- 数据范围
- 角色权限
- 部门数据

---

## 相关文件

- [security-guard.md](./security-guard.md) - Sa-Token 认证授权
- [spring-security-guide.md](./spring-security-guide.md) - Spring Security 指南
- [backend-annotations.md](./backend-annotations.md) - 后端注解使用规范

---

*更新时间：2026-04-06*  
*RuoYi-Vue-Plus AI 开发助手*
