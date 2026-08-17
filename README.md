# opencode-deep-whale · 深海女仆工坊

**opencode 桌面端的 asar 补丁皮肤注入器**——将"深海女仆工坊"（Maid Atelier）主题皮肤打入 OpenCode Desktop 的 `app.asar`，覆盖亮/暗双主题色板、角色立绘、宫殿背景与 DOM 装饰层。

## 当前状态

- ✅ 跨平台支持（Windows / macOS / Linux）
- ✅ 亮色 / 暗色双主题完整覆盖
- ✅ 一键安装 / 还原 / 自动重启
- ✅ 纯展示层注入，不修改任何业务逻辑

## 核心技术

| 层 | 技术 | 说明 |
|---|---|---|
| 打包 | `@electron/asar` | 提取 / 重打包 Electron asar 归档 |
| 运行时 | `tsx` (ES2022 + NodeNext) | TypeScript 直接执行，无编译步骤 |
| 注入点 | `out/renderer/oc-theme-preload.js` | 在 app bundle 之前执行的预载脚本 |
| 样式加载 | `oc://renderer/maid-atelier.css` | 通过 `<link>` 标签加载独立 CSS 文件 |
| 素材 | `oc://renderer/images/*.webp` | 独立 webp 文件，打包入 asar，CSS 变量引用 |
| CSS 作用域 | `html[data-maid-skin]` | 高特异性选择器，不影响未激活状态 |

## 运行

```bash
# 前置
pnpm install

# 1. 关闭 OpenCode（必须，app.asar 正在被占用时无法替换）
# 2. 一键打补丁
pnpm apply

# 3. OpenCode 会自动重启，深海女仆工坊生效
```

### CLI 参数

```bash
pnpm apply -- --no-force       # 不强制重打（保留已补丁状态直接跳过）
pnpm apply -- --no-backup      # 跳过备份
pnpm apply -- --allow-running  # 允许 OpenCode 运行中打补丁（测试用）
```

### TUI（终端版）安装

```bash
cp ./src/maid-atelier.tui.json "$HOME/.config/opencode/themes/maid-atelier.json"
# 然后在 opencode.json 中设置 "theme": "maid-atelier"
```

## 项目结构

```
opencode-deep-whale/
├── public/                          # 素材资源（webp 图片）
│   ├── maid-atelier-palace-day-v4.webp
│   ├── maid-atelier-palace-night-v4.webp
│   ├── maid-atelier-maid-left-v5.webp
│   ├── maid-atelier-maid-right-v6.webp
│   └── maid-*.webp                  # 装饰素材（花边、角饰等，暂未使用）
├── src/
│   ├── index.ts                     # 入口：CLI 参数解析 → patchAsar()
│   ├── patch-asar.ts                # 核心：asar 提取/注入/重打包/安装引擎
│   ├── maid-atelier.css             # 皮肤样式表（色板 + 布局规则，直接编辑）
│   ├── maid-atelier.inject.js       # DOM 注入层：维护 data-maid-skin 属性
│   └── maid-atelier.tui.json        # TUI 终端主题（flat 格式）
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── AGENTS.md
└── docs/
    ├── PRD.md
    ├── ARCHITECTURE.md
    ├── DECISIONS.md
    └── specs/
```

## 许可

本仓库各皮肤为**衍生创作**，整体以 **CC BY-NC-SA 4.0**（署名-非商业性使用-相同方式共享）发布，**禁止商业性使用**。

### 素材署名链

| 创作者 | 贡献 | 链接 |
|---|---|---|
| 上善 | 鲸鱼娘角色形象原作 | [Pixiv](https://www.pixiv.net/users/62155430) · [Bilibili](https://b23.tv/8h5L4xz) |
| ZipZipPipe | 加入 DeepSeek 元素的女仆鲸鱼娘二次设计 | [Pixiv](https://www.pixiv.net/users/18604994) · [Bilibili](https://b23.tv/Pnw6nG8) |
| Small-tailqwq | 三创皮肤工程与 asar 补丁 | GitHub |
| wpy030414 | 转向对 OpenCode 支持 | GitHub |
