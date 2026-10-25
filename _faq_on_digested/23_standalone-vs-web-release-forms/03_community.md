# 03 · 社区反应：数字与原话

读数日期 2026-10-25；评论抽样自 HN 桌面发布贴（228 条里取 40 余条），主题归类是归纳而非统计。

## 数字

| 指标 | 读数 | 来源 |
|---|---|---|
| GitHub star / fork | 260,724 / 31,499（仓库创建 2026-08-13，MIT） | GitHub API |
| 插件生态规模 | GitHub `topic:dsh-plugin` **22,638** 个仓库 | GitHub search API |
| npm `@deepseek-ai/dsh` | 周下载 **333,455** | npm downloads API |
| HN 开发者预览贴 | 747 分、314 评论（2026-08-13） | [item 49285244](https://news.ycombinator.com/item?id=49285244) |
| HN 桌面上线贴 | 417 分、228 评论（2026-10-02） | [item 49929489](https://news.ycombinator.com/item?id=49929489) |
| RC 反应数 | rc.1 103 / rc.2 217 / rc.3 76 | GitHub releases API |

（star 数对 8 月才创建的仓库高得反常，量级只能当「热度」看，不能当「留存」看。另：这些数字当天就在漂——star 在两小时内从 260,621 涨到 260,724，topic 仓库数从 22,603 涨到 22,638；引用时以「2026-10-25 读数」为准，不要当成稳定值。）

## 原话（按主题）

- **认可「装成 App 就顺手了」**：一位用户说装完 "The same great harness as before but now is an app you just click on your dock to run"，并当场决定为 cmd +/- 调字号写一个插件——「插件即扩展」的自证。
- **默认遥测是第一抱怨点**：评论给出可用关闭办法——首次启动前在 `$DSH_HOME/cordis.patch.yml` 写 `- id: desktop-product-telemetry / disabled: true`（同帖还提到 `product-analytics`；两行 id 可在 `packages/bundle/web-app/cordis.patch.yml` 核到）。与 [`apps/desktop/README.md:33`](../../apps/desktop/README.md) 的「Desktop analytics… Web usage is excluded」对得上。
- **Electron 原罪论**：多条评论说 "all the AI harnesses are Electron crap"，认为这么简单的 UI 应该让 AI 写原生前端。
- **插件信任**：有评论不愿装第三方插件（担心恶意代码、失修、质量参差），更想要开箱即用的精选集；同一段又承认「让 AI 给自己写插件」很香。两种心态并存，对应官方两套入口（On-demand Official vs Add plugin）。
- **数据与地缘**：少数评论把「二进制来自中国 / 数据去向」当作反对理由；也有评论指出第三方站点 `deepseekharness.io` 靠 SEO 抢在官方前面，属「官方没给简单安装包」留下的空档。
- **架构层的兴奋点**：被反复顶起的一条技术评论谈的不是 UI，而是 Cordis 的组合能力——"the potential to make this into something like the emacs of harnesses"。

## 插件市场：官方不带源，社区在填

`docs/user/guide/plugin-market.md` 写得很直接：「DSH ships no index source」。Discover 是实验 bundle，用户自己加 JSON 索引；社区因此长出了多个插件目录/市场站（`dshhub.dev`、`dshbase.com`、`deepseekharnessplugins.com` 等）——有的是可被 Discover 读取的 JSON 索引，有的只是目录站，形态并不统一。这解释了两件事：

1. 插件生态的「发现」环节目前不在官方发布物里，属于可替换的生态件。
2. 安装动作本身仍然收敛在 Host 的 Plugins 页 / `dsh plugin` 命令（见 [04 篇](./04_plugin-paths.md)）。

## 结论

**桌面形态的社区评价是「能用、快」，但 Electron + 默认遥测 + 插件信任三件事挨骂；插件发现与分发由社区补位。** 这与本文档 01/02 篇的结论一致：发布物本身成熟，周边生态靠社区。
