# Vue 3 最佳实践技能 (Vue Best Practices)

## 适用场景
- Vue 3 + TypeScript 项目开发
- 遵循 Vue 3 官方推荐实践
- 使用 Composition API、Pinia、Vite 技术栈

## 核心技术栈
- **Vue**: 3.x
- **TypeScript**: 5.x
- **Vite**: 5.x
- **Pinia**: 2.x
- **Vue Router**: 4.x
- **Element Plus**: 2.x (如使用)

## Composition API 规范

### 1. 必须使用 Composition API
```typescript
// 推荐
<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const count = ref(0)
const double = computed(() => count.value * 2)
</script>

// 不推荐 (除非特殊需求)
<script lang="ts">
export default {
  data() { return { count: 0 } },
  methods: { /* ... */ }
}
</script>
```

### 2. 响应式数据规范
```typescript
// 基本类型使用 ref
const count = ref(0)
const name = ref('')

// 对象/数组使用 reactive
const state = reactive({
  users: [],
  loading: false
})

// props 使用 defineProps
const props = defineProps<{
  title: string
  count?: number
}>()
```

### 3. Emits 规范
```typescript
// 使用 defineEmits
const emit = defineEmits<{
  (e: 'update', value: string): void
  (e: 'close'): void
}>()

// 触发事件
emit('update', 'new value')
```

## TypeScript 规范

### 1. 组件 Props 类型定义
```typescript
interface UserProps {
  id: number
  name: string
  email?: string
}

const props = defineProps<{
  user: UserProps
  showDetails?: boolean
}>()
```

### 2. 事件类型定义
```typescript
type UserEvents = 
  | { event: 'save'; user: UserProps }
  | { event: 'cancel' }
  | { event: 'error'; message: string }

const emit = defineEmits<{
  (e: 'save', user: UserProps): void
  (e: 'cancel'): void
  (e: 'error', message: string): void
}>()
```

## Pinia 状态管理规范

### 1. Store 定义
```typescript
import { defineStore } from 'pinia'

interface UserState {
  userInfo: UserInfo | null
  token: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    userInfo: null,
    token: null
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token,
    userName: (state) => state.userInfo?.name ?? 'Guest'
  },
  
  actions: {
    async login(credentials: LoginCredentials) {
      // 异步操作
      const response = await api.login(credentials)
      this.token = response.token
    }
  }
})
```

### 2. Store 使用
```typescript
<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
// 使用 storeToRefs 保持响应式
const { token, userName } = storeToRefs(userStore)
</script>
```

## 组件设计规范

### 1. 单文件组件结构
```vue
<script setup lang="ts">
// 导入
import { ref, computed } from 'vue'
import type { User } from '@/types'

// Props 定义
const props = defineProps<{ user: User }>()

// Emits 定义
const emit = defineEmits<{ update: [user: User] }>()

// 响应式数据
const loading = ref(false)

// 计算属性
const fullName = computed(() => `${props.user.firstName} ${props.user.lastName}`)

// 方法
async function handleUpdate() {
  loading.value = true
  // ...
}
</script>

<template>
  <!-- 模板内容 -->
</template>

<style scoped>
/* 样式 */
</style>
```

### 2. 组件命名规范
- 文件名使用 PascalCase: `UserProfile.vue`, `ProductList.vue`
- 组件名与文件名一致
- 基础组件加 `Base` 前缀：`BaseButton.vue`, `BaseInput.vue`

## Vite 配置规范

### 1. 路径别名配置
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
```

### 2. 环境变量
```bash
# .env.development
VITE_APP_TITLE=开发环境
VITE_API_BASE_URL=/api

# .env.production
VITE_APP_TITLE=生产环境
VITE_API_BASE_URL=https://api.example.com
```

## 最佳实践清单

### 代码组织
- [ ] 使用 Composition API
- [ ] 使用 `<script setup>` 语法
- [ ] TypeScript 类型完整
- [ ] 组件功能单一职责

### 性能优化
- [ ] 使用 `v-memo` 优化大列表
- [ ] 异步组件按需加载
- [ ] 图片使用懒加载
- [ ] 避免不必要的响应式

### 代码质量
- [ ] Props 类型定义完整
- [ ] Emits 事件类型清晰
- [ ] 错误处理完善
- [ ] 必要的注释文档

## 常见陷阱

### 1. 响应式丢失
```typescript
// 错误：解构后失去响应式
const { count } = useCounter()

// 正确：使用 toRefs
const { count } = toRefs(useCounter())
```

### 2. watch 使用错误
```typescript
// 错误：watch ref 时忘记 .value
watch(count, (newVal) => console.log(newVal))

// 正确
watch(count, (newVal) => console.log(newVal)) // ref 自动解包
```

## 检查清单

- [ ] 是否使用 Composition API
- [ ] TypeScript 类型是否完整
- [ ] Props/Emits 是否有类型定义
- [ ] Pinia Store 是否规范
- [ ] 组件命名是否符合规范
- [ ] 样式是否使用 scoped
- [ ] 是否处理了加载和错误状态
