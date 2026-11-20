# Answer 30 · Schemastery：DSH 中可执行、可读取的配置声明

## 先给结论

**Schemastery 是一个运行时 schema 库；DSH 主要用它声明插件配置的字段、校验规则、默认值，以及供其他组件读取的元数据。** 一个声明既能被调用来解析配置，也能被设置服务和配置工具检查，因此它的意义超过了“检查一下变量类型”。

在 DSH 的全插件架构下，配置决定挂载哪些实现、实例使用什么参数，以及部分设置如何在运行中更新。Schemastery 使这些规则有明确的源码归属，并为多个消费者提供共同的描述信息。执行加载、写文件、更新引用和绘制界面的，仍是各自的 DSH 组件。

我的判断是：DSH 最值得借鉴的地方，是**为容易脱节的环节建立可执行规则和可复核证据**，尤其是插件真实装配、配置更新后的消费者行为，以及模型实际收到的输入。这些工程措施提高可控性，但对模型能否正确理解任务、选对方法、完成目标，仍需另外验证。

## 一、先分清三个东西

从插件作者的视角看，配置值、静态类型和运行时 schema 可以描述同一份配置，却有不同的使用者。

| 东西 | 例子 | 谁使用、什么时候使用 |
|---|---|---|
| 配置值 | YAML 中的 `root: /some/path` | Loader 读取，求值和校验后交给插件 |
| TypeScript 类型 | `interface Config { root: string }` | 编译器检查源码；类型声明在运行时被擦除 |
| Schemastery schema 值 | `Schema.object({ root: Schema.string().required() })` | 运行中的 Cordis 调用它，检查实际配置并产生解析结果 |

