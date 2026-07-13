# DBX 本地差异索引

> 本文件只记录当前 fork 相对上游 `t8y2/dbx` 的净差异，作为以后合并上游时的保留清单。
>
> 详细的 Aeroric 内核迭代说明、API 变化和编译修复矩阵见
> [`AERORIC_DBX_CORE_UPGRADE_20260714.md`](./AERORIC_DBX_CORE_UPGRADE_20260714.md)。

## 当前同步基准

- 上游仓库：`https://github.com/t8y2/dbx.git`
- 合并前本地提交：`2a888c6879fe22cbd37a12e4395f55d5113ac262`
- 本次上游提交：`ae0e3a2a57b6c1f6c76a5e35dc288d05c550b0b0`
- 上游版本跨度：`v0.5.39` 到 `v0.5.56`
- 共同基线：`44884efa9bfda70f113a92bea8797647c22ebd51`
- 合并前备份分支：`backup/pre-upstream-merge-20260713`
- 文档核对日期：2026-07-14

## 必须保留的产品功能

### 1. 独立“表属性”标签页

本地把 DataGrid 右侧表属性抽屉迁移成独立标签页，展示字段、索引、外键、触发器和 DDL。

涉及文件：

- `apps/desktop/src/components/grid/TableInfoView.vue`
- `apps/desktop/src/types/database.ts`
- `apps/desktop/src/stores/queryStore.ts`
- `apps/desktop/src/components/sidebar/TreeItem.vue`
- `apps/desktop/src/components/layout/ContentArea.vue`
- `apps/desktop/src/components/layout/AppTabBar.vue`
- `apps/desktop/src/lib/app/openTabsPersistence.ts`
- `apps/desktop/src/lib/tabs/tabPresentation.ts`
- `apps/desktop/src/composables/useNavigationTargets.ts`
- `apps/desktop/src/i18n/locales/en.ts`
- `apps/desktop/src/i18n/locales/es.ts`
- `apps/desktop/src/i18n/locales/zh-CN.ts`

关键契约：

- `QueryTab.mode` 必须包含 `"tableInfo"`。
- `QueryTab` 必须保留 `tableInfoTarget` 和 `tableInfoActiveTab`。
- `queryStore.openTableInfo()` 必须按连接、数据库、catalog、schema、表名复用标签页。
- “查看 DDL”导航应打开独立表属性标签页的 DDL 子页，不应重新启用 DataGrid 抽屉。
- 标签页持久化、复制、标题、工具提示和失效表关闭逻辑必须继续支持 `tableInfo`。

### 2. DataGrid 不再内嵌表属性抽屉

`apps/desktop/src/components/grid/DataGrid.vue` 中旧抽屉相关状态、加载函数、模板、拖拽宽度、Mongo 索引删除弹窗及样式均已移除。

以后解决冲突时不要恢复以下旧接口：

- `showTableInfo`
- `activeTableInfoTab`
- `toggleTableInfo()` / `selectTableInfoTab()`
- `fetchDdl()` / `fetchIndexes()` / `fetchForeignKeys()` / `fetchTriggers()`
- `showDdl` / `toggleDdl`
- `tableInfoTab` prop
- `<!-- Table Info Drawer -->`

右侧单元格详情面板继续使用两列布局，不能因恢复旧抽屉而改回三列。

### 3. 表结构编辑器 DDL 视图

`apps/desktop/src/components/structure/TableStructureEditor.vue` 在字段页保留“DDL 视图 / 编辑视图”切换。

相关 i18n：

- `structureEditor.ddlView`
- `structureEditor.editView`
- `structureEditor.notNull`
- `structureEditor.noDefault`

## 本地运维和仓库差异

- 删除 `.github/workflows/docs.yml`
- 删除 `.github/workflows/sync-mirrors.yml`
- 新增 `CLAUDE.md`
- 新增 `build-and-push.sh`
- `LICENSE` 从上游 Apache-2.0 改为本地 MIT，Copyright Aho1ic
- `README-NIX.md`、`README.md`、`README.zh-CN.md` 各清理 1 处上游行尾空格，无内容变化

`build-and-push.sh` 会构建、替换 `/Applications/DBX.app`，并执行 `git push aho1ic main`。它不是通用 CI 脚本，运行前必须确认远端和发布意图。

## 已纠正的旧记录

旧版文档曾记录 `QueryHistory.vue` 的 `ref` 赋值修复，但当前 fork 相对上游的净差异中没有该文件，因此不再把它列为必须恢复的本地修改。

旧版文档中的路径 `apps/desktop/src/lib/tabPresentation.ts` 已随上游目录调整为：

```text
apps/desktop/src/lib/tabs/tabPresentation.ts
```

## 合并上游检查清单

```bash
git fetch origin --prune
git branch backup/pre-upstream-merge-$(date +%Y%m%d)
git merge origin/main
```

冲突处理原则：

1. 先保留上游最新架构、API 路径和组件结构。
2. 再按本文件恢复独立表属性标签页和表结构 DDL 视图。
3. 不恢复 DataGrid 旧表属性抽屉。
4. 保持两个本地 workflow 删除状态，除非发布流程明确改变。
5. 单独审查 `LICENSE`，不要把许可证差异当普通文本冲突处理。

合并后至少运行：

```bash
pnpm test
pnpm exec vue-tsc --noEmit --project apps/desktop/tsconfig.json
pnpm lint
pnpm build
cargo check -p dbx-core --locked
git diff --check
```

## 许可证提示

当前本地 `LICENSE` 是 MIT，而上游目标提交的 `LICENSE` 是 Apache-2.0。合并源代码不会自动解决许可证归属和再许可问题。发布、分发或把本 fork 作为 Aeroric 内核交付前，应由项目负责人进行许可证审查并保留上游版权与 NOTICE 要求。本提示不是法律意见。
