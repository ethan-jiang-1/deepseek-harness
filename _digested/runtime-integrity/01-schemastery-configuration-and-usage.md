# 01-schemastery-configuration-and-usage.md: 插件配置定义的标准范式与语义洞察

## 概念 (Concept)
在 DSH 源码中，`Schema` 定义不仅是类型，它是**插件元数据的载体**。它将“类型系统”从编译时延伸到了运行时，成为了 Cordis 框架与插件之间交换数据的标准接口。

## 背后思考 (Insight)
*   **`.description()` 的战略意义**：这不仅仅是注释。DSH 的 `Web UI` 或自动生成的文档工具会直接读取这个描述，在前端生成帮助提示。**如果你不写，用户就只能对着空荡荡的设置界面猜功能，直接拉低插件的可用性评分。**
*   **语义 Role (`.role`)**：这是 DSH 独有的 UI 扩展。除了 `secret`，常见还有 `url`、`path`、`markdown` 等。它们直接决定了 UI 渲染策略。
*   **与 Cordis 容器的深度绑定**：插件的 `apply` 方法通常会在 `ctx.plugin(Config, ...)` 中消费此模式。Cordis 框架在实例化插件时，通过这个 `Config` Schema 自动完成：注入、校验、热插拔。

## 工程实践推荐 (Practice)
推荐将 `Config` 接口定义与 `Schema` 对象定义并列维护：

```typescript
import { Schema } from '@deepseek-ai/schemastery'

// 1. 定义类型，供 IDE 智能提示与代码内部引用
export interface Config {
  apiKey: string
  port: number
  enabled: boolean
  tags: string[]
}

// 2. 定义 Schema，供运行时校验、UI 表单渲染、文档生成
export const Config = Schema.object({
  apiKey: Schema.string()
    .required()
    .role('secret')
    .description('用于访问外部服务的 API Key，严禁硬编码。'),

  port: Schema.number()
    .default(8080)
    .description('插件监听的本地端口号，默认 8080。'),

  enabled: Schema.boolean()
    .default(true)
    .description('开启或关闭该插件功能。'),

  tags: Schema.array(Schema.string())
    .default([])
    .description('插件的标签列表，用于分类搜索。'),
})
```

## 参考 (Reference)
*   参见 [Cordis 加载机制](../two-tree-runtime/framework/03-loader-include-与js插值.md)
*   开发避坑：不要在 `Schema` 外维护配置（如 `process.env`），这是 DSH 的大忌。
