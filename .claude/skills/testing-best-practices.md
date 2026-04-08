# 测试开发技能 (Testing Best Practices)

## 适用场景
- 单元测试编写
- 集成测试开发
- E2E 测试设计
- 测试覆盖率提升

## 核心技术栈

### 后端测试
- **JUnit 5** - Java 单元测试框架
- **Mockito** - Mock 框架
- **AssertJ** - 流式断言库
- **Testcontainers** - 集成测试容器

### 前端测试
- **Vitest** - Vue 3 单元测试 (推荐)
- **Jest** - 传统测试框架
- **Vue Test Utils** - Vue 组件测试
- **Playwright** - E2E 测试

## 后端测试规范

### 1. 单元测试结构
```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserMapper userMapper;
    
    @InjectMocks
    private UserServiceImpl userService;
    
    @Test
    @DisplayName("创建用户 - 成功场景")
    void testCreateUser_Success() {
        // Given
        CreateUserDTO dto = new CreateUserDTO();
        dto.setUsername("test");
        dto.setPassword("password123");
        
        User savedUser = new User();
        savedUser.setId(1L);
        savedUser.setUsername("test");
        
        when(userMapper.selectByUsername(dto.getUsername())).thenReturn(null);
        when(userMapper.insert(any(User.class))).thenReturn(1);
        
        // When
        UserVO result = userService.createUser(dto);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getUsername()).isEqualTo("test");
    }
    
    @Test
    @DisplayName("创建用户 - 用户名已存在")
    void testCreateUser_UsernameExists() {
        // Given
        CreateUserDTO dto = new CreateUserDTO();
        dto.setUsername("existing");
        
        User existingUser = new User();
        existingUser.setId(1L);
        existingUser.setUsername("existing");
        
        when(userMapper.selectByUsername(dto.getUsername())).thenReturn(existingUser);
        
        // When & Then
        assertThatThrownBy(() -> userService.createUser(dto))
            .isInstanceOf(BusinessException.class)
            .hasMessageContaining("用户名已存在");
    }
}
```

### 2. 集成测试
```java
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class UserControllerIntegrationTest {

    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("test_db")
            .withUsername("test")
            .withPassword("test");
    
    @DynamicPropertySource
    static void configureDatasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
    }
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Test
    void testCreateUser() throws Exception {
        CreateUserDTO dto = new CreateUserDTO();
        dto.setUsername("test");
        dto.setPassword("password123");
        
        mockMvc.perform(post("/api/v1/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data").isNumber());
    }
}
```

### 3. 测试覆盖率达到标
```java
// 单元测试覆盖率要求
// - 行覆盖率：≥ 80%
// - 分支覆盖率：≥ 70%
// - 核心业务：100%

// pom.xml 配置
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
    </executions>
    <configuration>
        <rules>
            <rule>
                <element>BUNDLE</element>
                <limits>
                    <limit>
                        <counter>LINE</counter>
                        <value>COVEREDRATIO</value>
                        <minimum>0.80</minimum>
                    </limit>
                </limits>
            </rule>
        </rules>
    </configuration>
</plugin>
```

## 前端测试规范

### 1. Vue 组件测试 (Vitest)
```typescript
// UserProfile.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UserProfile from './UserProfile.vue'
import { createPinia, setActivePinia } from 'pinia'

describe('UserProfile', () => {
  it('renders user name correctly', () => {
    const wrapper = mount(UserProfile, {
      props: {
        userId: 1
      },
      global: {
        stubs: {
          RouterLink: true
        }
      }
    })
    
    expect(wrapper.text()).toContain('User Name')
  })

  it('emits update event on save', async () => {
    const wrapper = mount(UserProfile, {
      props: {
        userId: 1
      }
    })
    
    await wrapper.find('button').trigger('click')
    
    expect(wrapper.emitted('update')).toBeTruthy()
  })

  it('shows error when validation fails', async () => {
    const wrapper = mount(UserProfile, {
      props: {
        userId: 1
      }
    })
    
    // 清空输入
    await wrapper.find('input').setValue('')
    await wrapper.find('form').trigger('submit.prevent')
    
    expect(wrapper.text()).toContain('用户名不能为空')
  })
})
```

