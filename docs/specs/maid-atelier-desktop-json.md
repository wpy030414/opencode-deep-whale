# spec: maid-atelier.desktop.json

## 概述

桌面端主题色板配置文件。定义亮/暗双主题的完整 CSS 变量覆盖，包括 legacy `overrides` 和 v2 设计系统 `v2Overrides`。

## 文件

`src/maid-atelier.desktop.json`

## Schema

```json
{
  "$schema": "https://opencode.ai/desktop-theme.json",
  "name": "深海女仆工坊 (Maid Atelier)",
  "id": "maid-atelier",
  "light": {
    "palette": { ... },
    "overrides": { ... },
    "v2Overrides": { ... }
  },
  "dark": {
    "palette": { ... },
    "overrides": { ... },
    "v2Overrides": { ... }
  }
}
```

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
- **主色**：`#9BB0E1`（星光蓝）
- **强调色**：`#E2CFAA`（月光金）

## overrides 分类

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

## v2Overrides 分类

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

## 设计原则

1. **v2 色阶自引用**：语义变量引用色阶变量（如 `--v2-background-bg-base: var(--v2-grey-100)`），便于整体色调微调。
2. **亮/暗对称**：两套主题结构完全对称，仅颜色值不同。
3. **透明度编码**：部分值包含 alpha 通道（如 `#F8FAFFAE`、`#475B912E`），实现半透明效果。
4. **Diff 语义**：绿色系表示添加，红色系表示删除，与 Git 惯例一致。

## 约束

- 所有颜色值必须为有效的 CSS 颜色（hex / `var()` 引用）。
- 不允许引用外部 CSS 变量（自包含）。
- 键名必须与 OpenCode 的 CSS 变量名精确匹配（不含 `--` 前缀）。
- `palette` 字段为兼容字段，`build-css.ts` 不消费它。
