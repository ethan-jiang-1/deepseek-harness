# Schemastery 在 DSH 中的全景决策指南

`schemastery` (@deepseek-ai/schemastery) 是 DSH 插件系统中配置、API 与边界数据校验的核心协议。本专题旨在回答：它为何是质量基石，以及如何在 DSH 插件开发中正确应用。

## 决策速查表 (The DSH Way)

| 场景 | 决策 (Decision) | 核心原理解释 |
| :--- | :--- | :--- |
| **定义配置结构** | 必须用 `Schema.object` | 为 Cordis 加载、Web 表单生成、文档自动化提供唯一 Truth。 |
| **处理外部输入** | 依靠 `.coercion` | 依靠 Schema 解析器自动修整类型，禁止在业务逻辑中塞类型转换。 |
| **校验失败时** | 必须 Fail-Fast | 插件定义不应容忍不合规配置，在加载瞬间报错防止运行时错误。 |
| **交互边界** | 使用 `Schema` 界定 | 插件交互 Seam 必须通过 Schema 达成协议，保证模块间隔离。 |
| **文档生成** | 必须写 `.description()` | 配合 `dsh-doc` 工具，实现代码定义与用户文档的原子同步。 |

---

## 分篇专题走查

如果将 `schemastery` 视为一个守门系统，以下四篇文档从不同角度论述其防线：

### 一、基础范式
*   [01-usage-patterns.md](./01-usage-patterns.md)：**定义契约**。论述如何通过声明式结构定义插件元数据（含 `role` 与 `description`），这是所有后续链条的起点。

### 二、运行时校验
*   [02-coercion-and-validation.md](./02-coercion-and-validation.md)：**守门防线**。深度剖析 Fail-Fast 机制与自动强制转换 (Coercion) 的多态性，禁止将防御性代码散落在逻辑中。

### 三、质量保障机制
*   [03-quality-assurance-practices.md](./03-quality-assurance-practices.md)：**工程闭环**。详述如何利用 Schema 在测试与部署阶段提前发现配置冲突，以及它如何与测试夹具联动。

### 四、高级组合能力
*   [04-advanced-patterns.md](./04-advanced-patterns.md)：**复杂业务处理**。论述 `intersect` 与 `union` 如何在复杂配置下（如多层叠层、互斥校验）实现逻辑简化。

---

> [!TIP]
> **维护说明**：本目录下的所有文件均遵循 DSH 源码一致性标准。修改 Schema 定义后，务必运行 `pnpm dsh --dump-config` 验证配置叠层的合法性，并观察 `doc-sync` 是否自动同步了文档描述。
