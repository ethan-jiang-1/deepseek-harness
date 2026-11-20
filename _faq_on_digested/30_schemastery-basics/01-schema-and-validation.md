# 01 · Schema 的结构与解析语义

## 本篇解决什么问题

本篇供编写 Config 时查阅：确认 schema 实际接受什么、返回什么、是否改写输入。这里的“解析”包括校验、填默认值和转换；不等于读取 YAML，也不保证纯函数。工具调用 JSON Schema 的经验可以帮助理解数据约束，但具体空值、分支与未知字段语义需要重新核对。

## 从一个可调用声明开始

Schemastery schema 同时具有执行能力和可读取结构。它调用解析器检查数据，又保留字段和元数据，供 DSH 的其他组件读取。本篇只看库本身：把未经处理的输入称为 raw 值，把校验、默认填充或转换后的结果称为解析值；二者不一定相同，解析也不一定保持输入不变。

下面只演示库的行为，不启动插件、不访问网络、不修改 profile。例子已通过当前源码的内存实验核验。

```javascript
import Schema from '@deepseek-ai/schemastery'

const Config = Schema.object({
  endpoint: Schema.string().required(),
  retries: Schema.number().step(1).min(0).default(3),
  enabled: Schema.boolean().default(true),
})

Config({ endpoint: 'https://example.com' })
// { endpoint: 'https://example.com', retries: 3, enabled: true }

Config({ endpoint: 'https://example.com', retries: 5 })
// { endpoint: 'https://example.com', retries: 5, enabled: true }

Config({ endpoint: 'https://example.com', retries: '5' })
// 抛出 ValidationError：retries 预期 number。

Config({ retries: 2 })
// 抛出 ValidationError：endpoint 缺少必填值。
```

上例只是一份库用法演示，`endpoint` 并非本篇新建的 DSH 插件配置。逐段读 `retries`：`number()` 检查数字，`step(1)` 限制整数步长，`min(0)` 要求至少为零，`default(3)` 给缺值提供默认值。“元数据”指 schema 附带的默认值、范围、说明等信息；resolver（解析器）则是执行具体节点规则的函数。

`Config` 是函数对象。`Config(raw)` 返回解析结果；`Config.dict` 能找到字段，字段的 `meta` 保存默认值、范围和角色。构造器将函数接到 `Schema.prototype`，调用时转交给 `Schema.resolve()`，见[实例构造](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L254)与[解析入口](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L515)。

这使消费者既能执行校验，又能检查声明，而不只是得到一个无法读取内部规则的判断函数。

## TypeScript 类型与运行时值各自负责什么

TypeScript 检查源码中的使用方式；运行时 schema 检查实际进入解析器的数据。YAML 和用户输入不是已经被编译器检查过的对象。

Schemastery 的两个主要泛型参数可概括为 `Schema<S, T>`：`S` 描述输入，`T` 描述解析输出，默认 `T = S`；`.volatile()` 另通过输出模式把值变成引用。依据见[调用签名](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L135)和[输出模式定义](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L245)。

插件常见的 `interface Config` 与 `const Config: Schema<Config>`，把静态声明和运行时规则放在相邻位置。但接口里的 `?` 不会替 schema 自动设置规则，接口里的必填字段也不会自动调用 `.required()`。可以从 schema 的调用返回值推导类型，仍不能因此认定 TypeScript 完整证明了空值、默认值和自定义转换的行为。

这里还有实际限制：普通 `Schema.string()` 的声明返回类型是 `string`，运行时却可能直接返回 `undefined` 或 `null`；对象的输出映射也不能保证所有字段实际存在。应当联合检查类型、解析规则与行为测试，不能只看泛型。[类型与实现对照](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L36)及[研究实验](./research.md)记录了这一点。

