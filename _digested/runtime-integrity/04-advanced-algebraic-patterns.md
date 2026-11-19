# 04-advanced-algebraic-patterns.md: 高级模式与架构扩展

## 概念 (Concept)
在复杂插件场景下，简单的对象模式无法满足需求。DSH 源码中大量使用了 Schema 的**代数性质 (Algebraic Properties)**，利用这些组合能力，可以将极度复杂的配置逻辑降维打击。

![Schemastery 质量保障流转图](./runtime-integrity-flow.svg)

## 背后思考 (Insight)
*   **配置叠层 (Layering)**：插件常有“基础功能 + 扩展功能”。不要用 `Object.assign` 去拼装配置对象，那是危险的。利用 `Schema.intersect`，框架层会通过 Schema 的嵌套性质自动识别这种叠层逻辑。
*   **互斥逻辑 (Union)**：这是插件架构中最强大的工具。当配置存在互斥关系时，使用 `Schema.union`。它会根据关键字段（如 `type`）自动识别并切换校验逻辑，彻底杜绝了互斥配置共存导致的 Bug。
*   **单一事实来源 (Single Source of Truth)**：Schema 是 DSH 文档自动化的根源。修改代码即修改文档，消除了“改了代码忘记改文档”的常见工程错误。

## 工程实践推荐 (Practice)

### 1. 动态插件层叠
```typescript
const BaseConfig = Schema.object({ enabled: Schema.boolean() })
const AdvancedConfig = BaseConfig.intersect(Schema.object({
  timeout: Schema.number().default(5000),
  retryCount: Schema.number().default(3)
}))
```

### 2. 联合模式处理互斥
```typescript
const StorageSchema = Schema.union([
  Schema.object({ type: 'local', path: Schema.string() }),
  Schema.object({ type: 'cloud', bucket: Schema.string(), region: Schema.string() })
])
```

## 参考 (Reference)
*   [DSH 文档自动化工具 `dsh-doc`](../system-overview/01-扩展表非显然落点.md)
