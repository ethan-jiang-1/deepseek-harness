# 02 · 模型怎么按需走图：read/grep/glob + skill + README

## 注入只覆盖指令链，正文靠工具拉取

`dsh-agent-instructions` 只注入 `AGENTS.md`/`CLAUDE.md` 指令链，不注入 package README、architecture、catalog、skill 正文。这些“按需合同”由模型用第一方工具主动拉取。三个导航工具各自的模型提示词就直接把纪律写进了工具：

> Use the read tool — not shell commands like cat — to inspect text files. Results include line numbers. Use offset and limit to continue reading large files.
>
> —— `packages/fs/tool-fs/src/read.ts:74`（`text: ({ scope }) =>` 在 `:72`，正文在 `:74`）

> Use the grep tool — not shell grep or rg — to search file contents.
>
> —— `packages/fs/tool-fs-search/src/grep.ts:280`

只有在 `read` 也注册时，这一句才追加 “Use read on a matched file when you need surrounding context.”（同文件 `:281` 的条件分支）。

> Use the glob tool — not shell find — to discover files by path pattern. …
>
> —— `packages/fs/tool-fs-search/src/glob.ts:302`

所以“怎么走图”在运行时是被工具提示词约束的：读文件用 read（带行号、可 offset/limit），搜内容用 grep，找文件用 glob——不是 shell 的 cat/rg/find。这本身也是“按图索骥”的一部分：工具给的是结构化、有界的结果，而不是 shell 的自由文本。

## skill：摘要先给，正文后取

`dsh-tool-skill` 注入的 skill catalog 只含 name + description，不含 body：

> The catalog contains sorted skill `name` and normalized, XML-escaped `description` only; it omits bodies, paths, sources, providers, and routing hints.
>
> —— `docs/subsystems/skills.md:229`

只有模型调用 `skill({ name })` 时才加载完整正文：

> The model-facing `skill({ name })` tool validates the kebab-case name, … then rereads the complete definition for the calling agent cwd … and returns a tool result containing `<skill_content name="...">`, `<skill_resources>`, and `<skill_instructions>`.
>
> —— `docs/subsystems/skills.md:233`

> Full definitions are not cached by the registry. Each `get()` calls the winning provider…
>
> —— `docs/subsystems/skills.md:192`

这是 L5（Agent Notes / skills）在运行时的实现：常驻的只是技能名 + 一句话描述（默认 ≤500 字符），正文按需加载、不缓存、每次现取。这就是“省上下文”在运行时的手腕。

## package README 是“拉取”不是“注入”

package README 不在注入链里（注入只认 `AGENTS.md`/`CLAUDE.md` 候选）。它靠两条运行时路径被拉到：

1. **路由**：注入的根/子树 AGENTS 把模型指到 `packages/<group>/<pkg>/README.md`（04 的地图）；
2. **standing order**：注入的 `packages/AGENTS.md:26` 要求在同一个 commit 里更新 package README 与 JSDoc 合同——模型改某个包时，这条 standing order 让它去读该包 README。

所以“agent 会不会主动读 README”的诚实答案是：**指令链（AGENTS）是 push 的，合同（README）是 pull 的**。前者不靠模型自觉，后者靠 standing order + 路由把模型引到正确文件前。

## 证据入口

- [`packages/fs/tool-fs/src/read.ts`](../../packages/fs/tool-fs/src/read.ts) 第 74 行
- [`packages/fs/tool-fs-search/src/grep.ts`](../../packages/fs/tool-fs-search/src/grep.ts) 第 280-281 行
- [`packages/fs/tool-fs-search/src/glob.ts`](../../packages/fs/tool-fs-search/src/glob.ts) 第 305-306 行
- [`docs/subsystems/skills.md`](../../docs/subsystems/skills.md) 第 192、229、233 行
