# Spec — qwenwork 二进制补丁引擎（patch-asar.ts）

**对应模块**：`packages/skins/qwenwork/src/patch-asar.ts` + `src/index.ts`

## 要实现什么

一个 Node.js CLI 工具，用**二进制补丁**方式把 QwenWorkCN 的 `app.asar` 替换成注入了深海女仆工坊主题的版本。

**为什么二进制**：QwenWorkCN 的 asar 含 unpacked 原生模块（sharp / node-pty 等），在 ARM Mac 上 `asar.extractAll()` 会因 x64 二进制缺失而失败。二进制补丁只改 `out/renderer/index.html` 条目，**其余条目（含 unpacked 标记）原样保留**。

## asar 二进制格式（Chromium Pickle）

```
[8 bytes: sizePickle]
  [0..3]   uint32LE = 4（固定）
  [4..7]   uint32LE = headerPickle 总字节数
[headerSize bytes: headerPickle]
  [0..3]   uint32LE = payload size（= 4 + paddedStrLen）
  [4..7]   uint32LE = JSON 字符串字节数
  [8..]    JSON 字符串 + 4 字节对齐 padding
[data section: 文件内容，offset 相对 data section 起点]
```

## 行为应该是什么

执行 `pnpm apply:qwenwork`（`tsx src/index.ts`）时：

1. 找到 `/Applications/QwenWorkCN.app/Contents/Resources/app.asar`（win32/linux 另有默认路径）
2. `hasMarker()` 流式扫描（4MB buffer + carry 处理跨边界）检测已打补丁；已打且非 force → 报错
3. app 运行中默认 kill（`--allow-running` 跳过）；kill 失败不阻塞
4. 备份 `app.asar` → `app.asar.skin.bak`（已存在不动；`--no-backup` 时仍保留 pristine snapshot）
5. 读取 `src/skin.css` + `dist/token-mapping.css` + 共享 `skin-core/src/inject.js`，`buildBootstrap()` 拼装（素材 = 活动主题，见 module-assets spec）
6. 解析 asar header，定位 `out/renderer/index.html` 条目
7. 读 HTML → 剥离旧 marker（`qwenwork-maid-atelier`）残留块 → 注入 bootstrap 到 `</head>` 前
8. 更新 header：HTML 条目 size + 后续文件 offset 平移；integrity sha256 重算；header JSON 尾部空格 padding 保持等长
9. **OOM watchdog 等长替换**：`oomWatchdogService.start()` → `0/*disabled-watchdog-pad*/`（长度一致）
10. 写临时 asar（`/tmp/qwenwork-skin-patch-*.asar`）→ 校验 marker + unpacked 条目数不变 → 覆盖安装
11. macOS `codesign --force --deep --sign -` 重新签名（失败仅警告）
12. 重启 QwenWorkCN（`--allow-running` 或 autoRestart=false 时跳过）

## 输入

| 参数 | 默认 | 含义 |
|---|---|---|
| `--no-force` | force=true | 关闭强制重 patch（已打补丁时报错） |
| `--no-backup` | false | 跳过备份（仍保留 pristine snapshot 供 --force） |
| `--allow-running` | false | 不关闭运行中的 app |

> 主题不在此选择：apply 跟随 build-tokens 选定的活动主题（`dist/tokens.json` 的 theme 字段）。切换主题 = 重跑 `pnpm build-tokens --theme <name>` 再 apply。

## 输出

- 修改后的 `app.asar`
- `.skin.bak`（原始 asar 副本，双重身份：回滚副本 + pristine source）
- 控制台日志（每步状态）
- 退出码：0 = 成功；非 0 = 失败

## 平台适配

| 平台 | 默认安装路径 | 可执行文件 | 进程检测 |
|---|---|---|---|
| win32 | `%USERPROFILE%\AppData\Local\Programs\QwenWorkCN` | `QwenWorkCN.exe` | `tasklist` |
| darwin | `/Applications/QwenWorkCN.app` | `Contents/MacOS/QwenWorkCN` | `pgrep` |
| linux | `/opt/QwenWorkCN` | `qwenworkcn` | `pgrep` |

未支持的平台立即报错。

## 约束

- 不修改 `out/renderer/index.html` 之外的文件内容（其他条目 offset 因 header 等长不变）
- 不修改 QwenWork 的 JS bundle（OOM watchdog 等长替换除外）
- 不依赖网络、不依赖 GUI
- 注入失败时清理临时 asar（catch 中 unlink）

## 边界条件

1. **首次 patch**：`.bak` 不存在，正常创建
2. **二次 patch 无 --force**：报错「already patched」
3. **二次 patch 带 --force**：从 `.bak` 还原 pristine HTML 再打（`.bak` 丢失则报错）
4. **`.bak` 已存在**：跳过备份，日志提示
5. **`--no-backup` 但 `.bak` 不存在**：仍创建 `.bak` 作 pristine snapshot
6. **App 正在运行**：默认 kill；`--allow-running` 仅警告
7. **活动主题缺失**（tokens.json 无 theme 字段或缺失）：报错提示先跑 build-tokens，不触碰 app.asar
8. **killApp / launchApp 失败**：捕获异常，仅警告，不失败整个流程
9. **`app.asar` 不存在 / HTML 无 `<head>`**：立即报错
10. **Repack 后 marker 缺失 / unpacked 数变化**：抛错，不安装
11. **OOM watchdog 字符串未找到**：警告（可能已禁用），继续
12. **旧 marker 残留**：自动剥离，保证 `--force` 后恰好一个 bootstrap

## 验收标准

- [x] `pnpm apply:qwenwork` 在 macOS 上跑通（首次 + force）
- [ ] Windows / Linux 待测
- [x] 备份 `.bak` 正确生成
- [x] `--force` 重 patch 不重复注入（旧 marker 残留也能清理）
- [x] QwenWork 重启后立绘可见，亮/暗/跟随系统切换正常
- [x] `.bak` 覆盖回 `app.asar` 后主题完全还原
- [x] unpacked 原生模块完整（sharp / node-pty 可用）

## 如何判断任务已经完成

apply 全流程跑通 + 主人在 macOS 上用一周没发现问题。
