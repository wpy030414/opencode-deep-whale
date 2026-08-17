# ARCHITECTURE · 深海女仆工坊

## 系统概览

```
┌─────────────────────────────────────────────────────────┐
│                    opencode-deep-whale                   │
│                      (本仓库)                             │
│                                                          │
│  ┌──────────┐  ┌────────────┐                            │
│  │ index.ts │─▶│patch-asar  │                            │
│  │ (入口)    │  │.ts (引擎)   │                            │
│  └──────────┘  └─────┬──────┘                            │
│                      │                                   │
│               ┌──────▼───────┐  ┌────────────────────┐   │
│               │ inject.js    │  │ maid-atelier.css   │   │
│               │ (属性维护层)  │  │ (色板 + 布局规则)   │   │
│               └──────────────┘  └────────────────────┘   │
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
│  │  │  + <link id="oc-maid-atelier"> (加载 CSS)     │   │  │
│  │  │  + maid-atelier.inject.js (属性维护)           │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  │                                                     │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │ out/renderer/maid-atelier.css (皮肤样式表)    │   │  │
│  │  │ out/renderer/images/*.webp (素材图片)          │   │  │
│  │  └──────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  渲染进程                                                  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ html[data-maid-skin="deep-sea-maid-atelier"]        │  │
│  │  ├── CSS 变量覆盖 (legacy + v2)                      │  │
│  │  ├── 角色立绘 (CSS background-image, oc:// 引用)     │  │
│  │  ├── 宫殿背景 (::before pseudo-element)              │  │
│  │  └── 透明层 (sidebar, main, prompt-dock)            │  │
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
  ├── 读取 src/maid-atelier.css (色板 + 布局规则)     │
  │                                                  │
  ├── asar.extractAll(app.asar → tempDir)           │
  ├── 改写 oc-theme-preload.js:                     │
  │   原始内容 + bootstrap(属性 + CSS link) + inject.js│
  ├── 复制 maid-atelier.css → out/renderer/          │
  ├── 复制 public/*.webp → out/renderer/images/      │
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
  │   ├── 创建 <link id="oc-maid-atelier">
  │   └── 加载 oc://renderer/maid-atelier.css
  │
  └── inject.js
      ├── DOMContentLoaded / readyState 检查
      ├── ensureSkinAttr(): 维护 html[data-maid-skin] 属性
      └── MutationObserver: 监听属性变化，防止被 React 重渲染清除
```

## 数据流

### 素材流

```
public/*.webp ──(复制)──▶ out/renderer/images/*.webp
                                      │
                                      │  CSS 变量引用
                                      ▼
                              maid-atelier.css
                              --maid-palace-day: url(oc://renderer/images/maid-atelier-palace-day-v4.webp)
                              --maid-palace-night: url(oc://renderer/images/maid-atelier-palace-night-v4.webp)
                              --maid-maid-left: url(oc://renderer/images/maid-atelier-maid-left-v5.webp)
                              --maid-maid-right: url(oc://renderer/images/maid-atelier-maid-right-v6.webp)
                                      │
                                      ▼
                            CSS background-image
                            CSS ::before background
```

### 色板流

```
maid-atelier.css
  ├── html[data-maid-skin][data-color-scheme="light"] { ... legacy overrides ... }
  ├── html[data-maid-skin][data-color-scheme="light"] { ... v2 overrides ... }
  ├── html[data-maid-skin][data-color-scheme="dark"]  { ... legacy overrides ... }
  └── html[data-maid-skin][data-color-scheme="dark"]  { ... v2 overrides ... }
```

## 关键设计约束

| 约束 | 实现方式 |
|---|---|
| 不触碰业务逻辑 | 仅 CSS 变量覆盖 + 布局调整，不修改事件/服务/模型 |
| 离线可用 | 素材文件打包入 asar，零远程请求 |
| 可卸载 | 移除 `data-maid-skin` 属性即恢复原生样式 |
| 跨平台 | `os.platform()` 分发路径/命令，支持 win32/darwin/linux |
| 幂等性 | marker 检测防止重复补丁，`--force` 从 pristine 备份重打 |
| 完整性 | asar 重打包时自动重算 integrity，应用不校验外部哈希 |

## 稳定性边界

本架构在以下条件范围内保持稳定：

1. **OpenCode 不改变 `oc-theme-preload.js` 的入口文件名和基本结构**（包含 `opencode-theme-id` 字符串）。
2. **OpenCode 的 CSS 变量命名体系不发生重大重构**（legacy + v2 变量名稳定）。
3. **OpenCode 的 `oc://` 协议支持加载 `out/renderer/` 下的任意文件**（当前用于加载 CSS 和图片）。

当上述任一条件不满足时，需要更新对应的注入逻辑，但整体架构（asar 提取 → 注入 → 重打包 → 安装）不受影响。