[AgentLoop 的静态 Config](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/agent-loop/src/index.ts#L344)是输入、输出不同的真实例子：输入允许省略默认字段，输出包含即时引用。主仓另有[即时引用类型断言](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/volatile-config.spec.ts#L9)。

## 缺省、null、默认值和必填

当前实现遇到 `undefined/null` 时，先检查 `required`；没有要求必填，再找非空默认值；没有可用默认值就原样返回输入。不要直接套用其他校验库的规则。

| 声明 | 输入 `undefined` | 输入 `null` | 非空输入 |
|---|---|---|---|
| `Schema.string()` | 返回 `undefined` | 返回 `null` | 要求字符串 |
| `Schema.number().default(3)` | 返回 `3` | 返回 `3` | 检查数字及附加限制 |
| `Schema.string().required()` | 拒绝 | 拒绝 | 要求字符串 |
| `Schema.string().required().default('x')` | 拒绝 | 拒绝 | 要求字符串 |
| `Schema.object({...})` | 使用隐含 `{}`，继续校验字段 | 同左 | 校验对象和字段 |
| `Schema.array(...)` | 使用隐含 `[]`，继续校验 | 同左 | 校验数组和元素 |

表中是普通节点行为，不涵盖自定义类型、lazy、loose 等情况。顺序见[空值解析](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L533)，容器隐含默认值见[工厂实现](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L912)。默认值复制后继续校验，不能靠默认值绕过范围或子字段必填要求。

因此 `Schema.object({ token: Schema.string().required() })` 不会因为外层有默认 `{}` 就成为可省略配置：空对象会在内部缺少 `token` 时失败。[配置投影测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/tests/schemastery-json-schema.spec.ts#L25)覆盖了这种情况和 `required + default`。

`.required()` 也不要求字符串非空。拒绝 `''` 需要 `.min(1)` 或相应业务规则。

## 类型转换与未知字段都需要明确判断

基本类型解析器直接检查 JavaScript 类型。数字要求 `typeof value === 'number'`，布尔要求布尔，字符串要求字符串；字符串 `"5"` 不会自动变为数字，`"false"` 不会自动变为布尔。依据见[基本类型解析器](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L668)。

普通 object 默认先校验声明字段，再保留输入中的其他字段。因此前面的 `Config({ endpoint: 'x', extra: 1 })` 会保留 `extra: 1`。拼错可选字段可能既没有设置正确选项，也没有触发未知键错误。

源码内部存在 `Schema.resolve(..., strict)` 参数；它不是公开的链式 `.strict()`，也不是“遇到未知键报错”。当前 object 在这种模式下省略当前层其他字段，不递归拒绝未知字段，见[object 解析](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L812)。需要拒绝未知键时，应明确实现并验证这项要求。

## 组合方法解决的是值解析

`union`、`intersect` 和 `transform` 有实际组合能力，但不能替代 profile patch、依赖注入或完整业务检查。

| 方法 | 当前语义 | 使用时要知道什么 |
|---|---|---|
| `union([A, B])` | 按顺序尝试，返回第一个成功分支 | 不是恰好一个匹配；分支顺序可能影响输出 |
| `intersect([A, B])` | 逐分支解析并合并兼容结果 | 对象已有键不被后续合并覆盖；与 patch 后层替换语义不同 |
| `transform(inner, callback)` | 解析 inner，再转换结果 | 输入输出可以不同；可能产生输入回写 |
| `lazy(builder)` | 延迟取得 schema | 校验或序列化可能执行 builder |

准确顺序见[组合解析实现](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L825)。DSH 的 patch 指定 `config` 时整块替换；它与 `intersect` 是独立机制，见[patch 描述](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/src/config-schema/document.ts#L24)。

普通 `transform` 会分别转换解析结果和用于输入适配的值，callback 可能执行两次；外层属性解析还可能回写原输入。失败分支没有统一输入回滚，因此转换回调应保持纯粹，不能假设执行一次，也不宜在里面发请求或写文件。`preserve: true` 走不同分支。依据见[transform](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L857)与[属性解析](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L746)，实测见[研究证据](./research.md)。

## 元数据与业务规则要追到消费者

有些元数据由库的 resolver 使用，有些要由 DSH 消费者解释。把值存入 `meta` 并不等于所有环境会执行同样的动作。

| 声明 | 实际作用 |
|---|---|
| `.min()`、`.max()`、`.step()`、`.pattern()` | 相应类型或容器解析器使用限制；单位依节点类型而定 |
| `.description()`、`.role()`、`.hidden()` | 保存说明和展示信息，消费者决定如何使用 |
| `.role('secret')` | DSH 设置脱敏器识别这个角色，不给任意日志提供全局脱敏 |
| `.volatile()` | 解析时创建引用；Loader 在合格更新中保留旧引用身份，业务仍需按操作读取 |

跨字段关系、引用服务是否存在、资源是否可用，仍要在拥有信息的位置检查。例如 [repeat-tool-reminder](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/guard/repeat-tool-reminder/src/index.ts#L164) 在 schema 基础校验之后，继续验证阈值与预览长度。当前库没有 `.check()` 或 `.coercion()` 方法，不应根据其他库的 API 推断这里已有对应行为。

追源码可以按三个位置走：先看插件实际导出的 `Config`，再找 Schemastery resolver，最后找读取元数据或执行修改的 DSH 消费者。下一篇沿此方法说明[实际消费链](./02-dsh-consumers-and-lifecycle.md)。

> 核验状态见[核验基线登记](../00-baseline.md)。
