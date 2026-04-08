# UI Mobile - 移动端开发规范（WDI 组件库）

## 职责范围

规范 RuoYi-Vue-Plus 项目中使用 WDI（WeChat Design Interface）组件库进行移动端开发的最佳实践，适用于 H5、小程序等多端场景。

---

## 核心规范

### 1. WDI 组件库引入

#### 1.1 安装与配置

```bash
# 安装 WDI 组件库
npm install wdi-mobile --save

# 安装小程序适配器（如需要）
npm install wdi-miniprogram --save
```

```typescript
// main.ts - 全局引入
import { createApp } from 'vue'
import WdiMobile from 'wdi-mobile'
import 'wdi-mobile/lib/index.css'
import App from './App.vue'

const app = createApp(App)
app.use(WdiMobile)
app.mount('#app')
```

#### 1.2 按需引入（推荐）

```typescript
// main.ts - 按需引入
import { createApp } from 'vue'
import { Button, Form, Input, Cell } from 'wdi-mobile'
import App from './App.vue'

const app = createApp(App)
app.component(Button.name, Button)
app.component(Form.name, Form)
app.component(Input.name, Input)
app.component(Cell.name, Cell)
app.mount('#app')
```

```javascript
// babel.config.js - 配合 babel-plugin-import
module.exports = {
  plugins: [
    ['import', {
      libraryName: 'wdi-mobile',
      libraryDirectory: 'lib',
      style: true
    }]
  ]
}
```

---

### 2. 基础组件使用

#### 2.1 按钮组件

```vue
<template>
  <div>
    <!-- 基础按钮 -->
    <wd-button type="primary">主要按钮</wd-button>
    <wd-button type="success">成功按钮</wd-button>
    <wd-button type="warning">警告按钮</wd-button>
    <wd-button type="danger">危险按钮</wd-button>

    <!-- 尺寸 -->
    <wd-button size="small">小按钮</wd-button>
    <wd-button size="normal">普通按钮</wd-button>
    <wd-button size="large">大按钮</wd-button>

    <!-- 状态 -->
    <wd-button :loading="true">加载中</wd-button>
    <wd-button disabled>禁用按钮</wd-button>

    <!-- 块级按钮 -->
    <wd-button type="primary" block>块级按钮</wd-button>

    <!-- 点击事件 -->
    <wd-button @click="handleClick">点击我</wd-button>
  </div>
</template>

<script setup lang="ts">
const handleClick = () => {
  console.log('按钮被点击了')
}
</script>
```

#### 2.2 表单组件

```vue
<template>
  <wd-form ref="formRef" :model="formData" :rules="formRules">
    <!-- 输入框 -->
    <wd-form-item name="username" label="用户名">
      <wd-input
        v-model="formData.username"
        placeholder="请输入用户名"
        clearable
      />
    </wd-form-item>

    <!-- 密码框 -->
    <wd-form-item name="password" label="密码">
      <wd-input
        v-model="formData.password"
        type="password"
        placeholder="请输入密码"
        show-password
      />
    </wd-form-item>

    <!-- 手机号 -->
    <wd-form-item name="phone" label="手机号">
      <wd-input
        v-model="formData.phone"
        type="tel"
        placeholder="请输入手机号"
        maxlength="11"
      />
    </wd-form-item>

    <!-- 选择器 -->
    <wd-form-item name="gender" label="性别">
      <wd-picker
        v-model="formData.gender"
        :columns="genderColumns"
        placeholder="请选择性别"
      />
    </wd-form-item>

    <!-- 日期选择 -->
    <wd-form-item name="birthday" label="生日">
      <wd-date-picker
        v-model="formData.birthday"
        placeholder="请选择生日"
      />
    </wd-form-item>

    <!-- 提交按钮 -->
    <wd-button type="primary" block @click="handleSubmit">
      提交
    </wd-button>
  </wd-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const formRef = ref()

const formData = reactive({
  username: '',
  password: '',
  phone: '',
  gender: '',
  birthday: ''
})

const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 16, message: '长度在 4-16 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
}

const genderColumns = [
  { text: '男', value: 'male' },
  { text: '女', value: 'female' }
]

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    console.log('表单验证通过', formData)
  } catch (error) {
    console.error('表单验证失败', error)
  }
}
</script>
```

#### 2.3 列表组件

```vue
<template>
  <div>
    <!-- 基础列表 -->
    <wd-cell-group>
      <wd-cell title="单元格标题" label="描述信息" />
      <wd-cell title="标题" is-link />
      <wd-cell title="标题" value="内容" is-link />
    </wd-cell-group>

    <!-- 带图标列表 -->
    <wd-cell-group>
      <wd-cell title="消息" icon="message" is-link />
      <wd-cell title="设置" icon="setting" is-link />
    </wd-cell-group>

    <!-- 分组列表 -->
    <wd-cell-group title="分组一">
      <wd-cell title="选项 1" />
      <wd-cell title="选项 2" />
    </wd-cell-group>
    <wd-cell-group title="分组二">
      <wd-cell title="选项 3" />
      <wd-cell title="选项 4" />
    </wd-cell-group>
  </div>
</template>
```

