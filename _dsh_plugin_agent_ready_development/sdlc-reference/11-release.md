# Reference 11 · Release（merge 之后：发布与上线）

## 一句话

merge 到 master 不触发任何发布。上线是一条显式的人工链：本地 `release:*` bump 把版本写进 manifest 并 commit（观察到的形态是经 `rel/*` 分支的 PR 合入 master）→ 人从 master 打 `dsh-v*` tag → 人手动 dispatch publish workflow（`npm-publish` 等 protected environment 审批）→ registry 按"三态"决定实际发布内容。发布前的 rehearsal（pack + packed-install 探针）反而无凭据地跑在每个 PR 和 master push 上；docs、Python、native、Desktop 各有独立 lane。

> The version lands in the manifests, the lockfile follows, and a human creates the tag after the commit merges. CI never writes to the repository.
>
> — DSH [`scripts/release/bump.ts` 的文件头](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/scripts/release/bump.ts)。发布版本永远先落在仓库里，CI 只检查和上传，从不回写版本。

## 1. 三条独立 release family 序列

发布机制的权威决定记录是 [npm release sequences Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.agents/notes/implemented/process/2026-08-10-npm-release-sequences.md#three-independent-sequences)：

| 序列 | 成员 | 版本基线 | tag | 打包 / 发布 workflow |
|---|---|---|---|---|
| dsh | `packages/*/*` 与 `apps/*` 的 publish set（private 例外见 denylist note；private 包只跟版本不发布） | 全家一个版本，落在根 `package.json`（基线时为 `0.2.0-rc.2`，由静态 gate 强制全员一致） | `dsh-v<version>` | [`release.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/workflows/release.yml) / [`release-publish.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/workflows/release-publish.yml) |
| vendored framework | `vendor/` 九个 rescoped Cordis 包 | 每包自己的版本行 | `vendor-<package>-v<version>`（每包一个） | [`release-vendor.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/workflows/release-vendor.yml) / [`release-vendor-publish.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/workflows/release-vendor-publish.yml) |
| native | `native/system/packages/*` | 自己的版本线 | `node-addon-system-v<version>` | [`node-addon-system-release.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/workflows/node-addon-system-release.yml) |

三条序列共享一个 npm scope（`@deepseek-ai`）但互不等待：发布 dsh 不会重发 vendor，反之亦然。Python 与 Desktop 是另外两条 lane（§5）。本地命令对应 `package.json` 的 `release:dsh`、`release:vendor`、`release:verify`、`release:pack`、`release:verify-packed-install`、`release:publish`。

## 2. 版本落库与 tag：人的两步动作

`pnpm run release:dsh <version>`（或显式 `x.y.z[-rc.N]`）写版本进 publish set、全部 private dsh 包与 workspace 根，跑 `pnpm install --lockfile-only`，然后 commit 为 `release(dsh): <version>`。基线历史显示这个 commit 经独立分支进入 master：`rel/dsh-0.1.7-rc.1` → PR #5073 → merge commit（由 tag `dsh-v0.1.7-rc.1` 定位）。bump 完成时打印的指引正是 "After this merges to master, tag it: `git tag <tag> <merge commit> && git push origin <tag>`"。

tag 节奏可以从历史直接读出（截至基线共 25 个 `dsh-v*` tag，`git tag -l | wc -l`；0009 轮复核：0.1.7-rc.1 基线时为 22 个，此后新增 `dsh-v0.1.7-rc.2`、`dsh-v0.2.0-rc.1`、`dsh-v0.2.0-rc.2`）：`dsh-v0.1.5-rc.1..rc.2` 之间 4 个 commit、`rc.2..rc.3` 之间 3 个（基本就是 bump commit 加少量随行修复），而 `dsh-v0.1.7-alpha.2..rc.1` 之间 156 个 commit（功能合流后打 RC）。相邻 tag 间隔从几小时到约 11 天。release tag 直接打在 release PR 的 merge commit 上，样本里距前一个 merge commit 约 19–41 分钟（`dsh-v0.1.5-rc.1`=23m48s、`dsh-v0.1.5-rc.2`=40m34s、`dsh-v0.1.7-rc.1`=19m27s；0010 轮重测，0009 轮的「24–41」读数与「19 来自 release-commit 端点」的归因均不可复现）；release PR 本体是单个 `release(dsh): <version>` commit（`2026-09-23 · release(dsh): 0.1.7-rc.1`，312 个文件全是版本号 bump）。dist-tag 规则：`alpha`/`canary` 映射到同名 dist-tag，其余 prerelease（含 `rc`）→ `next`，稳定版 → npm 默认 `latest`。

## 3. rehearsal 与 publish 是两个 workflow

**Rehearsal（无凭据，常开）。** [`release.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/workflows/release.yml) 的头注说明分工："Pack and dependency-layout verification run without credentials on every pull request and master push. Publication is a manual workflow_dispatch of release-publish.yml from a dsh-v* tag." `pack` job 以 `fetch-depth: 0` 检出（注释 "Complete history: the release scripts read tags"），依次跑 `release:verify --family dsh`、`build:official`、`release:pack`，再把 vendor 家族与 Landlock entry 一并打包——它们不发布，只供 [`release:verify-packed-install`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/scripts/release/verify-packed-install.ts) 把 tarball 装进一次性 consumer 并驱动真实入口。也就是说，**每个 PR 都在证明"release set 仍可打包、发布范围仍可安装"**。

**Publish（manual dispatch，环境保护）。** [`release-publish.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/workflows/release-publish.yml) 只监听 `workflow_dispatch`，"publication must always be an explicit, reviewed act from a dsh-v* tag, and it must never appear as a PR check"。它在 `RELEASE_PUBLISH=true` 下重跑 verify（追加"当前 ref 必须匹配 `dsh-v*` tag"与 `private: true` 拒绝检查）、重新 pack 当树（"so the bytes uploaded are exactly what this dispatch produced"），最后 `publish` job 挂 `npm-publish` environment（required reviewers 由 environment 持有），用全局 `Release-publish` 并发组串行执行，因为 dist-tag 是共享的 registry 状态。

## 4. registry 三态决定最终发布什么

Publish 不读"这次发哪些包"的清单，而是对每个 tarball 查询 registry：

| registry 状态 | 动作 |
|---|---|
| 没有该版本 | publish |
| 有该版本，tarball sha512 与 `dist.integrity` 相同 | skip（幂等重跑） |
| 有该版本，integrity 不同 | fail：内容变了但没 bump 版本 |

第三态抓"改了代码没升版本"，前两态让重跑安全。写入间隔 ≥2 秒并退避重试（连发会撞 registry 的 `E409`），每次重试先重读 registry——一次"报错"可能对应已经落地的写入。

## 5. 其余发布 lane

| Lane | 触发 | 关键约束 |
|---|---|---|
| 文档站（GitHub Pages） | [`docs-pages.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/workflows/docs-pages.yml) 仅 `workflow_dispatch` | "the site presents a released snapshot, so publication is an explicit act from a dsh-v* tag"；`release:verify` 拒绝一切其它 ref，`github-pages` environment 以 deployment tag policy + required reviewers 复述同一限制；每个 PR 已通过 `check:ci:static` 构建过生产站点 |
| Python（PyPI） | [`python-release.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/workflows/python-release.yml) `workflow_dispatch` + `publish` 输入 | 授权三条件：私有 publisher 仓库身份匹配、`PUBLIC_PYPI_RELEASE_ENABLED`、ref 必须是匹配仓库版本的 `python-v*` tag；五平台 wheel、`twine check`、`pypi-runtime`/`pypi` environment 走 OIDC Trusted Publishing（attestation 关闭，避免暴露私有 publisher 仓库） |
| native（npm） | [`node-addon-system-release.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/workflows/node-addon-system-release.yml) `workflow_dispatch` + `publish` 输入 | 必须从 `node-addon-system-v*` tag 运行；per-architecture prebuilds 汇编后 pack、Landlock 强制下 verify-packed-install；publish 同样挂 `npm-publish` |
| Desktop | 本地脚本链（`package:desktop:*` / `upload:*`），无 GitHub workflow | 打包前与用户确认版本；上传到 Tencent COS 更新目录，artifacts 公开后把该 commit 打成 `desktop-v<version>`；Windows 走 EV 硬件 token 签名流程（`apps/desktop/README.md` 的 required reading） |

每个 PR 还有一条不属于发布的预览 lane：[`build-preview-cloudflare.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/workflows/build-preview-cloudflare.yml) 把 PR 的 Web 构建部署到 Cloudflare Pages（`pr-<N>` 分支别名）并幂等回贴预览 URL。

## 6. 没有 CHANGELOG：发布历史住在哪里

仓库没有 `CHANGELOG.md`。跨 tag 的发布历史由两处承载：[`docs/persistence-changes/releases/`](https://github.com/deepseek-ai/deepseek-harness/tree/dsh-v0.2.0-rc.2/docs/persistence-changes/releases)（基线时收录 26 个 alpha/RC tag 及其相邻转换，每 tag 一页加 `manifest.json`，由 keyless 的 `verify-persistence-releases` 校验），以及 `.agents/notes/` 的决定记录。发布本身有售后义务：当一次产品发布首次携带更高的 Session format，发布操作者要确认发布与 tagged writer，然后在同一双语更新中推进 [`docs/session-format-status.md`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/docs/session-format-status.md#updating-the-record) 的 release record 与 evidence tag——"do not advance this release record before publication"。

## 7. master-only 检查与发布的关系

master push 之后还有一轮 PR 面板之外的平台补齐：[`ci-master.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/workflows/ci-master.yml) 跑 Wine 化 Windows gates、Linux ARM64 与双 macOS 的 Python runtime 构建载体（注释 "These native runtime carriers are post-merge checks; release keeps all targets."）、自托管 standby 上的串行全量门禁，以及手动 dispatch 的 runner benchmark；[`sandbox.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/workflows/sandbox.yml) 在真实内核（bwrap/Landlock/Seatbelt）上做无凭据 confinement 证明。它们不进 PR check 面板（[`.github/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/AGENTS.md)："separating workflow triggers keeps master-only jobs out of PR check panels"），但 release 保留全部五平台目标——master-only 的省略不构成发布资格。

## 证据入口

- DSH [npm release sequences Agent Note](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.agents/notes/implemented/process/2026-08-10-npm-release-sequences.md)：三条序列、版本落库、registry 三态、workflow shape 与全部被否备选的权威记录。
- DSH [`scripts/release/`](https://github.com/deepseek-ai/deepseek-harness/tree/dsh-v0.2.0-rc.2/scripts/release)（`bump.ts`、`families.ts`、`verify.ts`、`pack.ts`、`verify-packed-install.ts`、`publish.ts`）：bump/verify/pack/publish 的实现真源。
- DSH [`release.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/workflows/release.yml) 与 [`release-publish.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/workflows/release-publish.yml)：rehearsal 与 publish 的触发边界。
- DSH [`docs-pages.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/workflows/docs-pages.yml)、[`python-release.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/workflows/python-release.yml)、[`node-addon-system-release.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/workflows/node-addon-system-release.yml)：其余发布 lane。
- DSH [Desktop README 的 Release versions](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/apps/desktop/README.md#release-versions) 与 [Windows EV signing](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/apps/desktop/README.md#windows-ev-signing)：桌面发布链与签名。
- DSH [Session format status 的 Updating the record](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/docs/session-format-status.md#updating-the-record) 与 [persistence releases 存档](https://github.com/deepseek-ai/deepseek-harness/tree/dsh-v0.2.0-rc.2/docs/persistence-changes/releases)：发布后的记录义务与历史存档。
- DSH [`.github/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/.github/AGENTS.md)：PR CI 与 master-only workflow 的触发器纪律。
