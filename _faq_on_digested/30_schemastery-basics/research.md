# Schemastery 与 Cordis 插件配置研究证据

本页供同专题 FAQ 写作查证，资料限于当前 checkout 的源码、测试和包元数据。库能表达的行为、Cordis 通用配置协议和 DSH 的具体消费者分别列出；内存实验只补充源码语义，不替代产品入口验证。

## 1. 本质：携带描述数据的可调用 JavaScript 对象

Schemastery 的默认导出同时是工厂和类型名。工厂创建一个 JavaScript 函数，函数体调用 `Schema.resolve(data, schema, options)[0]`；再把 `type/meta/inner/list/dict` 等描述赋到这个函数上，把原型接到继承 `Function.prototype` 的 `Schema.prototype`。因此实例能同时被调用、读取描述字段和链式添加元数据；它不是 TypeScript 编译器插件，也不在运行时读取 interface。见 [实例构造与原型](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L252-L288)、[包入口与类型声明](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/package.json#L13-L24)。

- 实测 `typeof Schema.string() === 'function'`，且 `instanceof Function`、`instanceof Schema` 均为 `true`。
- `Schema<S, T = S, Mode = 'plain'>` 的 `S` 表示声明的输入类型，`T` 表示解析输出，第三参数控制普通输出或 `Volatile<T>`。`TypeS` 提取输入，`TypeT` 取可调用对象返回值；`Schema.date()` 的类型是 `Schema<string | Date, Date>`。见 [输入/输出推导](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L10-L39)、[工厂类型](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L42-L98)、[Mode 与输出](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L245-L257)。
- 对象输入类型把已声明字段设为可选且允许 `null`，输出映射把字段设为必需，并同时保留字典索引；这不等于运行时所有字段都存在。普通 `Schema.string()` 的声明返回 `string`，实际缺值却可返回 `undefined/null`；泛型不能当作运行时完备性的证明。见 [ObjectS/ObjectT](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L36-L39)、[调用签名](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L135-L158)、[缺值处理](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L531-L553)。
- `Schema<Config, ResolvedConfig>` 可以显式区分用户输入和补全后的值；DSH 实例包括实验性 Stagehand 插件。该插件还在 `apply` 内检查连接模式间的关系，说明 Schema 字段校验不自动覆盖业务约束。见 [Config 声明与额外检查](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/experimental/browser-use-stagehand-native/src/index.ts#L47-L96)。

## 2. 缺值、默认值与 required 的精确次序

`isNullable` 只指 `null` 或 `undefined`。除 `lazy` 外，`resolve` 先处理缺值：若 `meta.required` 为真立即抛错；否则查找默认值，非空默认值经 `clone` 复制后再交给对应 resolver 校验；没有非空默认值则原样返回输入。见 [isNullable](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/cosmokit/src/misc.ts#L19-L22)、[处理顺序](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L531-L553)。

| Schema | 输入 `undefined` | 输入 `null` | 非空非法值 |
|---|---|---|---|
| `Schema.string()` | `undefined` | `null` | 抛错 |
| `Schema.string().default('d')` | `'d'` | `'d'` | 抛错 |
| `Schema.string().required().default('d')` | 抛 `missing required value` | 同左 | 抛错 |
| 上一项再 `.loose()` | 仍抛缺值错误 | 仍抛缺值错误 | 返回 `'d'` |
| `Schema.never()` | `undefined` | `null` | 抛 `expected nullable` |
| `Schema.const(null).required()` | 抛错 | 抛错 | 常量不匹配而抛错 |

表中行为已由内存实验核对；现有投影测试也覆盖 required/default/null 组合。注意 `required()` 的 JSDoc 中“unless a default supplies a fallback”与当前实现及测试不符，应按实现和测试写 FAQ。见 [该 JSDoc](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L159-L175)、[现有组合测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/tests/schemastery-json-schema.spec.ts#L25-L48)。

- `object/dict` 工厂隐含默认 `{}`，`array/tuple` 隐含默认 `[]`，`bitset` 隐含默认 `0`。因此缺失的对象仍可能在递归校验必填子字段时失败；union 外壳本身不会自动继承对象分支的默认值。见 [工厂默认值](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L878-L919)、[嵌套缺值测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/tests/schemastery-json-schema.spec.ts#L25-L55)。
- `intersect` 缺值时会沿首个分支寻找默认值；这不是从所有分支合并默认值的通用算法。见 [首分支查找](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L535-L543)。
- 默认值复制不是 JSON 转换：Cosmokit `clone` 支持日期、正则、二进制、数组、对象原型、属性描述及引用缓存；每次使用普通缺值默认值各自复制。`.loose()` 捕获 resolver 抛错时直接返回 `meta.default`，没有上述复制和再次验证。见 [clone](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/cosmokit/src/types.ts#L87-L116)、[loose 分支](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L545-L553)。

## 3. object、未知键与 strict

`Schema.object()` 校验声明的字段并构造新结果；默认把原输入中未在结果内出现的键合并回去，因此未知键保留。缺失且解析为 `null/undefined` 的字段不加入结果；若输入本来含这个键，则保留该键，例如 `{x: undefined}`。见 [property 与 object](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L758-L771)、[merge/object](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L805-L823)。

`strict` 是底层 `Schema.resolve(data, schema, options, strict)` 的第四参数，不是当前库的 `.strict()` 实例方法。对于 object，它省略当前层未知键的合并，不是遇到未知键就拒绝；普通调用和 Standard Schema 适配器没有打开它。嵌套 `property()` 调用也没有继续传 strict，所以不能说它递归剥除未知键。见 [resolve 默认参数](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L515-L520)、[property 调用](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L758-L765)、[object strict](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L812-L823)。

`isPlainObject` 的实现只排除空值、非 object 和数组，没有严格检查原型；不能据函数名断言 object resolver 只接受普通 JSON 对象。普通 object 返回新外层对象，未知字段的对象值仍可与输入共享引用。见 [实际谓词](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/cosmokit/src/misc.ts#L29-L32)、[merge 的赋值](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L805-L823)。

## 4. transform、union、intersect 的副作用与失败

`Schema.transform(inner, callback, preserve?)` 先以 strict 模式解析 inner。`preserve` 为真时仅返回一次 `callback(result)`；默认模式返回 `[callback(result), callback(adapted)]`，其中 adapted 默认是原始 data。即便顶层可调用 Schema 最后只取第一项，两个回调也已经执行。回调的声明签名含 options，但当前 resolver 调用没有传第二实参，内存实验确认为 `undefined`。见 [类型声明](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L96)、[实际调用](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L857-L873)。

- 当 transform 用于对象属性或数组元素，`property()` 会把非 `undefined` 的 adapted 第二项写回输入；默认值补全本身通常只影响输出，不回写原输入。`preserve=true` 不产生这一 adapted 值，但不能保证 inner 或 callback 自己无副作用。见 [写回规则](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L758-L771)、[区分默认值和回写的测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/tests/schemastery-json-schema.spec.ts#L209-L234)。
- union 按顺序返回第一个未抛错分支，捕获各分支所有抛错，最后失败再抛统一 ValidationError；没有复制输入或回滚。先失败的分支可以改写输入，让后面的分支成功；不是 JSON Schema `oneOf` 的“恰好一个分支成功”。见 [union resolver](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L825-L835)、[失败分支回写回归测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/tests/schemastery-json-schema.spec.ts#L209-L223)。
- intersect 把同一 data 依次交给各分支，以 strict 解析；非空结果类型须一致，标量须相等，对象按“已有键优先”合并，最后视外层 strict 决定是否补入原 data。实测两个分支对 `a` 分别默认 `'first'/'second'` 时保留 `'first'`。见 [intersect 与 merge](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L805-L854)。
- 默认失败机制是抛异常，不保证输入不变。`autofix` 是显式选项：属性解析异常时删除输入属性，并返回该字段默认值；它不是全局类型 coercion，也不是普通 Cordis Config 校验的默认模式。dict 键解析还会执行重命名和删除，strict 对非法键则跳过。见 [options](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L102-L110)、[property/dict](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L758-L795)。

## 5. from、lazy、toJSON 与链式方法

`Schema.from(existingSchema)` 返回同一实例；字符串/数字/布尔常量转为必填 const；`String/Number/Boolean/Function` 构造器转为对应必填 Schema；其他函数转为必填 `is`；运行时 `null/undefined` 转为 any。object、array、union 等工厂会对传入成员调用 from，因此 `String` 与 `Schema.string()` 的缺值语义不同。见 [from](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L556-L574)、[工厂归一化](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L878-L888)。

`lazy` 延迟 builder，第一次解析或序列化时缓存 inner，并把外层 meta 合并进 builder 返回的 schema，inner 自己已有的 meta 优先；这会修改共享 inner。已缓存 lazy 再链 `.required()` 等会复制外层而共享 inner，新增 meta 不一定传播到 inner。不能把 lazy 写成没有缓存、没有副作用的简单递归标记。见 [构造及序列化触发](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L576-L586)、[解析触发](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L640-L647)、[共享 meta 回归测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/tests/schemastery-json-schema.spec.ts#L257-L298)。

`toJSON()` 返回 `{uid, refs}` 图封套，保留共享和递归 Schema 引用；`new Schema(envelope)` 用引用表重建。它不是标准 JSON Schema。transform callback 会附加 `toJSON` 方法以序列化函数文本；重建时用 `new Function` 恢复函数，闭包变量不随之保存，实测闭包引用抛 `ReferenceError`。`is` 构造器也会被附加按名字序列化的方法。见 [重建](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L254-L283)、[toJSON 图](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L311-L322)、[函数序列化附加方法](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L897-L906)。

大部分元数据链式方法创建新函数实例并浅复制 meta；这不是整张 Schema 图的不可变深拷贝：子节点可共享，`set/push` 直接修改本实例的 dict/list，`deprecated/experimental` 还可能共享并修改 meta.badges 数组。见 [set/push](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L324-L331)、[元数据方法](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L385-L419)、[default 等方法](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L470-L483)。

当前静态方法与实例方法均没有 `.nullable()`、`.null()`、`.coercion()`、`.check()`，实例也没有 `.transform()`；当前源码提供静态 `Schema.transform`、`Schema.extend(type, resolver)` 和可调用实例。基础 string/number/boolean resolver 按 `typeof` 判断，不把 `'3'` 自动转为数字。此处是当前实现及运行时对象核对结果，不主张其他库或未来扩展也没有这些名称。见 [方法声明](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L42-L98)、[实例方法声明](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L135-L205)、[extend](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L511-L513)、[基础 resolver](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L668-L711)。

## 6. Cordis 的 Config 发现、校验与失败时机

Cordis 公开的 `Plugin.Base.Config` 是可选 `StandardSchemaV1<any, T>`，不是必须为 Schemastery；Cordis 包也没有把 Schemastery 声明为依赖。Schemastery 的 `~standard` getter 返回 `version:1/vendor:'schemastery'/validate`，validate 用原生 resolve 并把可识别的 ValidationError 转成 issues，其他异常继续抛出。见 [Plugin.Config](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/cordis/src/registry.ts#L99-L145)、[Cordis 依赖](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/cordis/package.json#L47-L50)、[Schemastery 适配器](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L290-L307)。

1. Loader 导入模块后先 `unwrapExports`：优先选 `exports.default`，再处理 `__esModule` 默认互操作；因此函数插件 namespace 的 `Config/apply/inject` 和默认 service class 的静态 `Config` 是两种实际入口。见 [unwrapExports](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/loader/src/index.ts#L200-L208)、[Entry 导入与挂载](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/loader/src/config/entry.ts#L223-L237)、[函数插件实例](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/skill-filesystem/src/index.ts#L44-L88)、[service 静态 Config 实例](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/shell/bash-local/src/index.ts#L97-L111)。
2. Registry 把函数本身或对象的 apply 作为 callback 身份，首次创建 runtime 时读取 `plugin.Config`；此 runtime 的多个 fiber 共享该字段，不是每次调用都重新发现 Config。见 [callback 选择](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/cordis/src/registry.ts#L216-L226)、[runtime 创建](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/cordis/src/registry.ts#L316-L335)。
3. Fiber 保留 `_config` 原值；依赖全部可用才激活。reload 先跑 `internal/config` waterfall，再 `resolveConfig`，随后把结果交给函数 callback 或 class 构造器。缺失依赖的 PENDING 插件可以尚未完成 Config 校验。见 [保存原值和入口执行](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/cordis/src/fiber.ts#L229-L260)、[依赖检查](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/cordis/src/fiber.ts#L611-L657)。
4. `resolveConfig` 无 Config 时原样返回；有 Config 则同步调用 `~standard.validate`，拒绝异步结果，将 issues 包装为 Cordis ValidationError，否则返回 result.value。没有自动 `Config()`、JSON Schema 解释或隐藏 coercion 步骤。见 [resolveConfig](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/cordis/src/fiber.ts#L18-L62)。
5. 初次激活异常被记录并保存，随后卸载已收集 effects；调用者 `await fiber` 或 `fiber.await()` 才获得启动异常。ACTIVE fiber 的 `update()` 则先替换 `_config` 再同步解析，解析失败不会进入 restart，但 raw 已被保留；非 ACTIVE 更新延迟到可激活时解析。见 [reload catch](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/cordis/src/fiber.ts#L646-L695)、[await/update](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/cordis/src/fiber.ts#L698-L753)。

`Service[resolveConfig]` 是另一套“服务 intercept 配置合并”机制：从祖先收集配置，优先调用实例 `Config.merge`，否则浅 `Object.assign`。它不等于插件启动时的 `resolveConfig(runtime, raw)` 校验。见 [Service 合并实现](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/cordis/src/service.ts#L75-L102)。

## 7. Loader、表达式、持久化和 volatile 本地扩展

Loader 的 `internal/config` 钩子只对相应 entry 的配置递归插值；Group/Include 这类树载体保持字面配置，让子 entry 在自己的 Context 中求值。YAML `!!js` 由 Include 转为 `{__jsExpr}`，Loader 的 interpolate 用 Context 求值后才由 Fiber 校验。见 [YAML 类型](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/include/src/index.ts#L9-L25)、[Loader 钩子](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/loader/src/index.ts#L104-L113)、[求值和遍历](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/loader/src/config/utils.ts#L3-L26)。

普通 `internal/update` 的 Loader 持久化钩子会调用 Config 上可选的 `simplify`，把补全的默认值尽量去掉，再写 entry tree；`noSave` 会绕过。Schemastery `simplify` 自己含 union 分支解析，因此也不宜笼统称为无副作用序列化。见 [持久化钩子](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/loader/src/index.ts#L115-L121)、[simplify](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L422-L457)。

`.volatile()` 是这份源码实际具有的配置引用能力：在原节点 meta 写 `volatile:true`，解析后得到有 `.get()` 的新引用。引用保存分离且递归冻结的数据快照，拒绝函数、循环对象和非普通对象；同一 schema 每解析一次都会创建新引用。只有 Loader 更新时把新候选快照提交到旧引用，运行中的引用身份才保持稳定。见 [标记和解析](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L480-L529)、[快照与引用](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/cosmokit/src/volatile.ts#L18-L45)、[提交函数](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/cosmokit/src/volatile.ts#L78-L86)。

- volatile 字段必须在固定 object 路径；array/dict/tuple/union/intersect/transform/lazy 内部的 volatile 子节点及嵌套 volatile 被拒绝，支持把整个 array、union 或根对象标成 volatile。非法声明可在输入没有该字段时就失败。见 [声明检查](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/schemastery/src/index.ts#L488-L520)、[声明位置测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/volatile-config.spec.ts#L47-L65)、[lazy 限制测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/volatile-config.spec.ts#L85-L95)。
- 无重挂更新要求 ACTIVE fiber、Context 仍接原 parent、只改 config、raw 差异限于 Schema 已声明 volatile 的位置。raw 比较只读元数据，不运行表达式/校验；未知键和普通字段保持严格比较。见 [入口条件](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/loader/src/config/entry.ts#L141-L153)、[raw 比较](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/loader/src/config/diff.ts#L7-L45)。
- Loader 仍会对候选跑完整 config waterfall 与验证，再确认有效普通值未变；成功后提交所有引用，再向拥有该 fiber 的监听者发一次 `loader/volatile-update(paths)`。这条路径绕过普通 `internal/update` 钩子；普通有效值也变了则走正常更新。见 [提交实现](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/loader/src/config/entry.ts#L159-L196)、[钩子回归测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/loader-volatile-update.spec.ts#L110-L130)。
- 非法候选只警告并保留运行中的旧引用，raw 配置仍留待下一次激活；不能写成事务性回滚全部配置。混合普通字段更新、依赖替换或直接 `fiber.update()` 都不能由 volatile 标记单独保证不重启。见 [失败保留](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/loader/src/config/entry.ts#L149-L179)、[混合及依赖测试](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/loader-volatile-update.spec.ts#L85-L108)、[直接更新/依赖替换](https://github.com/deepseek-ai/deepseek-harness/blob/master/scripts/loader-volatile-update.spec.ts#L132-L169)。

DSH 已实际把 bash executor 的 cwd、超时、输出预算声明为 volatile，并在每次 `resolve()` 时调用 `.get()`；因此更新影响之后的操作，已经捕获的操作参数不会被自动改写。见 [声明与读取](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/shell/bash-local/src/index.ts#L97-L136)。

## 8. DSH 实际用途与不应泛化的地方

| 已核实用途 | 证据与范围 |
|---|---|
| 插件 Config 校验、默认值和元数据 | Cordis 按 Standard Schema 调用；Schemastery 是 DSH 采用的具体库，协议允许其他实现。见 [Plugin.Base](https://github.com/deepseek-ai/deepseek-harness/blob/master/vendor/cordis/src/registry.ts#L99-L110)。 |
| 设置表单与 Schema 传输 | settings 将 `schema.toJSON()` 封套交给客户端，表单数据投影只选 volatile 字段；不是所有普通 Config 都自动可在线编辑，实际页面控件由产品插件编写。见 [传输字段](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/settings/settings/src/types.ts#L22-L38)、[表单投影](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/settings/settings/src/schema.ts#L19-L50)。 |
| 配置输入 JSON Schema 投影 | 独立 projector 从原生图投影，不调用 transform callback；不模拟全部输入副作用，无法精确表达的地方报告 limitations。见 [projector 声明](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/src/config-schema/projector.ts#L143-L147)。 |
| 配置组合 dump | `renderConfigDump` 读 YAML、应用 overlays、渲染来源注释；没有导入插件或验证插件 Config。见 [dump 实现](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/src/index.ts#L635-L697)。 |
| 工具参数与输出 | tools 有自己的 JSON Schema DSL/验证子集，包含 `additionalProperties` 和 exact-one `oneOf`；不能套用 Schemastery unknown-key/union 语义。见 [工具 DSL](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/tools/src/schema.ts#L1-L8)、[独立 JSON Schema 实现](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/tools/src/json-schema.ts#L1-L11)。 |

原生配置图收集会执行受信任模块导入、Config getter 和 lazy builder，但不 apply 插件、不执行表达式，也不调用 transform callback；表达式结果、服务依赖和插件启动检查仍需运行时验证。因此“只做 schema dump”也不等于“完全不执行插件 JavaScript”。见 [收集器约束](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/src/config-schema/collect.ts#L67-L74)、[投影文档的限制](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/boot/app-boot/src/config-schema/document.ts#L156-L159)。

## 9. 已执行验证：命令与输出

已运行的窄回归命令如下，退出码 `0`，4 个文件、144 个测试通过；输出只有 Vite 提示可用原生路径解析替代现有插件的 warning，不影响测试通过。

```sh
pnpm exec vitest run scripts/volatile-config.spec.ts scripts/loader-config-diff.spec.ts scripts/loader-volatile-update.spec.ts packages/boot/app-boot/tests/schemastery-json-schema.spec.ts --maxWorkers 2
```

```text
packages/boot/app-boot/tests/schemastery-json-schema.spec.ts (90 tests)
scripts/volatile-config.spec.ts (17 tests)
scripts/loader-config-diff.spec.ts (11 tests)
scripts/loader-volatile-update.spec.ts (26 tests)
Test Files 4 passed (4)
Tests 144 passed (144)
```

内存实验使用以下命令启动，stdin 脚本直接导入 source、逐项捕获异常并用 Node inspect 打印；未写临时源码文件，也未调用产品业务服务。为方便复核，下面保留实际运行脚本中关键探针的原文；省略的探针涵盖表 2、克隆、autofix 和 Schema.from，结果已记在对应章节。

```sh
node --import tsx/esm --input-type=module <<'JS'
import Schema from './vendor/schemastery/src/index.ts'
import { inspect } from 'node:util'
const emit = (name, value) => console.log(name + ': ' + inspect(value, { depth: 6, breakLength: Infinity }))
const probe = (name, run) => { try { emit(name, run()) } catch (e) { emit(name, { name: e.name, message: e.message }) } }
probe('strict-depth',()=>Schema.resolve({outer:1,nest:{x:'v',extra:2}},Schema.object({nest:Schema.object({x:Schema.string()})}),{},true)[0])
probe('transforms',()=>{let count=0;const args=[];const fn=function(v,o){count++;args.push({v,options:o});return Number(v)};const input={x:'3'};const out=Schema.object({x:Schema.transform(Schema.string(),fn)})(input);return{input,out,count,args}})
probe('preserved-transform',()=>{let count=0;const input={x:'3'};const out=Schema.object({x:Schema.transform(Schema.string(),v=>{count++;return Number(v)},true)})(input);return{input,out,count}})
probe('union-no-rollback',()=>{const input={x:'3'};const s=Schema.union([Schema.object({x:Schema.transform(Schema.string(),Number),stop:Schema.never().required()}),Schema.object({x:Schema.number().required()})]);return{out:s(input),input}})
probe('lazy-cache',()=>{let calls=0;const shared=Schema.string();const lazy=Schema.lazy(()=>{calls++;return shared});lazy('x');const declared=lazy.required();return{calls,missing:declared(),outerRequired:declared.meta.required,innerRequired:declared.inner.meta.required}})
probe('toJSON-graph',()=>{const shared=Schema.string();const root=Schema.object({a:shared,b:shared});const json=root.toJSON();const restored=new Schema(json);return{type:json.type,keys:Object.keys(json),nodeCount:Object.keys(json.refs).length,shared:restored.dict.a===restored.dict.b,out:restored({a:'x',b:'y'})}})
probe('toJSON-closure',()=>{const suffix='!';const s=Schema.transform(Schema.string(),value=>value+suffix);const restored=new Schema(s.toJSON());return restored('x')})
JS
```

实际完整实验退出码 `0`，以上探针对应输出如下；异常都由 probe 捕获，退出码不表示每个输入通过了校验。

```text
strict-depth: { nest: { x: 'v', extra: 2 } }
transforms: { input: { x: 3 }, out: { x: 3 }, count: 2, args: [ { v: '3', options: undefined }, { v: '3', options: undefined } ] }
preserved-transform: { input: { x: '3' }, out: { x: 3 }, count: 1 }
union-no-rollback: { out: { x: 3 }, input: { x: 3 } }
lazy-cache: { calls: 1, missing: undefined, outerRequired: true, innerRequired: undefined }
toJSON-graph: { type: undefined, keys: [ 'uid', 'refs' ], nodeCount: 2, shared: true, out: { a: 'x', b: 'y' } }
toJSON-closure: { name: 'ReferenceError', message: 'suffix is not defined' }
```

## 10. FAQ 写作时应保留的限制

可确认 Schemastery 是运行时值校验、归一化与描述元数据的库，Cordis 在插件可激活时消费其 Standard Schema 协议，DSH 进一步消费其配置图、UI 元数据和 volatile 引用；不能据此推导所有 service API、工具 JSON 或跨进程输入都必须使用 Schemastery。`toJSON` 不等于 JSON Schema，TypeScript interface 不会自动变成运行时校验，缺值默认不等于 required，解析失败不等于输入回滚，volatile 标记不单独保证配置更新免重挂。各项依据见前述源码与实验。

当前研究没有为任意 `Schema.extend` 自定义 resolver、任意 callback 或其他 Standard Schema 库承诺无副作用；也没有把投影器的保守 JSON Schema 当作原生执行的完全等价替身。自定义代码的失败和副作用只能按实际实现判断。

## 11. 消费链与文档交付的补充核验

主执行者另外运行了以下定向命令，退出码 `0`，3 个文件、118 个测试通过；覆盖 JSON Schema 投影、设置字段投影、真实 profile 修改及消费者/重启恢复。该运行与前述 144 项包含重叠，不应直接相加当作独立用例数。

```sh
pnpm exec vitest run packages/boot/app-boot/tests/schemastery-json-schema.spec.ts packages/settings/settings/tests/schema.spec.ts packages/settings/settings/tests/configuration.spec.ts
```

消费链研究者还运行了下列命令，退出码 `0`，7 个文件、168 个测试通过，补充脱敏、Client schema 校验和目录生成器证据；同样与其他运行有重叠。

```sh
pnpm exec vitest run packages/boot/app-boot/tests/schemastery-json-schema.spec.ts packages/settings/settings/tests/schema.spec.ts packages/settings/settings/tests/redact.spec.ts packages/settings/settings/tests/configuration.spec.ts packages/client/ui-settings/tests/schema.client.spec.ts scripts/volatile-config.spec.ts scripts/gen-config-catalog.spec.ts
```

正文中的简单 Config 例子另以 Node 内存断言核验了默认值、必填、错误字符串、未知字段保留、Standard Schema 解析、原生序列化重建与即时引用；未启动实际用户 profile。对最终稿的独立聚焦复核未发现 Schema、Loader 和配置投影部分的实质事实错误；这不扩大为对全部质量系统的审计结论。

文档交付还执行了本语料自检、`pnpm run test:docs`、`pnpm run doc-sync`、`pnpm run lint` 和 `git diff --check`，均退出 `0`。其中快速文档检查 21 项、完整文档检查 43 项通过；lint 为 0 错误、1 条既有未使用禁用注释警告。另逐条检查本专题的 GitHub 源码引用目标在本地存在、引用行号未越界；这类链接检查不替代正文事实核验。

## 12. 配置影响模型输入时的补充证据

本节补充配置消费链末端的验证范围；没有新增测试运行。配置影响工具声明、提示词或请求参数时，Agent 循环从 Session 派生逻辑请求，录制场景以 sidecar 保留组装后的提示词和工具 schema，便于核对配置的实际作用。见[请求头与请求构造](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/core/agent-loop/src/agent.ts#L626-L702)、[输入固定规则](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/session-snapshot/README.md#L85-L87)。

[回放](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/llm-replay/src/index.ts#L1044-L1119)固定历史模型输出，实际执行当前 Harness 与工具，检查录制轨迹上的回归；它不重新评价当前模型如何理解修改后的输入。配置变更若声称改善模型表现，需要真实模型与独立任务效果证据，不能只用回放通过作结论。

[测试政策](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/testing.md#L53-L55)要求非平凡的模型、协议或用户可见变化更新组装后的录制场景；[工作区预期规则](https://github.com/deepseek-ai/deepseek-harness/blob/master/snapshots/AGENTS.md#L15)另要求修改场景独立验收完整文件树。二者在适用时累加，不是替代关系。[record 与 refresh](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/test-support/session-snapshot/README.md#L81-L87)分别生成新模型轨迹与复用旧轨迹重算输出，刷新不自动证明新预期正确。

[配置事故复盘](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/postmortem/0002-js-expression-disabled-filesystem-tools.md#L7-L46)记录工具未挂载却被刷新接受为新预期的错误，以及随后增加的静态配置和未知工具结果检查。它为本篇“从真实事故补持续回归”的建议提供具体依据；历史事故中的表达式能力描述不替代当前 Loader 规则。

## 13. 历史研究与当前回归验证

围绕配置来源、volatile 提交、投影与恢复的历史查证见[历史研究记录](./history-research.md)，可迁移的设计和验收建议见[第五分篇](./05-practical-design-disciplines.md)。历史研究区分提交直接记载和推断；当前活动 Note 不是冻结历史，历史论断以精确提交查证为准。全历史遍历遇缺失 Git 对象，不能声称完整考古；本轮未补拉或改变历史。

本轮另执行以下定向回归，退出码 `0`，5 个文件、169 项测试通过。此运行验证当前解析、diff、Loader 更新、设置与投影，不是重新执行历史版本。测试输出包含预期非法配置夹具的激活失败诊断，以及 Vite 路径插件提示。

```sh
pnpm exec vitest run scripts/volatile-config.spec.ts scripts/loader-config-diff.spec.ts scripts/loader-volatile-update.spec.ts packages/settings/settings/tests/configuration.spec.ts packages/boot/app-boot/tests/schemastery-json-schema.spec.ts --maxWorkers 2
```

> 核验状态见 [核验基线登记](../00-baseline.md)。
