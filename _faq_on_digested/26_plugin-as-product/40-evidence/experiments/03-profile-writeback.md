# 实验 03 · 插件能否回写自己那一行 profile patch

**状态**：已收口（源码）。等级 **C**。

## 假设

插件可以在运行时把某个值写回自己在 `cordis.patch.yml` 里的那一行，而不依赖用户在设置页操作。

## 命令

```sh
grep -n "entry?: Entry" vendor/loader/src/index.ts
grep -n "static readonly key" vendor/loader/src/config/entry.ts
grep -n "async edit(\|entries(): Entry" packages/boot/config-editor/src/index.ts
```

## 预期

如果 Loader 把行记录挂到 fiber 上，且 config editor 接受任意 Entry，插件就能定位自己并写入。

## 实际

- Loader 在 fiber 上记录所属行：`entry?: Entry`（[vendor/loader/src/index.ts](../../../../vendor/loader/src/index.ts) 的 `Fiber.entry`），设置点是 `fiber.entry = fiber.parent[Entry.key]`。
- `ConfigEditor.entries()` 返回当前 profile 里可寻址的行；`edit(entry, change)` 接受一个 Entry，校验完整 Config 后写回 patch。
- 因此插件可以用 `ctx.fiber.entry` 拿到自己那一行，再调 `configEditor.edit(entry, change)`。

## 结论

**可行**，但有四个前提：

1. `ctx.fiber.entry` 必须存在（非 Loader 挂载的 fiber 没有）；不在 `entries()` 里的行（嵌套 include、重复 id）不可编辑。
2. `change` 返回的是**完整** config；patch 是整对象替换，只写一个键会丢其余默认值（[17](../../10-foundations/17-config-layers.md)）。
3. 写回 profile patch 会把"运行时选择"混进安装文件；跨 profile 一致的产品设置应放 `dataRoot` 文件（[16](../../10-foundations/16-startup-resolution.md)）。
4. 设置页路径（`Config.volatile()`）仍是用户可见编辑的推荐入口；插件自动回写只适合"装一次"的参数。

## 改了哪篇

[16](../../10-foundations/16-startup-resolution.md) 的"待核实"第 3 条从 **U** 改为 **C**，并保留"优先用全局设置文件"的推荐。
