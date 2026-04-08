# 代码审查技能 (Code Review)

## 适用场景
- 代码提交前审查
- Pull Request 审查
- 代码质量检查
- 规范符合性验证

## 审查维度

### 1. 代码规范审查

#### Java 代码规范
- [ ] 命名规范（类名、方法名、变量名）
- [ ] 代码格式化（缩进、空格、空行）
- [ ] 注释完整性（类注释、方法注释、关键逻辑注释）
- [ ] 导入语句规范（避免通配符导入）
- [ ] 代码行长度（建议不超过 120 字符）

#### Vue 代码规范
- [ ] 组件命名 PascalCase
- [ ] Props 类型定义完整
- [ ] v-if 与 v-for 不一起使用
- [ ] 组件通信方式正确
- [ ] 响应式数据使用正确

### 2. 架构规范审查

#### 三层架构检查
```java
// ✅ 正确：依赖方向正确
@Controller → @Service → @Mapper

// ❌ 错误：循环依赖或反向依赖
@Controller → @Mapper (跳过 Service)
@Mapper → @Service (反向依赖)
```

#### 包依赖检查
- [ ] 不允许循环依赖
- [ ] 底层模块不依赖上层模块
- [ ] 通用模块不依赖业务模块

### 3. 安全性审查

#### SQL 注入防护
```java
// ❌ 危险：字符串拼接 SQL
String sql = "SELECT * FROM user WHERE name = '" + userName + "'";

// ✅ 安全：使用参数化查询
@Select("SELECT * FROM user WHERE name = #{userName}")
List<User> selectByName(String userName);
```

#### XSS 防护
```java
// ✅ 使用 @SaCheckPermission 权限控制
@SaCheckPermission("system:user:add")
@PostMapping
public R<Void> add(@RequestBody User user) { }

// ✅ 输入参数校验
@PostMapping
public R<Void> add(@Valid @RequestBody UserDTO dto) { }
```

#### 敏感数据处理
- [ ] 密码是否加密存储（BCrypt）
- [ ] 敏感信息是否脱敏输出
- [ ] Token/密钥是否硬编码

### 4. 性能审查

#### 数据库操作
```java
// ❌ 问题：循环中查询数据库
for (User user : userList) {
    Dept dept = deptMapper.selectById(user.getDeptId()); // N+1 问题
}

// ✅ 优化：批量查询后内存匹配
List<Long> deptIds = userList.stream().map(User::getDeptId).collect(Collectors.toList());
List<Dept> depts = deptMapper.selectBatchIds(deptIds);
```

#### 缓存使用
```java
// ✅ 热点数据使用缓存
@Cacheable(value = "dict", key = "#type")
public List<DictData> getDictByType(String type) {
    return dictMapper.selectByType(type);
}
```

#### 资源管理
- [ ] 流是否正确关闭（使用 try-with-resources）
- [ ] 数据库连接是否及时释放
- [ ] 大对象是否及时回收

### 5. 异常处理审查

#### 异常捕获规范
```java
// ❌ 不推荐：捕获过于宽泛的异常
try {
    // 业务逻辑
} catch (Exception e) {
    e.printStackTrace();
}

// ✅ 推荐：捕获具体异常并处理
try {
    // 业务逻辑
} catch (BusinessException e) {
    log.warn("业务异常：{}", e.getMessage());
    throw e;
} catch (DataAccessException e) {
    log.error("数据库异常", e);
    throw new ServiceException("数据操作失败");
}
```

#### 事务处理
```java
// ✅ 正确：事务注解使用
@Transactional(rollbackFor = Exception.class)
public void createOrder(Order order) {
    // 业务逻辑
}

// ❌ 问题：事务范围过大
@Transactional
public void batchProcess() {  // 应该拆分事务
    for (int i = 0; i < 1000; i++) {
        processItem(i);
    }
}
```

### 6. 日志规范审查

```java
// ❌ 不推荐：日志级别不当
log.info("系统异常：" + e.getMessage(), e);  // 异常应该用 error

// ✅ 推荐：正确的日志级别和格式
log.error("订单创建失败，orderId={}", order.getId(), e);

// ✅ 推荐：使用占位符避免字符串拼接
log.debug("用户信息：userId={}, name={}", user.getId(), user.getName());
```

## RuoYi-Vue-Plus 特定检查项

### 1. 包名规范
- [ ] 必须以 `org.dromara` 或 `com.ruoyi` 开头
- [ ] 包名层次清晰

### 2. 实体类规范
- [ ] 继承正确的基类（TenantEntity/BaseEntity）
- [ ] 主键使用雪花 ID 策略
- [ ] 时间字段使用自动填充注解
- [ ] 逻辑删除字段配置正确

### 3. API 规范
- [ ] RESTful 路径设计
- [ ] 权限注解 `@SaCheckPermission` 使用
- [ ] 统一响应格式 `R<T>`
- [ ] 参数校验注解 `@Valid`

### 4. 对象转换
- [ ] 使用 `MapstructUtils` 进行转换
- [ ] 避免手动逐个字段赋值

## 代码审查清单模板

### 提交前自查
```markdown
## 代码审查清单

### 功能完整性
- [ ] 需求功能全部实现
- [ ] 边界条件处理
- [ ] 异常情况处理

### 代码质量
- [ ] 无重复代码
- [ ] 方法职责单一
- [ ] 代码可读性好

### 安全性
- [ ] 权限控制完整
- [ ] 输入校验充分
- [ ] 无 SQL 注入风险

### 性能
- [ ] 无 N+1 查询
- [ ] 合理使用缓存
- [ ] 资源正确释放

### 测试
- [ ] 单元测试通过
- [ ] 关键逻辑有测试覆盖
```

## 常见问题及修复建议

| 问题类型 | 描述 | 修复建议 |
|----------|------|----------|
| N+1 查询 | 循环中执行数据库查询 | 改为批量查询后内存处理 |
| 事务过大 | 单个事务包含过多操作 | 拆分事务或使用编程式事务 |
| 缓存滥用 | 不适合缓存的数据使用缓存 | 评估数据特点，合理设置 TTL |
| 异常吞没 | 捕获异常后不处理 | 记录日志并重新抛出或返回错误 |
| 资源泄漏 | 未关闭流或连接 | 使用 try-with-resources |
| 硬编码 | 配置项写死在代码中 | 抽取到配置文件 |

## 审查报告格式

```markdown
## 代码审查报告

### 审查信息
- 审查人：[姓名]
- 审查日期：[日期]
- 审查范围：[文件/模块列表]

### 发现的问题

#### 🔴 严重问题 (必须修复)
1. [问题描述] - [文件：行号]
   - 建议：[修复建议]

#### 🟡 警告 (建议修复)
1. [问题描述] - [文件：行号]
   - 建议：[修复建议]

#### 🟢 建议 (可选优化)
1. [优化建议] - [文件：行号]

### 总体评价
- 代码质量：[评分]
- 规范性：[评分]
- 可维护性：[评分]

### 审查结论
[ ] 通过，可以合并
[ ] 需要修改后重新审查
[ ] 不通过，需要重大修改
```
