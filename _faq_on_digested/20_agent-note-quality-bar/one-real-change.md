# 附 · 跟着一次真实改动走一遍

**这是附录，也是最快建立整体印象的一页。** 分篇 01–07 讲的是**横切面**（要不要写、写什么、放哪、为什么、维护、移植、溯源）。这一页是**纵切**：跟着 DSH 自己的一次真实改动，从「我改了几行代码」走到「`doc-sync` 通过」，全程用真实的文件、真实的提交号。

## 这次改动是什么

2026-09-16 的提交里，DSH 在沙箱审批逻辑上做了一处小改动：当模型请求的沙箱模式**已经生效**时，`approveEscalation` 直接返回，不再报错。

改动本身是几行。[成品在这里](../../.agents/notes/implemented/feature/2026-09-16-sandbox-same-mode.md)，全文 171 个词。下面按时间顺序重放。

## 第 1 步：先问「要不要写」——走三个出口

| 出口 | 判据 | 这次 |
|---|---|---|
| ① 不用写 | 没有新决定 | ✗ 不符 |
| ② 更新已有 Note | 决定已存在，只是事实要跟上 | ✗ 不符（既有的是**另一条**决定） |
| ③ 写一篇 | 新的、未来有人会踩的取舍 | **✓ 命中** |

为什么不是 ①？因为这次改动**放宽了一条既有的安全保证**。原来的行为是「非加宽的重复请求一律拒绝」，现在变成「重复请求直接返回」。下一个维护者看到「重复请求危险模式却不拒绝」，很可能会把它当成权限校验的漏洞补上。

**这就是出口 ③ 的判据：我能指出一个未来维护者会犯的具体错误。** 判据原文与更多例子见 [01](./01-should-i-write-one.md)。

## 第 2 步：决定从哪个文件夹开始

两种开局，选一种：

- 工作还没做、决定需要先评审 → `proposed/{类型}/`
- 决定已经做出、随这次改动一起交付 → `implemented/{类型}/`

这次是后者，直接落在 `implemented/`。类型选 `feature`——它改变了一个面向模型的行为（重复请求不再被拒）。

六个类型怎么选，见 [03](./03-note-triplets-on-disk.md)。

> **新人提示：** 类型选错不是事故——换目录、三件套一起移动即可（[03](./03-note-triplets-on-disk.md)）。

## 第 3 步：把文件建起来

在 `implemented/feature/` 下新建三个文件（三件套的完整说明见 [03](./03-note-triplets-on-disk.md)）：

```text
2026-09-16-sandbox-same-mode.md          ← 英文正文
2026-09-16-sandbox-same-mode.zh.md       ← 中文对侧
2026-09-16-sandbox-same-mode.i18n.yaml   ← 一致性记录，由 --write 生成
```

日期用**主题首次提出**的日期，不是今天。

## 第 4 步：填四段

按 implemented 的骨架填。下面是这次填的内容（英文侧原文，节选）：

```markdown
# Agent Note: Repeated sandbox modes need no approval

Status: implemented

English | [中文](2026-09-16-sandbox-same-mode.zh.md)

## Problem
Models can repeat `sandbox_permissions: danger-full-access` while that mode is
already effective. Rejecting the call prevents authorized work without preventing
any permission increase.

## Decision
`approveEscalation` returns the effective mode immediately when the requested mode
matches it. Argument pairing remains mandatory at the tool. Wider modes still require
approval; narrower and unsupported targets still fail. This partially supersedes the
non-widening rejection in the sandbox decision (`2026-07-06-sandbox.md`); its
confinement and per-call approval decisions remain active.

## Alternatives considered
**Reject every non-widening request.** This makes a redundant argument fatal even
though it asks for no additional permission.

**Ask for approval again.** Existing permission is sufficient, so another prompt adds
no authorization.

## Consequences
Bash and filesystem tools accept repeated effective modes without an approval service
or agent. Shared unit tests cover both advertised targets, both tool consumers execute
the repeated mode, and the `fs-same-mode` ACP snapshot verifies an unrestricted write
with no approval events and checks the resulting file.
```

