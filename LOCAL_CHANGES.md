# 本地特色修改记录

> 本文档记录此 fork 相对上游仓库的所有本地修改。**拉取远端代码合并时，请逐条核对本文件并保留这些修改**。
> 基线提交：`56c937f refactor: migrate all context menus to CustomContextMenu`
> 最近更新：2026-06-05（确认保留：表属性独立标签页 + 表结构 DDL 视图切换 + DataGrid 移除旧表属性抽屉）

## 一、新增"表属性"独立标签页（Table Info Tab）

把原本只能作为 DataGrid 侧边抽屉显示的表元数据（字段、索引、外键、触发器、DDL）独立为可单独打开的标签页。从侧边栏右键表/视图选「表属性」即可打开。

涉及文件：

| 文件 | 改动性质 |
| --- | --- |
| `apps/desktop/src/components/grid/TableInfoView.vue` | **新增** — 独立的表属性视图组件 |
| `apps/desktop/src/types/database.ts` | 给 `QueryTab.mode` 增加 `"tableInfo"`；新增 `tableInfoTarget`、`tableInfoActiveTab` 字段 |
| `apps/desktop/src/stores/queryStore.ts` | 新增 `openTableInfo()` action 并导出 |
| `apps/desktop/src/components/sidebar/TreeItem.vue` | 表/视图右键菜单新增「表属性」项；新增 `openTableInfoTab()` 函数 |
| `apps/desktop/src/components/layout/ContentArea.vue` | 异步导入 `TableInfoView`；为 `mode === 'tableInfo'` 渲染 |
| `apps/desktop/src/components/layout/AppTabBar.vue` | `tableInfo` 模式使用 `TableProperties` 图标，绿色配色组 |
| `apps/desktop/src/lib/tabPresentation.ts` | `tabDisplayTitle` 处理 `tableInfo` 模式标题 |

i18n 新增键（三种语言均加）：
- `grid.tableInfoDefault`：默认值列标题
- `grid.tableInfoTabTitle`：标签页标题模板 `{tableName} 属性`

## 二、表结构编辑器 — DDL 视图切换

`TableStructureEditor.vue` 在「字段」Tab 增加「DDL 视图 / 编辑视图」切换按钮，DDL 视图以紧凑方式展示字段信息。

涉及文件：
- `apps/desktop/src/components/structure/TableStructureEditor.vue`：新增 `columnViewMode` 状态、DDL 视图表格、视图切换按钮
- 新增 i18n 键：`structureEditor.ddlView` / `editView` / `notNull` / `noDefault`

## 三、DataGrid 表属性抽屉已删除（迁移至独立标签页）

历史上 `DataGrid.vue` 内嵌了一个右侧表属性抽屉（字段/索引/外键/触发器/DDL）。现已全部移除，统一改用一、节中的 `TableInfoView` 标签页。

`apps/desktop/src/components/grid/DataGrid.vue` 的清理：

- 删除模块级 `globalDdlOpen` ref 与配套 `<script lang="ts">` 块
- 删除全部状态：`showTableInfo`、`activeTableInfoTab`、`ddlContent`、`ddlLoading`、`ddlWidth`、`ddlWrap`、`isResizingDdl`、`indexes/foreignKeys/triggers` 系列、`searchQuery`、`tableInfoTabs` 等
- 删除函数：`toggleTableInfo`、`selectTableInfoTab`、`fetchDdl`、`fetchIndexes`、`fetchForeignKeys`、`fetchTriggers`、`copyDdl`、`toggleDdlWrap`、`onDdlResize*`、`scrollToTableInfoColumn`、`matchesTableInfoColumn`
- 删除 `filteredColumns/Indexes/ForeignKeys/Triggers/DdlContent` computed
- 删除 `defineExpose` 中的 `showDdl` / `toggleDdl` / `showTableInfo` / `toggleTableInfo`
- 删除模板内 `<!-- Table Info Drawer -->` 整个块（约 200 行）
- 删除 CSS：`.ddl-drawer-resizing`、`.ddl-code :deep(.ddl-kw|.ddl-ident|.ddl-str)`
- 移除随之变为未使用的导入：`WrapText`、`KeyRound`、`Link2`、`ListTree`、`TableProperties`、`type Component`、`ForeignKeyInfo`、`IndexInfo`、`TriggerInfo`、`useSqlHighlighter`

`apps/desktop/src/components/layout/ContentArea.vue`：

- `DataGridHandle` 类型移除 `showDdl` / `toggleDdl` 字段
- 工具栏「表属性」按钮改为调用本地 `openTableInfoTab()`，调用 `queryStore.openTableInfo(...)` 直接打开新标签页（不再开侧边抽屉）

