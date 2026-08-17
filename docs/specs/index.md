# spec: index (CLI 入口)

## 概述

命令行入口文件。解析 CLI 参数并调用 `patchAsar()` 执行 asar 补丁流程。

## 文件

`src/index.ts`

## 使用方式

```bash
pnpm apply                        # 默认：force=true
pnpm apply -- --no-force          # 不强制重打
pnpm apply -- --no-backup         # 跳过备份
pnpm apply -- --allow-running     # 允许运行中打补丁
```

## CLI 参数

| 参数 | 效果 | 默认 |
|---|---|---|
| `--no-force` | 禁用强制重打 | 默认启用 force |
| `--no-backup` | 跳过备份步骤 | 默认备份 |
| `--allow-running` | 允许 OpenCode 运行中打补丁 | 默认终止进程 |

## 流程

1. 打印欢迎信息。
2. 解析 `process.argv.slice(2)` 获取 CLI 参数。
3. 构造 `PatchOptions` 对象。
4. 调用 `patchAsar(options)`。
5. 捕获异常，打印错误信息，`process.exit(1)`。

## 约束

- 无交互式提示（全部通过 CLI 参数控制）。
- 错误信息包含 emoji 前缀（`❌`）便于识别。
- 不导出任何 API（仅作为入口执行）。

## 依赖

- `./patch-asar.js`：核心补丁引擎
