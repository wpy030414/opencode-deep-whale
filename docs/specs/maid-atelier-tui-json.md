# spec: maid-atelier.tui.json

## 概述

TUI（终端版 opencode）主题配置文件。提供与桌面端一致的深海女仆工坊配色，采用 flat JSON 格式。

## 文件

`src/maid-atelier.tui.json`

## Schema

```json
{
  "$schema": "https://opencode.ai/themes/theme.json",
  "name": "深海女仆工坊 (Maid Atelier)",
  "id": "maid-atelier",
  "primary": "...",
  "secondary": "...",
  "accent": "...",
  "text": "...",
  "background": "...",
  "border": "...",
  "diff": { ... },
  "markdown": { ... },
  "syntax": { ... }
}
```

## 色彩方案

基于暗色调设计（TUI 不支持亮/暗切换）。

| 字段 | 值 | 说明 |
|---|---|---|
| `primary` | `#8CA4DC` | 主色（星光蓝） |
| `secondary` | `#A5B8E8` | 辅助色 |
| `accent` | `#E2CFAA` | 强调色（月光金） |
| `text` | `#E5EAF6` | 文本色（星光白蓝） |
| `background` | `#080F27` | 背景色（深海夜蓝） |
| `border` | `#31497F` | 边框色 |

## 子分类

### diff

| 字段 | 值 | 说明 |
|---|---|---|
| `add` | `#2E8A58` | 添加行背景 |
| `delete` | `#B93A32` | 删除行背景 |
| `addForeground` | `#B8E9C9` | 添加行前景 |
| `deleteForeground` | `#F7BEB6` | 删除行前景 |

### markdown

涵盖 heading、link、code、blockquote、emphasis、strong 等 12 个字段，配色与桌面端暗色主题的 `markdown-*` 变量同源。

### syntax

涵盖 comment、keyword、string、primitive、type、constant 等 20 个字段，配色与桌面端暗色主题的 `syntax-*` 变量同源。

## 安装

```bash
cp ./src/maid-atelier.tui.json "$HOME/.config/opencode/themes/maid-atelier.json"
# opencode.json: "theme": "maid-atelier"
```

## 约束

- 所有颜色值为 6 位 hex（不含 alpha），TUI 不支持透明度。
- 与桌面端暗色主题保持视觉一致性，但不要求数值精确匹配（TUI 的色彩空间可能不同）。
- 键名必须与 OpenCode TUI 主题 schema 精确匹配。
