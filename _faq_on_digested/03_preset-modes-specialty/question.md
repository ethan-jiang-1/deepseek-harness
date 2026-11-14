# FAQ 03 · 四个内置模式（Standard / PTC / Minimal / Creator）各自特殊在哪？

## 问题

Web UI 新建任务的模式选择器里有四个内置选项：Standard / PTC / Minimal / Creator（创造模式）。表面上它们都是"换一份工具清单"，但直觉上不止如此——如果是纯工具加减，为什么 PTC 连"模型怎么调用工具"的形状都变了，Minimal 连系统提示词都换掉了，Creator 却几乎不删任何东西？

1. **Standard**——它是"没有特殊性"的基线，但基线本身有内容：wire 工具怎么分组？哪些工具**刻意不在场**（cordis_\* / mcp_\* / ralph），为什么？三个 `isolate` 隔离组各自圈住什么？
2. **PTC 模式**——它只是换工具，还是换了"模型调用工具"这件事本身的形状？`run_code` 是什么，子调用还受不受权限约束，结果怎么回到上下文？
3. **Minimal 模式**——"极简"减掉的是哪些层？系统提示词还剩什么，终端为什么是持久的，它和 `sdk-minimal` 这个 profile 是什么关系？
4. **Creator 模式**（preset id 是 `cordis`）——它比 Standard 多出来的几行插件到底干什么？让 agent 改 DSH 自身，靠什么机制落地、靠什么门禁兜底？

更进一步：这四个"模式"在机制层是不是同一类东西？各自动的到底是宿主的哪一根轴——工具目录、提示词身份，还是别的什么？

## 要回答的问题

要回答：

1. 四个内置模式（Standard / PTC / Minimal / Creator）各自改动了宿主组合的哪一层？哪些地方没有改？
2. 每个模式的 wire 工具表、系统提示词、shell/终端、扩展点分别是什么形态？逐项能指到哪份 preset patch 与源码？
3. PTC 为什么禁用 workflow 工具？Minimal 的 `complete: true` 抑制了什么？Creator 的 `plugin_manager` 条件在判什么？
4. 三组容易混淆的名字（agent preset vs runtime profile、`minimal` preset vs `sdk-minimal` profile、`cordis` preset id vs "Creator mode" 显示名）各自指什么？

## 范围与基线

核验状态见 [核验基线登记](../00-baseline.md)。

四份预设声明的唯一事实源是 `packages/bundle/web-app/presets/` 下四个 `*.patch.yml`（[`standard.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/presets/standard.patch.yml)、[`ptc.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/presets/ptc.patch.yml)、[`minimal.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/presets/minimal.patch.yml)、[`cordis.patch.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/presets/cordis.patch.yml)）；GUI 文案（模式名、描述、引导文）来自 [`packages/client/ui-agent-preset/src/client/locales.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-agent-preset/src/client/locales.ts) 与 [`guide-locales.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-agent-preset/src/client/guide-locales.ts)。行为事实另有快照/e2e 钉住：[`apps/web/tests/minimal-preset.snapshot.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/web/tests/minimal-preset.snapshot.ts)、[`apps/web/tests/ptc-round.e2e.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/web/tests/ptc-round.e2e.ts)、[`apps/web/tests/ptc-escalation.e2e.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/web/tests/ptc-escalation.e2e.ts)、[`apps/web/tests/shipped-composition.e2e.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/web/tests/shipped-composition.e2e.ts)。

本篇主回答在 [answer.md](./answer.md)（机制总览与四模式对比），四个模式各有一篇分 FAQ：[standard-mode.md](./standard-mode.md)、[ptc-mode.md](./ptc-mode.md)、[minimal-mode.md](./minimal-mode.md)、[creator-mode.md](./creator-mode.md)。
