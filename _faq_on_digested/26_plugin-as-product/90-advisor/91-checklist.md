# 91 · 数据卡与集成检查

> 产品决策顺序见 [90](./00-index.md)，Web profile 的 composition 示例见 [93](./93-app-plugin-walkthrough.md)。

## 一份数据用一张卡

每张卡描述一份事实。Owner、authority、source、readers 和 writers 是不同角色。

| 字段 | 要回答的问题 |
|---|---|
| Fact | 这是什么事实？用户需要什么操作、导出或恢复能力？ |
| Owner | 谁负责记录的生命周期、迁移与删除？ |
| Authority | 哪份数据决定当前真值？派生数据可填“无；derived”。 |
| Source (input/operation) | 哪份数据、输入或用户操作产生此记录？ |
| Mechanism/path | 通过哪个 API、文件或服务保存？实际位置是什么？ |
| Scope/key | 跟哪个 Session、产品 project、DSH Workspace、profile、home 或 device 走？如何定位？ |
| Readers | 哪些角色或工具可以读取？ |
| Writers | 哪些角色或工具可以修改？ |
| Rebuildability | 丢失后能否从 authority 或 source 重建？成本是什么？ |
| Retention/deletion | 谁备份、迁移、删除或恢复？卸载后保留什么？ |

README 示例：

```text
Fact: Project search index
Owner: Product plugin
Authority: None; derived view
Source (input/operation): Project files
Mechanism/path: Storage domain, table `projects`
Scope/key: Product project ID
Readers: Product search tool
Writers: Product indexer
Rebuildability: Re-index from project files
Retention/deletion: Product cleanup command
```

Owner 负责记录的生命周期；authority 决定真值；source 说明记录如何产生。Reader 和 writer 分开列出。Plugin 可以写派生索引，而 project files 仍是被索引内容的 authority。

## Check the data path

- Do model-visible inputs come from reconstructable Session history or another documented source? Do not rely only on Host memory.
- Are secrets represented correctly? `CredentialRef.resolve` reads a named environment variable; `CredentialKey` accesses credential records. These are different APIs.
- Does a storage-domain record key satisfy the selected backend? JSON `per-record` keys must match `[a-zA-Z0-9_-]+`; use a prefixed hash for paths.
- Is `WorkspaceId` only used for a DSH registration? Removing and re-creating a registration gives a new ID; it is not a stable product project ID.
- Does a persisted Session event have compatible readers? A TypeScript declaration alone does not establish released reader compatibility; see [11](../10-foundations/11-five-homes.md).

## Check the implementation

1. **Concurrency:** identify competing writers and their coordination. JSON storage domains serialize calls in one process, not writes across processes.
2. **Failure and recovery:** test missing files, permissions, corrupt records, migration failure, cancellation, and restart recovery.
3. **Project moves and deletion:** state how paths, IDs, orphaned records, Workspace registrations, and project files behave.
4. **Retention:** assign owners for Session history, attachments, caches, and product-owned files. DSH has no general Session delete API; the local attachment backend has no automatic GC.
5. **Client state:** distinguish origin/device-local UI preferences from Session-derived state and product settings.
6. **Dependencies:** use the APIs and packages available to the target profile. Ordinary runtime dependencies do not add Cordis rows; a package that contributes rows must enter the profile as a bundle. Review external dependencies individually.

## Check the product profile

1. **Composition:** record the shipped template or complete custom bundle list, package dependencies, and bundle order.
2. **Tools:** list model-visible product and general-purpose tools; verify each provider and policy separately.
3. **Project selection:** distinguish DSH Web's default Workspace/picker from product-owned project selection and recovery.
4. **Workspace:** use `workspaceId` when the Session must join a Host registration; use absolute `cwd` when only a starting directory is needed.
5. **Isolation:** inventory shared `$DSH_HOME` stores, path overrides, browser origins, and external services. A profile name does not isolate data.
6. **Upgrade and removal:** document profile restart, data migration, surviving user files, and cleanup of product-owned records.

## Install and update

`dsh plugin --profile <name> add <bundle>` changes the profile's bundle list and returns the package-manager result, not Plugin Manager's `ChangeResult.application`. Restart the profile to load the changed composition. Plugin Manager reports its own application result.

To create a new Web profile, follow [93](./93-app-plugin-walkthrough.md). `--from-default-profile web` replaces a same-named custom profile, including installed dependencies and its user patch. Use a fresh profile name or back up the existing profile first. A successful replacement is committed before application boot; a later boot failure does not restore the prior profile.

Bundle removal does not delete project files, Session history, or product-owned data. `workspace.delete` removes only the Workspace registration. Remove product data only when its ownership is known and the user has authorized deletion.

## Common errors

| Error | Correction |
|---|---|
| Treat `WorkspaceId` as the product project ID | Define a product ID or accept that re-created registrations have new IDs |
| Treat Workspace registration as permission | Check the tool, provider, and policy that access the path |
| Treat Session `header.cwd` as the effective directory | Track working-directory changes separately; they do not change sandbox roots |
| Assume profiles isolate the same `$DSH_HOME` | Use an independent home or configure each relevant provider path |
| Assume bundle removal deletes business data | Provide product-owned migration and cleanup instructions |
