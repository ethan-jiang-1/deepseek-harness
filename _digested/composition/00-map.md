# Composition 地图

## 一句话定位

一次正在跑的 `dsh` 是 boot 时按层叠出来的插件树。profile 是命名组合，bundle 是可安装的 patch 层，用户的 `cordis.patch.yml` 叠在所有 bundle 之上。

```text
空 entry list
  + 每个 bundle 的 cordis.patch.yml（profile 声明的顺序）
  + 该 profile 的 cordis.patch.yml
  + Harness home 的 cordis.patch.yml
  + 命令行 --patch
```

id 命中的 patch **整份替换** 该行 `config`（要保留的字段得重写）；`insert` 加新行。

## 这一层回答什么

- `$DSH_HOME`（默认 `~/.dsh`）里 profile 目录长什么样。
- `dsh.profile` / `dsh.bundle` 在 `package.json` 里如何声明。
- `dsh-base` 为什么是每个 profile 的第一层；`web` 与 `headless` 在它之上加了什么。
- `composeEntries` / `boot` / `renderConfigDump` 如何共用 Include 的 patch 算法。
- 误配置为什么必须 fail loud，而不是跳过缺失的 bundle。

## 源码入口

| 路径 | 角色 |
|------|------|
| `packages/boot/app-boot/` | `boot`、`loadProfile`、`composeEntries`、`renderConfigDump` |
| `packages/boot/cmdline/` | CLI 参数如何选 profile / patch |
| `packages/bundle/base/` | 每个 profile 的第一层 |
| `packages/bundle/web-app/` | Web 应用层 |
| `packages/bundle/headless/` | 一次性 runner，无 server |
| `apps/cli/` | 产品 bin `dsh` |
| [`packages/boot/app-boot/README.md`](../../packages/boot/app-boot/README.md) | profile 机器合同 |
| [`docs/architecture.md`](../../docs/architecture.md) Profiles and bundles | 产品地图上的这一层 |

看树上实际装着什么：

```sh
dsh --profile web --dump-config
```

打印出的每一行都可以被你自己的 patch 整行替换。

## 计划中的章节（待消化）

| 文件 | 打算回答 |
|------|----------|
| `01-profile-与-home.md` | `$DSH_HOME/profiles/<name>`、模板 `web`/`headless`、`.env` 分层 |
| `02-bundle-patch-层.md` | bundle 清单、`applyEntryPatches`、insert vs 整行替换 |
| `03-boot-时序.md` | `boot()`：Loader、prepare、include mount、fail-loud |
| `04-dump-config-保真.md` | 为什么 dump 必须等于 boot，源码如何强制这一点 |
