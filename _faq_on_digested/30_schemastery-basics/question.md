# Question 30 · Schemastery 是什么，DSH 又怎样把相关质量做好？

DSH 插件中经常同时出现一个叫 `Config` 的 TypeScript 类型，以及同名的 `Schema.object(...)`。默认导入有时叫 `Schema`，有时叫 `z`；工具参数、远程调用和持久化数据也都在谈 schema，容易把这些机制混为一谈。

本专题回答以下问题：

1. Schemastery 是一个库、一种格式，还是 Cordis 的插件协议？schema 对象在运行时究竟做什么？
2. 已有 TypeScript 接口，为什么还需要运行时校验？同名的类型和值分别由谁消费？
3. `required`、`default`、`union`、`intersect` 和 `transform` 的真实语义是什么？是否自动转换字符串、拒绝未知字段？
4. Loader、即时设置、Client 和配置文档如何使用这些声明？`.volatile()` 为什么能支持运行中的修改？
5. Schemastery 序列化、JSON Schema、Zod 和 Typert 各自负责什么？
6. 围绕 Schemastery，DSH 自身长期开发时怎样防止配置声明、类型、文档、真实 Loader、消费者和设置保存逐渐脱节？哪些测试、检查和事故回归实际保障了这条链？
7. “证据驱动、五大防御习惯、可执行门禁、持久化指纹”这些归纳，哪些有源码依据，哪些需要限定范围？
8. Git 历史、Note 取舍和 Skills 操作要求揭示了哪些维护负担与开发纪律？未来插件作者怎样借鉴，怎样避免把工程检查误认为模型质量的充分保证？

读者假定熟悉 AI Agent/Harness、工具调用与一般工程测试；不要求了解 DSH 的配置组织、插件生命周期或内部测试名称，TypeScript 特有写法会就地解释。先读带 SVG 图解的[主回答](./answer.md)，再沿“解析语义 → 实际消费链 → 主仓质量实践 → 配置开发纪律”深入；质量说法核验与两份研究记录是可选附录。

> 核验状态见[核验基线登记](../00-baseline.md)。
