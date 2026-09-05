# Composition · 启动组合

## 一句话

一次正在跑的 `dsh` 是 boot 时按层**叠出来的插件树**。profile 是 Harness home 里的具名组合，bundle 是可安装的 patch 层，用户的 `cordis.patch.yml` 叠在所有 bundle 之上。

仓库里没有一份「最终 cordis.yml」代表你机器上的树。那棵树是算出来的。

## 从空列表开始叠

![组合：从空列表开始一层层 patch](./figures/patch-layers.svg)

顺序固定：

```text
空 entry list
  + 每个 bundle 的 cordis.patch.yml（profile 里写的顺序）
  + 该 profile 的 cordis.patch.yml
  + Harness home 的 cordis.patch.yml
  + 命令行 --patch
```

两条机械规则：

- **id 命中：整份替换**该行 `config`。想保留的字段必须重写，没有深合并。
- **`insert`：加新行。** 同一次列表里，后面的 patch 必须能打到前面刚 insert 的行（这是 vendor Include 的本地修改之一）。

列出的 bundle 若没有 `dsh.bundle` 声明，启动失败，不会默默跳过。Patch 文件必须是列表；要保留一个空层，写 `[]`。

`composeEntries`、`boot()` 与 `renderConfigDump` 共用 Include 的 `applyEntryPatches`。`--dump-config` 展示用户可编辑层，launcher 派生层只在启动时追加；差异和 `!!js` 保真见 [`02-dump-与boot-保真.md`](./02-dump-与boot-保真.md)。

```sh
dsh --profile web --dump-config
```

输出中的 entry 可由后续 patch 按 id 替换；launcher 派生层不属于这份输出。

## Profile 住在 home，不在 git 仓库根

![Harness home 与 profile 目录](./figures/profile-home.svg)

- **profile**：`$DSH_HOME/profiles/<name>`（未设 `DSH_HOME` 则为 `~/.dsh`）。里面有 `package.json`（`dsh.profile.bundles` + 树外插件）和用户自己的 `cordis.patch.yml`。
- **bundle**：npm 包，清单里写 `"dsh": { "bundle": { "patch": "./cordis.patch.yml" } }`。`dsh-base` 是每个 profile 的第一层；其它 bundle 增加 Web 或 headless 等产品组合。`dsh-base` 不依赖、也不挂载可选的 Codex / Claude Code provider；它们是独立的 Profile Bundle，用 `dsh plugin --profile <name> add` 装进 profile 并 restart，各自在 host 平面注册一个 dormant 默认 provider，agent preset 再决定要不要露出对应的 model-facing tool 行——host 可用不等于 tool 暴露。
- **模板**：`web`、`headless`、`sdk`、`sdk-minimal`、`acp` 五个内置 profile 首次使用会自动初始化（`PROFILE_TEMPLATES` 登记）。其它名字必须先 `initProfile`，否则 fail loud。`sdk-minimal` 是唯一不叠 `dsh-base` 的 bundle（自己持有完整工具树）。
- **preset id 与显示名**：shipped 目录是 `ptc` / `minimal` / `standard` / `cordis`（`packages/preset/agent-presets/presets/`；rc.1 前 `code` 改名 `ptc` 并新增 `minimal`）。显示名来自各 `preset.yml` 的 `name` 字段（如 `ptc` → PTC 模式），不是 locale 映射。

启动环境分层：进程继承 > 项目目录 `.env` > home `.env`；bootstrap-only 变量不允许来自文件。`ctx.credentials` 的本地 provider 对同名引用使用启动环境 > `$DSH_HOME/.credentials.yaml` > 项目 `.env` > home `.env`，其中凭据文件是可由产品写入的持久层。

`cordis:group` 与 Include 一起注册，使 provider 和 Consumer 可以处于同一个 `isolate` realm；agent preset 的服务隔离依赖这一点。

## 源码入口

| 路径 | 角色 |
|------|------|
| `packages/boot/app-boot/` | `boot`、`loadProfile`、`composeEntries`、`renderConfigDump` |
| `packages/boot/cmdline/` | CLI 如何选 profile / patch |
| `packages/bundle/base/` | 每个 profile 的第一层（web、headless、sdk、acp 共享） |
| `packages/bundle/web-app/` | Web 应用层 |
| `packages/bundle/headless/` | 一次性 runner |
| `packages/bundle/sdk-app/` | SDK JSON-RPC 服务层 |
| `packages/bundle/sdk-minimal/` | SDK 最小化 bundle（独立树，不叠 base） |
| `packages/bundle/acp-app/` | ACP 自动化服务层 |
| `packages/experimental/agent-team-profile/` | Agent Teams CLI 实验性 profile |
| `packages/experimental/agent-team-web-profile/` | Agent Teams Web 实验性 profile |
| `apps/cli/` | 产品 bin `dsh`（所有 profile 的入口） |
| [`packages/boot/app-boot/README.md`](../../packages/boot/app-boot/README.md) | profile 机器合同 |

## 机制级正文

| 文件 | 内容 |
|------|------|
| [`01-boot-时序.md`](./01-boot-时序.md) | `runProfile` → `prepareProfile` → `boot()`；两段失败标签；`installFailLoud` |
| [`02-dump-与boot-保真.md`](./02-dump-与boot-保真.md) | 同一 `applyEntryPatches`；dump 不含 launcher 派生层；`!!js` 不求值 |
| [`03-user-patch-hmr.md`](./03-user-patch-hmr.md) | `composeLive` 夹住用户层；候选失败保留上一棵好树 |

Session 与 turn 驱动见 [`../session-and-loop/00-map.md`](../session-and-loop/00-map.md)。
