# Creator 模式分篇 · 把 DSH 自身的可修改性交给 agent

![Creator 的四步循环：一、cordis_inspect_list / cordis_inspect_query 只读检查宿主运行时 API；二、按三个创作技能写插件或 preset 声明；三、plugin_manager 的 install_bundle 把 bundle patch 装进当前 profile（写操作过审批）；四、能力影响该 profile 此后所有会话并跨重启，新 preset 在下一个新任务可选，然后回到第一步。审批理由：profile 变更跨会话持久，装上的 Host 代码跑在工作区沙箱之外](./figures/creator-loop.svg)

## Creator 模式比 Standard 多了什么？

preset id 是 `cordis`，order 4，显示名 "Creator mode / 创造模式"。它**完整保留 standard 的任务工具**（guide 原话："includes the standard task tools plus…"），只加三件东西（[`cordis.patch.yml`](../../packages/bundle/web-app/presets/cordis.patch.yml)）：

1. `tool-cordis`——只读运行时检查工具 `cordis_inspect_list` / `cordis_inspect_query`；
2. `plugin-manager` 工具——**条件启用**（见下节），负责持久化安装；
3. 四个创作技能，经 `skill-filesystem` 的 `customSkillDirs` 指到 `dsh-agent-preset` 包自带的 `skills/` 目录。

它的特殊性在于工作对象变了：Standard/PTC/Minimal 的 agent 在**用户的仓库**里工作，Creator 的 agent 还要**修改 DSH 自己**——写插件、装插件、组 preset。

## `tool-cordis` 是什么？为什么 Standard 刻意不给？

`cordis_inspect_list` 列出检查 provider，`cordis_inspect_query` 查询 provider 的方法与类型：Host 侧有生成的 Service/Event 目录 + 活 Loader 树（含每个插件行的 Loader id、Config 状态、`packageDir`），Client 侧从已连接页面回答（[`packages/extensions/tool-cordis/README.md`](../../packages/extensions/tool-cordis/README.md)）。这是 agent 写插件前"看清宿主 API"的眼睛。

Standard 不给它的理由写在组合测试里：`cordis_*` 工具执行模型写的 JavaScript，**没有沙箱行能约束**，与 `mcp_*`（进程外 spawn）、`ralph`（无人监督轮次）一起被列为**刻意缺席**而非疏漏（[`apps/web/tests/shipped-composition.e2e.ts`](../../apps/web/tests/shipped-composition.e2e.ts) 的 `EXPECTED_TOOLS` 注释）。Creator 是有意识地把这层风险收进来——配套的约束是审批：`plugin-manager` 的写操作要求审批或 full access（[declarative presets Note](../../.agents/notes/implemented/architecture/2026-09-18-declarative-agent-presets.md)），因为**配置在 Host 里执行**。

## `plugin-manager` 那行 `!!js` 条件在判什么？

```yaml
- id: tool-plugin-manager
  name: '@deepseek-ai/dsh-plugin-manager/tools'
  disabled: !!js "!ctx.get('profileContext')"
```

判**进程有没有 profile 上下文**。`plugin-manager` 注入 `profileContext`，持久插件管理只在以 `dsh` profile 启动的进程里存在；没有 profile 上下文的组合里这行保持禁用而不是挂载失败（Loader 的 `!!js` 条件禁用是 cordis.yml 的合法用法，见根 AGENTS.md「Secrets / .env」节）。也就是说 Creator 的"持久化"那一半能力随宿主形态存在与否自动伸缩，preset 本身不用分叉。

## 四个创作技能从哪来、怎么控制上下文成本？

`customSkillDirs` 是**追加**不是替换：skill roots 在默认项目/用户目录之外加上这个 custom 目录，rank 为 `CUSTOM_RANK`（[`packages/skill/skill-filesystem/src/index.ts`](../../packages/skill/skill-filesystem/src/index.ts) 的 `roots()`）。四个技能（`packages/preset/agent-preset/skills/` 下，模板见 [`editing-cordis-compositions/SKILL.md`](../../packages/preset/agent-preset/skills/editing-cordis-compositions/SKILL.md)）：

