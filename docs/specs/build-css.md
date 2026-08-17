# spec: build-css

## 概述

CSS 生成器。读取 `public/*.webp` 素材和 `maid-atelier.desktop.json` 色板，生成包含 data URI 变量、亮/暗主题覆盖和静态 CSS 规则的完整样式表。

## 文件

`src/build-css.ts`

## 输入

| 来源 | 路径 | 说明 |
|---|---|---|
| 素材 | `public/*.webp` | 4 张角色/场景图 + 装饰素材 |
| 色板 | `src/maid-atelier.desktop.json` | light/dark 的 overrides + v2Overrides |

## 输出

- `src/build/maid-atelier.user.css`（自动创建 `build/` 目录）

## 素材映射

| CSS 变量名 | 文件名 | 用途 |
|---|---|---|
| `--maid-palace-day` | `maid-atelier-palace-day-v4.webp` | 亮色宫殿背景 |
| `--maid-palace-night` | `maid-atelier-palace-night-v4.webp` | 暗色宫殿背景 |
| `--maid-maid-left` | `maid-atelier-maid-left-v5.webp` | 左侧角色立绘 |
| `--maid-maid-right` | `maid-atelier-maid-right-v6.webp` | 右侧角色立绘 |

## 生成结构

```css
/* 头部注释 */

/* 1. Data URI 变量声明 */
html[data-maid-skin] { --maid-palace-day: url(data:image/webp;base64,...); }
html[data-maid-skin] { --maid-palace-night: url(data:image/webp;base64,...); }
html[data-maid-skin] { --maid-maid-left: url(data:image/webp;base64,...); }
html[data-maid-skin] { --maid-maid-right: url(data:image/webp;base64,...); }

/* 2. 亮色主题变量覆盖 */
html[data-maid-skin][data-color-scheme="light"] {
  --background-base: #DCE6F5;
  /* ...overrides */
}
html[data-maid-skin][data-color-scheme="light"] {
  --v2-background-bg-base: var(--v2-grey-100);
  /* ...v2Overrides */
}

/* 3. 暗色主题变量覆盖 */
html[data-maid-skin][data-color-scheme="dark"] {
  --background-base: #080F27;
  /* ...overrides */
}
html[data-maid-skin][data-color-scheme="dark"] {
  --v2-background-bg-base: var(--v2-grey-1100);
  /* ...v2Overrides */
}

/* 4. 静态 CSS 规则 (RULES) */
/* 宫殿背景 ::before */
/* 角色立绘 background-image */
/* 新会话界面 */
/* 透明层 */
/* 对话框样式 */
```

## 静态规则清单 (RULES)

| 选择器 | 效果 |
|---|---|
| `[bg-v2-background-bg-base][rounded-]::before` | 宫殿背景叠加（opacity 0.12），亮/暗分别使用 day/night |
| `[bg-v2-background-bg-base][rounded-]` | 角色立绘（左右 background-image，78%/72% 高度，16px 偏移） |
| `[bg-v2-background-bg-base][rounded-] > *` | 子元素 `z-index: 1` 确保在 ::before 之上 |
| `[session-new-design]::before` | 新会话界面宫殿背景 |
| `[session-new-design]` | 新会话界面角色立绘 |
| `[session-prompt-dock]` | 提示输入栏透明（`background: transparent !important`） |
| `#root` | `position: relative; z-index: 1` |
| `main`, `[sidebar-nav-*]` | 透明背景 |
| `[sidebar-rail]` | 半透明背景（`color-mix 82%`） |
| `[dialog-v2] [dialog-container]` | 对话框毛玻璃效果（88% 透明度 + 阴影） |

## 导出 API

```typescript
export function buildCss(): string        // 返回完整 CSS 字符串
export function buildCssToFile(): string  // 写入文件，返回文件路径
```

## 约束

- 所有素材路径相对于 `ROOT`（项目根目录），不存在时抛出错误。
- `overrides` 和 `v2Overrides` 分两个独立的 CSS 块输出（特异性相同，但语义分离）。
- 变量名直接作为 CSS 属性输出（`--${key}: ${value}`），不加前缀。
- 生成的 CSS 不压缩、不混淆，便于调试。

## 依赖

- `node:fs`, `node:path`, `node:url`：文件系统和路径操作
- 无外部 npm 依赖