对照 [02](./02-what-goes-in-the-file.md) 的四条要求，注意它做对了什么：

| 要求 | 这篇怎么做 |
|---|---|
| `## Problem` 不看解决方案也能懂 | 只讲「重复请求已经生效的模式」这个处境，没提怎么改 |
| `## Decision` 用现在时，边界写在这里 | "returns the effective mode immediately"。更宽的模式仍要审批，也写在这一节 |
| `## Alternatives considered` 真实且带理由 | 两个真备选，各一句话说明为什么输。一个真实备选也合格，不要为了凑数编造 |
| `## Consequences` 写收益，并点名钉住它的证据 | 收益是工具接受重复的生效模式，不再要审批服务。钉住它的是共享单测、两个工具消费者和 `fs-same-mode` 快照 |

最后一句还点名了**什么钉住了这个决定**（单测、两个工具消费者、ACP 快照）——这是 `dsh-prose-standard` 要求保留的内容（[02](./02-what-goes-in-the-file.md)）。

## 第 5 步：写中文侧，重录哈希

机器标记只有两处保持英文：`# Agent Note: ` 前缀，以及整行 `Status:`。标题正文要翻译。第 2 行和第 4 行留空，接着是语言切换行。下面是这篇中文侧的头部，与仓库里的文件一致：

```text
# Agent Note: 重复沙箱模式无需审批

Status: implemented

[English](2026-09-16-sandbox-same-mode.md) | 中文

## 问题
```

其余三节标题是 `## 决策`、`## 考虑过的替代方案`、`## 影响`。每一节的正文翻译英文侧同节。把 `## Problem` 照抄进中文正文是漏译。

然后重录 sidecar：

```sh
pnpm run verify-translation-pairing --write .agents/notes/implemented/feature/2026-09-16-sandbox-same-mode.md
```

## 第 6 步：同一个 PR 里还要做两件事

1. **supersession 检查。** 每篇新 Note 都必须搜一遍活跃树，看有没有旧 Note 拥有同一个决定。这次找到的是部分取代——旧沙箱决定里的「不加宽就拒绝」被取代了，但它的 confinement 与 per-call approval 决定仍然有效。所以**两篇都留在活跃树，互相链接**（那篇 Decision 里的 "This partially supersedes…" 就是这一步的产物）。完全取代才合并并归档旧篇，见 [05](./05-keep-archive-delete.md)。
2. **跑门禁。**

```sh
pnpm run verify-agent-note-format   # 头部、骨架、Alternatives、禁用标题
pnpm run doc-sync                   # 含上面的格式门禁与类型目录门禁
```

## 第 7 步：三个月后它会怎样

- 如果代码后来改名、换默认值——**改事实**，Note 跟着改；
- 如果这条决定被推翻——**另写一篇**，两篇互链，不要偷偷改写历史；
- 如果它不再能指导未来工作——进 `archived/`，永久冻结；
- 如果它只在描述一次小的局部调整——**当初就不该写**。

## 一次走完的检查清单

- [ ] 走的是出口 ③（说得出「未来谁会踩什么」）
- [ ] 放对了生命周期与类型文件夹
- [ ] 三件套齐全，日期是主题首次提出日
- [ ] `## Problem` 独立成文，`## Decision`/`## Proposal` 时态正确
- [ ] `## Alternatives considered` 记下每一个真实备选和它为什么输；一个也算，不要为了凑数编造
- [ ] `## Consequences` 写了买到了什么，并点名钉住它的测试或检查
- [ ] 中文侧：`# Agent Note: ` 前缀和 `Status:` 行保持英文，标题正文已翻译，第 2 行和第 4 行是空行，语言行是 `[English](….md) | 中文`，章节标题已翻译，sidecar 已重录
- [ ] 同 PR 做了 supersession 检查
- [ ] `pnpm run doc-sync` 通过

---

*基线：工作树 `caf78ed639`，2026-10-08 实测；上游改动规则文件后需重新核对行号。*
