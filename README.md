# Personalized Agent — Universal Skin Pipeline

**通用皮肤引擎 monorepo**：将任意原始图片素材 → 按规则取色 → 生成设计 tokens → 应用到任何 GUI Agent。

## 这个项目是什么？

一套把「图片素材 → 可换肤的桌面端 GUI Agent」打通的全自动管线：

- **skin-core**：从图片提取颜色（k-means++ 聚类），生成 **46 个设计 tokens**（light / dark 两套完整方案）
- **skin-assets**：共享图片库（宫殿背景 + 角色立绘），以 `manifest.json` 统一角色映射
- **skins/<target>**：每个目标 app 一个皮肤包，只写 token-mapping + 组件 CSS + 打补丁引擎

当前已支持两个目标：**QwenWork Desktop**（QwenWorkCN）与 **OpenCode Desktop**，主题为「深海女仆工坊」。

## 为什么存在？

- **每个 GUI Agent 都要手写皮肤**：重复劳动，无法复用
- **取色靠人工**：设计师手动挑色，无法自动化
- **token 命名空间不统一**：每个 app 一套命名，皮肤移植成本高

把「取色」与「适配」解耦后，换新 target 只需写一份 token-mapping 和 CSS。

## 如何安装和运行？

前置：Node.js 20+、pnpm。

```bash
pnpm install

# 1. 从素材取色生成 tokens（默认只采 manifest 声明的 colorSource 图）
pnpm build-tokens

# 2. 预览取色结果
pnpm preview

# 3. 生成各 skin 的 token 映射 CSS
pnpm build-mapping

# 4. 给 QwenWork 打皮肤补丁（自动备份 + 重启）
pnpm apply:qwenwork

# 5. 给 OpenCode 打皮肤补丁
pnpm apply:opencode
```

还原皮肤：把 `app.asar.skin.bak` 覆盖回 `app.asar` 即可（apply 完成后控制台会打印命令）。

### 命令集

| 命令 | 说明 |
|---|---|
| `pnpm build-tokens` | 从 skin-assets 的 colorSource 图提取颜色，生成 light+dark 双套 tokens.json |
| `pnpm build-mapping` | 两个 skin 包各自读取 tokens，生成 `dist/token-mapping.css` |
| `pnpm preview` | 生成 palette.html 可视化预览（簇 + 双套 token） |
| `pnpm apply:qwenwork` | 给 QwenWorkCN Desktop 打补丁（二进制补丁策略） |
| `pnpm apply:opencode` | 给 OpenCode Desktop 打补丁（extract/repack 策略） |
| `pnpm dev:qwenwork` | 关闭 QwenWorkCN，带 `--enable-devtools` 重启 |
| `pnpm dev:opencode` | 关闭 OpenCode，带 `--enable-devtools` 重启 |

apply 支持参数（透传到各 skin 包）：

| 参数 | 默认 | 含义 |
|---|---|---|
| `--no-force` | force=true | 关闭强制重 patch（已打过补丁时报错） |
| `--no-backup` | false | 跳过备份（仍保留 pristine snapshot 供 --force 使用） |
| `--allow-running` | false | 不关闭运行中的 app |

## 当前处于什么状态？

- ✅ skin-core：k-means++ 确定性取色（mulberry32 种子 PRNG）+ 46 tokens light/dark 双套生成
- ✅ skin-assets：4 张立绘 + manifest（roles + colorSource 角色映射）
- ✅ skins/qwenwork：二进制补丁引擎 + token-mapping（~200 条映射）+ 组件 CSS
- ✅ skins/opencode：extract/repack 引擎 + token-mapping（~300 条映射）+ 组件 CSS
- ✅ 共享注入：bootstrap 构建 + data URI 图片注入 + `data-skin` 属性保活
- ✅ 双套对比度达标：light/dark 各渠道 28 项对比度检查全绿

## 使用了哪些核心技术？

| 层 | 技术 | 说明 |
|---|---|---|
| 取色 | sharp + k-means++ | 100x100 resize、每 2 像素采样、按 L* 亮度排序 |
| Token | 固定 schema | 46 tokens（neutral 12 / brand 6 / semantic 12 / text 5 / surface 4 / border 4 / input 2 / accent 1），light+dark 双套 |
| 映射 | 各 skin 包函数映射 | token-mapping.ts 把通用 tokens 映射到目标 CSS variables（支持计算与 fallback） |
| 注入 | data: URI + MutationObserver | 图片内联进 HTML，`html[data-skin]` 属性保活 |
| 打包 | 二进制补丁 / `@electron/asar` | qwenwork 用二进制（unpacked 原生模块），opencode 用 extract/repack |
| 运行时 | `tsx` (ES2022 + NodeNext) | TypeScript 直接执行，无编译步骤 |

## 项目结构

```
personalized-agent/
├── package.json                # 根：路由脚本
├── pnpm-workspace.yaml         # monorepo workspace
├── README.md / AGENTS.md       # 项目总览（唯一文档入口）
├── scripts/
│   ├── dev-qwenwork.mjs        # kill + open --enable-devtools
│   └── dev-opencode.mjs
├── packages/
│   ├── skin-core/              # 通用管线（取色 + token 生成 + 共享注入）
│   │   └── src/
│   │       ├── index.ts             # 入口 buildTokens() + CLI
│   │       ├── types.ts             # TOKEN_KEYS（46 个）/ Tokens / BuildOptions
│   │       ├── extract-colors.ts    # k-means++ 取色（确定性）
│   │       ├── generate-tokens.ts   # 簇 → light/dark 双套 tokens
│   │       ├── assets-loader.ts     # manifest 加载（roles + colorSource）
│   │       ├── bootstrap-builder.ts # 共享 bootstrap HTML 片段生成
│   │       ├── inject.js            # data-skin 属性保活（共享）
│   │       └── palette-preview.ts   # HTML 预览生成
│   ├── skin-assets/            # 共享图片资产（纯静态）
│   │   └── original-images/    # manifest.json + 4 张 webp
│   └── skins/
│       ├── qwenwork/           # QwenWork 实现
│       │   └── src/{index,patch-asar,token-mapping}.ts + skin.css
│       └── opencode/           # OpenCode 实现
│           └── src/{index,patch-asar,token-mapping}.ts + skin.css
└── docs/
    ├── PRD.md                  # 产品需求（为什么做、做什么）
    ├── ARCHITECTURE.md         # 系统组织（三层架构、数据流）
    ├── DECISIONS.md            # 设计决策记录（历史上下文）
    └── specs/                  # 模块级实现契约
```

## 许可

本仓库各皮肤为**衍生创作**，整体以 **CC BY-NC-SA 4.0**（署名-非商业性使用-相同方式共享）发布，**禁止商业性使用**。

### 素材署名链

| 创作者 | 贡献 | 链接 |
|---|---|---|
| 上善 | 鲸鱼娘角色形象原作 | [Pixiv](https://www.pixiv.net/users/62155430) · [Bilibili](https://b23.tv/8h5L4xz) |
| ZipZipPipe | 加入 DeepSeek 元素的女仆鲸鱼娘二次设计 | [Pixiv](https://www.pixiv.net/users/18604994) · [Bilibili](https://b23.tv/Pnw6nG8) |
| Small-tailqwq | 三创皮肤工程与 asar 补丁 | GitHub |
| wpy030414 | 转向对 OpenCode/QwenWork 支持 | GitHub |
