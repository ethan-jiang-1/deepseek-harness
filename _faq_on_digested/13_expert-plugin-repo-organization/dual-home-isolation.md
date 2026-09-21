# Dual Home · 开发 home 与日用 home 隔离：插件做崩了也不碰日用 DSH

## 问题

我已经在用官方安装的 DSH（默认 home `~/.dsh`）。开发自己的插件时，理想是直接插到这个正在用的 DSH 里试；但插件做错了 DSH 崩溃怎么办？我只有一个 DSH——能不能有两个：一个专门开发用，一个日常跑，互相不干扰？

## 一句话答案

**不需要装两份 DSH，起两个 home 就行。** DSH 的隔离单位不是"实例"，是 **Harness home**（解析顺序：显式指定 → `$DSH_HOME` → 默认 `~/.dsh`，见 `docs/config-catalog.md`）。日用 DSH 留在默认 home 原样不动；开发用 `DSH_HOME=~/dsh-dev` 起第二个 home，两边从进程到数据互不可见。

## 机制依据（为什么隔离是物理的）

- **profile 存在 home 里**：`dsh --profile <p>` 用的是 `$DSH_HOME/profiles/<p>`；`dsh plugin --profile <p> add` 装进的是这个 home 里这个 profile。
- **每个 profile 是独立的 npm 项目**：自己的 package 集、lockfile、`node_modules`、插件激活状态；`architecture.md` 明说这些从不跨 profile 共享——隔离是物理的，不靠操作纪律。
- **数据也在 home 里**：会话日志（`sessions/`）、settings、凭据（`$DSH_HOME/.credentials.yaml`）、用户级 `AGENTS.md`、`$DSH_HOME/.agent-presets` 各自独立。

## 落地设置

```sh
# 日用 DSH：默认 home ~/.dsh，保持官方安装原样，什么都不装
dsh web

# 开发 DSH：另一个 home，随你折腾
export DSH_HOME=~/dsh-dev                    # 或写进专家 repo 的 dev/ 环境脚本
dsh plugin --profile dev add file:./packages/expert-pack
DSH_HOME=~/dsh-dev dsh --profile dev "…"     # 起 dev profile 会话（profile 按需首次生成）
```

三条工程化建议：

1. **环境脚本兜底**：把 `export DSH_HOME=~/dsh-dev` 放进专家 repo 的 `dev/` 环境脚本（或 direnv）。这条最关键——**coding agent 不会自己想起来这个区别**，靠环境兜底比靠提醒可靠；agent 起的一切会话自动落在开发 home。
2. **开发 home 配一次 key**：凭据按 home 隔离，`~/dsh-dev/.credentials.yaml` 要自己配一次 `DEEPSEEK_API_KEY`（或接受真实 API 测试在开发 home 里 self-skip）。
3. **更细的临时实验连开发 home 都不落**：`dsh --profile <p> --patch ./dev/try-x.patch.yml` 单次启动生效、不落盘——试一行配置的风险半径是一次进程。

## 崩溃故事：做错了会发生什么

插件把组合弄坏时，**fail-loud 纪律让装载在最早可解点报错**——炸的只是开发 home 里那一次启动，错误信息直接指出装不上的插件行与原因（preset roster 也会连原因列出装不上的 preset）。日用 home 里根本没有这个插件，不存在"恢复"动作。运行期才炸的插件（比如工具 execute 抛异常）影响半径也只是那一次会话进程；日用 home 的会话与数据不在同一个 world 里。

## 迁移方向：从开发 home 到日用 home

开发 home 里走完 [dev-loop](./dev-loop.md) 全流程后，插件以**发布物**（npm 包名或 `github:<owner>/<repo>`）进日用 home：

```sh
dsh plugin --profile <daily-profile> add <npm-name>     # 装的是发布物，不是工作区
```

出问题时按 [dev-loop 插拔速查](./dev-loop.md#附录--插拔速查)回退（patch `disabled` 或卸载）。日用 home 从头到尾不承担开发期的不确定性——它只见经过冒烟的版本。

## 与四方案的关系

四方案（A/B/C/D）都适用本篇，无差异：隔离由 home 机制提供，与 repo 形态无关。开发 home 的落点有两个等价选择——**repo 内托管**（方案 A 的 `dev/harness-home/`，即把 `DSH_HOME` 指向它，运行残留 gitignore）或 **repo 外**（`~/dsh-dev`，如上文）；无论哪种，只要不是日用 home 就达到目的。方案 B 因为整个 repo 就是 DSH，开发跑在源码 checkout 上，天然不碰官方安装——双 home 对它退化成"源码 checkout vs 官方安装"的隔离。
