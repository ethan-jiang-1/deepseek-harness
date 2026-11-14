# 01 · 仓库地图与文档分工：让 Agent 进门十秒找对地方

Coding Agent 进一个陌生仓库时，最常见的死法有两种：要么根目录只有一份年久失修的启动说明，Agent 只能靠 `grep` 盲猜架构；要么有人把所有编码规范、历史背景、接口教程全塞进一份几千行的超级 `CLAUDE.md`，结果上下文还没开始干活就塞满了，关键红线反而被淹没。

DSH 解决这个矛盾靠的不是文笔，而是四条硬性分工：**入口只做路由、每个事实只放一处、文档只写现状、常驻文件卡死预算**（主仓自身的设计细节另见 [FAQ 04](../04_root-entry-doc/answer.md)）。

---

## 一、入口骨架：`AGENTS.md` 只放常驻路标，`CLAUDE.md` 软链接合一

打开 DSH 仓库，它的指令入口是一棵极克制的路由树：

```text
CLAUDE.md ──(symlink)──> AGENTS.md（常驻铁律 + 顶层目录地图 + 常用命令，每条 1~3 行并链向权威文档）
                           ├─ docs/architecture.md（模块关系与“新行为接哪里”路由表）
                           ├─ packages/AGENTS.md（仅在子树确有专属常驻规则时才设立）
                           │    └─ packages/<group>/<pkg>/README.md（单包对外契约与已知限制）
                           ├─ .agents/skills/<name>/SKILL.md（高频多步流程，按需加载）
                           └─ .agents/notes/（持久设计取舍与被否决方案）
```

往自己项目搬时，直接照抄四个动作：

1. **一条软链接消灭双份维护**：Claude 系列工具默认找 `CLAUDE.md`，DSH、Codex 等找 `AGENTS.md`。在根目录执行 `ln -s AGENTS.md CLAUDE.md`（DSH 全仓在根、`packages/`、`vendor/` 等处共设了 4 个同名软链接），永远只改真实文件，杜绝两份规则越改越岔。
2. **根 `AGENTS.md` 只留“每轮对话都用得上”的东西**：仓库目录一句话导航、构建/测试/检查命令表、以及踩中就会坏事的全局底线。每条规则控制在 1–3 行，具体怎么做直接贴相对链接——比如根文件只写“推送前按改动面跑最小检查”，具体选法链向 [`dsh-pre-push-checks`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-pre-push-checks/SKILL.md)。
3. **子树 `AGENTS.md` 宁缺毋滥**：只有当某个大目录（比如前端客户端、数据库迁移目录）确实存在跟全仓不同的专属红线时才放一份子级 `AGENTS.md`；绝大多数业务模块只需要自己的 `README.md`。
4. **给“改哪里”立一张两列路由表**：经验丰富的老员工知道“加鉴权去中间件、加渠道去 adapter”，Agent 不知道。学 [`docs/architecture.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md#where-new-behavior-goes) 写一张 10–15 行的 **`需求目标 → 具体改动入口`** 表，右列必须写清具体目录、基类或注册函数（例如 `新增支付渠道 → 在 src/providers/ 实现 PaymentAdapter 并注册到 registry.ts`），别写“参考相关模块”这种正确的废话。

---

## 二、一个事实一个家（`One home per fact`）与“只写现状”

[`docs/AGENTS.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/AGENTS.md) 里最值得贴在团队墙上的就两句话：**`Each fact has one home: the tier whose job it is; elsewhere, link there`**，以及 **`Document current state`**。

普通业务仓库不需要照搬 DSH 的十几个文档层级，切成下面五格就够清爽了：

| 信息类型 | 唯一权威位置（Home） | 严禁塞进哪里 |
|---|---|---|
| **每次必守的底线、目录与命令** | 根 `AGENTS.md` | 各模块 README 到处复制粘贴 |
| **模块边界与扩展入口** | `docs/architecture.md` | 散落在 PR 评论或飞书群聊天记录 |
| **模块当前行为、配置与已知限制** | 模块 `README.md` + 导出类型 JSDoc | 混写“v1 以前怎么做、这次重构改了啥” |
| **为什么选 A 弃 B（含被否决方案）** | `docs/adr/`（或 `.agents/notes/`） | 写在代码大段注释里，或拿 ADR 冒充当前接口文档 |
| **重复出现的复杂操作步骤** | `.agents/skills/<name>/SKILL.md` | 全文塞进根 `AGENTS.md` 挤占每轮上下文 |

