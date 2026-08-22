# Spec — opencode 打补丁引擎（patch-asar.ts）

**对应模块**：`packages/skins/opencode/src/patch-asar.ts` + `src/index.ts`

## 要实现什么

一个 Node.js CLI 工具，用 **extract/repack** 方式把 OpenCode Desktop 的 `app.asar` 替换成注入了深海女仆工坊主题的版本。

**为什么 extract/repack**：OpenCode 没有 unpacked 原生模块问题，标准 `@electron/asar` API 更简单可靠（见 DECISIONS D-004）。

## 行为应该是什么

执行 `pnpm apply:opencode`（`tsx src/index.ts`）时：

1. 找到 `/Applications/OpenCode.app/Contents/Resources/app.asar`（win32/linux 另有默认路径）
2. `hasMarker()` 流式扫描检测已打补丁；已打且非 force → 报错
3. app 运行中默认 kill（`--allow-running` 跳过）
4. 备份 `app.asar` → `.skin.bak`（已存在不动；`--no-backup` 时保留 pristine snapshot）
5. 读取 `src/skin.css` + `dist/token-mapping.css` + 共享 `skin-core/src/inject.js`，`buildBootstrap()` 拼装
6. `asar.extractAll()` 解包到 `/tmp/opencode-skin-patch-*` 临时目录
7. `--force` 时从 `.bak` 提取 pristine `index.html` 还原（校验备份不含 marker，防污染）
8. 校验 HTML 包含 `oc-theme-preload-script`（防止对错误的文件打补丁）
9. `injectBootstrapIntoHtml()` 注入 bootstrap 到 `</head>` 前
10. favicon 替换：`src/icon.svg` → `out/renderer/favicon-v3.svg`（源存在才替换，校验含 `<svg`）
11. `asar.createPackage()` 重打包 → 校验 marker 存在 → 覆盖安装
12. 重启 OpenCode（`--allow-running` 或 autoRestart=false 时跳过）
13. finally 强制清理临时目录

## 输入

| 参数 | 默认 | 含义 |
|---|---|---|
| `--no-force` | force=true | 关闭强制重 patch |
| `--no-backup` | false | 跳过备份（仍保留 pristine snapshot） |
| `--allow-running` | false | 不关闭运行中的 app |

## 输出

- 替换 `<appDir>/resources/app.asar` 为补丁版本
- `.skin.bak` 备份文件
- 控制台日志（每步状态）

## 平台适配

| 平台 | 默认安装路径 | 可执行文件 | 进程检测 |
|---|---|---|---|
| win32 | `C:\Users\xrl\AppData\Local\Programs\@opencode-aidesktop` | `OpenCode.exe` | `tasklist` |
| darwin | `/Applications/OpenCode.app` | `Contents/MacOS/OpenCode` | `pgrep` |
| linux | `/opt/OpenCode` | `opencode-desktop` | `pgrep` |

未支持的平台立即报错。

## 约束

- 注入锚点：`out/renderer/index.html` 的 `</head>` 前（升级后最稳定的结构，见 DECISIONS D-015）
- 不修改 OpenCode 的 JS bundle
- 不依赖网络、不依赖 GUI
- 注入失败时清理临时目录（finally 块）

## 边界条件

1. **首次 patch**：`.bak` 不存在，正常创建
2. **二次 patch 无 --force**：报错「already patched」
3. **二次 patch 带 --force**：从 `.bak` 还原 pristine HTML 再打；备份含 marker → 抛错（备份已污染）
4. **`.bak` 已存在**：跳过备份
5. **`--no-backup` 但 `.bak` 不存在**：仍创建 `.bak` 作 pristine snapshot
6. **HTML 不含 `oc-theme-preload-script`**：抛错（非预期文件，拒绝打补丁）
7. **`</head>` 缺失**：注入前抛错
8. **favicon 源不存在**：跳过（非致命）；存在但无 `<svg`：抛错
9. **重打包后 marker 缺失**：抛错，不安装损坏的 asar
10. **killApp / launchApp 失败**：捕获异常，仅警告

## 验收标准

- [x] `pnpm apply:opencode` 在 macOS 上跑通（首次 + force）
- [ ] Windows / Linux 待测
- [x] 备份 `.bak` 正确生成
- [x] `--force` 重 patch 不重复注入
- [x] OpenCode 重启后皮肤生效，亮/暗切换正常
- [x] favicon 替换生效
- [x] 临时目录清理成功（`/tmp/opencode-skin-patch-*` 无残留）
- [x] `.bak` 覆盖回 `app.asar` 后完全还原

## 如何判断任务已经完成

apply 全流程跑通 + 主人在 macOS 上使用无异常。
