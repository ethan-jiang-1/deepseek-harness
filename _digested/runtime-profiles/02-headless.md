# headless — 一次性 CLI 任务

## 一句话

`dsh --profile headless "run the tests"` 回答一条任务，打印最终 assistant 消息；`completed` 退 0，其余结局（`max-tokens` / `error` / `aborted` 等，或没有 turn）退 1。没有 HTTP 服务、没有 browser、没有常驻进程。

## 怎么跑

```sh
dsh --profile headless "run the tests"
dsh --profile headless --patch my.yml "refactor this module"
dsh --profile headless --help
```

### 运行契约

对调用方的 stdout / stderr、`--json`、退出码、task 输入与 `--session-id` 契约见 [`../surfaces-entrypoints/01-启动面与session流.md`](../surfaces-entrypoints/01-启动面与session流.md)；本页只写组合与执行机制。

## Bundle 组合

`PROFILE_TEMPLATES.headless` = `['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-headless']`

**注意**：`INSTALLATION_OWNED_PROFILE_TUPLES.headless` = `['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', '@deepseek-ai/dsh-headless']`（`packages/boot/app-boot/src/profile.ts:198-200`），但 `loadProfile` 中的 `normalizeShippedProfile` 会在首次加载时把它**整理回** `['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-headless']`：这个 tuple 登记为 installation-owned（安装方写下的旧值），加载时按 shipped 模板重写；用户自己改过的 bundle 列表不会被触碰（`:659-669`）。

| 层 | 从哪里来 | 作用 |
|----|---------|------|
| `dsh-base` | `packages/bundle/base/` | 所有 profile 共享的核心插件 |
| `dsh-headless` | `packages/bundle/headless/` | headless 特有层：override + insert task runner |

### `dsh-headless` 的 override 行

| id | 做了什么 |
|----|---------|
| `system-prompt` | 只设 `personaPrefix`（`You are a coding agent powered by the {{model}} model.`）（`packages/bundle/headless/cordis.patch.yml:9-12`）。shipped 组合不设 `personaSuffix`；执行目录由 `ctx.workingDirectory` 供给 |
| `tools` | 透传 `DSH_TOOLS_MODE` |
| `hmr` | `disabled: true`；一次性任务只做启动期组合 |
| `credentials` / `authorization` / `deepseek-account` | 全部 `disabled: true`；一次性任务改用启动环境凭据（`packages/bundle/headless/cordis.patch.yml:32-43`） |

### `dsh-headless` 的 insert 行

| id | 插件 | 作用 |
|----|------|------|
| `headless-startup` | `@deepseek-ai/dsh-headless/startup` | 解析 `"<task>"` 位置参数，提供 `headlessStartup` 服务 |
| `headless-runner` | `@deepseek-ai/dsh-headless` | 注入 `headlessStartup`，读取 task，创建 Agent，驱动到完成，打印结果（`config.task` / `sessionId` / `json` 取自 provider，patch `:27-30`） |

（`ptc-runtime` 是 **base** 层行（`packages/bundle/base/cordis.patch.yml:397-398`），所有 profile 共享。产品 bin 另把 `@deepseek-ai/dsh-experimental-ptc-runtime-python` 声明为 devDependency（CPython 子进程后端，experimental，`apps/cli/package.json:127`；shipped 组合不挂载它），PTC runtime 呈双 provider 形态（node + 实验性 Python），base 挂载的仍是 node 行。）

## 进程模型

```
dsh --profile headless "run the tests"
  → resolveProfileDir('headless')
  → initProfile(dir, ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-headless'])
  → loadProfile → 叠 bundle + user patch + --patch
  → boot() → 启动 Loader 插件树
  → headless-startup 解析 task，提供 headlessStartup 服务
  → headless-runner 读取 task，创建 Agent，推进到完成
  → 打印最终 assistant 消息 → `completed` 退 0，其余退 1
```

最终消息的读取是逐 seq 的：runner 的 `summarize` 按 `session.eventAt(SessionSeq(seq))` 从首个 seq 读到捕获长度，读不到即 fail loud（`dsh: headless summary cannot read seq N below captured length M`；`packages/bundle/headless/src/index.ts:73-99`，fail-loud 抛在 `:82`，`tests/headless.spec.ts` 有对应用例）。进程中的推理进度另走 `streamReasoning`：它订阅 `agent/assistant-stream` 这个 process-local 帧（不是 WAL），只把非空 `reasoning-delta` 打到 stderr（`packages/bundle/headless/src/index.ts:109-165`，`:122` 是订阅点）——最终结局仍从耐久日志推导，两路不混。

## 独特之处

- **唯一一次性退出的 Profile**：回答完就 exit，没有常驻进程。
- **没有 HTTP 服务、没有 browser、没有常驻 event loop**：生命周期短于任何需要等待的进程。
- **stdout 不装 logger**：默认只承载最终结果，`--json` 时承载事件流；任何额外 stdout 输出都会污染脚本管道。
- **startup-only 重载**：一次性任务在运行中重载 patch 没有意义。
- **不依赖会话级 preset**：tool-bash、tool-fs 等工具行直接在 host 平面挂载，而不是放到会话 preset 里。

## 源码入口

| 路径 | 角色 |
|------|------|
| `packages/bundle/headless/cordis.patch.yml` | headless 特有 patch 层 |
| `packages/bundle/headless/src/startup.ts` | 命令行 flag 解析，提供 `headlessStartup` 服务 |
| `packages/boot/app-boot/src/profile.ts` | `PROFILE_TEMPLATES.headless`、launcher 组合 |
| `apps/cli/src/bin.ts` | 产品 bin 分发 |
| `_digested/plugin-system/composition/00-map.md` | 启动组合机制 |
