# spec: maid-atelier.inject

## 概述

属性维护层。在 OpenCode 渲染进程中运行，负责维护 `html[data-maid-skin]` 属性，防止 React 重渲染将其清除。

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

检查 `html` 元素的 `data-maid-skin` 属性，若值不为 `"deep-sea-maid-atelier"`，则设置为该值。

### `start()`

1. 调用 `ensureSkinAttr()`（最早设置属性，确保 CSS 立即生效）。
2. 若 `window.MutationObserver` 可用：
   - 创建 Observer 实例
   - 监听 `document.documentElement` 的 `attributes` 变化
   - `attributeFilter: ['data-maid-skin']`
   - 每次变化调用 `ensureSkinAttr()` 重新设置属性

## 行为说明

- **职责简化**：本文件仅负责维护 `data-maid-skin` 属性，不执行任何 DOM 替换操作（favicon/logo/avatar）。
- **防重渲染清除**：React 可能会在重渲染时清除 `html` 元素上的自定义属性，MutationObserver 检测到后立即重新设置。
- **无重试逻辑**：早期版本使用 `setInterval` 重试，现已简化为仅依赖 MutationObserver。

## 约束

- **无全局污染**：IIFE 封装，不暴露任何全局变量。
- **无远程请求**：纯本地属性维护，不触发网络请求。
- **兼容性**：使用 `var`（非 `let`/`const`）和 ES5 语法，确保在旧版 Electron 中运行。
- **幂等性**：`ensureSkinAttr()` 可重复调用，属性值始终为 `"deep-sea-maid-atelier"`。

## 错误处理

- `MutationObserver` 不可用：跳过（属性仅在启动时设置一次，无持续维护）。

## 历史

早期版本包含 `install()` 函数，负责替换 favicon SVG、logo-mark 和默认项目头像。但由于 React 频繁重渲染导致替换丢失，且 MutationObserver 持续监听带来性能开销，后续版本简化为仅维护 `data-maid-skin` 属性（见 D-011）。