- `cordis-plugin-development`——写/装/调试持久插件与 MCP 的**过程**；
- `editing-cordis-compositions`——preset 声明格式与"改 preset = 装一份 override bundle patch"（明确说了四份内置预设就在 web-app bundle 的 `presets/` 下，`minimal.patch.yml` 最短可作模板）；
- `cordis-composition-reference`——Loader patch 方言（insert/override by id/group/isolate/`!!js`）+ 可装插件包清单（doc-sync 门禁保鲜）；
- `agent-experience`——面向模型表面的写作纪律（工具定义、技能与上下文加载设计；0009 起由 agent-preset 包共享给 Creator 模式）。

成本控制是 [progressive disclosure Note](../../.agents/notes/implemented/architecture/2026-09-21-creator-skills-progressive-disclosure.md) 的主题：`SKILL.md` 只留过程、知识源次序和索引表（首载约 3.9 KB），recipe 拆进 `references/`、可拷贝 bundle 拆进 `templates/`，压在 tool-result pruner 的 8192 字符阈值之下；技能明确**允许**读源码，知识源次序是检查（`cordis_inspect_query`）→ 包 README（`Config.listConfigs` 解析出的 `packageDir`）→ built `lib/` 声明或 checkout 源码。对比被否决的方案：把创作文本放系统提示词是每轮都付费，技能目录按需加载。

## 创作成果怎么生效？

闭环是"声明式 preset + bundle patch 安装"：一个新 preset 就是一行普通的 `@deepseek-ai/dsh-agent-preset` 声明，由 bundle patch 携带、`plugin_manager` 的 `install_bundle` 装进当前 profile；装完影响该 profile 此后所有会话并跨重启（registry 不扫描目录、不接受路径，一切声明都是插件行——[`packages/preset/agent-preset-registry/README.md`](../../packages/preset/agent-preset-registry/README.md)）。工具的审批理由把风险面一句话说尽："**Profile changes persist across sessions; installed Host code runs outside the workspace sandbox**"（[`packages/boot/plugin-manager/src/tools.ts`](../../packages/boot/plugin-manager/src/tools.ts)）。Web 编辑器保存走同一条路：写 active profile 的 user patch，带 revision 检查与 profile 锁防并发覆盖（[declarative presets Note](../../.agents/notes/implemented/architecture/2026-09-18-declarative-agent-presets.md)）。Web 设置页另有 "让 Agent 帮我创建预设模式"（`creatorDraft`）入口直接发起一个 Creator 任务（[`locales.ts`](../../packages/client/ui-agent-preset/src/client/locales.ts)）。guide 对用户的建议值得引用：**"要求 Agent 完成安装并验证实际效果，而不是只生成源代码"**——插件可能即时加载也可能要重启，新 preset 在下一个新任务里可选。

一个演进注记：declarative presets Note 提过 "The Web editor and `agent_preset` tool accept only child plugin YAML"，但当前树里已找不到叫 `agent_preset` 的工具——编辑面收敛为 Web 编辑器 + `plugin_manager`（技能明说"没有任何东西原地编辑声明：改 preset 就是装一份声明/覆盖它的 bundle patch"，[`editing-cordis-compositions`](../../packages/preset/agent-preset/skills/editing-cordis-compositions/SKILL.md)）。引用该 Note 时按当前机制转述。

## 特殊性总结

Creator 是四份里唯一动**扩展轴**的：它假设的自我修改循环（agent 写插件 → 装进 profile → 宿主能力变多）正是 "all-plugin harness" 的自举入口。风险面（无沙箱约束的检查工具 + 持久配置写入）不由 preset 兜底——preset 不是安全边界——而由审批 seam 与 profile 上下文条件共同兜住。
