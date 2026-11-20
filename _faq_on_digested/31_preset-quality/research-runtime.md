# FAQ 31 Agent preset：运行时一手资料研究

本页保存专题的运行时出处与测试记录，范围只含 DSH 声明、装配、生命周期、可见性及可维护性证据。2026-11-20 对本地源码做静态核对，并执行下述定向测试；核验版本统一见[集中登记](../00-baseline.md)。GitHub `master` 链接会随源码移动，结论来自本次实际读取与明确列出的执行，不表示每条所链接测试都已运行。

## 1. 精确定义与配置入口

Agent preset 是“带身份和展示字段的子 Cordis 插件组合声明”，不是一个模型名称，也不是仅有一段 persona 文本。`PresetDefinition` 字段为 `id`、可选 `name` / `description` / `order`，以及 `plugins` 子条目列表；子条目可以带 `disabled` 表达式。声明插件 `@deepseek-ai/dsh-agent-preset` 注入 `agentPresets`，在 Service init 中调用 registry.register；`EntryGroup.key` 保留子插件表达式直到其自身激活。来源：[definition.ts L4–11](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/definition.ts#L4-L11)、[声明插件 L8–29](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/src/index.ts#L8-L29)。

声明的顶层 schema 要求 `id` 为字符串、`plugins` 为数组；单个子插件的配置 schema 由 Cordis / 各插件所有者验证，声明插件仅用 `z.any()` 接受数组项，随后 registry 验证条目结构。Registry 的配置是 required deployment `default` 和 volatile `selectedDefault`；新建时未指定 preset，用户选择优先于部署默认。来源：[声明 schema L16–23](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/src/index.ts#L16-L23)、[默认解析 L51–75](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/index.ts#L51-L75)、[配置类型](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/preset.ts#L12-L18)。

当前创作路径是 bundle patch 插入或覆盖一个声明行；覆盖按 Loader row id（例如 `preset-standard`），需要重述完整 config / 子列表，不能期待自动继承未来 builtin 列表变化。Registry 的 `read` 只把声明子列表渲染为 YAML（保留 `!!js`），没有接受 YAML 回写的对称接口；registry 不扫描 preset 目录，不接受 preset 路径。来源：[README L46–48](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/README.md#L46-L48)、[readDocument L213–230](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/index.ts#L213-L230)、[skill 覆盖说明 L54–74](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/skills/editing-cordis-compositions/SKILL.md#L54-L74)、[README 限制 L95–99](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/README.md#L95-L99)。

需保留一个“文档指导 vs 实际约束”区别：skill 写 id 为 lowercase letters / digits / hyphens；读到的运行时代码只要求字符串且 `trim()` 后非空，拒绝重复 id，没有正则约束，也没有把 id trim 后再存储。FAQ 可建议采用该命名约定，不能写成当前 validator 已保证的格式。来源：[skill L14](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/skills/editing-cordis-compositions/SKILL.md#L14)、[schema L16–23](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/src/index.ts#L16-L23)、[register L81–86](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/index.ts#L81-L86)。

## 2. 定义存在、激活可用与 Agent 发布：不同验证时点

| 时点 | 实际检查 / 行为 | 主要源码 |
|---|---|---|
| 声明插件加载 | 顶层 Config 类型；registry 检查非空 / 重复 id | [声明插件 L16–29](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/src/index.ts#L16-L29)、[register L81–100](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/index.ts#L81-L100) |
| register 的 eager activate | 注册定义后立即建立 registry-owned scope，验证顶层插件列表 / 每行 map 和非空 name / 递归 group，加载实际插件树 | [activate L103–122](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/index.ts#L103-L122)、[entryListProblem L18–38](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/definition.ts#L18-L38) |
| mountPreset | 等待子树；enabled 行导入失败、启动失败、激活异常会拒绝 mount；发布到 root realm 的服务泄漏也拒绝；禁用行跳过 | [auditRows L134–158](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/mount.ts#L134-L158)、[mountPreset L191–215](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/mount.ts#L191-L215) |
| roster / resolve / 新 binding 读取 | mounted tree 重新 audit；若有等待服务的行，等待 Host loader settle 后再 audit | [diagnostic L124–145](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/index.ts#L124-L145) |
| retain / mount | missing id 抛 `agent-preset/not-found`；broken / 无 generation 抛 `agent-preset/invalid`；不是静默回退默认 | [retain L232–247](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/index.ts#L232-L247) |
| preset 内的 standing delegation tool 进入具体 Agent | 对该 Agent 校验配置的目标 preset 引用，读取目标声明元数据；安装自己的 schema | [tool-subagent L398–403](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/tool-subagent/src/index.ts#L398-L403)、[L454–503](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/tool-subagent/src/index.ts#L454-L503) |
| model 请求独立 child preset | `agent_preset` 输入必须被当前 tool 的 allowlist 接受；mount 再检查目标 activation；provider 也必须支持独立 preset 且不继承 parent context | [preset-selection L74–96](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/tool-subagent/src/preset-selection.ts#L74-L96) |

三个容易混淆的状态：

- 自包含结构 / 导入 / 激活 / 服务泄漏失败：record.broken 保存错误，失败 scope 清理；声明仍在 roster，健康 preset 与 Host 可继续运行。[activate L103–122](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/index.ts#L103-L122)、[list L174–188](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/index.ts#L174-L188)、[对应测试 L71–87](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/tests/registry.spec.ts#L71-L87)。
- 服务暂未到位：tree 保留，Cordis 可在 Host provider 完成后自动激活行；diagnostic 不是一次性的“启动时失败”缓存。若 Host settle 后仍缺服务，拒绝新 binding。[mount 注释及实现 L191–215](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/mount.ts#L191-L215)、[缺服务 / 慢 provider 测试 L169–208](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/tests/registry.spec.ts#L169-L208)。
- 目标声明可读不等于目标可 mount：`SubagentPresetSelection.validate()` 用 `readDocument` 校验存在并采集 description，不调用 resolve / mount；broken preset 的元数据仍可被读取和广告，真正装配拒绝。[validate L53–72](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/tool-subagent/src/preset-selection.ts#L53-L72)、[测试 L122–137](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/tool-subagent/tests/preset-selection.spec.ts#L122-L137)。

每 Agent 验证引用还有实际目的：自己选择自己、两个 preset 相互选择可正常工作；引用不存在则 Agent 发布失败，测试断言没有 agent/created、没有残留 Agent / Session / 全局工具。不能把“声明注册成功”宣传为“后续所有消费路径都验证完成”。来源：[self / mutual / absent reference 测试 L139–201](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/tool-subagent/tests/preset-selection.spec.ts#L139-L201)。

额外条件：profile 版本兼容策略可以在审计之前将不兼容插件行变为 disabled；audit 将其视为有意不启用，整个 preset 未必 broken。因此“没有 broken”也不保证声明列表每个名字都实际提供工具。来源：[mountPreset L196–209](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/mount.ts#L196-L209)、[兼容策略测试 L103–152](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/tests/mount.spec.ts#L103-L152)。

## 3. Revision 保留与现有 / 新会话的效果

一个声明 revision eagerly 激活一次，被选择它的 Agents 共享。更新 / 移除声明时，原 generation 标记 retired；旧 Agents、children 和临时 cold-read lease 仍引用该 generation；只有 retired 且 users=0 才 dispose scope / tree。新 Agent 选择 registry 当前声明；移除声明不撤销已绑定的 live Agent。来源：[register dispose L88–100](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/index.ts#L88-L100)、[collect L148–158](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/index.ts#L148-L158)、[bind / join / mount L250–289](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/index.ts#L250-L289)、[retention 测试 L38–68](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/tests/registry.spec.ts#L38-L68)、[cold-read lease 测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/tests/registry.spec.ts#L149-L158)。

这是一段进程内 live revision 的保留规则，不是持久化版本锁定。日志保留 preset ID 和选择事件；重启 / cold reconstruction 用该 ID 的当前定义；旧实现不会跨进程留存。来源：[README L56–60](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/README.md#L56-L60)、[已声明限制 L99](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/README.md#L99)、[API resumeObserved L424–444](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/session-controller/src/agent.ts#L424-L444)。

普通 Web Session 新建时，composeAgent 先 resolve identity，setup 在发布前 mount；creation header 记录 preset id。cold resume 读 projection 的当前 preset，不单看 immutable creation header，再 compose 当前声明。来源：[composeAgent L382–400](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/session-controller/src/agent.ts#L382-L400)、[createAgent L563–577](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/session-controller/src/agent.ts#L563-L577)、[presetForObservation L589–598](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/session-controller/src/agent.ts#L589-L598)、[projection L20–47](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/session.ts#L20-L47)。

空白 Session 可以 select；判定是尚无 open turn 且 lastTurn=0，不是“当前 idle”。第一轮开始后，即使轮次结束，也拒绝修改，错误为 `agent-preset/locked`。成功 recompose 后追加 `agent-preset/selected`；该事件改变 projection。若已记录同 id 且恰好运行当前 generation，重复 select 不追加 / 不通知；同 id 定义被替换后，空白 Agent 再 select 可转到新 revision 并记录第二次选择。来源：[select L341–367](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/index.ts#L341-L367)、[重复选择测试 L301–342](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/tests/registry.spec.ts#L301-L342)。

API `session.create` 的“复用空白草稿”不同于“恢复原会话继续聊天”：create 请求没有 preset 时使用当前默认，可以给复用的空白草稿重新选默认；若已有 turn，另建新 identity。不能泛化为所有 resume 都回退默认。已有 live 空白 Session 若目标 preset id 与 projection 相同，API reuseLive 直接返回，没有调用 registry.select 的 generation-refresh 检查；因此“对同 id 再次 create 一定加载新 revision”也不成立。来源：[claim L459–506](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/session-controller/src/agent.ts#L459-L506)、[reuseLive / reuseSetup L509–547](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/session-controller/src/agent.ts#L509-L547)、[stale blank draft 测试 L448–512](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/api/session-controller/tests/session-presets.host.spec.ts#L448-L512)。

## 4. Child composition：省略与显式同 ID 不能互换

新 child 不指定独立 preset 时，`composeFrom` 同步 join parent 当时保留的 exact generation；不按 id 回 registry 取新定义。明确选 preset 则 mount 当前定义，即使 id 与 parent 相同，也可能拿到不同 revision。child creation metadata 记录实际 composition id（读取 parent live binding，而非 parent header）。来源：[composeFrom L292–317](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/index.ts#L292-L317)、[childSessionMeta / applyChildComposition L121–201](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent/src/child-agent.ts#L121-L201)、[同 ID 显式选择对照测试 L144–159](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent/tests/activation-presets.spec.ts#L144-L159)。

独立选择需要 provider 支持 independent preset 且不继承 parent context；fork 即使显式给与 parent 相同 id 也拒绝，测试断言未发布 session / agent / subagent，未触发模型请求。来源：[provider 检查](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/tool-subagent/src/preset-selection.ts#L74-L81)、[fork 验证测试 L106–128](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent/tests/continuation-presets.spec.ts#L106-L128)。

Cold child resume 有专门规则：只检查 inheritedEventCount 之后的 own events；第一次 own `subagent/descriptor` 之前存在 `agent-preset/selected`，才是独立 spawn 选择标记。独立 child 用当前 projection 的最新选择恢复；否则跟随此次 parent live composition（可继续 join parent retained revision）。继承来的选择事件、descriptor 后的 fork 选择都不构成独立标记。来源：[materialize setup L880–896](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent/src/manager.ts#L880-L896)、[coldResume L1345–1381](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent/src/manager.ts#L1345-L1381)、[hasIndependentPresetSelection L1485–1492](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent/src/manager.ts#L1485-L1492)。

这覆盖了三个值得保留的边界：显式与 parent 同 id 的 spawn 仍可独立恢复；历史 children（无独立标记）用当前 parent composition，并重放历史 persona / toolFilter；独立目标 missing 或 broken 时 cold resume 抛 `NOT_RESUMABLE`，cause 分别为 not-found / invalid，不回退 parent。来源：[continuation tests L180–251](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent/tests/continuation-presets.spec.ts#L180-L251)、[fork / inherited marker tests L253–290](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent/tests/continuation-presets.spec.ts#L253-L290)、[failure tests L293–326](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent/tests/continuation-presets.spec.ts#L293-L326)。

## 5. Tool / prompt 可见性和 Host 放置

Preset 本身不直接向模型贡献一段“preset 信息”；实际可见工具、prompt sections、skills 由子插件贡献。Host 共享 Agent loop / 注册中心；preset 提供 scope 内贡献。测试用同一个 Host 建立 standard 和 minimal Agents，工具和 prompt sections 分别可见，全局 tools.schemas() 不包含它们。来源：[Model Experience](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/README.md#L78-L93)、[scope 可见性测试 L17–35](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/tests/registry.spec.ts#L17-L35)。

Scope 控制注册及事件可见性；`isolate` 控制 service instances。Preset 自己提供 service 必须让 provider 与 consumers 在同一隔离 group；root service leak 会拒绝 mount。普通 agent.ctx service lookup 不因此自动指向 entry-local isolated 服务；`agentPresets.serviceFor` 是显式读取保留 composition 的方法，不能据此宣称所有 service lookup 自动隔离。Host consumers 要用的服务放 Host。来源：[skill L76–80](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/skills/editing-cordis-compositions/SKILL.md#L76-L80)、[README L56–60](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/README.md#L56-L60)、[serviceFor L319–327](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/index.ts#L319-L327)。

Persona 是其中一个 scoped 插件：prefix / suffix shadow deployment persona；`complete: true` 使 prefix 成为完整 system prompt，抑制其他 sections；`includeRuntimeContext: false` 抑制该 scope 的动态 runtime-context。这会影响工具使用指导能否进入 prompt，不能只检查工具插件是否安装。来源：[persona config / apply L29–74](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/persona/src/index.ts#L29-L74)。实际 shipped minimal 就配置了 complete=true、includeRuntimeContext=false，且有按平台 disabled 的 shell 行；名称 minimal 本身不能推导具体行为。来源：[minimal patch L10–16](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/presets/minimal.patch.yml#L10-L16)、[平台行 L40–69](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/bundle/web-app/presets/minimal.patch.yml#L40-L69)。

独立 child 最终 request 只带 selected preset 的工具，parent 工具保持原 composition；runtime result tool 还可叠加，因此 preset 列表也不等于最终工具全集。来源：[selected tools test L154–178](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent/tests/continuation-presets.spec.ts#L154-L178)、[structured result tool test L122–140](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent/tests/activation-presets.spec.ts#L122-L140)。

## 6. 长期质量：可据源码提出的维护准则

以下是由上述机制得出的编辑 / 维护建议，不是声称运行时已经实现的评分器或质量认证：

1. 把 preset 视为有版本演进的配置产物：记录 bundle 来源和完整 override 列表；builtin 更新时主动比较，不能期待列表自动 merge。[override 规则](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/skills/editing-cordis-compositions/SKILL.md#L54-L66)、[限制](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/README.md#L95-L99)。
2. 检查声明、实际 activation 状态、具体 Agent 的模型请求三层证据；metadata/read 成功与 mount 成功不同，disabled 行也不会触发 audit failure。[broken metadata test](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/tool-subagent/tests/preset-selection.spec.ts#L122-L137)、[disabled admission test](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/tests/mount.spec.ts#L103-L152)。
3. 验证更新后的行为时创建新 Session；再单独检查旧 live Session / child retention 与 cold recovery。不要用旧会话看不到改动来判断更新失败，也不要承诺跨 restart 保留旧实现。[revision tests](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/tests/registry.spec.ts#L38-L68)、[README limitation](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/README.md#L99)。
4. 保留最小职责划分：Host shared services，preset scoped contributions；自带 service 的 group 同时包含全部 consumers。一个能 mount 的 preset 仍需任务效果验证；activation audit 没有评价回答质量、任务完成率或 prompt 内容适用性。[mount audit 的实际检查](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/src/mount.ts#L134-L158)、[placement guidance](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset/skills/editing-cordis-compositions/SKILL.md#L76-L80)。
5. 测试应包含真实 request 的工具 / prompt 与持久化 selection，而不能只看 YAML 可解析或 roster 行存在；已有 child tests 提供了对应断言范例。[request assertions](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent/tests/continuation-presets.spec.ts#L154-L178)、[logged prompt assertion](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent/tests/activation-presets.spec.ts#L83-L104)。

Preset 不是安全 sandbox；YAML / 插件可以执行 Host code。Scope 可见性与系统权限策略不能混成同一承诺。来源：[README 限制](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/preset/agent-preset-registry/README.md#L95-L99)。

## 7. 已执行测试与核验范围

本次真实执行（工作目录 `/Users/bowhead/deepseek-harness`）：

```sh
pnpm exec vitest run packages/preset/agent-preset-registry/tests/registry.spec.ts packages/preset/agent-preset-registry/tests/mount.spec.ts packages/preset/agent-preset-registry/tests/session.spec.ts packages/subagent/subagent/tests/activation-presets.spec.ts packages/subagent/subagent/tests/continuation-presets.spec.ts packages/subagent/tool-subagent/tests/preset-selection.spec.ts packages/api/session-controller/tests/session-presets.host.spec.ts
```

结果：exit code 0；7 个文件、116 个测试通过；Vitest 4.1.11，耗时 3.03s。分项：registry 36、mount 5、projection 2、activation-presets 6、continuation-presets 12、preset-selection 21、session-presets.host 34。stderr 有 vite-tsconfig-paths 提示，以及兼容策略测试有意输出的 incompatible plugin disabled 诊断；均未造成失败。这里只声称该 focused run 通过，没有运行 full suite、coverage、真实 API e2e、GUI、build 或 lint。

以下补充测试本轮未执行，不能纳入本轮通过计数：

```sh
pnpm exec vitest run packages/preset/persona/tests/persona.spec.ts packages/preset/agent-preset-registry/tests/composition-inventory.spec.ts
```

若增加长周期 preset 质量回归，建议新增 / 选择真实 Loader composition 场景，检查完整 model-visible request 与 durable events；当前 focused suite 有大量关键行为断言，但不能替代实际 profile 的最终装配验证。未在本次运行任何额外 snapshot 命令；不要把“读过测试源文件”写成“执行过所有相关测试”。

产品源码与集中基线的对照：执行 `git diff --stat 62adbb04417f3214eb4428c4ac28490d7ea0fdcf -- packages/preset packages/subagent packages/api/session-controller packages/skill docs/testing.md`，输出为空；这些已核对范围没有产品差异。本轮文档检查：FAQ 自检通过；`pnpm run test:docs` 21 项通过，`pnpm run doc-sync` 43 项通过，`pnpm run lint` 0 errors（1 项现有 unused oxlint-disable warning），`git diff --check` 通过。来源路径与行号边界独立核对通过；这不验证每个外部 URL 的联网可达性，也不把静态阅读当作场景实跑。

## 8. FAQ 最应防止的误解

- “Preset 就是 system prompt”：实际是插件组合，persona 只是其中一行。
- “定义存在 / read 成功 / bundle 已安装就代表可用”：activation、引用消费与 mount 各有独立验证时点。
- “所有错误都在声明加载时一次性确定”：Host 服务晚到会 re-audit，standing delegation 引用在每 Agent 安装时检查。
- “改 preset 会更新所有旧聊天”：live generation 继续保留；新 Session 才直接拿新声明。
- “保留 revision 等于永久版本锁定”：旧实现只进程内保留，cold recovery 使用当前 ID 定义。
- “重启按 creation header 原样恢复”：应读 selection projection；child 还须区分 own descriptor 前的独立选择。
- “省略 child preset 与显式传 parent 相同 id 一样”：前者保留 parent exact revision，后者 mount 当前定义。
- “列表不 broken 表示所有插件都启用”：disabled / compatibility-denied 行不参与 failure audit。
- “Scope/isolate 就是安全隔离”：一个控制贡献可见性，一个控制 service instances；插件仍可执行 Host code。
- “覆写后自动得到 builtin 后续新增能力”：完整子列表 override 不自动合并。
- “运行时验证通过就是 Agent 长期质量认证”：当前审计检查可装配性，不评分任务质量。

上述误解的逐项依据位于前面相应段落，避免 FAQ 将维护建议写成新 API 或产品承诺。
