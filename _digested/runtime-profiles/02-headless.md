# headless — 一次性 CLI 任务

## 一句话

`dsh --profile headless "run the tests"` 回答一条任务，打印最终 assistant 消息，然后 exit 0。没有 HTTP 服务、没有 browser、没有常驻进程。

## 怎么跑

```sh
dsh --profile headless "run the tests"
dsh --profile headless "refactor this module" --patch my.yml
dsh --profile headless --help
```

## Bundle 组合

`PROFILE_TEMPLATES.headless` = `['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-headless']`

**注意**：`INSTALLATION_OWNED_PROFILE_TUPLES.headless` = `['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', '@deepseek-ai/dsh-headless']`，但 `loadProfile` 中的 `normalizeShippedProfile` 会在首次加载时把它**整理回** `['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-headless']`，因为 `dsh-web-app` 是安装时用于 headless 的旧靠模，实际启动时不需要 web 层。这是安装升级路径的兼容性调整。

| 层 | 从哪里来 | 作用 |
|----|---------|------|
| `dsh-base` | `packages/bundle/base/` | 所有 profile 共享的核心插件 |
| `dsh-headless` | `packages/bundle/headless/` | headless 特有层：override + insert task runner |

### `dsh-headless` 的 override 行

| id | 做了什么 |
|----|---------|
| `system-prompt` | 设 persona 文本 |
| `tools` | 透传 `DSH_TOOLS_MODE` |

### `dsh-headless` 的 insert 行

| id | 插件 | 作用 |
|----|------|------|
| `code-runtime` | `@deepseek-ai/dsh-code-runtime-worker-thread` | PTC 程序执行器；产品 bin 另依赖 `@deepseek-ai/dsh-experimental-code-runtime-python`（CPython 子进程后端，experimental，7f84a825c9），PTC 的 code-runtime 呈双 provider 形态（worker-thread + 实验性 Python），本 patch 挂载的仍是 worker-thread 行 |
| `headless-startup` | `@deepseek-ai/dsh-headless/startup` | 解析 `"<task>"` 位置参数，提供 `headlessStartup` 服务 |
| `headless-runner` | `@deepseek-ai/dsh-headless` | 注入 `headlessStartup`，读取 task，创建 Agent，驱动到完成，打印结果 |

## 进程模型

```
dsh --profile headless "run the tests"
  → resolveProfileDir('headless')
  → initProfile(dir, ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-headless'])
  → loadProfile → 叠 bundle + user patch + --patch
  → boot() → 启动 Loader 插件树
  → headless-startup 解析 task，提供 headlessStartup 服务
  → headless-runner 读取 task，创建 Agent，推进到完成
  → 打印最终 assistant 消息 → exit 0
```

最终消息的读取是逐 seq 的：runner 的 `summarize` 按 `session.eventAt(SessionSeq(seq))` 从首个 seq 读到捕获长度，读不到即 fail loud（`dsh: headless summary cannot read seq N below captured length M`；`packages/bundle/headless/src/index.ts:64-73`，`tests/headless.spec.ts` 有对应用例）。

## 独特之处

- **唯一一次性退出的 Profile**：回答完就 exit，没有常驻进程。
- **没有 HTTP 服务、没有 browser、没有常驻 event loop**：生命周期短于任何需要等待的进程。
- **stdout 给最终结果**：进程退出前打印 assistant 的最后一条消息，适合脚本管道。
- **startup-only 重载**：一次性任务在运行中重载 patch 没有意义。
- **不依赖 agent-presets**：tool-bash、tool-fs 等工具行直接在 host 平面挂载，而不是放到会话 preset 里。

## 源码入口

| 路径 | 角色 |
|------|------|
| `packages/bundle/headless/cordis.patch.yml` | headless 特有 patch 层 |
| `packages/bundle/headless/src/startup.ts` | 命令行 flag 解析，提供 `headlessStartup` 服务 |
| `packages/boot/app-boot/src/profile.ts` | `PROFILE_TEMPLATES.headless`、launcher 组合 |
| `apps/cli/src/bin.ts` | 产品 bin 分发 |
| `_digested/composition/00-map.md` | 启动组合机制 |
