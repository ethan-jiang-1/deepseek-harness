# 40 · 证据入口：当前证据、实验与复核

`40-evidence/` 只放证据，不放结论。结论在 `10`–`40`；这里回答“这句话凭什么”。

## 当前证据 / 本轮审计（优先）

| 文件 | 用途 |
|---|---|
| [reference.md](./reference.md) | API 速查、`$DSH_HOME` 目录、证据薄弱处、外部来源 |
| [research-native.md](./research-native.md) | DSH 原生 33 个数据落点、44 事件清单、关键决定 |
| [research-external.md](./research-external.md) | 外部插件约 97 个候选、15 个深读的样本与来源 |
| [quality-review.md](./quality-review.md) | 本轮结构/一致性审计；计数结论截至 2026-10-27，不替代 API 证据 |
| [experiments/](./experiments/00-index.md) | 启动竞态实验（01 未执行）、源码核验（02/03）与 CLI profile composition probe（05） |

**profile/template 安装的 T 级观测**：隔离 home 下从 Web template 初始化 custom profile，再安装本地 bundle fixture；实测顺序为 base、web-app、产品 bundle。命令与 manifest 结果见 [实验 05](./experiments/05-profile-bundle-install.md)。其他 runtime/provider data roots 需按各 package Config 合同分别验证。

## 历史底稿

早期两轮研究的工作底稿（v1 外部核验、v2 调查计划与 review）已从语料移除——它们的结论已吸收进正文，保留只会让人误以为有"版本"。需要追溯时看 git 历史；各轮审计结论见 [quality-review](./quality-review.md)。

## 阅读顺序

1. 先看 [reference](./reference.md) 的“证据薄弱处”，知道哪些是 C/H，哪些是 S/R/U。
2. 原生结论查 [research-native](./research-native.md)；外部结论查 [research-external](./research-external.md)。
3. 想知道“这轮改了什么、还漏什么”，看 [quality-review](./quality-review.md)；它是审计快照，不替代 reference。
4. 需要追溯早期方法时看 git 历史；本目录不再保留 v1/v2 底稿。

## 标签

**T** 可复现实验/探针（命令+输出） · **C** 当前合同（docs/源码，精确到符号） · **H** 历史事实 · **P** 提案 · **S** 第三方源码阅读 · **R** 第三方 README/作者声明 · **U** 未确认。

只有 T/C 能写成“DSH 现在如何”；H 只能写“当时如何”；P 不能当已实现；S/R/U 不能冒充合同；外部源码与 README 不得支撑 C 级结论。

外部插件默认没有安装实测：S 只代表源码阅读，R 只代表作者声明；行为类结论要么在隔离环境抽样实测并记为 T，要么保持 S 并在句中注明。
