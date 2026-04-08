# UI Components - Element Plus 组件封装规范

## 职责范围

规范 RuoYi-Vue-Plus 项目中 Element Plus 组件的使用和封装，包括通用组件开发、表单组件、表格组件等最佳实践。

---

## 核心规范

### 1. 组件封装原则

#### 1.1 单一职责原则

```vue
<!-- ✅ 正确：组件职责单一 -->
<!-- UserTable.vue - 只负责用户表格展示 -->
<template>
  <el-table :data="userList" v-bind="$attrs">
    <el-table-column prop="username" label="用户名" />
    <el-table-column prop="email" label="邮箱" />
    <el-table-column label="操作">
      <el-button @click="handleEdit">编辑</el-button>
    </el-table-column>
  </el-table>
</template>

<!-- ✅ 正确：搜索组件独立 -->
<!-- UserSearch.vue - 只负责搜索条件 -->
<template>
  <el-form :model="searchForm" inline>
    <el-form-item label="用户名">
      <el-input v-model="searchForm.username" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="handleSearch">搜索</el-button>
    </el-form-item>
  </el-form>
</template>
```

#### 1.2 Props 定义规范

```vue
<script setup lang="ts">
// ✅ 正确：使用 defineProps 定义
interface Props {
  modelValue?: string
  options?: Array<{ label: string; value: any }>
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  options: () => [],
  placeholder: '请选择',
  disabled: false,
  clearable: true
})

// ✅ 正确：使用 emit 定义事件
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: any): void
  (e: 'clear'): void
}>()
</script>
```

---

### 2. 表单组件封装

#### 2.1 基础输入组件

```vue
<!-- RInput.vue - 封装 el-input -->
<template>
  <el-input
    v-model="internalValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    :maxlength="maxlength"
    @input="handleInput"
  >
    <template v-if="prefixIcon" #prefix>
      <el-icon><component :is="prefixIcon" /></el-icon>
    </template>
  </el-input>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  maxlength?: number
  prefixIcon?: string
}>(), {
  placeholder: '请输入',
  disabled: false,
  clearable: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const internalValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleInput = (value: string) => {
  emit('update:modelValue', value)
}
</script>
```

#### 2.2 选择器组件

```vue
<!-- RSelect.vue - 封装 el-select -->
<template>
  <el-select
    v-model="internalValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    :filterable="filterable"
    :loading="loading"
    @change="handleChange"
  >
    <el-option
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value"
      :disabled="item.disabled"
    />
  </el-select>
</template>

<script setup lang="ts">
interface Option {
  label: string
  value: any
  disabled?: boolean
}

const props = withDefaults(defineProps<{
  modelValue?: any
  options: Option[]
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  filterable?: boolean
  loading?: boolean
}>(), {
  modelValue: undefined,
  placeholder: '请选择',
  disabled: false,
  clearable: true,
  filterable: false,
  loading: false
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  'change': [value: any]
}>()

const internalValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleChange = (value: any) => {
  emit('change', value)
}
</script>
```

---

### 3. 表格组件封装

```vue
<!-- RTable.vue - 封装 el-table -->
<template>
  <div class="r-table">
    <el-table
      v-loading="loading"
      :data="data"
      :border="border"
      :stripe="stripe"
      :height="height"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
    >
      <el-table-column
        v-if="showSelection"
        type="selection"
        width="55"
        align="center"
      />
      <el-table-column
        v-if="showIndex"
        type="index"
        label="序号"
        width="60"
        align="center"
      />
      
      <slot name="columns" />
      
      <el-table-column
        v-if="showOperation"
        label="操作"
        width="200"
        align="center"
        fixed="right"
      >
        <slot name="operation" />
      </el-table-column>
    </el-table>
    
    <!-- 分页 -->
    <el-pagination
      v-if="showPagination"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  data: any[]
  loading?: boolean
  border?: boolean
  stripe?: boolean
  height?: number
  showSelection?: boolean
  showIndex?: boolean
  showOperation?: boolean
  showPagination?: boolean
  total?: number
  currentPage?: number
  pageSize?: number
}>(), {
  loading: false,
  border: true,
  stripe: true,
  height: undefined,
  showSelection: false,
  showIndex: true,
  showOperation: false,
  showPagination: true,
  total: 0,
  currentPage: 1,
  pageSize: 10
})()

const emit = defineEmits<{
  'selection-change': [selection: any[]]
  'sort-change': [sort: any]
  'size-change': [size: number]
  'current-change': [current: number]
}>()

const handleSelectionChange = (selection: any[]) => {
  emit('selection-change', selection)
}

const handleSortChange = (sort: any) => {
  emit('sort-change', sort)
}

const handleSizeChange = (size: number) => {
  emit('size-change', size)
}

const handleCurrentChange = (current: number) => {
  emit('current-change', current)
}
</script>

<style scoped>
.r-table {
  width: 100%;
}
</style>
```

