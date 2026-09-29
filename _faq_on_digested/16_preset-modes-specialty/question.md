# FAQ 16 · 四个内置模式（Standard / PTC / Minimal / Creator）各自特殊在哪？

## 问题

Web UI 新建任务的模式选择器里有四个内置选项：Standard / PTC / Minimal / Creator（创造模式）。表面上它们都是"换一份工具清单"，但直觉上不止如此——如果是纯工具加减，为什么 PTC 连"模型怎么调用工具"的形状都变了，Minimal 连系统提示词都换掉了，Creator 却几乎不删任何东西？

1. **Standard**——它是"没有特殊性"的基线，但基线本身有内容：26 个 wire 工具怎么分组？哪些工具**刻意不在场**（cordis_\* / mcp_\* / ralph），为什么？三个 `isolate` 隔离组各自圈住什么？
2. **PTC 模式**——它只是换工具，还是换了"模型调用工具"这件事本身的形状？`run_code` 是什么，子调用还受不受权限约束，结果怎么回到上下文？
3. **Minimal 模式**——"极简"减掉的是哪些层？系统提示词还剩什么，终端为什么是持久的，它和 `sdk-minimal` 这个 profile 是什么关系？
4. **Creator 模式**（preset id 是 `cordis`）——它比 Standard 多出来的几行插件到底干什么？让 agent 改 DSH 自身，靠什么机制落地、靠什么门禁兜底？

更进一步：这四个"模式"在机制层是不是同一类东西？各自动的到底是宿主的哪一根轴——工具目录、提示词身份，还是别的什么？

## 回答目标

读完本 FAQ，应当能够：

1. 一句话说出四个模式各自动的轴：Standard **三轴都不动**（因此是 diff 基准），PTC 动**呈现层**（工具目录如何投影给模型），Minimal 动**身份层**（系统提示词与运行时上下文整体替换 + 持久终端），Creator 动**扩展层**（把宿主自身的可修改性交给 agent）。
2. 对每个模式列出"改了什么 / 没改什么 / 为什么"，且每条能指到源码位置；对 Standard 还能报出工具家族清单与三组刻意缺席。
3. 回答几个具体困惑：PTC 预设为什么把 workflow 工具禁了；Minimal 的 `complete: true` 到底抑制了什么；Creator 的三个技能从哪来、`plugin-manager` 那行 `!!js` 条件在判什么。
4. 分清三组容易混淆的名字：agent preset vs runtime profile、`minimal` preset vs `sdk-minimal` profile、`cordis` preset id vs "Creator mode" 显示名。

## 范围与基线

源码核验基线：本仓库工作树 `7073ae7c94`。预设相关路径（`packages/bundle/web-app/presets/`、`packages/preset/`、`packages/core/agent-tool-presentation/`、`packages/client/ui-agent-preset/`）在该 commit 与 `_digested/` 基线 `46a7f68b09`（`dsh-v0.1.7-rc.1`）之间无差异，结论对两个基线同时成立；上游合入后按 `_digested/_change_log/` 复核。

四份预设声明的唯一事实源是 `packages/bundle/web-app/presets/` 下四个 `*.patch.yml`（[`standard.patch.yml`](../../packages/bundle/web-app/presets/standard.patch.yml)、[`ptc.patch.yml`](../../packages/bundle/web-app/presets/ptc.patch.yml)、[`minimal.patch.yml`](../../packages/bundle/web-app/presets/minimal.patch.yml)、[`cordis.patch.yml`](../../packages/bundle/web-app/presets/cordis.patch.yml)）；GUI 文案（模式名、描述、引导文）来自 [`packages/client/ui-agent-preset/src/client/locales.ts`](../../packages/client/ui-agent-preset/src/client/locales.ts) 与 [`guide-locales.ts`](../../packages/client/ui-agent-preset/src/client/guide-locales.ts)。行为事实另有快照/e2e 钉住：[`apps/web/tests/minimal-preset.snapshot.ts`](../../apps/web/tests/minimal-preset.snapshot.ts)、[`apps/web/tests/ptc-round.e2e.ts`](../../apps/web/tests/ptc-round.e2e.ts)、[`apps/web/tests/ptc-escalation.e2e.ts`](../../apps/web/tests/ptc-escalation.e2e.ts)、[`apps/web/tests/shipped-composition.e2e.ts`](../../apps/web/tests/shipped-composition.e2e.ts)。

本篇主回答在 [answer.md](./answer.md)（机制总览与四模式对比），四个模式各有一篇分 FAQ：[standard-mode.md](./standard-mode.md)、[ptc-mode.md](./ptc-mode.md)、[minimal-mode.md](./minimal-mode.md)、[creator-mode.md](./creator-mode.md)。
