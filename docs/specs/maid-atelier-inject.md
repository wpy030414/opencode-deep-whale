# spec: maid-atelier.inject

## 概述

DOM 注入层。在 OpenCode 渲染进程中运行，负责替换 favicon、logo-mark 和默认项目头像。通过 MutationObserver 保持注入节点在 SPA 重渲染后存活。

## 文件

`src/maid-atelier.inject.js`

## 运行环境

- Electron 渲染进程（`<head>` 中的预载脚本）
- 无模块系统（IIFE，`'use strict'`）
- 无 Node.js API（纯浏览器 API）

## 注入时机

```
document.readyState === 'loading'
  └── DOMContentLoaded → start()
document.readyState !== 'loading'
  └── 立即 start()
```

## 核心函数

### `ensureSkinAttr()`

确保 `html[data-maid-skin]` 属性值为 `"deep-sea-maid-atelier"`。

### `install()` → `boolean`

1. 检查 `#root` 是否存在（不存在返回 `false`，等待重试）。
2. 调用 `ensureSkinAttr()`。
3. **默认项目头像重路由**：
   - 选择器：`img[data-component="app-icon"]`
   - 条件：`src` 包含 `opencode.ai/favicon` 且未被本皮肤接管
   - 动作：替换 `src` 为 `ICON_DATA_URI`（data:image/webp;base64）
   - 标记：设置 `data-maid-skin-owner="true"` 防止重复修改
4. **Logo-mark SVG 替换**：
   - 选择器：`svg[data-component="logo-mark"]`
   - 条件：未被本皮肤接管
   - 动作：替换 `innerHTML` 为 `LOGO_MARK_SVG` 的内部路径（去掉外层 `<svg>` 标签）
   - 标记：设置 `data-maid-skin-owner="true"`
5. 返回 `true`。

### `start()`

1. `ensureSkinAttr()`（最早设置属性，确保 CSS 立即生效）。
2. 尝试 `install()`，成功则返回。
3. 启动 `setInterval` 重试（500ms × 60 次上限）。
4. 注册 `MutationObserver`：
   - 观察 `document.body` 的 `childList` + `subtree`
   - 每次变化调用 `install()`
   - 幂等性由 `data-maid-skin-owner` 属性保证

## 占位符

| 占位符 | 替换时机 | 替换内容 |
|---|---|---|
| `__MAID_ATELIER_ICON_B64__` | `patch-asar.ts` 构建时 | `public/maid-atelier-palace-day-v4.webp` 的 base64 编码 |

## 常量

### `ICON_DATA_URI`

```javascript
'data:image/webp;base64,__MAID_ATELIER_ICON_B64__'
```

用于替换默认项目头像的 data URI。

### `LOGO_MARK_SVG`

自定义的侧栏品牌 SVG（女仆风格 glyph），包含：
- 3 条 `<path>` 元素
- 使用 `var(--icon-weak-base)` 和 `var(--icon-strong-base)` 变量着色
- 自动跟随主题色变化

## 约束

- **幂等性**：所有 DOM 修改通过 `data-maid-skin-owner` 属性标记，重复执行 `install()` 不会重复修改。
- **无全局污染**：IIFE 封装，不暴露任何全局变量。
- **无远程请求**：所有素材为 data URI，不触发网络请求。
- **兼容性**：使用 `var`（非 `let`/`const`）和 ES5 语法，确保在旧版 Electron 中运行。
- **选择器稳定性**：依赖 `data-component` 属性而非 class name，对 CSS 重构有较好的容忍度。

## 错误处理

- `#root` 不存在：返回 `false`，由 `setInterval` 重试。
- `MutationObserver` 不可用：跳过（仅 `setInterval` 兜底）。
- 重试上限（60 次 / 30 秒）：静默停止，不报错。
