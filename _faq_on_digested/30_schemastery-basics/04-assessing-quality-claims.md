# 04 · 对一段 DSH 质量体系解释的核验与取舍

## 总体判断

“DSH 把 Agent 行为变成可审计证据”抓住了有源码支撑的特点：模型可见输入进入日志，真实装配测试检查交付路径，录制会话允许比较请求与结果，持久化类型变化有明确记录。这个方向值得借鉴。

但“质量不是测试出来的，而是通过约束强制保障”过于绝对。DSH 的可靠性依赖结构约束、运行时检查、测试、评审和实际使用共同作用；其中仍有声明性规范、覆盖有限的脚本，以及自动化无法判断的语义问题。**工程约束减少特定错误，测试提供特定证据，都不能充分保证 Agent 完成任意任务。**

本页把所给解释作为待核验观点，与原生仓文档、源码和测试对照。结论是对机制范围的判断，不是对一套表述作整体赞成或整体否定。

## 一、证据驱动：方向成立，三件套和快照范围要收窄

代码、当前状态文档和行为证据共同交付，是有依据的工程归纳。不过行为证据要匹配改动，不能统一改写成“任何修改都必须更新会话快照”。

[测试政策](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md#L53)明确要求的是：每个非平凡的模型、协议或用户可见变化，在同一 PR 新增或更新无密钥录制会话场景。包测试、e2e 和仅 mock 的证据不能替代对应的组装会话。纯内部变化仍需匹配其影响的检查，但不能据此推出一律新增会话录制。

“文档就是 README 或 Agent Note”也不准确。当前行为文档和决策理由有不同归属；[文档分层](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/AGENTS.md#L15)区分包说明、子系统、操作指南和决策记录。Agent Note 不是每次修改的替代文档，机械修改也不自动需要新 Note，见[根规则](https://github.com/deepseek-ai/deepseek-harness/blob/master/AGENTS.md#L155)。

最需要校准的是“模型输出风格微调，快照立刻报红”。回放消费的是已录制的模型输出，不会重新向线上模型采样。它可以发现当前代码导致请求、工具处理、日志或界面结果偏离该场景预期，**不能主动发现线上模型后来改变了风格或能力**。这种区别在[无密钥与真实 API 政策](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md#L23)中写得很明确。

值得借鉴的是：把行为影响变成有独立预期、可以复跑的证据，并评审预期变化；不要机械追求“每个 PR 都改一个快照”，更不能把刷新预期当成证明。

## 二、五大防御习惯确实存在，属于评审原则

所列五条基本忠实于[防御模式入口](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/defensive-patterns/README.md#L5)：显式正确性、单一事实来源、经注册扩展、改动范围与评审范围一致、要求可反驳和可重算的证据。

需要改变的是把它们称为“五大自动门禁”。入口明确说是仓库在 review 中执行的要求，各页按具体产物应用这些习惯。部分要求可以接入脚本，另一些要由评审者判断；不能从原则存在推断每条都有一个 CI 检查器。

“通过 seam 扩展”也不意味着每次加功能都新建 seam。仓库的[能力接缝定义](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/glossary.md#capability-seam)要求 Service Definition、Provider、Consumer 齐备；实际工作应先使用已有扩展点。是否值得新建可替换能力，需要具体设计理由。

我的判断是，这五条的价值在于给评审者一个一致的提问方式：新状态谁拥有？失败时谁负责？改动是否扩大了旧组件的职责？证据是否真的经过交付入口？它们有指导性，但并非 DSH 独有，也不是把每个问题变成禁令就能自动兑现。

## 三、可执行检查确实重要，但独立 FAQ 不等于产品 CI

主仓确实把许多机械一致性要求接入执行链。例如[门禁清单](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/run-gates.ts#L805)组织文档链接、类型抄录、翻译配对、配置目录和持久化变化等检查。[文档部署工作流](https://github.com/deepseek-ai/deepseek-harness/blob/master/.github/workflows/docs-pages.yml#L74)调用 doc-sync。

但本目录的[FAQ 校验器](../verify.mjs)是研究语料自己的完整性检查；[目录约定](../00-index.md#验证命令)要求修改后运行它。本次在主仓的执行清单、脚本配置和 CI 文件中没有找到调用它的接线，不能列为 DSH 产品 CI 的既有保障。主仓的[引用检查器](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/verify-repository-references.ts#L15)也明确识别这类研究语料，不把它等同于维护中的产品引用。

此外，链接和锚点有效只能证明目标存在，无法证明解释正确；生成目录新鲜也不能保证散文中的因果判断正确。本次 Schemastery 研究发现的注释和教程差异，见[具体质量观察](./03-repo-quality-practices.md)。

值得借鉴的是把某类已知错误做成会失败的检查，并验证检查器确实能拒绝反例；同时明确检查对象、执行入口和未覆盖范围。

## 四、Tombstone 有具体用途，不能泛化为所有逻辑退役

持久化变更历史确实保留删除记录。[变更记录规则](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/persistence-changes/README.md#L44)规定，被删除的持久化根类型没有 after schema，保留 tombstone；[回归测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/persistence-changes.spec.ts#L610)检查重新加入时必须承接删除历史。

这个机制防止同名持久化根类型被当成从未存在过，从而跳过类型演进关系。其对象是持久化历史中的根类型，不是每一段删除代码、每一条不再成立的推论或每一个插件逻辑分支。

因此，“任何代码逻辑退役都必须 Tombstone”没有得到这些证据支持。其他退役场景可能需要升级说明、数据迁移、保留历史夹具或归档决策，应由各自规则判断。普通死代码删除不应凭这个词额外制造一份永久记录。

可借鉴的是按兼容性风险保留必要历史，而不是普遍扩大历史负担。

## 五、持久化指纹真实且有价值，但它检查声明结构

所给解释识别到了重要机制，不过“所有内存状态”“所有 Session 格式变化”“记录在一个目录文件里”都需要更精确。

[持久化目录说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/persistence-catalog.md#L6)覆盖仓库声明的持久 Session 头、事件封套和事件类型；[指纹规则](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/persistence-catalog.md#L14)按规范化类型及引用类型计算摘要。字段名、值类型、可选性等变化影响指纹；注释、位置或无害重排等不会。这不是任意进程内状态或全部 Conversation 视图的通用快照。

可读目录、机器 schema inventory、逐次变更记录和兼容性决定各有文件归属，见[记录所有权](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/persistence-changes/README.md#L27)。检查比较当前源码和确认历史，阻止未确认的声明变化；兼容性需要说明旧读者、新读者和数据怎样被解释或拒绝。

上限也明确：不改变类型的行为变化、`unknown` 等不透明数据内部的语义，超出这种结构比较的范围。变更已登记，不代表人类已经认真评审；[评审指南](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cookbook/reviewing-persistence-type-changes.md#L34)专门说明，确认历史不能替代 base/head 的独立比较，也不能证明人类审查已发生。

所以它降低跨版本误读风险，但不能直接许诺“Agent 记忆不会混乱”。后者还涉及日志重建、模型上下文、摘要质量和任务理解等问题。

## 六、怎样评价“像建设编译器和运行时”

这是一种有解释力的观察：DSH 确实重视输入协议、类型投影、事件日志、生命周期、兼容性和可复现执行；全插件架构也要求把装配本身当成需要测试的产品行为。

但它不是排他的分类。普通服务端、编译器、数据库和插件平台也采用类似方法；Agent 项目同样需要模型评估和真实用户验证。DSH 的特殊之处主要是把这些办法延伸到**模型可见输入、工具执行、真实配置组合、会话回放和外部效果**，并在仓库里安排了相应归属和检查。

“Agent 出错一定是门禁没过、注册不清或证据链断了”则不成立。模型可能在合法工具、正确装配和完整日志下仍选错方法、误读信息或未完成任务。有限夹具也可能没覆盖那个输入。门禁全绿证明被执行的条件成立，不能推出没有其他错误。

## 七、我会借鉴什么，保留什么判断

对一个规模较小的 Agent 或插件项目，我优先借鉴以下做法，而不是先复制整套规则与脚本清单。

| 借鉴顺序 | 具体做法 | 原因 |
|---|---|---|
| 先做 | 明确事实和状态的所有者，运行输入有校验，失败有可定位报告 | 让错误出现的位置和责任清楚 |
| 接着做 | 从真实发布入口装配，检查实际消费者和外部效果 | 排除测试与交付路径脱节 |
| 有模型交互后做 | 保存可重建请求和工具轨迹，固化高价值真实会话，用独立预期复跑 | 让模型可见变化和实际效果能比较 |
| 出现漂移后加 | 对重复、机械的遗漏写生成器或检查器，并测试拒绝反例 | 把有限维护成本用在真实缺陷上 |
| 有兼容性责任后加 | 对持久化声明做结构比较、变更确认和迁移证据 | 避免数据演进成为隐蔽破坏 |

我不会借鉴把“严格”直接写成“有保证”的表达。更好的判断方式是持续追问：**检查了哪个条件，从哪个真实入口运行，有什么反例，仍漏掉什么？** 这既能保留那段解释中有价值的工程直觉，也能避免把仓库规约误写成产品已经拥有的能力。

> 核验状态见[核验基线登记](../00-baseline.md)。
