# spec: maid-atelier.css

## 概述

皮肤样式表。定义亮/暗双主题的完整 CSS 变量覆盖（legacy + v2），以及布局规则（宫殿背景、角色立绘、透明层）。直接编辑，无生成步骤。

## 文件

`src/maid-atelier.css`

## 结构

```css
/* 1. 素材变量声明 */
html[data-maid-skin] { --maid-palace-day: url(oc://renderer/images/maid-atelier-palace-day-v4.webp); }
html[data-maid-skin] { --maid-palace-night: url(oc://renderer/images/maid-atelier-palace-night-v4.webp); }
html[data-maid-skin] { --maid-maid-left: url(oc://renderer/images/maid-atelier-maid-left-v5.webp); }
html[data-maid-skin] { --maid-maid-right: url(oc://renderer/images/maid-atelier-maid-right-v6.webp); }

/* 2. 亮色主题变量覆盖 */
html[data-maid-skin][data-color-scheme="light"] {
  --background-base: #DCE6F5;
  /* ... legacy overrides (~120 个变量) ... */
}
html[data-maid-skin][data-color-scheme="light"] {
  --v2-background-bg-base: var(--v2-grey-100);
  /* ... v2 overrides (~150 个变量) ... */
}

/* 3. 暗色主题变量覆盖 */
html[data-maid-skin][data-color-scheme="dark"] {
  --background-base: #080F27;
  /* ... legacy overrides (~120 个变量) ... */
}
html[data-maid-skin][data-color-scheme="dark"] {
  --v2-background-bg-base: var(--v2-grey-1100);
  /* ... v2 overrides (~150 个变量) ... */
}

/* 4. 布局规则 */
/* 全局透明层、宫殿背景、角色立绘、对话框样式等 */
```

## 素材变量

| 变量名 | 引用文件 | 用途 |
|---|---|---|
| `--maid-palace-day` | `maid-atelier-palace-day-v4.webp` | 亮色宫殿背景 |
| `--maid-palace-night` | `maid-atelier-palace-night-v4.webp` | 暗色宫殿背景 |
| `--maid-maid-left` | `maid-atelier-maid-left-v5.webp` | 左侧角色立绘 |
| `--maid-maid-right` | `maid-atelier-maid-right-v6.webp` | 右侧角色立绘 |

## 色彩体系

### 亮色主题 (Light)

- **基调**：深海蓝 + 暖金色调
- **背景**：`#DCE6F5`（浅蓝灰）
- **文字**：`#172347`（深海墨蓝）
- **主色**：`#526AA8`（皇家蓝）
- **强调色**：`#C5A468`（暖金色）

### 暗色主题 (Dark)

- **基调**：深海夜空 + 星光蓝
- **背景**：`#080F27`（深海夜蓝）
- **文字**：`#E5EAF6`（星光白蓝）
- **主色**：`#8CA4DC`（星光蓝）
- **强调色**：`#E2CFAA`（月光金）

## 变量分类

### Legacy Overrides

| 类别 | 变量前缀 | 数量 | 说明 |
|---|---|---|---|
| 背景 | `background-*` | 4 | 页面背景层级 |
| 表面 | `surface-*` | ~20 | 卡片、面板、输入框表面 |
| 文本 | `text-*` | ~14 | 文字颜色层级 |
| 按钮 | `button-*` | 3 | 按钮状态 |
| 边框 | `border-*` | ~15 | 边框颜色状态 |
| 图标 | `icon-*` | ~15 | 图标颜色状态 |
| 语法高亮 | `syntax-*` | ~17 | 代码高亮 |
| Markdown | `markdown-*` | ~12 | Markdown 渲染 |
| Diff | `surface-diff-*` / `text-diff-*` | ~12 | 代码差异 |
| 头像 | `avatar-*` | 12 | 用户头像配色 |

### V2 Overrides

| 类别 | 变量前缀 | 说明 |
|---|---|---|
| 色阶 | `v2-grey-*` ~ `v2-pink-*` | 12 阶色阶（50-1200），10 个色系 |
| 语义映射 | `v2-background-*` | 背景语义变量，引用色阶 |
| 语义映射 | `v2-text-*` | 文本语义变量 |
| 语义映射 | `v2-icon-*` | 图标语义变量 |
| 语义映射 | `v2-border-*` | 边框语义变量 |
| 语义映射 | `v2-overlay-*` | 叠层/遮罩变量 |
| 语义映射 | `v2-state-*` | 状态色（success/warning/danger/info） |
| 语义映射 | `v2-avatar-*` | 头像背景/边框色 |

## 布局规则

| 选择器 | 效果 |
|---|---|
| `main`, `[sidebar-nav-*]` | 透明背景 |
| `[sidebar-rail]` | 半透明背景（`color-mix 82%`） |
| `[bg-v2-background-bg-base][rounded-]::before` | 宫殿背景叠加（opacity 0.24），亮/暗分别使用 day/night |
| `[bg-v2-background-bg-base][rounded-]::after` | 角色立绘（左右 background-image，86%/78% 高度，10px 偏移） |
| `[bg-v2-background-bg-base][rounded-] > *` | 子元素 `z-index: 2` 确保在伪元素之上 |
| `[session-new-design]::before` | 新会话界面宫殿背景 |
| `[session-new-design]::after` | 新会话界面角色立绘 |
| `[data-session-title]` | 透明背景 |
| `[session-prompt-dock]` | 透明背景 |

## 设计原则

1. **v2 色阶自引用**：语义变量引用色阶变量（如 `--v2-background-bg-base: var(--v2-grey-100)`），便于整体色调微调。
2. **亮/暗对称**：两套主题结构完全对称，仅颜色值不同。
3. **透明度编码**：部分值包含 alpha 通道（如 `#F8FAFFAE`、`#475B912E`），实现半透明效果。
4. **Diff 语义**：绿色系表示添加，红色系表示删除，与 Git 惯例一致。

## 约束

- 所有颜色值必须为有效的 CSS 颜色（hex / `var()` 引用）。
- 所有选择器必须以 `html[data-maid-skin]` 为前缀（高特异性，可卸载）。
- 图片 URL 使用 `oc://renderer/images/...` 协议。
- 文件结构按 light/dark 分段，便于维护。

## 依赖

- `oc://renderer/images/*.webp`：素材图片（由 patch-asar.ts 复制）

## 历史

早期版本通过 `build-css.ts` 从 `maid-atelier.desktop.json` 生成 CSS，并使用 base64 data URI 内嵌图片。后来重构为直接编辑的静态 CSS 文件，图片改为独立文件通过 `oc://` 协议加载（见 D-002、D-005、D-012）。
