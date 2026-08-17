# DECISIONS · 设计抉择记录

本文件记录项目演进过程中的关键设计决策及其背后的原因，防止架构漂移喵～

---

## D-001: 选择 asar 补丁而非浏览器扩展

**决策**：通过提取、改写、重打包 `app.asar` 的方式注入皮肤，而非开发独立的浏览器扩展或用户脚本。

**原因**：
- OpenCode Desktop 是 Electron 应用，渲染进程运行在 asar 归档内，不走常规浏览器扩展通道。
- asar 补丁能直接修改预载脚本（`oc-theme-preload.js`），在 app bundle 之前执行，获得最早的注入时机。
- 用户无需安装额外工具（如 Chrome 扩展），一条命令完成安装。

**权衡**：应用更新后需重跑补丁。但这是一行命令的事，且脚本自带已补丁检测和自动备份。

---

## D-002: 全部素材内嵌为 data URI

**决策**：所有 webp 图片在构建时转为 base64，作为 CSS 变量的 `url(data:image/webp;base64,...)` 值内嵌。

**原因**：
- 零远程依赖：皮肤离线可用，无网络请求。
- 零临时文件：不需要在磁盘上写入额外的素材文件。
- asar 归档天然支持大文件，base64 膨胀（~33%）在可接受范围内。
- 避免跨域 / CSP 问题。

**权衡**：生成的 CSS 文件较大（数 MB），但它是构建产物（`src/build/`），不入 git。

---

## D-003: CSS 选择器挂在 `html[data-maid-skin]` 下

**决策**：所有皮肤 CSS 规则都以 `html[data-maid-skin]` 为前缀，而非直接覆盖 `:root` 或全局选择器。

**原因**：
- **可卸载**：移除 `data-maid-skin` 属性即可恢复原生样式，无需重新加载。
- **高特异性**：`html[data-maid-skin][data-color-scheme="..."]` 的特异性高于 app 的 `:root` / `[data-color-scheme]` 规则，确保覆盖生效。
- **无副作用**：不影响未激活皮肤时的界面。

---

## D-004: 注入点选择 `oc-theme-preload.js`

**决策**：改写 `out/renderer/oc-theme-preload.js` 而非其他入口文件。

**原因**：
- 它是 OpenCode 原生主题系统的一部分，在 `<head>` 中、app bundle 之前执行。
- 执行时机最早，确保 CSS 变量在 React 渲染前就位，避免闪烁（FOUC）。
- 文件体积小巧（~40 行），便于安全地拼接 bootstrap 代码。
- 文件名和 `opencode-theme-id` 字符串可作为注入前的完整性校验锚点。

---

## D-005: MutationObserver 防 SPA 重渲染丢失

**决策**：在 `inject.js` 中使用 `MutationObserver` 监听 `document.body` 的 `childList` 和 `subtree` 变化，每次变化重新执行 `install()`。

**原因**：
- OpenCode 是 React SPA，路由切换或组件卸载/重挂载可能清除注入的 DOM 节点（如 logo-mark SVG 内容）。
- `install()` 是幂等的（通过 `data-maid-skin-owner` 属性防止重复修改），多次调用安全。
- 同时保留 `setInterval` 重试（500ms × 60 次）作为初始加载的兜底。

**权衡**：Observer 持续运行有微小的性能开销，但 `install()` 在无变更时几乎无操作（仅检查属性）。

---

## D-006: TypeScript + tsx 直接执行，无编译步骤

**决策**：使用 `tsx` 直接运行 TypeScript 源码，不经过 `tsc` 编译。

**原因**：
- 本项目是工具脚本（一次性运行），不需要产出 JS 构建产物。
- `tsx` 零配置，开发体验好。
- `tsconfig.json` 仅用于编辑器类型检查，不参与运行。

---

## D-007: 色板分为 `overrides` 和 `v2Overrides` 两层

**决策**：`maid-atelier.desktop.json` 中 light/dark 各包含 `overrides`（legacy 变量）和 `v2Overrides`（v2 设计系统变量）两个命名空间。

**原因**：
- OpenCode 的 CSS 变量体系经历了从 legacy（`--background-base` 等）到 v2（`--v2-background-bg-base` 等）的迁移。
- 两层都覆盖确保在新旧版本的 OpenCode 上都能生效。
- v2 变量内部大量使用 `var(--v2-grey-100)` 等引用，形成完整的色阶体系。

---

## D-008: 宫殿背景使用 `::before` 伪元素 + 低透明度

**决策**：宫殿背景图通过 `::before` 伪元素叠加在主内容卡片上，opacity 设为 0.24。

**原因**：
- 不占用额外的 DOM 节点，纯 CSS 实现。
- 低透明度（12%）确保背景图营造氛围但不遮挡文本可读性。
- `pointer-events: none` 确保不影响交互。
- 亮/暗模式分别使用 day/night 版本的宫殿图，跟随 `data-color-scheme` 自动切换。

---

## D-009: 角色立绘使用 `background-image` 而非 `<img>` 标签

**决策**：左右角色立绘通过 CSS `background-image` 挂在内容卡片上，而非注入 `<img>` DOM 节点。

**原因**：
- 不需要 DOM 节点，减少 React 重渲染时的干扰。
- CSS 控制尺寸和位置更灵活（`background-size: auto 78%` / `auto 72%`，偏移 16px）。
- 立绘作为装饰层，不需要无障碍属性（alt text 等）。

---

## D-010: TUI 主题采用 flat JSON 格式

**决策**：`maid-atelier.tui.json` 使用扁平的 key-value 格式（与 OpenCode TUI 主题 schema 一致），不嵌套 light/dark。

**原因**：
- OpenCode TUI 的主题系统独立于桌面端，使用不同的 schema。
- TUI 不支持亮/暗切换，只提供单一配色方案（基于暗色调）。
- 用户只需将 JSON 文件拷贝到 `~/.config/opencode/themes/` 即可生效。
