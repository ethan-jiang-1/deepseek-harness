# FAQ 08 · "Everything is a plugin" 落到源码：哪些插件领域已经饱和，哪里仍是缺口？（纯技术视角）

## 问题

DSH 宣称 everything is a plugin。口号之外，以当前源码为准：哪一类插件领域已经"做得差不多了"，再从零造边际价值很低？哪一类地基（Service Definition / Consumer）已打但缺真实 Provider 或关键 Consumer？判断本身需要一条可复核的标准，而不是印象分。

## 要回答的问题

要回答：

1. 以当前源码与生成目录为准，哪些插件领域已饱和、哪些仍是缺口、哪些不可插件化？
2. 用什么可复核的判据衡量 seam 成熟度（三角色完整性、Provider 数量、Consumer 覆盖、L0 可解性）？
3. 量化底座是什么（`docs/capability-seams.md` 的生成表、role 拆分、可替换率），读数如何随基线更新？
4. 哪些判断超出纯技术视角，留给业务价值与产品叙事？