## 四、TreeItem 上下文菜单调整

`apps/desktop/src/components/sidebar/TreeItem.vue`：

- 移除未使用的 `shouldPreventRenameCloseAutoFocus` 导入和 `onContextMenuCloseAutoFocus` 函数
- 「复制名称」菜单项的显示条件由 `node.type !== "connection" && hasTypeMenu.value` 简化为 `hasTypeMenu.value`（即连接节点也允许复制名称）

## 五、修复 QueryHistory 的 ref 误用

`apps/desktop/src/components/editor/QueryHistory.vue`：

- `selectedEntry = entry` → `selectedEntry.value = entry`（`selectedEntry` 是 `ref`，需用 `.value` 赋值）

## 六、TableInfoView DDL 配色调暗（更高级、更柔和）

`apps/desktop/src/components/grid/TableInfoView.vue` 末尾 `<style scoped>`：

- 关键字（`.ddl-kw`）：`oklch(0.6 0.15 250)` → 浅色 `oklch(0.42 0.05 245)` / 深色 `oklch(0.74 0.06 235)`
- 标识符（`.ddl-ident`）：`oklch(0.65 0.15 150)` → 浅色 `oklch(0.46 0.04 165)` / 深色 `oklch(0.78 0.05 155)`
- 字符串（`.ddl-str`）：`oklch(0.65 0.15 50)` → 浅色 `oklch(0.5 0.07 40)` / 深色 `oklch(0.78 0.07 55)`
- 通过 `:global(.dark)` 选择器为深色主题单独提色，避免暗背景下读不清

## 合并远端代码的操作建议

本地已额外保存可恢复补丁：

- 补丁目录：`../dbx-local-backups/`
- 最新补丁：`../dbx-local-backups/dbx-local-features-20260605.patch`

每次拉取并合并上游前，先重新生成一次补丁，防止当前工作区改动被误覆盖：

```bash
mkdir -p ../dbx-local-backups
git diff --binary > ../dbx-local-backups/dbx-local-features-$(date +%Y%m%d).patch
git diff --no-index -- /dev/null apps/desktop/src/components/grid/TableInfoView.vue >> ../dbx-local-backups/dbx-local-features-$(date +%Y%m%d).patch || true
```

如果合并后发现这两块页面改动丢失，可从补丁恢复：

```bash
git apply --3way ../dbx-local-backups/dbx-local-features-20260605.patch
```

```bash
# 1. 备份当前本地修改
git stash push -u -m "local-features-backup-$(date +%Y%m%d)"

# 2. 拉取远端
git fetch origin
git merge origin/main   # 或 git rebase origin/main

# 3. 恢复本地修改
git stash pop
```

**冲突处理重点**：

- `apps/desktop/src/types/database.ts` 中 `QueryTab.mode` 联合类型 — 必须保留 `"tableInfo"`，以及 `tableInfoTarget` / `tableInfoActiveTab` 字段
- `apps/desktop/src/stores/queryStore.ts` 中 `openTableInfo` 函数及导出
- `apps/desktop/src/components/sidebar/TreeItem.vue` 表/视图菜单中的「表属性」项
- `apps/desktop/src/components/layout/ContentArea.vue` 中：
  - `tableInfo` 模式的渲染分支
  - `DataGridHandle` 类型不含 `showDdl` / `toggleDdl`
  - 工具栏「表属性」按钮调用 `openTableInfoTab()` 而非 `dataGridRef?.toggleDdl()`
- `apps/desktop/src/components/layout/AppTabBar.vue` 中 `tabIconClass` 和图标渲染
- `apps/desktop/src/lib/tabPresentation.ts` 中 `tableInfo` 标题分支
- `apps/desktop/src/components/structure/TableStructureEditor.vue` 的 DDL 视图切换块（位于"字段"TabsList 旁的按钮组与 `TabsContent value="columns"` 内的 DDL `<table>`）
- `apps/desktop/src/components/grid/DataGrid.vue` —— **不要把上游的表属性抽屉合回来**：globalDdlOpen、showTableInfo、ddlContent 等状态、`onDdlResize*` 函数、`<!-- Table Info Drawer -->` 模板、`.ddl-code/.ddl-kw/.ddl-ident/.ddl-str` 样式都已删除
- `apps/desktop/src/components/grid/TableInfoView.vue` —— DDL 配色（`<style scoped>` 中的浅色 + `:global(.dark)` 深色覆盖）
- 所有 i18n 文件 (`zh-CN.ts` / `en.ts` / `es.ts`) 的新增键

合并完成后必跑：

```bash
pnpm exec vue-tsc --noEmit --project apps/desktop/tsconfig.json
pnpm lint
pnpm tauri build   # 验证可正常打包
```
