# 03 · "别用 V4 Pro，多用 vision"：模型路由的机制事实

## 第一节 默认 catalog 里三个模型各自是什么

`llm-deepseek` 省略 `models` 配置时公布的默认 catalog（`packages/llm/llm-deepseek/README.md:53`）：

| 模型 | 输入模态 | 定位 |
|---|---|---|
| `deepseek-v4-flash` | text | 默认主力；体感里"快"的来源 |
| `deepseek-v4-pro` | text | 同 catalog 的重档位；harness 未做任何限制 |
| `deepseek-v4-flash-vision-exp` | `[text, image]` | **唯一**默认支持图片输入的条目 |

三个关键机制事实：

1. **vision 是模型条目的属性，不是开关**。catalog 条目以 `inputModalities: [text, image]` 声明图片能力（`README.md:55`）；路由是否收图由"确切模型能力"决定，而非会话配置。catalog 是 advisory：未列出的模型 id 原样透传、按纯文本路由——所以"用 vision"必须真的把路由切到 vision 条目，不是开个设置。
2. **`read_image` 工具的存在本身依赖两道门**：`ctx.attachments` 持久附件服务挂载（没挂则工具根本不注册，`packages/fs/tool-fs/src/index.ts:67` 条件注入）；执行时 `assertImageCapableRoute` 解析会话最新 `request/header` 的路由并要求 `inputModalities` 显式含 `'image'`，否则拒——"model … does not declare image input"（`tool-fs/src/read-image.ts:87-99`）。
3. **切换路由有缓存代价**：`request/header` 记录 provider/model/effort 为会话级状态；模型路由一变，装配前缀的 DeepSeek cache 从第一个变更 token 起失效（`README.md:120`）。"干活用 Flash、关键验证切 vision"在长会话里每次都是一次前缀清零，值得按节而不是按请求切换。

## 第二节 为什么 vision 是"验证手段"而不只是"看得见图"

DSH 对 UI/前端类工作的验证有一个结构性事实：**模型没有"指向 URL 看一眼"的能力**。`ctx.web` 只有 `web_search` + `web_fetch` 两个文本操作，fetch 返回 `html | text`，无页面渲染、无截图、无浏览器引擎（`packages/web/README.md`）；产品里也没有内置自动化浏览器——模型"看世界"的视觉入口**只有文件路径这一条**（`read_image` / 附件上传）。官方自己的实践印证了这条回路的地位：`record-browser-gif` skill 的纪律是每个 GUI PR 必须附"来自该 PR 真实服务器与真实模型轮次"的 GIF——截图落盘 → `read_image` 读回，是 DSH 里像素证据进入审计链的唯一通道。

这解释了"多用 vision"为什么在机制上成立：**视觉证据和文本证据走同一条日志制度**（`read_image` 的结果经 `ctx.attachments.saveImage` 内容寻址持久化，"在 `tool/result` 事件追加时图像块引用的对象必须已持久提交"，`tool-fs/src/read-image.ts:216-217`），它是 harness 内最便宜的"以最终渲染结果为准"的验证回路。工具层的降采样还专门为"看图指坐标"设计了补偿：输出信封给出 `originalDimensions` 与逐轴倍率提示（如 "multiply x coordinates by 2.50 and y coordinates by 2.00"，`read-image.ts:129-146`）。

但要把"多用 vision"落对姿势，注意两点：

- **截图要先落盘**：`read_image` 只吃 PNG/JPEG/WebP/GIF 文件路径（按扩展名路由，magic-byte 校验在附件服务）；没有"打开这个网页看一眼"的工具。浏览器侧素材要靠宿主浏览器控制或 Playwright 这类外部手段先产出文件。
- **用户侧有对称缺口**：模型收到的工具结果图像，GUI 的工具卡不渲染（见 [02 第二节](./02-self-built-previews.md#第二节-一个用户清单之外的发现模型看得见的图用户看不见)）；用户上传的图反而有完整待遇（粘贴/拖放 → `imageLimits` 投影预检 → 画廊/lightbox，`packages/client/ui-conversation/README.md:39`）。

## 第三节 read_image 的预算全链：一张图要过几道压缩

"多用 vision"的成本控制不是一句 maxTokens，是一条五级预算链，每级独立配置：

| 级 | 位置 | 默认预算 | 超限行为 |
|---|---|---|---|
| 准入 | `attachment-local` 每源 | ≤20MiB、≤64,000,000 px、单边 ≤8192px；每消息 ≤20 张 / 200MiB | 拒绝进入 |
| 规范化 | 附件存储 | 长边 2048px、4MiB 安全帽；EXIF 方向应用、转 8-bit sRGB | 按 `sqrt(预算/实际)×0.95` 迭代收缩 |
| 路由请求版本 | catalog 条目 | 总像素 640,000、编码 1MiB；`imageDetail: low` 时 512×512 | 确定性缩放（2048×1024 → 约 1130×565，不强制方形） |
| 请求总量 | 适配器 | 文件引用 128MiB / 600 张；内联回退 20MiB | **最老图优先 offload**，替换为固定占位文本 |
| 单文件 | Files API | 32MiB 硬限、默认 7 天过期 | 失效即重传一次，二次失败不再试 |

（依据：`packages/attachment/attachment-local/README.md:7`、`packages/llm/llm-deepseek/README.md:55-63`。）

第五级的 offload 占位文本值得读一遍：`[image omitted to keep the request within its image limit; older images are omitted first. …]`（`README.md:57`）——**旧图先出局**，且高水位投影让前缀不因每张新图改写。这就是长会话反复看截图的机制告诫：`read_image` 是"看一眼"，不是"存档"；同一张图要反复引用时，靠的是重新读文件，而不是指望历史里的图永远在场。

## 第四节 V4 Pro 的真实位置："别用"是经济学，不是机制

harness 层面没有任何东西阻止 `deepseek-v4-pro`：它在默认 catalog 里、`agent/request` waterfall 允许逐步换路由、模型选择本来就是 per-session/per-step 决策。所以第 3 条体感的正确读法是**路由经济学**：

- Flash 与 Pro 同为 1M 窗口；重构类任务的瓶颈通常在上下文组织与并行度（[01](./01-fast-is-good.md) 第一、四节），Flash + `max` effort 已覆盖思考深度，Pro 的增量买不到结构性的东西；
- 反过来，**真该花钱的地方是 vision**：UI 工作的验收标准在像素里，文本回路再强也推不出渲染结果；
- 唯一像"机制成本"的是缓存：切换路由清前缀缓存（第一节第 3 条），所以"别用 Pro"的机制版表述是——**别在会话中途往返切路由**，而不是"别用 Pro"。

最后校一点体感里的措辞：vision 条目叫 `deepseek-v4-flash-vision-exp`，是 Flash 家族的实验性视觉变体——"多用 vision"与"V4 Flash 足够优秀"在同一条路由族上自洽；若上游未来把视觉并进正式档位，本篇的条目名随之过期（见 [answer.md 诚实边界](./answer.md) 第 4 条）。