**自检有没有做到位的方法很简单**：挑一条规则搜全仓，如果把权威位置之外的重复解释全删掉、只留链接，信息一点没丢，说明分家干净了。同时严禁在 `docs/` 或 `README` 里留 `已实现！`、`未来计划支持...`、`原先用 X 现改为 Y` 这类时态垃圾——历史演进归 Git log 和决策记录，`docs/` 永远只回答“截至当前 HEAD 系统怎么工作”。

---

## 三、用字数预算和按需加载防“入口发福”

文档体系建好三个月后最大的敌人是“追加冲动”：每次线上出个小坑，就有人往根 `AGENTS.md` 塞十行叮嘱，半年后根入口变成没人读得完的裹脚布。

DSH 从静态和运行时两头锁死了这件事：

- **静态字数预算门禁**：[`scripts/doc-budgets.manifest.json`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/doc-budgets.manifest.json) 搭配 [`scripts/verify-doc-budgets.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-doc-budgets.ts)，直接给 7 份核心常驻文档卡死词数上限。一旦写超变红，规定必须按 **先挪走越界内容（Relocate）→ 再精简措辞（Condense）→ 确实省无可省才准在 PR 里写明理由上调上限（Raise）** 的顺序处理，平时收窄上限还要留出至少 5% 余量。
  - **迁移实操建议**：中小型仓库起步时，把根 `AGENTS.md` 卡在 **300–1,000 英文词（中文约 600–1,800 字）** 最舒服。注意 `wc -w` 按空格分词，遇到纯中文会把整段算成 1 个词——中文仓库写预算脚本时一定要按**字符数（`wc -m`）或非空行数**卡关。
- **把低频长流程拆进 `SKILL.md` 按需读取**：像“发版前核对”“数据库字段迁移”“排查性能抖动”这类流程，平时根本不需要占上下文。学 DSH 的 [`dsh-pre-push-checks`](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/skills/dsh-pre-push-checks/SKILL.md) 写成独立技能文件：YAML 头两行 `name` + `description` 写清触发时机（`Use before... / Use when...`），正文每一步配**可直接执行的命令**而非空洞散文。Agent 常驻上下文只看两行摘要，命中任务才读正文（见 [`tool-skill` 说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/tool-skill/README.md)）。
- **运行时渐进注入（供自研 Agent 宿主参考）**：DSH 自身的 [`agent-instructions`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/context/agent-instructions/README.md) 插件只在开局注入根级指令，子目录 `AGENTS.md` 要等模型用 `read`/`write`/`edit` 真正触达该目录时才动态挂载（`touch-driven`），且自动对软链接去重、受 `maxBytes` 总预算封顶。就算你直接用现成的 Claude Code 或 Cursor，只要静态层做到了“根文件够短 + 细节外链 + 流程进 Skill”，同样能白拿绝大部分省上下文的效果。

---

## 四、手写地图 vs 自动生成目录：什么时候该写生成器？

看到 DSH 里齐全的 [`docs/tool-catalog.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/tool-catalog.md)、[`docs/config-catalog.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/config-catalog.md) 和 [`docs/capability-seams.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/capability-seams.md)，不少团队第一反应是“我们也写一套 AST 扫描生成文档吧”。先别急，看体量下菜碟：

- **模块少于 20 个、配置项一屏能看完时：直接手写短表，别造生成器。** 维护生成脚本本身的成本比改两行表高得多。
- **当注册项多到“新增一个工具/错误码/路由总有人忘改文档”时：上“生成脚本 + `--check` 门禁”。** DSH 的生成目录从不允许手改，且大多直接启动真实注册表导出 schema（防动态拼接漏扫），并在 CI `doc-sync` 里比对工作区是否有未提交差异——一旦脱节当场报红。
- **当多层配置覆盖（环境变量 + 默认配置 + 本地覆盖）总让 Agent 猜错实际生效值时：优先加一条 `--dump-config` 只读打印命令。** 让 Agent 跑一条命令看最终合成结果，比读十个配置合并函数靠谱得多。
