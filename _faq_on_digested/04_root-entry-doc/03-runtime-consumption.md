# 03 · 运行时消费：谁负责推入、谁负责拉取、超了谁回收？

静态文档分好层之后，下一个现实问题是：**跑起来的时候，模型真的会按这张图走吗？**

DSH 在运行时没有赌模型“自己记得先去读 `AGENTS.md`”，而是把消费过程拆成了 **推入（push）→ 拉取（pull）→ 回收（recycle）** 三个明确分工的环节。

---

## 一、推入（Push）：`dsh-agent-instructions` 负责把 `AGENTS.md` 送进上下文

[`packages/context/agent-instructions`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/context/agent-instructions/README.md) 插件专门负责在合适时机把工作区指令链注入会话，分两次触发：

### 1. 会话首步的 Baseline 注入

在每个活跃会话的第一个合规 `agent/pre-step` 节点，插件会自动组装一条持久化的 user 角色消息（外包 `<system-reminder>` 标签），折入首轮送往模型的消息批。加载顺序从宽到窄依次是：

1. 用户全局的 `$DSH_HOME/AGENTS.md`；
2. 从项目根目录一路向下到当前会话工作目录（`session.header.cwd`）沿途各层的候选文件（`AGENTS.md`、`CLAUDE.md`，以及本地覆盖层 `AGENTS.local.md`、`CLAUDE.local.md`）。

会话恢复（resume）时，如果可见 baseline 仍然兼容，就直接复用这条已有消息，不会重改历史前缀、也不会白白打碎前序 KV Cache。

### 2. 触达深层目录后的 Touch-Driven 追补注入

模型还没碰 `packages/` 之前，像 `packages/AGENTS.md` 或 `packages/client/AGENTS.md` 这样的子目录规则**不会**提前塞进首轮上下文。

只有当模型通过一等文件工具（`read`、`write`、`edit`）成功触达某个更深的目录后，插件才会在下一步请求前把新命中的子目录 `AGENTS.md` 作为补充指令追加进来；如果此前读过的指令文件被修改或删除，下次触达时也会同步发出替换或移除提示。

这套注入机制靠四条硬规则保持可控：

- **`maxBytes` 必填字节上限**：部署配置必须显式声明 `maxBytes`。一旦整条指令链超出预算，渲染器优先保留**最具体（最深层）**的目录规则，先整份丢弃外层较宽泛的文件，万不得已才截断最具体文件，并附带一条模型可见的 `Workspace instruction budget ...` 告警指明哪些路径被省略或截断。
- **同内容与未变更自动去重**：同一目录下 trim 后内容完全一致的 `CLAUDE.md` 与 `AGENTS.md` 只渲染一次；路径和内容摘要（digest）都没变过的文件绝不重复注入。
- **不跑后台文件监听器（No file watcher）**：刷新完全由一等 `read`/`write`/`edit` 触达或会话恢复驱动，既省掉全盘 watch 的系统开销，又让每次上下文变化都有明确的步级因果可查。
- **指令定位清晰**：外层 `<system-reminder>` 模板明确告诉模型“越具体的目录指引优先级越高，但工作区指引不能凌驾于 system、developer 或用户的直接指令之上”。

---

## 二、拉取（Pull）：包 README、生成目录与 Skill 正文靠工具按需取用

`dsh-agent-instructions` **只**推送 `AGENTS.md` / `CLAUDE.md` 指令链，绝不自动推送任何 `package README`、`docs/architecture.md`、生成目录或 skill 正文。这些 L3–L5 层材料全部走按需拉取：

### 1. 导航工具把“怎么查图”写进了工具提示词

DSH 的三个一等文件检索工具在各自的工具描述里直接立下了检索纪律（见 [`packages/fs/tool-fs/src/read.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/fs/tool-fs/src/read.ts) 与 [`packages/fs/tool-fs-search/src/`](https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/fs/tool-fs-search/src)）：

- 读文本文件用 `read`（不要调 shell `cat`），返回自带行号，大文件用 `offset` 和 `limit` 分段翻阅；
- 搜内容用 `grep`（不要调 shell `grep` / `rg`），需要看命中行上下文时再配合 `read`；
- 按路径模式找文件用 `glob`（不要调 shell `find`）。

这样模型去查 `docs/tool-catalog.md` 或 `docs/event-producer-consumer.md` 时，拿到的是有界、结构化的片段，而不是把几千行生成表一口气倒进上下文。

### 2. 包 `README.md` 靠“注入路由 + 同改规矩”两头牵引

既然包 `README.md` 不自动注入，怎么保证模型改某个包之前真会去读它？靠两条链路合围：

1. 已被自动注入的根 `AGENTS.md` 和 `packages/AGENTS.md` 把单包契约明确指路到 `packages/<group>/<pkg>/README.md`；
2. 模型一读目标包下的源码，触达注入的 `packages/AGENTS.md` 就会提醒它“改行为必须在同一 commit 同步更新该包 `README.md` 与 JSDoc 契约”。为了对齐契约，模型自然会先 `read` 该包 `README.md`。

说白了：**全局规矩走 push（防忘），单包契约走 pull（省窗口）。**

### 3. Skill 走“目录摘要常驻 + 正文现用现读”

[`docs/subsystems/skills.md`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/skills.md) 对技能加载做了同样干净的两段式切分：

- 常驻进提示词的 skill catalog **只包含排序后的 `name` 和一句话 `description`**，不包含正文、文件路径或内部资源列表；
- 只有当模型判断当前任务匹配并显式调用 `skill({ name })` 工具时，才实时读取完整 `SKILL.md` 正文与关联资源目录作为工具结果返回（且注册表不缓存完整正文，每次调用现取最新内容）。

---

## 三、回收（Recycle）：上下文涨超水位后怎么安全瘦身？

就算按需拉取，长会话里读过的文件和工具输出还是会不断累积。运行时最后一环由 [`dsh-token-meter`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/token-meter.md) 与 [`compaction`](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/compaction.md) 兜底：

- `ctx.tokenMeter` 基于回放快照持续度量当前请求压力与各位置面的 token 开销；
- 当上下文压力触及阈值时，压力压缩（pressure compaction）会在 `agent/pre-step` 瀑布流阶段、正式派生本轮模型请求之前介入，将早期已经闭合的步骤折叠摘要；
- 压缩切分边界严格保护 `tool/call` 与 `tool/result` 成对完整，同时允许在一个超长 turn 内部先行压缩早期已走完的步骤，避免单轮大重构把窗口撑爆。

至此，静态端的词数门禁与运行时端的 `maxBytes` + 按需工具拉取 + 压力压缩首尾相接，构成了完整的上下文容量闭环。
