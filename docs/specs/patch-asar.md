# spec: patch-asar

## 概述

跨平台 asar 补丁引擎。负责提取 OpenCode Desktop 的 `app.asar`，改写预载脚本注入皮肤 CSS 和 DOM 注入层，替换 favicon，重打包并安装。

## 文件

`src/patch-asar.ts`

## 输入

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `appDir` | `string` | 平台默认路径 | OpenCode 安装目录 |
| `force` | `boolean` | `true` | 从 .bak 恢复 pristine 再重打（`--no-force` 禁用） |
| `noBackup` | `boolean` | `false` | 跳过备份（仍创建 pristine 快照） |
| `allowRunning` | `boolean` | `false` | 允许 OpenCode 运行中打补丁 |
| `autoRestart` | `boolean` | `true` | 补丁完成后自动启动 OpenCode |
| `backupPath` | `string` | `<asarPath>.maid-atelier.bak` | 自定义备份路径 |

## 输出

- 替换 `<appDir>/resources/app.asar` 为补丁版本。
- 创建备份文件 `<asarPath>.maid-atelier.bak`（首次）。
- 写入 `src/build/maid-atelier.user.css`（通过 `buildCssToFile()`）。

## 流程

```
1. 校验前置条件
   ├── app.asar 存在？
   ├── 已打补丁（hasMarker）且非 force？→ 报错
   └── OpenCode 运行中且非 allowRunning？→ 终止进程

2. 备份
   ├── 备份不存在？→ 复制 app.asar → .bak
   └── 备份已存在？→ 保留（不覆盖）

3. 构建 CSS
   └── buildCssToFile() → src/build/maid-atelier.user.css

4. 提取与改写
   ├── asar.extractAll(app.asar → tempDir/out)
   ├── force 模式：从 .bak 提取 pristine preload
   ├── 校验 preload 包含 "opencode-theme-id"
   ├── 读取 CSS + inject.js
   ├── 替换 inject.js 中的 __MAID_ATELIER_ICON_B64__ 占位符
   └── 拼接 bootstrap: preload + IIFE(属性+CSS) + inject.js

5. 替换 favicon
   └── 读取 maid-icon.svg → 写入 out/renderer/favicon-v3.svg

6. 重打包与校验
   ├── asar.createPackage(out → out.asar)
   ├── 校验 out.asar 包含 marker
   └── 记录文件大小

7. 安装
   ├── 删除原 app.asar
   ├── 重命名 out.asar → app.asar
   └── autoRestart？→ launchOpenCode()

8. 清理
   └── 删除 tempDir（finally 块，确保执行）
```

## 平台适配

| 平台 | 默认安装路径 | 可执行文件 | 进程检测 | 启动方式 |
|---|---|---|---|---|
| win32 | `C:\Users\xrl\AppData\Local\Programs\@opencode-aidesktop` | `OpenCode.exe` | `tasklist` | `spawn(exe, detached)` |
| darwin | `/Applications/OpenCode.app` | `Contents/MacOS/OpenCode` | `pgrep` | `open -a` |
| linux | `/opt/OpenCode` | `opencode-desktop` | `pgrep` | `spawn(exe, detached)` |

## 约束

- **marker 检测**：使用流式二进制搜索（`hasMarker`），4MB 缓冲区 + carry 处理跨边界情况，确保在大文件中不漏匹配。
- **pristine 校验**：`--force` 模式下从 .bak 恢复 preload 前，检查 .bak 中的 preload 不包含 marker（防止备份本身已被污染）。
- **内容校验**：改写前检查 preload 包含 `opencode-theme-id` 字符串，防止对错误的文件打补丁。
- **临时目录**：使用 `os.tmpdir()` 创建 `opencode-maid-patch-*` 前缀的临时目录，`finally` 块中强制删除。

## 依赖

- `@electron/asar`：asar 提取/重打包
- `node:fs`, `node:path`, `node:os`：文件系统操作
- `node:child_process`：进程管理（检测/终止/启动 OpenCode）
- `./build-css.js`：CSS 生成

## 错误处理

| 场景 | 行为 |
|---|---|
| `app.asar` 不存在 | `fail()` → `process.exit(1)` |
| 已打补丁且非 force | `fail()` 提示使用 force |
| .bak 中的 preload 含 marker | 抛异常（备份已污染） |
| preload 不含 `opencode-theme-id` | 抛异常（非预期文件） |
| favicon 源不存在 | 跳过（非致命） |
| 重打包后 marker 缺失 | 抛异常（不安装损坏的 asar） |
