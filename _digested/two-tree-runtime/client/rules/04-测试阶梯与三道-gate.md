# 测试阶梯与三道 client gate

核验入口：[`packages/client/AGENTS.md`](../../../../packages/client/AGENTS.md) 的 testing ladder 与 coverage 段、[`docs/testing.md`](../../../../docs/testing.md)。

这一页把「改一行 UI 要跑什么」排成三级，并列出三道 client gate 各自拦什么；选窄一级，不要默认全量。

## 测试阶梯

GUI 测试的三层结构，仓库级策略在 `docs/testing.md`（`packages/client/AGENTS.md:125`）。阶梯按改动面选最窄一级（`packages/client/AGENTS.md:136-138`）：**每个 GUI 代码改动**跑 `pnpm run test:gui`（秒级，无浏览器无服务器，是内循环，可以像 typecheck 一样随便跑）；**任何可能改变组装后浏览器或可见 conversation/UI 输出的改动**（client 组件或文案、`apps/web`、Vite、`dsh-host-webserver`、connection/handler/SSE）额外跑 `DSH_SNAPSHOT=replay pnpm run test:web`，它会重建 frontend dist 再跑 browser smoke 对（无 `DEEPSEEK_API_KEY` 时 real-host case 自跳过）加 keyless 重放 e2e；`DSH_SNAPSHOT=refresh` 只在确认输出变化是有意的之后用，`DSH_SNAPSHOT=record` 带 key 重录 fixture；**PR 之前**用 dsh-pre-push-checks 选窄检查，仓库没有全量 pre-push 聚合。

覆盖率与环境的硬规定：Client source 包在 per-file 100% coverage gate 内（`pnpm run test:coverage`），真的不可达的防御分支用 `/* v8 ignore -- <reason> */` 写真实理由，绝不用裸 ignore（`packages/client/AGENTS.md:127`）；组件 spec 用真实 props 或驱动的 fixture runtime 渲染并断言用户可见行为，而不是 class 名、hook 内部或 render 次数（`packages/client/AGENTS.md:128`）；jsdom 环境来自 spec 第一行的 per-file `// @vitest-environment jsdom` pragma，共享 config 保持 node-env（`packages/client/AGENTS.md:129`）；每一级只断言自己那层 —— 数据层语义归 runtime 与 host 套件，组件 spec 覆盖呈现行为（`packages/client/AGENTS.md:130`）。若 `test:gui` 在你没碰的代码上红，既不静默修也不忽略，写进 handoff 让它落进下一轮 PR 窗口（`packages/client/AGENTS.md:140`）。

## 三道 gate 各拦什么

| gate | 拦什么 | 什么时候红 |
|---|---|---|
| [`verify-client-packages`](../../../../scripts/verify-client-packages.ts) | 模块请求：baseline 重复、空值、重复值、指向自己的行、无 supplier、无生产源码 import 的过期声明，以及同步 `dsh.client.external` 环 | 新包 manifest 里重复声明 React / Cordis；请求一个没有 supplier 的 external；两个包互相请求 |
| [`verify-client-domain-graph`](../../../../scripts/verify-client-domain-graph.ts) | 包内三层：`contract/` 是唯一共享 API，`<domain>/` 是实现，`apply.ts`/`index.ts` 是组装点；兄弟 domain 之间不得 import | 多域包里两个 domain 直接 import；在 domain 里 re-export 组装点 |
| [`verify-client-ui-i18n`](../../../../scripts/verify-client-ui-i18n.ts) | 文案归属：产品可见字符串必须来自 typed locale 字典，经标准 `t` seat 或已本地化的 prop 到达组件 | 组件里硬编码中文或英文标签；`format` 结果当文案比较 |

三道的共同点：它们检查的是**包与包之间、文件与文件之间**的关系，不是运行时行为——所以能秒级跑，适合放进内循环；行为正确性仍由 `test:gui` 与 `test:web` 负责。