真实例子是 [JSON 存储插件](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/storage/storage-json/src/index.ts#L22)：它同时导出 `Config` 接口和同名 schema，明确要求 `root`，随后用解析后的 `config.root` 创建后端。

```typescript
import Schema from '@deepseek-ai/schemastery'

export interface Config {
  root: string
}

export const Config: Schema<Config> = Schema.object({
  root: Schema.string().required(),
})
```

同名并不冲突：接口处于 TypeScript 的类型空间，常量处于值空间。`import z from '@deepseek-ai/schemastery'` 也只是把默认导入取名为 `z`；判断是不是 Zod，要看包名。

Schemastery 实例是带有 `type`、`dict`、`list`、`meta` 等信息的**可调用函数对象**。`Schema.number().default(3)` 返回的对象既能被调用，也能让其他组件读取“这是数字，默认值为 3”。依据见[实例声明与构造实现](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L135)。它有明确的上游来源，DSH 使用的是[随仓维护、重新加作用域的版本](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/README.md#L3)。

## 二、它为什么在 DSH 里有用

DSH 需要把许多独立插件组合起来。TypeScript 能检查仓内代码，无法预先保证用户的 YAML、表达式求值结果和后续设置修改一定符合插件要求，因此还需要运行时规则。

```mermaid
flowchart LR
  A[组合后的原始 config] --> B[Loader 求值配置表达式]
  B --> C[Cordis 调用 Config 校验器]
  S[插件声明的 Config schema] --> C
  C --> D[解析结果：有效值、默认值或即时引用]
  D --> E[插件 apply 或服务构造函数]
```

Schemastery 负责解析，Cordis 在插件启动代码之前调用校验器。配置无法通过时，该插件不会正常启动。校验发生在插件可以激活时，可能先等待依赖服务，并非扫描到 YAML 的瞬间。源码入口是 [Fiber 配置解析与激活](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/cordis/src/fiber.ts#L641)。

同一套声明在当前 DSH 中还有几种具体用途：

| 用途 | 具体收益 | 实现者 |
|---|---|---|
| 校验并补默认值 | 插件收到解析结果，错误带字段路径 | Schemastery + Cordis |
| 声明即时配置 | `.volatile()` 产出稳定引用，业务通过 `.get()` 读取 | Schemastery 建引用，Loader 更新引用 |
| 提供设置数据 | 提取可即时编辑字段，提供值、修订号和脱敏结果 | SettingsForms + ConfigEditor |
| 支持前端校验 | 将原生 schema 序列化，在 Client 重建并检查草稿 | SettingsSchemaService |
| 供配置工具检查 | 将可表达的输入规则投影成 JSON Schema，标明局限 | app-boot 投影器 + Inspect |
| 检查配置文档漂移 | 对照 schema 字段路径与配置类型，检查生成目录是否新鲜 | 配置目录生成器及检查脚本 |

各行的调用与支持范围见[实际消费链](./02-dsh-consumers-and-lifecycle.md)。特别需要分清：Schema 提供界面可以读取的信息；**当前生产设置页面的控件由产品插件编写，再通过 Slots 注册，不能把 schema 元数据等同于已经实现的通用自动表单。**

## 三、一个真实用途：修改 Shell 超时

Shell 的超时配置能把这套机制串起来，也说明只把 Schemastery 理解为类型检查会漏掉什么。

[LocalBashExecutor](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/shell/bash-local/src/index.ts#L97) 声明了 `timeoutMs: z.number().default(120_000).volatile()`。解析后，`config.timeoutMs` 是一个引用；执行器处理新请求时调用 `.get()`，按当前配置解析超时。

设置页面提供入口，Host 校验完整配置并保存 profile patch。在仅即时字段改变且满足更新条件时，Loader 更新原引用，插件实例继续使用它。业务代码需要按操作读取；把启动时的 `.get()` 结果永久存起来，就无法获得后续值。

即时设置因此需要四部分：**Schema 声明、Loader 提交、业务读取、设置持久化。** 只写 `.volatile()` 不会替任意宿主实现全部行为。[第二分篇](./02-dsh-consumers-and-lifecycle.md)沿这条真实链路展开。

## 四、DSH 原生仓怎样把质量做对

全插件架构的难点之一是：函数正确，仍可能在实际挂载、依赖等待、热更新或远程设置时出错。主仓为不同失败方式分别保留检查和证据。

| 容易出现的问题 | 主仓的具体手段 | 保证到哪里 |
|---|---|---|
| 配置类型错或遗漏必填项 | 启动前执行运行时 Config 校验 | 保证已声明规则；业务条件仍需业务验证 |
| schema 加字段，接口和目录没跟上 | 静态字段路径检查、生成目录新鲜度检查 | 检查字段可定位及产物一致，不证明所有约束等价 |
| 即时修改成功，消费者仍用旧值 | 真实 Loader/配置更新测试，检查实例、引用、消费者和重启恢复 | 验证被测生命周期 |
| 无效修改或并发写损坏配置 | 完整 Config 校验、修订号、文件锁、原子写入、应用失败后恢复 | 由写入服务及失败测试负责，不是 schema 单独保证 |
| 秘密从设置响应泄露 | Host 强制脱敏，处理 schema 默认值，测试嵌套结构 | 保障这条响应链，不是给任意日志自动脱敏 |
| 配置改变后模型看到的工具或提示词不对 | 按影响范围增加真实装配及录制会话回放证据 | 回放验证流程与记录结果；真实模型能力仍需真实 API 验证 |

我认为关键在于**把要求放到会执行的检查和拥有修改权的操作中**。前端验证改善反馈，Host 写入前仍校验完整配置；类型与文档检查减少漂移，真实装配测试继续验证插件有没有挂对。

这些大多有传统软件工程基础。DSH 的特色在于：把模型请求、提示词、工具 schema、会话日志和实际工作区效果纳入证据，并对可替换插件的装配与撤销单独验证。它也仍有检查范围较窄、文档滞后的地方，不能从“规则写得严格”反推“所有错误都已被拦住”。[质量实践分篇](./03-repo-quality-practices.md)会同时交代做法和上限。

## 五、几个容易误解的地方

理解价值时，也要分清不同机制的职责。下面按当前实现核查，而不是根据方法名或旧说明推断。

- **数字 schema 不会把字符串 `"5"` 自动变成 `5`。** 转换需要明确声明；当前库没有 `.coercion()`，普通 object 默认保留未声明字段。
- **`required` 优先于 `default`。** 两者同时设置仍拒绝缺省或 `null`；普通未设必填的标量却可能直接接受缺省或 `null`。精确语义见[第一分篇](./01-schema-and-validation.md)。
- **Cordis 接受同步 Standard Schema 校验器。** Schemastery 是 DSH 的主要 Config 实现；换用其他兼容校验器，不会自动获得 DSH 的原生投影和设置支持。
- **`toJSON()` 不是标准 JSON Schema。** 前者保存 `uid/refs` 原生图；后者由 DSH 专门投影，无法完整表达任意 JavaScript 转换与自定义解析。
- **模型工具参数、RPC 和持久化记录另有 schema。** 工具使用 JSON Schema，远程协议涉及 Typert/Zod，存储记录也可用 Zod。工具插件的启动 Config 与模型每次调用的参数是两件事。
- **检查有不同证明范围。** 配置 dump 展示组合结果，schema dump 展示可投影规则，插件启动和业务结果仍需运行时证据。回放固定的模型输出，也无法发现线上模型后来改变了回答风格。

## 继续阅读

主回答建立概念与用途，分篇保留具体语义、源码和质量判断。

| 你关心什么 | 阅读入口 |
|---|---|
| 默认值、空值、组合与转换的精确规则 | [01 · Schema 的结构与解析语义](./01-schema-and-validation.md) |
| 配置怎样进入插件、设置、即时更新、Inspect 和文档 | [02 · DSH 的实际消费链与生命周期](./02-dsh-consumers-and-lifecycle.md) |
| 主仓怎样防漂移、验真实装配和失败恢复，有何可借鉴 | [03 · 主仓质量实践](./03-repo-quality-practices.md) |
| 对“证据驱动、五大习惯、退役、持久化指纹”那段归纳逐项判断 | [04 · 对质量体系解释的核验与取舍](./04-assessing-quality-claims.md) |
| 直接追实现、窄实验和测试记录 | [研究证据](./research.md) |

> 核验状态见[核验基线登记](../00-baseline.md)。