---

### 4. 对话框组件封装

```vue
<!-- RDialog.vue - 封装 el-dialog -->
<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="showClose"
    :draggable="draggable"
    @open="handleOpen"
    @close="handleClose"
  >
    <slot />
    
    <template v-if="showFooter" #footer>
      <el-button @click="handleCancel">{{ cancelText }}</el-button>
      <el-button
        type="primary"
        :loading="confirmLoading"
        @click="handleConfirm"
      >
        {{ confirmText }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  width?: string
  closeOnClickModal?: boolean
  closeOnPressEscape?: boolean
  showClose?: boolean
  draggable?: boolean
  showFooter?: boolean
  cancelText?: string
  confirmText?: string
  confirmLoading?: boolean
}>(), {
  modelValue: false,
  title: '',
  width: '500px',
  closeOnClickModal: false,
  closeOnPressEscape: true,
  showClose: true,
  draggable: true,
  showFooter: true,
  cancelText: '取消',
  confirmText: '确定',
  confirmLoading: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'open': []
  'close': []
  'cancel': []
  'confirm': []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleOpen = () => emit('open')
const handleClose = () => emit('close')
const handleCancel = () => emit('cancel')
const handleConfirm = () => emit('confirm')
</script>
```

---

### 5. 搜索表单组件

```vue
<!-- RSearchForm.vue - 搜索表单封装 -->
<template>
  <el-form
    ref="formRef"
    :model="formData"
    :inline="true"
    class="r-search-form"
  >
    <slot :form="formData" />
    
    <el-form-item>
      <el-button type="primary" @click="handleSearch">
        <el-icon><Search /></el-icon>
        搜索
      </el-button>
      <el-button @click="handleReset">
        <el-icon><Refresh /></el-icon>
        重置
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: Record<string, any>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>]
  'search': [value: Record<string, any>]
  'reset': []
}>()

const formRef = ref()

const formData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const handleSearch = () => {
  emit('search', formData.value)
}

const handleReset = () => {
  emit('reset')
}
</script>

<style scoped>
.r-search-form {
  margin-bottom: 16px;
}
</style>
```

---

### 6. 使用示例

```vue
<!-- 用户管理页面 -->
<template>
  <div class="user-management">
    <!-- 搜索表单 -->
    <RSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <template #default="{ form }">
        <el-form-item label="用户名">
          <RInput v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="状态">
          <RSelect
            v-model="form.status"
            :options="statusOptions"
            placeholder="请选择状态"
          />
        </el-form-item>
      </template>
    </RSearchForm>
    
    <!-- 表格 -->
    <RTable
      v-model:current-page="pagination.currentPage"
      v-model:page-size="pagination.pageSize"
      :data="userList"
      :loading="loading"
      :total="pagination.total"
      show-selection
      show-operation
      @selection-change="handleSelectionChange"
      @current-change="loadUserList"
      @size-change="loadUserList"
    >
      <template #columns>
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
      </template>
      
      <template #operation="{ row }">
        <el-button type="primary" size="small" @click="handleEdit(row)">
          编辑
        </el-button>
        <el-button type="danger" size="small" @click="handleDelete(row)">
          删除
        </el-button>
      </template>
    </RTable>
    
    <!-- 编辑对话框 -->
    <RDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :confirm-loading="dialogLoading"
      @confirm="handleConfirm"
      @cancel="dialogVisible = false"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名" required>
          <RInput v-model="form.username" />
        </el-form-item>
        <el-form-item label="邮箱" required>
          <RInput v-model="form.email" />
        </el-form-item>
      </el-form>
    </RDialog>
  </div>
</template>
```

---

## 组件命名规范

| 组件名 | 说明 |
|--------|------|
| RInput | 输入框组件 |
| RSelect | 选择器组件 |
| RTable | 表格组件 |
| RDialog | 对话框组件 |
| RSearchForm | 搜索表单 |
| RUpload | 上传组件 |
| RTree | 树形组件 |
| RPagination | 分页组件 |

---

## 触发关键词

- Element Plus
- UI 组件
- 表单组件
- 表格组件
- 对话框
- 组件封装
- Vue 组件

---

## 相关文件

- [vue-best-practices.md](./vue-best-practices.md) - Vue 开发最佳实践
- [store-bc.md](./store-bc.md) - Pinia 状态管理
- [ui-design-mobile.md](./ui-design-mobile.md) - 移动端设计规范

---

*更新时间：2026-04-06*  
*RuoYi-Vue-Plus AI 开发助手*