---

### 3. 弹窗组件

#### 3.1 Toast 提示

```typescript
import { showToast, showSuccessToast, showErrorToast, showLoadingToast } from 'wdi-mobile'

// 文本提示
showToast('操作成功')

// 成功提示
showSuccessToast('保存成功')

// 错误提示
showErrorToast('操作失败')

// 加载提示
const loading = showLoadingToast('加载中...')

// 关闭加载
loading.close()

// 自定义
showToast({
  message: '自定义提示',
  duration: 2000,
  position: 'top',
  icon: 'success'
})
```

#### 3.2 Dialog 对话框

```typescript
import { showDialog } from 'wdi-mobile'

// 确认对话框
showDialog({
  title: '提示',
  message: '确定要删除吗？',
  showCancelButton: true,
  confirmButtonText: '确定',
  cancelButtonText: '取消'
}).then(() => {
  console.log('点击了确定')
}).catch(() => {
  console.log('点击了取消')
})

// 输入对话框
showDialog({
  title: '请输入',
  showInput: true,
  inputPlaceholder: '请输入内容'
}).then((value) => {
  console.log('输入的内容:', value)
})
```

#### 3.3 ActionSheet 动作面板

```typescript
import { showActionSheet } from 'wdi-mobile'

showActionSheet({
  title: '请选择操作',
  actions: [
    { name: '分享', icon: 'share' },
    { name: '收藏', icon: 'star' },
    { name: '删除', icon: 'delete', color: 'red' }
  ]
}).then((index) => {
  console.log('选择了第', index, '个操作')
})
```

---

### 4. 导航组件

#### 4.1 Tab 标签页

```vue
<template>
  <wd-tabs v-model="activeTab">
    <wd-tab name="tab1" title="标签 1">
      <div>标签 1 内容</div>
    </wd-tab>
    <wd-tab name="tab2" title="标签 2">
      <div>标签 2 内容</div>
    </wd-tab>
    <wd-tab name="tab3" title="标签 3">
      <div>标签 3 内容</div>
    </wd-tab>
  </wd-tabs>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const activeTab = ref('tab1')
</script>
```

#### 4.2 NavBar 导航栏

```vue
<template>
  <wd-nav-bar
    title="页面标题"
    left-arrow
    @click-left="handleBack"
  >
    <template #right>
      <wd-icon name="more" @click="handleMore" />
    </template>
  </wd-nav-bar>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()

const handleBack = () => {
  router.back()
}

const handleMore = () => {
  console.log('更多操作')
}
</script>
```

---

### 5. 列表组件

#### 5.1 下拉刷新 + 上拉加载

```vue
<template>
  <wd-list
    v-model:loading="loading"
    :finished="finished"
    finished-text="没有更多了"
    @load="onLoad"
  >
    <wd-pull-refresh
      v-model="refreshing"
      @refresh="onRefresh"
    >
      <wd-cell
        v-for="item in list"
        :key="item.id"
        :title="item.title"
        :label="item.description"
        is-link
      />
    </wd-pull-refresh>
  </wd-list>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const list = reactive<any[]>([])
const page = ref(1)

const onLoad = async () => {
  // 模拟请求
  const data = await fetchList(page.value)
  
  if (refreshing.value) {
    list.length = 0
    refreshing.value = false
  }
  
  list.push(...data)
  page.value++
  
  loading.value = false
  
  if (list.length >= 100) {
    finished.value = true
  }
}

const onRefresh = () => {
  page.value = 1
  finished.value = false
  loading.value = true
  onLoad()
}

const fetchList = (page: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        Array.from({ length: 10 }).map((_, i) => ({
          id: (page - 1) * 10 + i,
          title: `标题${(page - 1) * 10 + i}`,
          description: '描述信息'
        }))
      )
    }, 1000)
  })
}
</script>
```

---

### 6. 移动端适配

#### 6.1 viewport 配置

```html
<!-- index.html -->
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">
</head>
```

#### 6.2 rem 适配

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    'postcss-pxtorem': {
      rootValue: 37.5,  // 设计稿宽度 750 / 20
      propList: ['*'],
      selectorBlackList: ['html']
    }
  }
}
```

#### 6.3 安全区域适配

```css
/* 适配 iPhone X 安全区域 */
.safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## 触发关键词

- 移动端
- WDI
- 小程序
- H5
- 响应式
- 移动端 UI

---

## 相关文件

- [ui-design-mobile.md](./ui-design-mobile.md) - 移动端设计规范
- [store-mobile.md](./store-mobile.md) - 移动端状态管理
- [uniape-platform.md](./uniape-platform.md) - 跨平台条件编译

---

*更新时间：2026-04-06*  
*RuoYi-Vue-Plus AI 开发助手*
