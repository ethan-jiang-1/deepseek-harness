# 证据实验：方法与状态

这一层只放**可证伪的实验记录**，不放结论。每条记录固定六段：假设 / 命令 / 预期 / 实际 / 结论 / 改了哪篇。能靠一次只读命令或源码阅读收口的，就当场收口；收不了的写清阻塞。

## 状态

| # | 实验 | 状态 | 结果 |
|---|---|---|---|
| 01 | 启动竞态：占位登记 vs 客户端首连 | **未执行（有阻塞）** | 需要合成一个延迟 `apply` 的测试插件；没有它无法可靠复现 |
| 02 | 客户端插件能否调用 `uiWorkspace.connectWorkspace` | 已收口（源码） | 可以；顺序不保证 |
| 03 | 插件能否回写自己那一行 profile patch | 已收口（源码） | 可以（经 `ctx.fiber.entry` + `ConfigEditor.edit`）；仍推荐设置文件 |
| 04 | 本机运行时可复现观测 | 已执行 | 见下节命令与输出 |

证据等级见 [40-evidence/00-index](../00-index.md)：T = 可复现命令 + 输出；C = 源码/docs 合同。

## 04 · 本机观测（T）

2026-10-30，`DSH_HOME=/Users/bowhead/.dsh`，`dsh --version` = `0.2.1-rc.3`。

```sh
$ node -e 'const d=require(process.env.DSH_HOME+"/storages/workspace.json"); console.log(d.unit, Object.keys(d.tables))'
{ name: 'workspace', version: 2 } [ 'workspaces' ]

$ f=$(ls "$DSH_HOME"/sessions/*/*/session.v4.jsonl.zstd | head -1); zstd -dc "$f" | head -1
{"type":"session","version":4,"id":"session-…","cwd":"<某个目录>","agentPreset":"<产品 preset>",…}
```

（第二行的 `id`、`cwd`、`agentPreset` 实际值已脱敏；命令保留，可在本机复现。）

**结论**：workspace domain 是 `workspace` v2，表为 `workspaces`；会话日志为 V4，首帧含 `cwd` 与 `agentPreset`。这两条支撑 [00-answer](../../00-answer.md) 与 [15](../../10-foundations/15-four-spaces.md) 的 T 级断言。

## 为什么不做脚本

这些观测是一次性只读命令，写进文档即可复现；维护一套 probe 脚本的成本高于收益。**约定**：T 级断言必须在本节或实验记录里给出可直接粘贴的命令与输出。