### 2. Pinia Store 测试
```typescript
// userStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'

describe('UserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default state', () => {
    const store = useUserStore()
    expect(store.user).toBeNull()
    expect(store.token).toBeNull()
    expect(store.isLoggedIn).toBe(false)
  })

  it('sets user after login', async () => {
    const store = useUserStore()
    const mockUser = { id: 1, name: 'Test User' }
    const mockToken = 'test-token'
    
    // Mock API call
    vi.spyOn(api, 'login').mockResolvedValue({ user: mockUser, token: mockToken })
    
    await store.login({ username: 'test', password: 'password' })
    
    expect(store.user).toEqual(mockUser)
    expect(store.token).toBe(mockToken)
    expect(store.isLoggedIn).toBe(true)
  })

  it('clears state after logout', () => {
    const store = useUserStore()
    store.$patch({
      user: { id: 1, name: 'Test' },
      token: 'test-token'
    })
    
    store.logout()
    
    expect(store.user).toBeNull()
    expect(store.token).toBeNull()
    expect(store.isLoggedIn).toBe(false)
  })
})
```

### 3. E2E 测试 (Playwright)
```typescript
// login.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('http://localhost:8080/login')
    
    // 输入用户名和密码
    await page.fill('input[name="username"]', 'admin')
    await page.fill('input[name="password"]', 'admin123')
    
    // 点击登录按钮
    await page.click('button[type="submit"]')
    
    // 验证跳转到首页
    await expect(page).toHaveURL('http://localhost:8080/index')
    
    // 验证显示用户名
    await expect(page.locator('.user-name')).toHaveText('管理员')
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:8080/login')
    
    await page.fill('input[name="username"]', 'invalid')
    await page.fill('input[name="password"]', 'wrong')
    await page.click('button[type="submit"]')
    
    // 验证错误提示
    await expect(page.locator('.error-message'))
      .toHaveText('用户名或密码错误')
  })

  test('should validate form before submit', async ({ page }) => {
    await page.goto('http://localhost:8080/login')
    
    // 不输入直接提交
    await page.click('button[type="submit"]')
    
    // 验证必填提示
    await expect(page.locator('.validation-error')).toBeVisible()
  })
})
```

### 4. Playwright 配置
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['junit', { outputFile: 'results.xml' }]],
  
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
})
```

## 测试最佳实践

### 1. 测试命名规范
```java
// 推荐：方法_场景_预期
@Test
void createUser_usernameExists_throwsBusinessException()

// 推荐：使用@DisplayName
@Test
@DisplayName("创建用户 - 用户名已存在时抛出异常")
void testCreateUserWithExistingUsername()
```

### 2. AAA 模式 (Arrange-Act-Assert)
```java
@Test
void testCalculateTotal() {
    // Arrange (准备)
    ShoppingCart cart = new ShoppingCart();
    cart.addItem(new Item("Book", 29.99, 2));
    
    // Act (执行)
    BigDecimal total = cart.calculateTotal();
    
    // Assert (断言)
    assertEquals(new BigDecimal("59.98"), total);
}
```

### 3. 测试数据工厂
```java
// 使用工厂方法创建测试数据
public class UserFactory {
    public static User createUser() {
        User user = new User();
        user.setUsername("test" + System.currentTimeMillis());
        user.setPassword("password123");
        user.setEmail("test@example.com");
        return user;
    }
    
    public static User createAdminUser() {
        User user = createUser();
        user.setRole("admin");
        return user;
    }
}

// 测试中使用
@Test
void testUserCreation() {
    User user = UserFactory.createUser();
    // ...
}
```

## 测试检查清单

### 单元测试
- [ ] 测试命名清晰表达意图
- [ ] 遵循 AAA 模式
- [ ] 每次测试只验证一个行为
- [ ] 使用有意义的断言
- [ ] Mock 外部依赖

### 集成测试
- [ ] 使用测试容器
- [ ] 数据隔离
- [ ] 清理测试数据
- [ ] 验证端到端流程

### E2E 测试
- [ ] 覆盖关键用户流程
- [ ] 包含错误场景
- [ ] 截图/录像失败用例
- [ ] 合理设置超时时间

## 常见测试陷阱

### 1. 过度 Mock
```java
// ❌ 不推荐：Mock 太多，测试失去意义
@Mock
private ServiceA serviceA;
@Mock
private ServiceB serviceB;
@Mock
private ServiceC serviceC;

// ✅ 推荐：只 Mock 外部依赖和数据库
@Mock
private UserMapper userMapper;
```

### 2. 断言不完整
```java
// ❌ 不推荐：只验证不为空
assertNotNull(result);

// ✅ 推荐：验证所有关键字段
assertNotNull(result);
assertEquals(expectedId, result.getId());
assertEquals(expectedName, result.getName());
```

### 3. 测试依赖
```java
// ❌ 不推荐：测试之间有依赖
@Test
void test1() { /* 创建数据 */ }

@Test  
void test2() { /* 依赖 test1 的数据 */ }

// ✅ 推荐：每个测试独立
@Test
void testCreate() { /* 自包含 */ }

@Test
void testUpdate() { /* 自己创建数据 */ }
```
