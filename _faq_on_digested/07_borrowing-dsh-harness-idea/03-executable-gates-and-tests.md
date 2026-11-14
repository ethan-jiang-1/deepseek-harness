# 03 · 可执行快门禁与分层验证：把口头规矩变成秒级拦截

团队在引入 Coding Agent 后最常见的挫败感是：“明明已经在 `AGENTS.md` 里加粗写了三次不准跨模块直接调数据库、改接口必须同步改文档，为什么它跑嗨了还是照犯不误？”

DSH 在 [`quality-gates` 决策记录](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/process/2026-06-11-quality-gates.md) 里早就把这个窗户纸捅破了：**`Agents follow enforced gates far more reliably than prose conventions.`** 长对话跑到后半程，文档里的软约束很容易被注意力稀释；但只要一条命令返回非零退出码（`exit 1`）并把报错拍在终端里，Agent 立刻就会停下来乖乖修好。

---

## 一、把高频口头规矩写成“自带修复提示”的小脚本

在 DSH 仓库里，[`scripts/run-gates.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/run-gates.ts) 汇总了几十个 `verify-*` 检查脚本：大到包依赖边界、导出函数 JSDoc 完整性，小到 Markdown 相对死链、文档词数上限、甚至禁止新增 `as unknown` 强转（保留历史基线只降不升）。

普通项目不需要一上来搞几十个门禁，挑你们 Code Review 里**每个月都要嘴碎提醒三次以上的死规矩**，花半小时写个几十行的 Node 或 Python 脚本就能立竿见影：

- **文档与地图防腐烂**：检查 `AGENTS.md` 和 `docs/` 里的本地相对链接与 `#anchor` 是否真实存在；检查根 `AGENTS.md` 是否超出了团队约定的行数上限。
- **架构分层防越界**：用简单的正则或依赖图扫一遍 `import`——比如禁止 `ui/` 直接引用 `db/`、禁止业务模块绕过统一客户端私自 `new OpenAI()`。
- **派生物防手改漂移**：OpenAPI 客户端、数据库类型、配置表生成脚本统一提供 `--check` 模式，一旦有人改了源码忘跑生成命令，当场 `exit 1`。
- **老代码债“棘轮封顶”**：如果老项目里已经有 20 处裸 `any` 或未捕获异常一时半会儿清不完，学 DSH 记一个基线计数只准减少不准增加，先堵死增量失血。

**写给 Agent 看的报错信息有个关键窍门**：别只冷冰冰打一行 `Check failed`，要在标准错误输出里一次性写全 **`违规文件与行号 + 违反了哪条规则 + 怎么修（或跑哪条命令刷新）`**。报错越具体，Agent 在下一轮自主修复的成功率就越高，完全不用人插手。

---

## 二、本地快反馈 vs 远端全矩阵：别把 Git 钩子塞成慢速小 CI

门禁一多，紧接着就会踩第二个大坑：有人把全量单测、打包构建全塞进 `pre-commit` 钩子，结果每次提交要等三分钟——不出两天，全组人和 Agent 都会养成敲 `--no-verify` 绕过检查的坏习惯。

DSH 在 [`lefthook.yml`](https://github.com/deepseek-ai/deepseek-harness/blob/master/lefthook.yml) 和 [`fast-local-git-hooks` 记录](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/archived/process/2026-07-22-fast-local-git-hooks.md) 里的切分非常值得照抄——**本地只抓便宜高置信的毛病，穷举矩阵全推给远端 CI**：

| 时机 | DSH 实际跑什么 | 耗时量级与分工原则 |
|---|---|---|
| **`git commit`（`pre-commit`）** | 仅针对 staged 暂存文件跑快速 Oxlint（自动修复格式）、`git diff --cached --check`（尾随空白与换行检查）及极轻量守卫 | **秒级完成**。明令禁止把单测套件、快照、构建塞进 commit 钩子 |
| **开发迭代内圈（按需执行）** | 先用 `change-scope` 看清当前分支改了哪几个包，**只跑受影响包的最窄单测**，改了文档再补跑 `doc-sync`（见 [`dsh-pre-push-checks`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-pre-push-checks/SKILL.md)） | **几秒到十几秒**。反馈够快，Agent 才愿意每改一小步就真跑一次 |
| **`git push`（`pre-push`）** | 跑 `pnpm run typecheck` 做跨包类型兜底 | **几十秒级**。拦截跨模块签名改坏但单包测试没编译到的漏网之鱼 |
| **远端 PR CI（`.github/workflows/ci.yml`）** | 全仓单文件 100% 覆盖率（`test:coverage`）、全套文档与生成目录同步、构建与发布包体检（`hygiene`）、跨平台矩阵，汇总为 `all-checks-passed` | **分钟级并行**。由机器集群承担穷举成本，不占本地开发心流 |

---

## 三、五层验证各司其职，新门禁必做“红灯对照”

自动化检查不是挂得越多越安全，关键是搞清楚每一层能证明什么、不能证明什么（完整测试策略见 [`docs/testing.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md)）：

1. **编译与类型检查**：能证明接口签名拼得上、闭合联合类型（`switch + assertNever`）没漏分支；证明不了运行时配置有没有配错。
2. **启动加载期校验（`Fail loud`）**：配置解析错、必填引用缺失时在进程启动第一秒直接抛错退出，绝不用隐式默认值带病跑起来。
3. **模块单元测试**：能快速钉住单个模块的边界条件与错误处理；但 **100% 单测全绿依然可能在线上组装时崩掉**（DSH 历史上就出过 178 个单测全绿、覆盖率满分，结果真实入口漏接线导致功能全挂的事故，详见 [FAQ 21](../21_recorded-session-snapshots/answer.md)）。
4. **真实入口组装与回放测试**：走真实的命令行、路由或配置组装入口跑通端到端链路；如果涉及昂贵或不稳定的外部大模型调用，可以把真实响应录下来做无密钥确定性回放（`keyless` 快照）。
5. **人工 / Agent 语义评审（Code Review）**：机器门禁帮你把格式、死链、类型等体力活清零，是为了让审代码的人把精力全部集中在机器审不出来的软问题上——意图对不对、模块拆得合不合理、有没有漏掉关键边界。

无论写新单测还是写新门禁脚本，DSH 都有两条保命规矩可以直接搬走：

- **红灯对照（`Introduce the regression, watch red, revert`）**：新写完一条检查或回归测试，先别急着提交——手动把刚修好的那行代码改坏（或者故意造一个违规样本），亲眼看着它报红失败，再把代码恢复回来。没红过的门禁，十有八九正则表达式写偏了，是个永远绿灯的摆设。
- **验证外部世界，别信返回自述（`Verify the world, not the self-report`）**：测试断言要去查真正落盘的文件、数据库记录、HTTP 响应体或持久日志，绝不能只看函数返回了一个 `{ ok: true }` 就宣布通过。

---

## 四、加餐：如果你的项目本身也在集成或自研 Agent 循环

假如你维护的不只是普通 CRUD 服务，而是自己也在业务里搭了一套调工具的大模型 Agent 工作流，DSH 在运行时执行链（[`docs/tool-execution-pipeline.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/tool-execution-pipeline.md)）和上下文管理上的四条小经验非常管用：

1. **工具调用先记日志再执行**：任何模型发出的动作请求，先往只追加（append-only）任务日志里落一条记录再真正调外部接口——哪怕执行中途崩了，事后排障也能精确还原现场，还能顺手拿这套日志做离线回放测试。
2. **权限和风控抽到工具函数外面**：别在二十个工具的 `execute()` 函数里各自写一遍白名单和参数审计；在分发器外层设一道统一的 `pre-execute` 拦截层，改安全策略时只动一个文件。
3. **异常统一兜底转成结构化错误结果**：外部工具超时或抛异常时，由外层管道统一捕获并转成模型能读懂的错误反馈（如 `isError: true`），别让未捕获异常把整轮对话直接炸断，也别把残缺的中间状态塞进上下文。
4. **长对话压缩别拆散配对，派子任务别倒垃圾**：如果做上下文裁剪（compaction），切分边界一定要保住 `tool-call` 和对应 `tool-result` 成对出现；往下派发独立子任务（subagent）时，默认只传干净的任务目标和必要入参，别把父会话攒了几万字的聊天历史原样灌进去带偏子模型。
