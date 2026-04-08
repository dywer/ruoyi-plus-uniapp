# Uniape Platform - 跨平台条件编译

## 职责范围

规范 RuoYi-Vue-Plus 项目中跨平台开发的条件编译实践，适用于 UniApp 多端发布场景（H5、小程序、App）。

---

## 核心规范

### 1. 条件编译语法

#### 1.1 Vue 模板条件编译

```vue
<template>
  <div>
    <!-- 仅 H5 平台显示 -->
    <!-- #ifdef H5 -->
    <div class="h5-only">这是 H5 页面</div>
    <!-- #endif -->

    <!-- 仅微信小程序显示 -->
    <!-- #ifdef MP-WEIXIN -->
    <view class="mp-weixin">这是微信小程序</view>
    <!-- #endif -->

    <!-- 多平台判断 -->
    <!-- #ifdef H5 || APP-PLUS -->
    <div>H5 或 App 显示</div>
    <!-- #endif -->

    <!-- 排除某平台 -->
    <!-- #ifndef MP-ALIPAY -->
    <div>非支付宝小程序显示</div>
    <!-- #endif -->

    <!-- 多平台组合 -->
    <!-- #ifdef H5 -->
    <web-view src="https://example.com" />
    <!-- #elifdef MP-WEIXIN -->
    <web-view src="https://example.com/mp" />
    <!-- #else -->
    <view>其他平台</view>
    <!-- #endif -->
  </div>
</template>
```

#### 1.2 Script 条件编译

```typescript
// #ifdef H5
console.log('仅在 H5 执行')
// #endif

// #ifdef MP-WEIXIN
const mpConfig = {
  // 微信小程序特有配置
  appId: 'wx1234567890'
}
// #endif

// #ifndef APP-PLUS
const webFeature = 'web-only-feature'
// #endif

// 跨平台函数
function platformSpecific() {
  // #ifdef H5
  return 'h5'
  // #elifdef MP-WEIXIN
  return 'weixin'
  // #else
  return 'other'
  // #endif
}
```

#### 1.3 CSS 条件编译

```css
/* #ifdef H5 */
.h5-style {
  font-size: 16px;
  cursor: pointer;
}
/* #endif */

/* #ifdef MP-WEIXIN */
.mp-weixin-style {
  font-size: 28rpx;
}
/* #endif */

/* #ifdef APP-PLUS */
.app-style {
  font-size: 14px;
}
/* #endif */
```

---

### 2. 平台专用 API 封装

```typescript
// utils/platform.ts
import { platform } from '@uni-helper/uni-env'

/**
 * 获取当前平台
 */
export function getCurrentPlatform(): string {
  return platform
}

/**
 * 判断是否为 H5 平台
 */
export function isH5(): boolean {
  return platform === 'h5'
}

/**
 * 判断是否为微信小程序
 */
export function isWechatMp(): boolean {
  return platform === 'mp-weixin'
}

/**
 * 判断是否为 App 平台
 */
export function isApp(): boolean {
  return platform === 'app' || platform === 'app-plus'
}

/**
 * 跨平台分享
 */
export function shareContent(data: {
  title: string
  content: string
  href?: string
}) {
  // #ifdef MP-WEIXIN
  wx.shareAppMessage({
    title: data.title,
    path: data.href
  })
  // #endif

  // #ifdef H5
  if (navigator.share) {
    navigator.share({
      title: data.title,
      text: data.content,
      url: data.href
    })
  }
  // #endif

  // #ifdef APP-PLUS
  plus.share.sendWithSystem(data.content)
  // #endif
}

/**
 * 跨平台支付
 */
export async function requestPayment(orderInfo: any) {
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    wx.requestPayment({
      timeStamp: orderInfo.timeStamp,
      nonceStr: orderInfo.nonceStr,
      package: orderInfo.package,
      signType: 'MD5',
      paySign: orderInfo.paySign,
      success: resolve,
      fail: reject
    })
  })
  // #endif

  // #ifdef H5
  // H5 跳转到支付页面
  window.location.href = orderInfo.payUrl
  return Promise.resolve()
  // #endif

  // #ifdef APP-PLUS
  return uni.requestPayment({
    provider: orderInfo.provider,
    orderInfo: orderInfo
  })
  // #endif
}

/**
 * 跨平台上传文件
 */
export async function uploadFile(filePath: string) {
  // #ifdef H5
  const formData = new FormData()
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
  if (fileInput && fileInput.files) {
    formData.append('file', fileInput.files[0])
  }
  return await fetch('/api/upload', {
    method: 'POST',
    body: formData
  })
  // #endif

  // #ifndef H5
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: '/api/upload',
      filePath: filePath,
      name: 'file',
      success: resolve,
      fail: reject
    })
  })
  // #endif
}
```

