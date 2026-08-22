# Spec — opencode 主题 CSS（skin.css）

**对应模块**：`packages/skins/opencode/src/skin.css`

## 要实现什么

一份手写的组件样式文件（约 90 行），覆盖 OpenCode 的布局与装饰层。**所有颜色值已移入 token-mapping.css**（见 DECISIONS D-021），本文件只保留组件规则。

## 行为应该是什么

当 `<html data-skin="active">` 存在时：

1. 主区域 / 侧栏导航 / 提示输入区背景清理：`main`、`[data-component="sidebar-nav-desktop/mobile"]` → `background: none`；侧栏轨道 `[data-component="sidebar-rail"]` → `background: var(--background-base)`
2. 主内容卡片（`[class*="bg-v2-background-bg-base"][class*="rounded-"]`，非弹窗、非按钮、无 data-component）：
   - `::before` 宫殿背景（opacity 0.24，昼/夜随 data-color-scheme 分支）
   - `::after` 角色立绘（`background-image: var(--character-left), var(--character-right)`，10px 贴底，86% / 78% 高度）
   - 子元素 `z-index: 2` 内容置顶
3. 新会话界面（`[data-component="session-new-design"]`）同样挂宫殿 + 立绘
4. 首页区块透明化：`section > [class*="bg-v2-background-bg-base"]`、home-session-group-header 系列 → `background: none !important`
5. 聊天视图透明化：`[data-session-title]`、tool-part-wrapper / session-turn-diffs-group 子元素、`[data-component="session-prompt-dock"]` → `background: none !important`
6. 文本气泡：`[data-component="text-part"]:has([data-slot$="wrapper"]) [data-slot$="body"]` → `var(--v2-background-bg-layer-03)` + padding + 圆角
7. 删除 `data-skin` 属性 → 全部规则失效 → 还原原生主题

## 选择器结构（全部 scoped 在 html[data-skin] 下）

| 语义 | 选择器要点 |
|---|---|
| 主区域透明 | `main` / `[data-component="sidebar-nav-*"]` → `background: none` |
| 侧栏轨道 | `[data-component="sidebar-rail"]` → `var(--background-base)` |
| 宫殿背景（昼） | `[data-color-scheme="light"] [class*="bg-v2-background-bg-base"][class*="rounded-"]:not([data-component]):not(button)::before` |
| 宫殿背景（夜） | `[data-color-scheme="dark"] ...::before` |
| 角色立绘 | `...::after`（两图 one background-image 列表） |
| 新会话装饰 | `[data-component="session-new-design"]::before / ::after` |
| 弹窗排除 | `[role="dialog"]` 内装饰 `content: none !important`、`position: static !important` |
| 首页透明 | `section > [class*="bg-v2-background-bg-base"]` 等 → `background: none !important` |
| 聊天透明 | `[data-session-title]` / `[data-component="tool-part-wrapper"] *` 等 |
| 消息气泡 | `[data-component="text-part"]:has(...)` → 层级背景 + 圆角 |

## 输入

由 bootstrap 注入的 CSS 变量：

| 变量 | 值 |
|---|---|
| `--background-day` | `url(data:image/webp;base64,...)` |
| `--background-night` | `url(data:image/webp;base64,...)` |
| `--character-left` | `url(data:image/webp;base64,...)` |
| `--character-right` | `url(data:image/webp;base64,...)` |

由 token-mapping.css 定义的 OpenCode 变量：`--background-base`、`--v2-background-bg-layer-03` 等。

OpenCode 自己设置的属性：`data-color-scheme`（light / dark）。

## 约束

- 所有选择器必须 scoped 在 `html[data-skin]` 之下
- 不用 `!important`（透明层清理场景除外——原生组件内联样式需要覆盖）
- **不硬编码颜色**（必须走 var()）
- 不在 CSS 里写死立绘路径（必须用 `var(--background-day)` 等）

## 边界条件

1. **`data-skin` 不存在**：规则全部失效
2. **弹窗**（model picker / 设置等 `[role="dialog"]`）：内部不渲染装饰层（`content: none` + `position: static`）
3. **按钮 / 带 data-component 的元素**：不挂装饰（排除链）
4. **窗口极窄**：立绘按比例缩放，不截断
5. **卡片容器伪元素被占用**：该容器不展示装饰（可接受）

## 验收标准

- [x] light / dark 主题下宫殿昼夜图正确切换
- [x] 角色立绘贴底左右两侧（主内容卡片 + 新会话界面）
- [x] 弹窗内无装饰层
- [x] 首页 / 聊天视图透明层生效
- [x] 删除 `data-skin` 后原生主题原样出现
- [x] 主内容区可读性不受影响（不透明内容承载区）

## 如何判断任务已经完成

apply 后亮/暗主题视觉舒服，弹窗正常无装饰，文字无叠加装饰层的可读性问题。
