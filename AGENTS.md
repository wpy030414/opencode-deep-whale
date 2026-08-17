# AGENTS.md

本文件定义 Agent 在本仓库中工作时的边界与约束喵～

## Code Review Rules

### Skin Lifecycle

- 所有 DOM/CSS 变更、Observer、事件监听、定时器、动画帧、注入节点均视为皮肤自有状态。
- 标记以下路径中的任何泄漏风险：`apply()` 部分失败、销毁、重复激活、热切换遗留状态或误删其他激活态的状态。
- 安全路径：在可失败操作**之前**注册清理回调，保留精确的原始值和自有句柄，仅还原当前激活所修改的内容。

### Product Compatibility

- 本仓库**仅交付展示层皮肤**。
- 标记以下变更：修改 DSH 服务/事件/模型请求、要求远程运行时资源、遮挡原生控件/叠层、依赖不稳定 DOM 选择器且无安全降级。
- 安全路径：CSS 和 DOM 装饰限定在当前激活皮肤范围内，保持原生行为在亮/暗主题、窄/宽侧栏、对话/工作区视图、浏览器/桌面端布局下均正常。

### Distribution and Attribution

- 素材为 CC BY-NC-SA 4.0 衍生创作。
- 标记以下问题：源码或素材变更但产物未同步、生成包包含绝对路径或远程依赖、素材/许可变更破坏署名链。
- 安全路径：仅从仓库输入重新生成包，署名链变更时同步更新 `LICENSE` / `NOTICE`。

## Non-Goals（绝对不做的事）

1. **不修改 OpenCode 业务逻辑**：不触碰消息、事件、模型请求、API 调用。
2. **不引入远程资源依赖**：所有素材打包入 asar，皮肤离线可运行。
3. **不替换二进制系统资源**：任务栏图标（`*.ico`）、系统通知图标不做替换（无图像转换工具链）。
4. **不维护上游 OpenCode 代码**：本仓库是独立分发仓库，不是 OpenCode 的 fork。
5. **不自动检测上游更新**：`app.asar` 被应用更新后需用户手动重跑 `pnpm apply`。
6. **不扩展皮肤功能范围**：不加动画、不加音效、不加用户可配置面板——纯视觉主题。
7. **不支持浏览器端插件分发**：本仓库仅面向 opencode 桌面端 asar 补丁 + TUI 主题。

## 工作区约定

- **语言**：TypeScript（ES2022 + NodeNext），无编译步骤，`tsx` 直接执行。
- **包管理**：pnpm（`pnpm-workspace.yaml` 中 `allowBuilds.esbuild: true`）。
- **样式表**：`src/maid-atelier.css` 为直接编辑目标（色板 + 布局规则），无生成步骤。
- **素材**：`public/*.webp`，命名规则 `maid-atelier-<角色/场景>-<版本>.webp`。
- **CSS 选择器**：全部挂在 `html[data-maid-skin]` 下，禁止裸全局选择器。
- **图片加载**：通过 `oc://renderer/images/...` URL 引用，图片文件打包入 asar 的 `out/renderer/images/` 目录。
