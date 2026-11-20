# 配置消费方：序列化、投影、目录与设置 UI

一份原生 Config 可以被多个消费者读取，但各消费者保留的信息和承担的校验不同。Cordis 通过[同步 Standard Schema](./01-schemastery-configuration-and-usage.md)得到运行值；下面的序列化、投影和目录都是另外的产物，不能相互替代。

![配置声明的实际消费方与诊断点](./runtime-integrity-flow.svg)

## 各产物回答什么

| 消费方或产物 | 输入与产物 | 能回答的问题 | 保证范围 |
|---|---|---|---|
| 原生 `schema.toJSON()` | Schemastery 图 → `uid` / `refs` 引用结构 | 怎样传递共享节点和元数据，并由 `new Schema(...)` 重建？ | 不是 JSON Schema；回调可序列化为文本，重建不恢复原闭包，不能接受不可信 schema |
| JSON Schema 投影 | 原生节点 → JSON Schema 2020-12 与 `x-cordis` 诊断 | 哪些输入约束可被通用校验器或编辑器表达？ | 不执行原生 validator 或 transform；遇到不能精确表达的效果时放宽约束并列出 limitations |
| 静态配置目录 | 源码中的类型与 schema 声明 → 字段目录和静态检查 | 声明有哪些字段，schema 路径是否存在于对应类型？ | 路径存在性检查不证明运行值正确或类型与 schema 完全等价；无法解析的情况为 unknown |
| Settings 数据与草稿校验 | 活跃 entry 的原生 schema 和运行值 → volatile 表单、普通值与脱敏数据 | 哪些字段可在线编辑，候选草稿是否通过表单校验？ | 普通字段不进入在线表单；客户端草稿通过不代表服务器保存、持久化和调和已成功 |
| 产品设置卡片 | Settings 数据与产品注册 → 实际控件 | 用户怎样理解、编辑和重置这项配置？ | 卡片、标签与交互由产品插件实现；导出 Config 或标注 secret 不会自动生成完整 UI |
| YAML dump | profile 组合层 → 带来源信息的 entry-list YAML | 层叠之后声明了什么？ | 不 boot、不求值 `!!js`，不证明 Config 校验或插件激活成功 |
| Schema dump | 组合后的插件声明 → profile 级 JSON Schema 与诊断 | 可发现的配置声明是否完整投影？ | 不 apply 插件、不求值 `!!js`；import 和 lazy builder 可执行受信任代码；输出可有用但不完整，需同时看 complete 与退出状态 |
| live Config Inspect | 当前 Loader tree → entry 状态与单项 JSON Schema | 当前有哪些 Loader 条目，它们的声明能投影成什么？ | 不执行 validator 或 transform，不覆盖运行时创建的 Agent preset 树 |

## 怎样读投影限制

JSON Schema 的 `default` 是注解，不能替代原生的缺省解析；通用验证器也不应擅自把原生 union 的“首个成功分支”改成 `oneOf`。对 transform、可能改变后续分支输入的解析或其他不透明效果，投影会显式标注限制，而不是执行原生回调来猜出所有输入行为。

投影的 `x-cordis.complete`、entry 状态与 `limitations` 需要一起阅读。Schema dump 能输出部分可用文档，同时以失败状态表示收集或投影不完整；“打印出 JSON”不等于检查全部成功。YAML 与 schema dump 的组合语义见[dump 与启动保真](../plugin-system/composition/02-dump-and-boot-fidelity.md)。

## 元数据与产品职责

`.description()`、`.role()`、hidden 等是 Schemastery 提供的元数据。具体消费者决定如何解释；`secret` 可参与脱敏，不能据此推出任意设置页都自动出现密码框。现有 shell 设置卡片显式声明控件、文案与编辑回调，Settings 提供共享的配置数据和编辑机制。

运行配置仍以插件的 Config 为声明来源，产品 UI 不应另存一份互相覆盖的偏好。在线字段的生命周期、保存、继承和 reset 的含义归[配置与设置面](../plugin-system/lifecycle/09-configuration-and-settings.md)。工具 JSON Schema、远程类型图和存储记录校验各有独立消费者，不能用本页的 Config 产物替代。

## 问题导航

- 原生校验通过，通用 JSON Schema 仍给出不同判断：先看投影的输入范围、缺省语义和 limitations，再回到[精确解析](./02-coercion-and-fail-fast-mechanisms.md)。
- 有 schema 却没有设置页：区分可编辑字段投影、实例 UI 策略和产品卡片是否注册。
- dump 正常但启动失败：继续检查表达式、依赖和激活，失败范围见[HMR](../plugin-system/composition/03-user-patch-hmr.md)。

## 源码核验入口

- [原生序列化与重建](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts)、[序列化往返测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/volatile-config.spec.ts)：引用图、元数据与回调重建的范围。
- [JSON Schema 投影器](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/src/config-schema/projector.ts)、[profile 文档组装](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/src/config-schema/document.ts)：默认值注解、限制和完整性诊断。
- [静态目录生成器](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/gen-config-catalog.ts)：类型路径存在性与 unknown 结果。
- [Settings 表单投影](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/settings/settings/src/schema.ts)、[客户端 schema 服务](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-settings/src/client/schema.ts)、[shell 设置卡片](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/client/ui-settings-shell/src/client/ShellCard.tsx)：原生图重建、草稿校验与产品控件分工。
- [YAML dump](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/src/dump-config.ts)、[Schema dump](https://github.com/deepseek-ai/deepseek-harness/blob/master/apps/cli/src/dump-config-schema.ts)、[live Config Inspect](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/extensions/tool-cordis/src/config.ts)：三种检查入口的执行范围。
