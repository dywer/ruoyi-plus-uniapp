# Store BC - Pinia 状态管理

## 职责范围

规范 RuoYi-Vue-Plus 项目中使用 Pinia 进行状态管理的最佳实践，包括 Store 定义、State、Getters、Actions 的使用规范。

---

## 核心规范

### 1. Store 定义规范

#### 1.1 Setup 风格定义（推荐）

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref<string>('')
  const userInfo = ref<UserInfo | null>(null)
  const roles = ref<string[]>([])
  const permissions = ref<string[]>([])

  // Getters
  const username = computed(() => userInfo.value?.username || '')
  const avatar = computed(() => userInfo.value?.avatar || '')
  const isLoggedIn = computed(() => !!token.value)
  const hasRoles = computed(() => roles.value.length > 0)

  // Actions
  async function login(username: string, password: string) {
    try {
      const response = await api.login({ username, password })
      token.value = response.token
      await fetchUserInfo()
      return response
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  async function fetchUserInfo() {
    const data = await api.getUserInfo()
    userInfo.value = data
    roles.value = data.roles || []
    permissions.value = data.permissions || []
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    roles.value = []
    permissions.value = []
  }

  function setToken(newToken: string) {
    token.value = newToken
  }

  // 重置 Store
  function $reset() {
    token.value = ''
    userInfo.value = null
    roles.value = []
    permissions.value = []
  }

  return {
    // State
    token,
    userInfo,
    roles,
    permissions,
    // Getters
    username,
    avatar,
    isLoggedIn,
    hasRoles,
    // Actions
    login,
    fetchUserInfo,
    logout,
    setToken,
    $reset
  }
})
```

#### 1.2 Options 风格定义

```typescript
// stores/app.ts
import { defineStore } from 'pinia'

interface AppState {
  sidebarOpened: boolean
  device: 'desktop' | 'mobile'
  theme: 'light' | 'dark'
  language: 'zh-cn' | 'en'
}

export const useAppStore = defineStore('app', {
  // State
  state: (): AppState => ({
    sidebarOpened: true,
    device: 'desktop',
    theme: 'light',
    language: 'zh-cn'
  }),

  // Getters
  getters: {
    sidebarStatus: (state) => state.sidebarOpened ? 'opened' : 'closed',
    isMobile: (state) => state.device === 'mobile',
    currentTheme: (state) => state.theme,
    isChinese: (state) => state.language === 'zh-cn'
  },

  // Actions
  actions: {
    toggleSidebar() {
      this.sidebarOpened = !this.sidebarOpened
    },

    setDevice(device: 'desktop' | 'mobile') {
      this.device = device
    },

    setTheme(theme: 'light' | 'dark') {
      this.theme = theme
    },

    setLanguage(lang: 'zh-cn' | 'en') {
      this.language = lang
    },

    // 重置状态
    $reset() {
      this.$patch({
        sidebarOpened: true,
        device: 'desktop',
        theme: 'light',
        language: 'zh-cn'
      })
    }
  }
})
```

---

### 2. State 规范

#### 2.1 基本类型 State

```typescript
export const useUserStore = defineStore('user', () => {
  // ✅ 正确：使用 ref 定义基本类型
  const count = ref<number>(0)
  const name = ref<string>('')
  const isLoading = ref<boolean>(false)

  // ✅ 正确：使用 reactive 定义对象
  const config = reactive({
    pageSize: 10,
    currentPage: 1,
    searchKeyword: ''
  })

  return { count, name, isLoading, config }
})
```

#### 2.2 数组类型 State

```typescript
interface MenuItem {
  id: number
  title: string
  path: string
  children?: MenuItem[]
}

