# Spec — skin-assets 素材库与 manifest

**对应模块**：`packages/skin-assets/` + `skin-core/src/assets-loader.ts`

## 要实现什么

所有 target 共用的图片素材库 + 标准角色映射文件（`manifest.json`），以及 skin-core 侧的加载器。

## 行为应该是什么

1. `manifest.json` 把 4 个**标准角色**映射到物理文件（角色 key 固定，文件名自由）
2. `manifest.json` 声明 **colorSource** 角色数组——只有这些角色的图喂给取色管线
3. skin-core 通过 `assets-loader.ts` 按角色（而非文件名）消费素材
4. bootstrap 构建时按 4 个角色读取图片转 data URI

## 目录结构

```
packages/skin-assets/
└── original-images/
    ├── manifest.json
    ├── maid-atelier-palace-day-v4.webp
    ├── maid-atelier-palace-night-v4.webp
    ├── maid-atelier-maid-left-v5.webp
    └── maid-atelier-maid-right-v6.webp
```

## manifest.json 契约

```json
{
  "schema": "standard-roles-v1",
  "description": "...",
  "roles": {
    "background-day": "<file>",
    "background-night": "<file>",
    "character-left": "<file>",
    "character-right": "<file>"
  },
  "colorSource": ["character-left", "character-right"]
}
```

**标准角色**（固定 4 个，任何主题都必须提供映射）：

| 角色 | 说明 | 当前文件 |
|---|---|---|
| `background-day` | 背景·昼 | `maid-atelier-palace-day-v4.webp` |
| `background-night` | 背景·夜 | `maid-atelier-palace-night-v4.webp` |
| `character-left` | 立绘·左 | `maid-atelier-maid-left-v5.webp` |
| `character-right` | 立绘·右 | `maid-atelier-maid-right-v6.webp` |

**colorSource 约定**：取色来源必须显式声明。场景背景（day/night）不得参与取色（会绑架主题色调）。变更取色来源只改 manifest，不改代码。

## 加载器 API（assets-loader.ts）

| API | 返回 | 说明 |
|---|---|---|
| `getRoleImagePath(role)` | `string` | 单个角色的物理路径 |
| `getAllRoleImagePaths()` | `Record<StandardRole, string>` | 4 个角色 → 路径 |
| `getColorSourceImagePaths()` | `string[]` | 仅 colorSource 角色的路径（取色专用） |

## 约束

- 纯静态资源：**不写代码**，只有图片 + 一个 JSON 映射
- 文件名自由：`<主题名>-<角色>-<版本>.<ext>` 是建议命名，**禁止**在 skin-assets 层强制任何主题前缀
- 版本号递增（v1 → v2 → v3）；WebP 优先；原图保持高分辨率不压缩
- manifest 的 4 个 `file` 字段必须指向真实存在的文件
- manifest 缺失或 `colorSource` 为空数组 → 加载器抛错

## 边界条件

1. **角色 key 缺失**：`getRoleImagePath` 抛错（`role 'X' not found in manifest.json`）
2. **colorSource 引用不存在的角色**：抛错
3. **新增素材**：只改文件名映射 + 版本号，角色 key 不动；扩展新角色需先提案扩展标准角色枚举（目前固定 4 个）

## 验收标准

- [x] manifest 4 个角色全部指向存在的文件
- [x] colorSource 非空且只含角色立绘
- [x] `pnpm build-tokens` 无 `--sources` 时能读到立绘路径并出 tokens
- [x] 无代码文件（只有图片、JSON、文档）

## 如何判断任务已经完成

换一套主题图片只需：替换文件 → 改 manifest 文件名 → 跑 build-tokens / apply，无需改任何代码。
