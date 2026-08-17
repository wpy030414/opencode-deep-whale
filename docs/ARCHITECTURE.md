# ARCHITECTURE · 深海女仆工坊

## 系统概览

```
┌─────────────────────────────────────────────────────────┐
│                    opencode-deep-whale                   │
│                      (本仓库)                             │
│                                                          │
│  ┌──────────┐  ┌────────────┐  ┌─────────────────────┐  │
│  │ index.ts │─▶│patch-asar  │──│ build-css.ts        │  │
│  │ (入口)    │  │.ts (引擎)   │  │ (CSS 生成器)        │  │
│  └──────────┘  └─────┬──────┘  └───────┬─────────────┘  │
│                      │                  │                │
│                      │    ┌─────────────┤                │
│                      │    │             │                │
│               ┌──────▼────▼───┐  ┌──────▼──────────────┐ │
│               │ inject.js     │  │ desktop.json        │ │
│               │ (DOM 注入层)   │  │ (主题色板)           │ │
│               └───────────────┘  └─────────────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │ public/*.webp (素材资源)                           │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────┬───────────────────────────────┘
                           │
                    pnpm apply
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                 OpenCode Desktop                          │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ app.asar                                            │  │
│  │                                                     │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │ out/renderer/oc-theme-preload.js (注入点)      │   │  │
│  │  │                                              │   │  │
│  │  │  原始预载逻辑 (40行)                           │   │  │
│  │  │  + data-maid-skin 属性                        │   │  │
│  │  │  + <style id="oc-maid-atelier"> (皮肤 CSS)    │   │  │
│  │  │  + maid-atelier.inject.js (DOM 注入)          │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │                                                     │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │ out/renderer/favicon-v3.svg (替换为女仆徽标)  │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  渲染进程                                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ html[data-maid-skin="deep-sea-maid-atelier"]        │  │
│  │  ├── CSS 变量覆盖 (palette + v2Overrides)            │  │
│  │  ├── 角色立绘 (CSS background-image)                 │  │
│  │  ├── 宫殿背景 (::before pseudo-element)              │  │
│  │  ├── 透明层 (sidebar, main, prompt-dock)            │  │
│  │  └── DOM 装饰 (favicon, logo-mark, avatar)          │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## 模块关系

### 构建时（Build-time）

```
index.ts ──────────────────────────────────────────┐
  │ CLI 参数解析                                     │
  ▼                                                │
patch-asar.ts                                      │
  ├── build-css.ts ──┐                              │
  │   ├── 读取 public/*.webp → base64 data URI      │
  │   ├── 读取 maid-atelier.desktop.json → 色板变量   │
  │   ├── 拼接静态 CSS 规则 (RULES)                  │
  │   └── 写入 src/build/maid-atelier.user.css       │
  │                                                  │
  ├── asar.extractAll(app.asar → tempDir)           │
  ├── 改写 oc-theme-preload.js:                     │
  │   原始内容 + bootstrap(属性 + CSS) + inject.js    │
  ├── 替换 favicon-v3.svg                           │
  ├── asar.createPackage(tempDir → out.asar)        │
  ├── 校验 marker 存在                               │
  └── 安装 out.asar → app.asar                      │
```

### 运行时（Runtime）

```
OpenCode 启动
  │
  ▼
oc-theme-preload.js 执行（<head> 中，app bundle 之前）
  │
  ├── 原始主题预载逻辑（~40行）
  │   └── 设置 html[data-color-scheme]
  │
  ├── Bootstrap IIFE
  │   ├── 设置 html[data-maid-skin="deep-sea-maid-atelier"]
  │   ├── 创建 <style id="oc-maid-atelier">
  │   └── 注入皮肤 CSS（变量覆盖 + 静态规则）
  │
  └── inject.js
      ├── DOMContentLoaded / readyState 检查
      ├── install():
      │   ├── 重路由默认项目头像 → maid icon data URI
      │   └── 替换侧栏 logo-mark SVG 内容
      ├── setInterval 重试（500ms × 60 次）
      └── MutationObserver 防 SPA 重渲染丢失
```

## 数据流

### 素材流

```
public/*.webp ──(读取)──▶ build-css.ts ──(base64)──▶ CSS 变量
                                                    --maid-palace-day
                                                    --maid-palace-night
                                                    --maid-maid-left
                                                    --maid-maid-right
                                                        │
                                                        ▼
                                              CSS background-image
                                              CSS ::before background
```

### 色板流

```
maid-atelier.desktop.json
  ├── light.overrides ──────▶ html[data-maid-skin][data-color-scheme="light"]
  ├── light.v2Overrides ───▶   CSS 变量覆盖
  ├── dark.overrides ───────▶ html[data-maid-skin][data-color-scheme="dark"]
  └── dark.v2Overrides ────▶   CSS 变量覆盖
```

## 关键设计约束

| 约束 | 实现方式 |
|---|---|
| 不触碰业务逻辑 | 仅 CSS 变量覆盖 + DOM 装饰，不修改事件/服务/模型 |
| 离线可用 | 所有素材 base64 内嵌，零远程请求 |
| 可卸载 | 移除 `data-maid-skin` 属性即恢复原生样式 |
| 跨平台 | `os.platform()` 分发路径/命令，支持 win32/darwin/linux |
| 幂等性 | marker 检测防止重复补丁，`--force` 从 pristine 备份重打 |
| 完整性 | asar 重打包时自动重算 integrity，应用不校验外部哈希 |

## 稳定性边界

本架构在以下条件范围内保持稳定：

1. **OpenCode 不改变 `oc-theme-preload.js` 的入口文件名和基本结构**（包含 `opencode-theme-id` 字符串）。
2. **OpenCode 的 CSS 变量命名体系不发生重大重构**（palette / v2Overrides 键名稳定）。
3. **OpenCode 的 DOM 结构保留 `data-component` 属性**（inject.js 依赖的选择器锚点）。

当上述任一条件不满足时，需要更新对应的注入逻辑，但整体架构（asar 提取 → 注入 → 重打包 → 安装）不受影响。
