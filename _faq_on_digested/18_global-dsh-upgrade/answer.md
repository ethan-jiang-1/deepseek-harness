# 答案:全局 DSH CLI 的安全升级路径(所有未来升级通用)

## 结论

升级命令永远是这一条:

```sh
npm install -g @deepseek-ai/dsh@latest
```

因为它就是本机的事实安装方式(npm 全局,装在 nvm prefix 下),而 `latest` 这个 dist-tag 正是「最新 RC 或正式版」通道——DSH 把 RC 发布在 `latest` 上(2026-09-30 观测:`latest` = `0.2.0-rc.2`),所以「只升 RC/正式、不碰 alpha」的策略直接映射为**永远用 `@latest`,永远不用 `@alpha`**(`@next` 目前与 `latest` 同步,但语义不受我们控制,也不用)。

把前后检查、确认、安装、校验、回滚固化成的脚本在本目录:

```sh
bash _faq_on_digested/18_global-dsh-upgrade/upgrade-dsh-global.sh          # 交互模式
bash _faq_on_digested/18_global-dsh-upgrade/upgrade-dsh-global.sh --dry-run # 只做检查,不安装
bash _faq_on_digested/18_global-dsh-upgrade/upgrade-dsh-global.sh --yes     # 免确认(不自动跑 sudo)
```

## 事实链

1. **安装方式**:npm 全局。bin 软链 `~/.nvm/versions/node/v22.23.1/bin/dsh → ../lib/node_modules/@deepseek-ai/dsh/lib/bin.js`(package.json 的 `bin.dsh`)。CLI 没有自升级命令,所以升级主体就是包管理器的全局安装命令。
2. **通道语义**:npm `dist-tags` 实测为 `latest = 0.2.0-rc.2`、`next = 0.2.0-rc.2`、`alpha = 0.1.7-alpha.2`。`alpha` 是先行实验通道;按约定我们只消费 `latest`。
3. **Node 版本前置**:仓库 package.json 声明 `engines.node: "^22.19.0 || >=24.0.0"`(基线 `dsh-v0.2.0-rc.2`)。注意:**发布到 npm 的包 metadata 里不带 engines 字段**(2026-09-30 实测 `npm view @deepseek-ai/dsh@0.2.0-rc.2 engines.node` 为空),npm 因此不会替你拦,检查要自己做——脚本里用仓库默认范围兜底。
4. **npm 缓存坑**:`~/.npm` 缓存里有 root 属主残留文件时,npm 任何要写缓存的操作(包括 `view` 和 `install`)都会 EPERM,报错文本自带的修复命令是 `sudo chown -R "$(id -u):$(id -g)" "$HOME/.npm"`。脚本会先探测,能修就(经确认后)修,不修就整体改用 `$TMPDIR` 临时缓存,不让缓存问题挡住升级。
5. **回滚与用户数据**:全局包本身无状态;用户数据在 `~/.dsh/`(session、attachments、设置等),不随 npm 包的安装/卸载变化。所以回滚 = `npm install -g @deepseek-ai/dsh@<旧版本>`,旧版本号脚本会在升级前打印出来。
6. **升级收尾**:跨预发布版本的变更条目记录在仓库 `docs/upgrade-guide/v<版本>/` 下(如 `v0.1.7-rc.2/` 有 schedule-optional-bundle、transcript-view-legacy-normal 两条)。升级完成后要核对目标版本有没有对应目录;本地 checkout 可能落后,以 GitHub 上的仓库为准。

## 脚本做什么(检查清单)

| 阶段 | 检查/动作 | 失败时的行为 |
|---|---|---|
| 预检 | node/npm 存在 | 中止并提示 |
| 预检 | 安装方式识别(npm/pnpm 全局,读全局 root 下的 package.json) | 中止;只支持 npm/pnpm |
| 预检 | 有没有正在运行的 dsh 进程(`pgrep -f`) | 警告 + 确认后才能继续 |
| 预检 | registry 可达性 + npm 缓存健康(`npm view` 探测) | EPERM → 提供修复/临时缓存旁路;网络问题 → 中止 |
| 解析 | dist-tags 全量展示,取 `latest` 为目标 | 解析失败中止 |
| 解析 | 目标版本 engines 校验(自实现的 `^`/`~`/`>=` 求值器) | 不满足 → 中止并给 nvm 建议;语法不认识 → 警告 + 人工确认 |
| 确认 | 摘要(方式/版本/范围/缓存)逐项确认后才动手 | 拒绝即退出,零改动 |
| 安装 | `npm install -g @deepseek-ai/dsh@latest`(pnpm 则 `pnpm add -g`) | 打印处置建议后退出 |
| 校验 | `command -v dsh`、`dsh --version` 与目标一致、`dsh --help` 冒烟 | 版本不一致 → 警告并给回滚命令 |
| 收尾 | 打印回滚命令;核对本地 checkout 的 `docs/upgrade-guide/v<目标版本>/` | 无条目则提示去 GitHub 核对 |

`--yes` 跳过所有确认,但**不会自动执行 sudo 修复**(需要人在场输密码),改走临时缓存旁路。`--dry-run` 完整跑一遍检查并打印将执行的命令,不做任何写操作。

## 今后每次升级的 runbook

1. `bash _faq_on_digested/18_global-dsh-upgrade/upgrade-dsh-global.sh`(或先 `--dry-run` 预览);
2. 升级完成后按脚本末尾提示过一遍 `docs/upgrade-guide/v<新版本>/` 的迁移条目;
3. 有问题用脚本打印的回滚命令退回旧版本,`~/.dsh` 数据不受影响。

如果某天安装方式变了(比如换 pnpm 全局),脚本会自动识别;如果脚本本身报「不支持的安装方式」,说明安装路径偏离了本 FAQ 的事实链,先回来更新这条 FAQ 再说。

## 引用来源

- npm registry 实测(2026-09-30):`dist-tags`、发布包无 engines 字段。
- 本机实测:npm 全局路径、bin 软链、`dsh --help` 无自升级命令、`~/.npm` 缓存 EPERM 报错文本。
- 仓库基线 `dsh-v0.2.0-rc.2`:根 package.json 的 `engines.node`;`docs/upgrade-guide/` 的目录结构(该结构由 `.agents/skills/dsh-create-upgrade-guide/SKILL.md` 约定)。
- 用户数据位置:`~/.dsh/`(本机实测目录列表)。