---

### 3. 平台配置文件

#### 3.1 manifest.json 配置

```json
{
  "name": "RuoYi App",
  "appid": "__UNI__XXXXXXX",
  "versionName": "1.0.0",
  "versionCode": "100",
  "transformPx": false,
  
  "h5": {
    "title": "RuoYi H5",
    "router": {
      "mode": "history",
      "base": "/h5/"
    },
    "devServer": {
      "port": 8080,
      "https": false
    },
    "sdkConfigs": {},
    "optimization": {
      "treeShaking": {
        "enable": true
      }
    }
  },
  
  "mp-weixin": {
    "appid": "wx1234567890",
    "setting": {
      "urlCheck": true,
      "es6": true,
      "minified": true
    },
    "permission": {
      "scope.userLocation": {
        "desc": "用于获取您的位置信息"
      }
    }
  },
  
  "mp-alipay": {
    "appid": "2021000000000000",
    "setting": {
      "enableAppxNg": true,
      "es6": true,
      "minimize": true
    }
  },
  
  "app-plus": {
    "usingComponents": true,
    "splashscreen": {
      "alwaysShowBeforeRender": true,
      "waiting": true,
      "autoclose": true,
      "delay": 0
    },
    "modules": {},
    "distribute": {
      "android": {
        "permissions": [
          "<uses-permission android:name=\"android.permission.INTERNET\"/>",
          "<uses-permission android:name=\"android.permission.ACCESS_NETWORK_STATE\"/>"
        ]
      },
      "ios": {}
    }
  }
}
```

#### 3.2 pages.json 配置

```json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "首页",
        // #ifdef MP-WEIXIN
        "navigationStyle": "custom",
        // #endif
        // #ifdef H5
        "navigationBarBackgroundColor": "#007AFF"
        // #endif
      }
    },
    {
      "path": "pages/detail/detail",
      "style": {
        "navigationBarTitleText": "详情",
        // #ifdef APP-PLUS
        "scrollIndicator": "none",
        // #endif
        "enablePullDownRefresh": true
      }
    }
  ],
  "globalStyle": {
    "navigationBarTextStyle": "white",
    "navigationBarTitleText": "RuoYi",
    "navigationBarBackgroundColor": "#007AFF",
    "backgroundColor": "#F8F8F8"
  },
  // #ifdef H5
  "globalStyle": {
    "h5": {
      "title": "RuoYi H5"
    }
  }
  // #endif
}
```

---

### 4. 跨平台组件封装

```vue
<!-- components/RWebView.vue -->
<template>
  <div>
    <!-- #ifdef H5 -->
    <iframe
      :src="src"
      class="webview-iframe"
      frameborder="0"
    />
    <!-- #endif -->

    <!-- #ifndef H5 -->
    <web-view
      :src="src"
      @load="onLoad"
      @error="onError"
    />
    <!-- #endif -->
  </div>
</template>

<script setup lang="ts">
defineProps<{
  src: string
}>()

const onLoad = () => {
  console.log('页面加载完成')
}

const onError = (e: any) => {
  console.error('页面加载失败', e)
}
</script>

<style scoped>
/* #ifdef H5 */
.webview-iframe {
  width: 100%;
  height: 100vh;
  border: none;
}
/* #endif */
</style>
```

---

### 5. 平台样式适配

