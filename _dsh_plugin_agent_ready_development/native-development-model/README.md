# DSH 原生开发模型 · 独立插件仓的图解主卷

## 本卷定位

这卷面向刚创建独立 DSH 插件仓的 owner 和 coding agent，讲清关键概念、完整开发闭环、测试资产与交付判断。读者不需要先通读另外两卷，就能回答“从哪里开始、如何找到 owner、怎样证明插件工作、哪些事情仍需决定”。

这里综合 DSH 一手机制，不新增官方方法名，也不把 DSH 主仓库的贡献制度强加给外部插件仓。所有机制依据来自固定版本的 DSH 源码、文档、规则、测试和 Skills；其他研究材料不参与本卷的证据链。

## 先看哪一页

| 你的问题 | 页面与重点 |
|---|---|
| 想先看懂整体流程、重要概念和注意事项 | [开发模型总览](./00-index.md)：闭环图、owner 图、证据路由与六类误区 |
| 不熟悉 DSH 术语，想知道 HMR、owner、bundle、oracle 是什么 | [术语与心智模型](./02-terms-and-mental-models.md)：运行时、组合分发、变更组织与验证词汇 |
| 刚建了插件仓，想知道先建立什么 | [新仓起步](./01-new-plugin-repository.md)：加载、生命周期、真实组合、安装验证与评审 |
| 需要核对 DSH 某条规则的准确条件或例外 | [SDLC Reference](../sdlc-reference/README.md)：按问题查阅，不是本卷的必读前置 |
| 想找到仓库知识、Skill、扩展点和查询工具 | [Development Harness](../repo-harness/README.md)：按当前任务进入，不是本卷的必读前置 |

本卷的流程图解释关系，不规定所有工作串行，也不强制 test-first。Issue、Agent Note 和 Plan 按所承载的事实选用；实现、用户文档和行为证据应作为同一笔变更核对。若这些词对你还不熟，先读 [术语与心智模型](./02-terms-and-mental-models.md)，再回到总览页。

## 图文分工

正文拥有概念、流程与注意事项，图只辅助表达。七张 SVG 分别说明开发闭环、owner 归属、证据路由、新仓起步、插件生命周期、plugin/bundle/profile 分层和交付判断角色；所有图由本卷自己的 [图示清单](./figures/README.md) 管理，不依赖相邻卷的图。

需要具体代码和命令时，继续 DSH [首次插件指南](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/docs/user/develop/basic/index.md) 与 [Cordis 教程](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/docs/cordis-tutorial/index.md)。本卷不另造未经执行的脚手架命令，也不承载跨 feature 排期。