export const useMenuStore = defineStore('menu', () => {
  // ✅ 正确：使用 ref 定义数组
  const menuList = ref<MenuItem[]>([])
  const activeMenuIds = ref<number[]>([])

  // ✅ 正确：数组操作方法
  function addMenu(menu: MenuItem) {
    menuList.value.push(menu)
  }

  function removeMenu(id: number) {
    const index = menuList.value.findIndex(m => m.id === id)
    if (index !== -1) {
      menuList.value.splice(index, 1)
    }
  }

  function setActiveMenus(ids: number[]) {
    activeMenuIds.value = ids
  }

  return { menuList, activeMenuIds, addMenu, removeMenu, setActiveMenus }
})
```

---

### 3. Getters 规范

#### 3.1 计算属性 Getters

```typescript
export const useUserStore = defineStore('user', () => {
  const roles = ref<string[]>([])
  const permissions = ref<string[]>([])

  // ✅ 正确：简单计算属性
  const roleNames = computed(() => roles.value.join(', '))
  const permissionSet = computed(() => new Set(permissions.value))

  // ✅ 正确：带条件的计算属性
  const isAdmin = computed(() => roles.value.includes('admin'))
  const hasPermission = computed(() => (perm: string) => 
    permissions.value.includes(perm) || roles.value.includes('admin')
  )

  // ✅ 正确：链式计算
  const sortedRoles = computed(() => [...roles.value].sort())

  return { roles, permissions, roleNames, isAdmin, hasPermission }
})
```

#### 3.2 跨 Store Getters

```typescript
export const usePermissionStore = defineStore('permission', () => {
  const userStore = useUserStore()  // 使用其他 Store

  // ✅ 正确：访问其他 Store 的 state
  const hasRoles = computed(() => userStore.roles.length > 0)

  // ✅ 正确：访问其他 Store 的 getter
  const isAdmin = computed(() => userStore.isAdmin)

  // ✅ 正确：结合多个 Store
  const canAccess = computed(() => (route: string) => {
    if (userStore.isAdmin) return true
    return userStore.permissions.includes(route)
  })

  return { hasRoles, isAdmin, canAccess }
})
```

---

### 4. Actions 规范

#### 4.1 同步 Actions

```typescript
export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null)

  // ✅ 正确：修改 state
  function setUserInfo(user: UserInfo) {
    userInfo.value = user
  }

  // ✅ 正确：使用 patch 批量更新
  function updateUserInfo(updates: Partial<UserInfo>) {
    if (userInfo.value) {
      Object.assign(userInfo.value, updates)
    }
  }

  // ✅ 正确：返回 Promise
  function validateUsername(username: string): boolean {
    return /^[a-zA-Z0-9_]{4,16}$/.test(username)
  }

  return { userInfo, setUserInfo, updateUserInfo, validateUsername }
})
```

#### 4.2 异步 Actions

```typescript
export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const userInfo = ref<UserInfo | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ✅ 正确：async/await 处理
  async function login(credentials: { username: string; password: string }) {
    loading.value = true
    error.value = null

    try {
      const response = await api.login(credentials)
      token.value = response.token
      await fetchUserInfo()
      return response
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  // ✅ 正确：并发请求
  async function fetchAllData() {
    loading.value = true
    try {
      const [userInfo, roles, permissions] = await Promise.all([
        api.getUserInfo(),
        api.getRoles(),
        api.getPermissions()
      ])
      userInfo.value = userInfo
      // ...
    } finally {
      loading.value = false
    }
  }

  // ✅ 正确：取消请求处理
  const controller = ref<AbortController | null>(null)

  async function searchUsers(keyword: string) {
    controller.value?.abort()  // 取消上次请求
    controller.value = new AbortController()

    try {
      return await api.searchUsers(keyword, {
        signal: controller.value.signal
      })
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        console.log('请求已取消')
        return
      }
      throw err
    }
  }

  return { token, userInfo, loading, error, login, fetchAllData, searchUsers }
})
```

---

### 5. Store 持久化

```typescript
// plugins/pinia-persist.ts
import type { PiniaPluginContext } from 'pinia'

interface PersistConfig {
  key?: string
  paths?: string[]
  storage?: Storage
}