```scss
// styles/mixin.scss

// 响应式字体
@mixin responsive-font($h5: 16px, $mp: 28rpx, $app: 14px) {
  /* #ifdef H5 */
  font-size: $h5;
  /* #endif */
  /* #ifdef MP-WEIXIN */
  font-size: $mp;
  /* #endif */
  /* #ifdef APP-PLUS */
  font-size: $app;
  /* #endif */
}

// 安全区域适配
@mixin safe-area($property: padding-bottom, $value: 0) {
  #{$property}: $value;
  /* #ifdef APP-PLUS */
  #{$property}: constant(safe-area-inset-bottom);
  #{$property}: env(safe-area-inset-bottom);
  /* #endif */
}

// 使用示例
.container {
  @include responsive-font(16px, 28rpx, 14px);
  @include safe-area(padding-bottom, 20px);
}
```

---

### 6. 跨平台路由跳转

```typescript
// utils/router.ts

interface NavigateOptions {
  url: string
  type?: 'navigateTo' | 'redirectTo' | 'reLaunch' | 'switchTab'
  params?: Record<string, any>
}

/**
 * 跨平台路由跳转
 */
export function navigate(options: NavigateOptions) {
  const { url, type = 'navigateTo', params = {} } = options

  // 构建查询参数
  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')

  const fullPath = queryString ? `${url}?${queryString}` : url

  // #ifdef H5
  const router = useRouter()
  switch (type) {
    case 'navigateTo':
      router.push(fullPath)
      break
    case 'redirectTo':
      router.replace(fullPath)
      break
    case 'reLaunch':
      router.push({ path: fullPath, replace: true })
      break
  }
  // #endif

  // #ifndef H5
  switch (type) {
    case 'navigateTo':
      uni.navigateTo({ url: fullPath })
      break
    case 'redirectTo':
      uni.redirectTo({ url: fullPath })
      break
    case 'reLaunch':
      uni.reLaunch({ url: fullPath })
      break
    case 'switchTab':
      uni.switchTab({ url: fullPath })
      break
  }
  // #endif
}

// 便捷方法
export function goTo(url: string, params?: Record<string, any>) {
  navigate({ url, params })
}

export function redirect(url: string, params?: Record<string, any>) {
  navigate({ url, type: 'redirectTo', params })
}
```

---

## 平台能力差异对照表

| 功能 | H5 | 微信小程序 | 支付宝小程序 | App |
|------|-----|-----------|------------|-----|
| 路由模式 | history/hash | 页面栈 | 页面栈 | 页面栈 |
| 存储 API | localStorage | wx.setStorage | my.setStorage | uni.setStorage |
| 网络请求 | axios/fetch | wx.request | my.request | uni.request |
| 分享功能 | navigator.share | wx.shareAppMessage | my.shareAppMessage | plus.share |
| 支付 | 跳转页面 | wx.requestPayment | my.tradePay | uni.requestPayment |
| 文件上传 | FormData | wx.uploadFile | my.uploadFile | uni.uploadFile |
| 扫码 | 浏览器 API | wx.scanCode | my.scan | uni.scanCode |

---

## 常见错误

### 错误 1：忘记条件编译导致 API 报错

```typescript
// ❌ 错误：wx 对象在 H5 不存在
function login() {
  wx.login({
    success: (res) => console.log(res.code)
  })
}

// ✅ 正确：添加条件编译
function login() {
  // #ifdef MP-WEIXIN
  wx.login({
    success: (res) => console.log(res.code)
  })
  // #endif
}
```

### 错误 2：CSS 样式未隔离

```css
/* ❌ 错误：所有平台都会应用 */
.button {
  cursor: pointer;  /* 小程序不支持 */
}

/* ✅ 正确：H5 专用样式 */
/* #ifdef H5 */
.button {
  cursor: pointer;
}
/* #endif */
```

---

## 触发关键词

- 跨平台
- 条件编译
- UniApp
- 多端发布
- 小程序
- H5

---

## 相关文件

- [ui-mobile.md](./ui-mobile.md) - 移动端开发规范
- [store-mobile.md](./store-mobile.md) - 移动端状态管理
- [ui-design-mobile.md](./ui-design-mobile.md) - 移动端设计规范

---

*更新时间：2026-04-06*  
*RuoYi-Vue-Plus AI 开发助手*
