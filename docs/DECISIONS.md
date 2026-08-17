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

## D-002: 素材文件打包入 asar，通过 `oc://` 协议加载

**决策**：将 webp 图片作为独立文件复制到 `out/renderer/images/`，在 CSS 中通过 `oc://renderer/images/...` URL 引用。

**原因**：
- 独立文件便于维护和调试（直接编辑 webp，无需重新编码）。
- `oc://` 是 OpenCode 的内部协议，支持加载 `out/renderer/` 下的任意文件。
- 素材打包入 asar，离线可用，无网络请求。

**权衡**：asar 文件会增大（webp 文件未压缩），但在可接受范围内。

**历史**：早期版本使用 base64 data URI 内嵌（见 D-002-old），后来重构为独立文件以提高可维护性。

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

## D-005: CSS 通过 `<link>` 标签加载，而非内联 `<style>`

**决策**：Bootstrap IIFE 创建 `<link id="oc-maid-atelier">` 标签加载 `oc://renderer/maid-atelier.css`，而非将 CSS 内联到 `<style>` 标签。

**原因**：
- CSS 文件独立存在于 asar 中，便于调试（DevTools 可直接定位文件）。
- 避免 bootstrap 代码过大（CSS 文件数万字符）。
- 浏览器对 `<link>` 标签的加载和解析有优化路径。

**权衡**：需要确保 `oc://` 协议支持加载 CSS 文件（已验证可行）。

**历史**：早期版本将 CSS 内联到 `<style>` 标签，后来重构为 `<link>` 以提高可维护性。

---

## D-006: TypeScript + tsx 直接执行，无编译步骤

**决策**：使用 `tsx` 直接运行 TypeScript 源码，不经过 `tsc` 编译。

**原因**：
- 本项目是工具脚本（一次性运行），不需要产出 JS 构建产物。
- `tsx` 零配置，开发体验好。
- `tsconfig.json` 仅用于编辑器类型检查，不参与运行。

---

## D-007: 色板分为 legacy overrides 和 v2 overrides 两层

**决策**：`maid-atelier.css` 中 light/dark 各包含两段 CSS 规则：legacy 变量（`--background-base` 等）和 v2 设计系统变量（`--v2-background-bg-base` 等）。

**原因**：
- OpenCode 的 CSS 变量体系经历了从 legacy 到 v2 的迁移。
- 两层都覆盖确保在新旧版本的 OpenCode 上都能生效。
- v2 变量内部大量使用 `var(--v2-grey-100)` 等引用，形成完整的色阶体系。

---

## D-008: 宫殿背景使用 `::before` 伪元素 + 低透明度

**决策**：宫殿背景图通过 `::before` 伪元素叠加在主内容卡片上，opacity 设为 0.24。

**原因**：
- 不占用额外的 DOM 节点，纯 CSS 实现。
- 低透明度（24%）确保背景图营造氛围但不遮挡文本可读性。
- `pointer-events: none` 确保不影响交互。
- 亮/暗模式分别使用 day/night 版本的宫殿图，跟随 `data-color-scheme` 自动切换。

---

## D-009: 角色立绘使用 `background-image` 而非 `<img>` 标签

**决策**：左右角色立绘通过 CSS `background-image` 挂在内容卡片上，而非注入 `<img>` DOM 节点。

**原因**：
- 不需要 DOM 节点，减少 React 重渲染时的干扰。
- CSS 控制尺寸和位置更灵活（`background-size: auto 86%, auto 78%`）。
- 立绘作为装饰层，不需要无障碍属性（alt text 等）。

---

## D-010: TUI 主题采用 flat JSON 格式

**决策**：`maid-atelier.tui.json` 使用扁平的 key-value 格式（与 OpenCode TUI 主题 schema 一致），不嵌套 light/dark。

**原因**：
- OpenCode TUI 的主题系统独立于桌面端，使用不同的 schema。
- TUI 不支持亮/暗切换，只提供单一配色方案（基于暗色调）。
- 用户只需将 JSON 文件拷贝到 `~/.config/opencode/themes/` 即可生效。

---

## D-011: inject.js 简化为仅维护 `data-maid-skin` 属性

**决策**：`maid-atelier.inject.js` 不再执行 favicon/logo/avatar 的 DOM 替换，仅负责维护 `html[data-maid-skin]` 属性。

**原因**：
- 早期版本尝试在运行时替换 favicon SVG 和默认项目头像，但 OpenCode 的 React 组件频繁重渲染导致替换丢失。
- MutationObserver 持续监听 DOM 变化并重试替换，带来不必要的性能开销。
- 简化后的 inject.js 只关注属性维护，MutationObserver 仅监听 `data-maid-skin` 属性变化，逻辑更清晰。

**权衡**：favicon 和默认头像保持 OpenCode 原生样式，但这不影响皮肤的整体视觉效果（宫殿背景、角色立绘、色板覆盖是核心）。

---

## D-012: CSS 直接编辑，无生成步骤

**决策**：`src/maid-atelier.css` 是手动编辑的源文件，不再通过 `build-css.ts` 从 JSON 色板生成。

**原因**：
- 早期版本使用 `build-css.ts` 从 `maid-atelier.desktop.json` 生成 CSS，但 JSON → CSS 的转换增加了理解成本。
- 直接编辑 CSS 更直观，IDE 有语法高亮和自动补全。
- 图片 URL 直接写在 CSS 变量中，无需在构建时插入 base64 data URI。

**权衡**：色板变量较多（legacy + v2 各约 150 个），手动编辑需要谨慎，但 CSS 文件结构清晰，按 light/dark 分段，易于维护。

**历史**：此决策与 D-002、D-005 共同构成了从"动态生成 + 内嵌"到"静态编辑 + 独立文件"的架构演进。