export function createPersistPlugin() {
  return ({ store, options }: PiniaPluginContext) => {
    const persist = options.persist as PersistConfig | undefined
    if (!persist) return

    const storage = persist.storage || localStorage
    const key = persist.key || `${store.$id}`
    
    // 加载持久化数据
    const saved = storage.getItem(key)
    if (saved) {
      const data = JSON.parse(saved)
      if (persist.paths) {
        persist.paths.forEach(path => {
          if (data[path] !== undefined) {
            store.$patch(path as any, data[path])
          }
        })
      } else {
        store.$patch(data)
      }
    }

    // 保存数据
    store.$subscribe((_, state) => {
      const toSave = persist.paths 
        ? persist.paths.reduce((acc, path) => ({ ...acc, [path]: state[path] }), {})
        : state
      storage.setItem(key, JSON.stringify(toSave))
    })
  }
}

// main.ts
import { createPinia } from 'pinia'
import { createPersistPlugin } from './plugins/pinia-persist'

const pinia = createPinia()
pinia.use(createPersistPlugin())
app.use(pinia)
```

---

### 6. 模块化 Store 设计

```typescript
// stores/modules/user.ts - 用户模块
export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const userInfo = ref(null)
  
  async function login() { /* ... */ }
  function logout() { /* ... */ }
  
  return { token, userInfo, login, logout }
})

// stores/modules/app.ts - 应用模块
export const useAppStore = defineStore('app', () => {
  const sidebar = ref(true)
  const theme = ref('light')
  
  function toggleSidebar() { /* ... */ }
  
  return { sidebar, theme, toggleSidebar }
})

// stores/modules/permission.ts - 权限模块
export const usePermissionStore = defineStore('permission', () => {
  const routes = ref([])
  const hasPermission = computed(() => (route: string) => {
    const userStore = useUserStore()
    return userStore.roles.includes('admin') || userStore.permissions.includes(route)
  })
  
  return { routes, hasPermission }
})

// 在组件中使用
import { useUserStore, useAppStore, usePermissionStore } from '@/stores/modules'

const userStore = useUserStore()
const appStore = useAppStore()
const permissionStore = usePermissionStore()
```

---

## 最佳实践

### 1. Store 命名规范

```typescript
// ✅ 正确：使用 useXxxStore 命名
export const useUserStore = defineStore('user', { /* ... */ })
export const useAppStore = defineStore('app', { /* ... */ })
export const useMenuStore = defineStore('menu', { /* ... */ })

// ❌ 错误：不规范的命名
export const userStore = defineStore('user', { /* ... */ })  // 缺少 use
export const UserStore = defineStore('user', { /* ... */ })  // 不应该大写
```

### 2. 避免状态冗余

```typescript
// ❌ 错误：state 与 getter 冗余
state: () => ({
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe'  // 冗余！应该用 getter
}),
getters: {
  fullName: (state) => `${state.firstName} ${state.lastName}`  // ✅ 正确
}

// ❌ 错误：多个 state 表示同一状态
state: () => ({
  isLoggedIn: false,
  isLogin: false,  // 重复！
  hasLogin: false  // 重复！
})
```

### 3. 避免直接修改 state

```typescript
// ❌ 错误：直接修改 state
userStore.userInfo.name = 'new name'  // 可能不触发响应式

// ✅ 正确：使用 action 或 $patch
userStore.setUserInfo({ name: 'new name' })
userStore.$patch({ userInfo: { name: 'new name' } })
```

---

## 触发关键词

- Pinia
- 状态管理
- Store
- Vuex
- 全局状态

---

## 相关文件

- [vue-best-practices.md](./vue-best-practices.md) - Vue 开发最佳实践
- [ui-bc.md](./ui-bc.md) - Element Plus 组件封装
- [ui-mobile.md](./ui-mobile.md) - 移动端开发

---

*更新时间：2026-04-06*  
*RuoYi-Vue-Plus AI 开发助手*
