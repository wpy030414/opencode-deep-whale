# Spec — qwenwork 主题 CSS（skin.css）

**对应模块**：`packages/skins/qwenwork/src/skin.css`

## 要实现什么

一份手写的组件样式文件（约 90 行），覆盖 QwenWork 的布局与装饰层。**所有颜色值已移入 token-mapping.css**（见 DECISIONS D-021），本文件只保留组件规则。

## 行为应该是什么

当 `<html data-skin="active">` 存在时：

1. 主内容区全不透明背景（`var(--bg-card-z1)`）——禁止透明/半透明（可读性，DECISIONS D-020）
2. 主聊天卡片（`agents-parchment-paper-surface` / `workbench-card`）叠加宫殿背景（`::before`，opacity 0.24，昼/夜随 data-theme 分支）
3. 同一卡片 `::after` 贴底左右两侧叠角色立绘（`background-image: var(--character-left), var(--character-right)`，位置 10px / 高度 86% / 78%）
4. 卡片子元素 `position: relative; z-index: 2`——内容在装饰层之上
5. 品牌化调整：隐藏问题反馈 / 用量 / 新任务按钮等原生入口；侧边栏品牌区加「ClaudeWork」文字（`::after`）
6. 删除 `data-skin` 属性 → 全部规则失效 → 还原原生主题

## 选择器结构（全部 scoped 在 html[data-skin] 下）

| 语义 | 选择器要点 |
|---|---|
| 主内容区不透明 | `[class*="agents-content-area"]` / `[class*="agents-inner-view-clamp"]` → `background: var(--bg-card-z1)` |
| 宫殿背景（昼） | `html[data-skin][data-theme="light"] ...::before` + `:not([data-theme])`（跟随系统浅色） |
| 宫殿背景（夜） | `html[data-skin][data-theme="dark"] ...::before` |
| 角色立绘 | `...::after`（两图 one background-image 列表） |
| 内容层级 | 卡片 `> *` → `z-index: 2` |
| 代码文字 | `html[data-skin] code { color: #fff }` |
| 品牌化隐藏 | 问题反馈 / 查看我的用量 / 新任务按钮 / 首页推荐提示词槽等 `display: none` |

**装饰层排除**：`[class*="right-dock-panel"]`（右侧辅助面板）与 `[class*="aux-panel"]` 不挂宫殿/立绘——它们是边栏，不是主卡片。

## 输入

由 bootstrap 注入的 CSS 变量：

| 变量 | 值 |
|---|---|
| `--background-day` | `url(data:image/webp;base64,...)` |
| `--background-night` | `url(data:image/webp;base64,...)` |
| `--character-left` | `url(data:image/webp;base64,...)` |
| `--character-right` | `url(data:image/webp;base64,...)` |

由 token-mapping.css 定义的 QwenWork 变量：`--bg-card-z1` 等（不透明）。

QwenWork 自己设置的属性：`data-theme`（light / dark / glass / classic / parchment 变体；跟随系统时不设置）。

## 约束

- 所有选择器必须 scoped 在 `html[data-skin]` 之下
- 不用 `!important`（除非排除弹窗装饰，见下）
- **不硬编码颜色**（必须走 var() 或装饰层固有值如 opacity）
- 不在 CSS 里写死立绘路径（必须用 `var(--background-day)` 等）

## 边界条件

1. **`data-skin` 不存在**：规则全部失效
2. **`data-theme` 未设置**（跟随系统）：昼/夜通过 `:not([data-theme])` + prefers-color-scheme（token-mapping 负责）分支
3. **卡片容器 `::before` / `::after` 被占用**：该容器不展示装饰（可接受）
4. **窗口极窄**：立绘按比例缩放，不截断
5. **弹窗**：不挂装饰（选择器排除链）

## 验收标准

- [x] light 主题下深海蓝调可见、宫殿昼图
- [x] dark 主题下深海蓝调可见、宫殿夜图
- [x] 角色立绘贴底左右两侧，不遮挡文字
- [x] 主内容区文字可读（不透明背景 + 对比度全绿）
- [x] 删除 `data-skin` 后原生主题原样出现
- [x] 品牌化调整（ClaudeWork 标识）生效

## 如何判断任务已经完成

apply 后亮/暗/跟随系统三模式视觉舒服，文字无叠加装饰层的可读性问题。
