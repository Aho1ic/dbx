# Aeroric 使用 DBX Core 的升级说明

## 1. 文档目的

本文用于把 Aeroric 的数据库内核从 DBX `v0.5.39` 附近升级到本次合并后的 `v0.5.56` 上游状态，并记录 DBX fork 必须继续保留的本地修改。

本文基于以下两个项目的实际代码和一次隔离编译检查：

- DBX：`/Users/macbook/Downloads/同步空间/LYX/dbx`
- Aeroric：`/Users/macbook/Downloads/同步空间/LYX/Aeroric`

检查日期：2026-07-14。

## 2. 本次 DBX 合并边界

| 项目 | 值 |
| --- | --- |
| 上游仓库 | `https://github.com/t8y2/dbx.git` |
| 共同基线 | `44884efa9bfda70f113a92bea8797647c22ebd51` |
| 基线日期 | 2026-06-27 20:03:16 +0800 |
| 基线最近标签 | `v0.5.39` |
| 合并前本地 HEAD | `2a888c6879fe22cbd37a12e4395f55d5113ac262` |
| 本次目标提交 | `ae0e3a2a57b6c1f6c76a5e35dc288d05c550b0b0` |
| 目标日期 | 2026-07-13 17:51:34 +0000 |
| 目标最近标签 | `v0.5.56` |
| 第一次合并提交 | `dbf0faadde579b818a701e8b63aebd37d31c5832` |
| 最终上游合并提交 | `c3117ab27a54549448375d2cc047227bbf2bce2b` |
| 备份分支 | `backup/pre-upstream-merge-20260713` |

从共同基线计算，合并前本地分叉有 6 个提交，上游有 796 个提交。`crates/dbx-core` 在该区间有 282 个提交，涉及 141 个文件，变化规模约为 46,345 行新增、3,343 行删除。

第一次合并 `8f619fb7` 后重新 fetch，发现上游又增加 17 个提交并发布 `v0.5.56`，因此继续合并到 `ae0e3a2a`。创建最终 merge commit `c3117ab2` 后已再次执行 `git fetch origin --prune`；截至 2026-07-14，`origin/main` 仍为 `ae0e3a2a`，当前分支已完整包含该上游提交。

## 3. 合并冲突和处理方式

本次出现冲突的文件：

- `.github/workflows/sync-mirrors.yml`
- `apps/desktop/src/components/grid/DataGrid.vue`
- `apps/desktop/src/components/layout/AppTabBar.vue`
- `apps/desktop/src/components/layout/ContentArea.vue`
- `apps/desktop/src/components/structure/TableStructureEditor.vue`
- `apps/desktop/src/i18n/locales/en.ts`
- `apps/desktop/src/i18n/locales/es.ts`
- `apps/desktop/src/i18n/locales/zh-CN.ts`
- `apps/desktop/src/types/database.ts`

处理原则是“先采用上游最新文件，再小范围恢复本地产品功能”，避免把 2026-06 的旧组件整体覆盖到 2026-07 的上游架构。

具体处理：

1. `.github/workflows/sync-mirrors.yml` 继续保持本地删除。
2. `.github/workflows/docs.yml` 继续保持本地删除。
3. `DataGrid.vue` 使用上游最新版，完整删除旧表属性抽屉。
4. 独立表属性标签页适配上游新 API 路径和 catalog 参数。
5. `TableStructureEditor.vue` 在上游最新搜索、密度和工具栏基础上恢复 DDL 视图切换。
6. “查看 DDL”导航改为打开独立 `tableInfo` 标签页的 DDL 子页。

## 4. DBX fork 相对上游的净差异

### 4.1 仓库和发布文件

| 文件 | 本地差异 | 后续合并要求 |
| --- | --- | --- |
| `.github/workflows/docs.yml` | 删除 | 除非重新启用上游文档发布，否则保持删除 |
| `.github/workflows/sync-mirrors.yml` | 删除 | 避免本 fork 自动同步上游镜像 |
| `CLAUDE.md` | 新增 | 本地开发说明 |
| `build-and-push.sh` | 新增 | 本地构建、替换应用并推送 `aho1ic` 的脚本 |
| `LICENSE` | Apache-2.0 改为 MIT | 必须单独进行许可证审查 |
| 三个 README 文件 | 清理 3 处行尾空格 | 无内容和行为变化 |
| `LOCAL_CHANGES.md` | 新增 | 本地差异快速索引 |
| 本文档 | 新增 | Aeroric 内核迁移手册 |

### 4.2 独立表属性标签页

| 文件 | 修改内容 |
| --- | --- |
| `apps/desktop/src/types/database.ts` | `QueryTab.mode` 增加 `"tableInfo"`；增加 `tableInfoTarget` 和 `tableInfoActiveTab` |
| `apps/desktop/src/stores/queryStore.ts` | 新增并导出 `openTableInfo()`；支持复用、复制和失效表关闭 |
| `apps/desktop/src/components/grid/TableInfoView.vue` | 新增字段、索引、外键、触发器、DDL 独立视图 |
| `apps/desktop/src/components/layout/ContentArea.vue` | DataGrid 工具栏改为打开独立标签页；增加 `tableInfo` 渲染分支 |
| `apps/desktop/src/components/layout/AppTabBar.vue` | 增加 `tableInfo` 图标和配色 |
| `apps/desktop/src/components/sidebar/TreeItem.vue` | 表和视图右键菜单增加“表属性” |
| `apps/desktop/src/composables/useNavigationTargets.ts` | “查看 DDL”在加载元数据后打开 `tableInfo`，不再传递 DataGrid 抽屉参数 |
| `apps/desktop/src/lib/app/openTabsPersistence.ts` | 持久化目标表元数据和当前子页 |
| `apps/desktop/src/lib/tabs/tabPresentation.ts` | 标题、模式标签和工具提示支持 `tableInfo` |
| 三个 i18n 文件 | 增加标签页标题、默认值和结构视图文案 |

`tableInfoTarget` 当前保存：

```ts
{
  catalog?: string;
  schema?: string;
  tableName: string;
  columns: ColumnInfo[];
  primaryKeys: string[];
}
```

标签页复用键是：

```text
connectionId + database + catalog + schema + tableName
```

### 4.3 DataGrid 清理

`apps/desktop/src/components/grid/DataGrid.vue` 删除了旧表属性抽屉的状态、请求函数、模板、拖动调整宽度、Mongo 索引删除弹窗和样式。

关键布局变化：

- 右侧 cell detail 从第 3 列移动到第 2 列。
- `contentGridStyle` 从三列改为两列。
- `DataGrid` 不再暴露 `showDdl` / `toggleDdl`。
- `DataGrid` 不再接收 `tableInfoTab`。

后续合并不得把上游或旧补丁中的抽屉代码重新带回。

### 4.4 表结构 DDL 视图

`apps/desktop/src/components/structure/TableStructureEditor.vue` 增加：

- `columnViewMode: "edit" | "ddl"`
- 字段页的视图切换按钮
- 只读紧凑字段表格
- 主键、非空、默认值、注释展示

### 4.5 测试

本地补充的测试覆盖：

- `tableInfo` 持久化 round trip
- 标签页标题、模式标签和工具提示
- 相同目标复用和元数据刷新
- 不同 catalog 不复用
- duplicate tab 深复制字段和主键数组

旧版 `LOCAL_CHANGES.md` 曾声称修改了 `QueryHistory.vue`，但该文件不在当前本地净差异中，已从保留清单删除。

## 5. Aeroric 当前如何接入 DBX Core

Aeroric 没有复制一份 DBX 内核，而是通过 Cargo path dependency 直接引用兄弟仓库：

```toml
# Aeroric/src-tauri/Cargo.toml
dbx-core = { path = "../../dbx/crates/dbx-core", default-features = false }
```

因此，只要 `/Users/macbook/Downloads/同步空间/LYX/dbx/crates/dbx-core` 更新，Aeroric 下一次 Rust 编译就会立即使用新 API。不存在单独的“复制内核”步骤。

### 5.1 后端桥接层

Aeroric 的 DBX 适配代码位于：

```text
src-tauri/src/database/
├── connections.rs
├── dbx_state.rs
├── drivers.rs
├── grid.rs
├── import_export.rs
├── legacy_sqlite.rs
├── mongo.rs
├── query.rs
├── redis.rs
├── schema.rs
├── transfer.rs
└── types.rs
```

调用链：

```text
React UI
  -> src/lib/databaseApi.ts
  -> Tauri invoke("dbx_*")
  -> src-tauri/src/database/*.rs
  -> dbx_core::*_core / SQL builder
  -> 数据库驱动
```

### 5.2 连接配置

Aeroric 使用自己的外层连接结构：

```rust
AeroricDbConnectionConfig {
    id,
    name,
    db_type,
    read_only,
    project_scope,
    dbx: serde_json::Value,
    ...
}
```

`connections.rs::parse_core_config()` 把 `dbx` JSON 反序列化为 `dbx_core::ConnectionConfig`，再覆盖 Aeroric 管理的 `id`、`name`、`db_type` 和 `read_only`。

已有 JSON 中缺少新字段不会导致读取失败，因为 DBX 的 `ConnectionConfigData` 为新增字段提供了 serde 默认值。真正导致当前编译失败的是 `default_connection_config()` 仍使用完整 struct literal，必须显式增加新字段。

### 5.3 本地状态目录

Aeroric 在 `~/.aeroric` 下使用：

```text
database-connections-v2.json
dbx-core.db
dbx-plugins/
dbx-agents/
```

升级内核前应备份 `~/.aeroric/database-connections-v2.json` 和 `~/.aeroric/dbx-core.db`。

### 5.4 前端边界

主要边界：

- `src/lib/databaseApi.ts`：Tauri 命令封装
- `src/types/database.ts`：前端请求和返回类型
- `src/hooks/useRedisBrowser.ts`：Redis 分页合并
- `src/components/database/MongoBrowser.tsx`：Mongo 查询参数
- `src/components/database/DatabaseView.tsx`：数据库界面总编排

`DatabaseView.tsx` 当前接近一万行。升级时应把 API 类型变化限制在现有边界内，不建议顺手重构整个界面。

## 6. 隔离编译结果

为了不修改 Aeroric 原工作区，检查在临时 worktree 中完成。

原工作区执行：

```bash
cd /Users/macbook/Downloads/同步空间/LYX/Aeroric/src-tauri
cargo check --locked
```

首先失败，因为 `src-tauri/Cargo.lock` 需要更新。

临时 worktree 执行：

```bash
cargo check --offline
```

Cargo.lock 只增加了两个依赖引用：

```diff
calamine dependencies:
+ chrono

aeroric dependencies:
+ quick-xml 0.37.5
```

依赖完成编译后，Aeroric 自身出现 17 个 Rust 编译错误，分为下列 10 组接口变化。

## 7. 17 个编译错误逐项修复

### 7.1 表数据 SQL 选项增加 catalog、database 和 identifier_quote

位置：

- `src-tauri/src/database/grid.rs:190`
- `src-tauri/src/database/grid.rs:205`

变化：

```rust
TableDataSelectSqlOptions {
    identifier_quote: Option<String>,
    catalog: Option<String>,
    database: Option<String>,
    ...
}

DataGridCountSqlOptions {
    identifier_quote: Option<String>,
    catalog: Option<String>,
    database: Option<String>,
    ...
}
```

最小兼容：

```rust
identifier_quote: None,
catalog: None,
database: None,
```

完整接入：

1. 给 `TableDataRequest` 增加 `catalog?: string`，并明确 `database` 是外部 catalog 下的中间限定名。
2. 从连接配置或驱动元数据取得 `identifier_quote`。
3. `databaseApi.ts` 和 `TableDataRequest` TypeScript 类型同步增加字段。
4. 生成查询 SQL 和 count SQL 时传递同一组 catalog/database/quote，避免主查询和计数查询指向不同对象。

### 7.2 Mongo find 增加 projection

位置：`src-tauri/src/database/mongo.rs:92`

新签名顺序：

```rust
filter,
projection,
sort,
```

最小兼容是在 `filter.as_deref()` 与 `sort.as_deref()` 之间传 `None`。

完整接入需要同时修改：

- Rust command 参数 `projection: Option<String>`
- `src/types/database.ts::MongoFindDocumentsRequest`
- `src/lib/databaseApi.ts`
- `src/components/database/MongoBrowser.tsx`
- Mongo 相关 API 和组件测试

### 7.3 Mongo update 增加 routing

位置：`src-tauri/src/database/mongo.rs:137`

新参数：

```rust
routing: Option<&str>
```

最小兼容在 `doc_json` 后传 `None`。

完整接入应为支持 routing 的文档存储后端增加 `routing?: string`，并贯穿更新命令、前端请求类型和编辑 UI。普通 MongoDB 使用 `None` 即可保持旧行为。

### 7.4 Redis load-more 参数和返回类型改变

位置：`src-tauri/src/database/redis.rs:114`

变化：

```rust
redis_load_more_in_db_core(
    ...,
    count,
    filter: Option<&str>,
) -> Result<RedisCollectionPage, String>
```

旧返回值是完整 `RedisValue`，新返回值是分页增量：

```rust
enum RedisCollectionPage {
    List { items, scan_cursor },
    Set  { items, scan_cursor },
    Hash { items, scan_cursor },
    Zset { items, scan_cursor },
}
```

这不是只加一个 `None` 就能完成的修改。最低可用方案也必须做跨层类型更新：

1. Rust command 返回 `RedisCollectionPage`。
2. 增加 `filter: Option<String>`，先允许前端传 `null`。
3. TypeScript 增加带 `kind` 判别字段的 `RedisCollectionPage` 联合类型。
4. `databaseApi.dbxRedisLoadMore()` 返回 `RedisCollectionPage`。
5. `useRedisBrowser.ts::mergeRedisValuePage()` 改为把 `page.items` 合入当前 `RedisValue.value`，并从 `page.scan_cursor` 更新游标。
6. 更新 `src/test/redis-browser-state.test.ts`、`src/test/database-api.test.ts` 和 Redis UI 测试。

不要在 Rust 层伪造一个缺少 key、ttl、binary 状态的 `RedisValue`，否则分页返回会覆盖首屏元数据。

完整接入可进一步把 `filter` 暴露为集合成员筛选条件。

### 7.5 对象列表增加筛选、分页和类型约束

位置：`src-tauri/src/database/schema.rs:41`

新签名增加：

```rust
filter: Option<&str>,
limit: Option<usize>,
offset: Option<usize>,
object_types: Option<&[String]>,
```

最小兼容全部传 `None`。

完整接入：

- Tauri command 增加四个可选参数。
- `databaseApi.dbxListObjects()` 和前端调用增加筛选、分页参数。
- 对象树支持增量加载时要避免把分页结果当成完整列表覆盖。
- `object_types` 应直接使用字符串数组，不要在桥接层重新定义数据库类型枚举。

### 7.6 对象源码增加 signature

位置：`src-tauri/src/database/schema.rs:93`

新参数是：

```rust
signature: Option<&str>
```

它不是 catalog。最小兼容传 `None`。

完整接入应给存储过程和函数对象传递 metadata 中的 signature，以区分同名重载。

### 7.7 TransferProgress 增加 terminal

位置：

- `src-tauri/src/database/transfer.rs:55`
- `src-tauri/src/database/transfer.rs:92`
- `src-tauri/src/database/transfer.rs:111`
- `src-tauri/src/database/transfer.rs:130`

语义应与 DBX 自身 Tauri wrapper 一致：

| 事件 | `terminal` |
| --- | --- |
| 单表完成 `TableDone` | `false` |
| 可继续处理其他表的单表错误 | `false` |
| 整体 `Done` | `true` |
| 取消并退出 | `true` |
| 错误后立即退出 | `true` |

Aeroric 当前遇到单表错误就 `return`，因此该错误事件必须是 `terminal: true`。

前端监听器也应优先使用 `terminal` 判断一次传输是否结束，不要只靠 status 字符串推断。

### 7.8 ConnectionConfig 增加 4 个字段

位置：`src-tauri/src/database/connections.rs:97`

新增字段：

```rust
agent_java_options: Vec<String>,
init_script: Option<String>,
is_production: bool,
production_databases: Vec<String>,
```

最小兼容值：

```rust
agent_java_options: Vec::new(),
init_script: None,
is_production: false,
production_databases: Vec::new(),
```

`ConnectionConfig` 当前没有公开 `Default` 实现，因此不能直接使用 `..Default::default()`。建议继续显式补齐字段，同时增加一个测试：

1. 用 `default_connection_config()` 生成配置。
2. 序列化为 JSON。
3. 通过 `parse_core_config()` 反序列化。
4. 验证新字段默认值和 `read_only` 不丢失。

完整接入时，Aeroric 的连接编辑器应支持：

- `init_script`
- `is_production`
- `production_databases`
- JDBC agent Java options

生产标记涉及 SQL 安全策略，不能只保存字段而不检查 UI 的危险操作确认流程。

### 7.9 QueryExecutionOptions 增加 use_transaction

位置：

- `src-tauri/src/database/query.rs:78`
- `src-tauri/src/database/query.rs:90`

字段类型：

```rust
use_transaction: Option<bool>
```

旧行为兼容值是 `None` 或 `Some(false)`。

更稳妥的最小修改是给 struct literal 增加：

```rust
use_transaction: None,
```

也可以改成：

```rust
QueryExecutionOptions {
    ...,
    ..Default::default()
}
```

完整接入应只在多语句执行请求上暴露 `useTransaction?: boolean`。单条查询没有必要启用该选项。

### 7.10 创建数据库和 schema 的 SQL builder 现在返回 Result

位置：

- `src-tauri/src/database/query.rs:196`
- `src-tauri/src/database/query.rs:236`

原代码形成了嵌套 Result：

```rust
Ok(dbx_core::db_admin_sql::build_create_database_sql(options))
```

应直接返回：

```rust
dbx_core::db_admin_sql::build_create_database_sql(options)
```

`build_create_schema_sql()` 同理。

这样 DBX 新增的“不支持此数据库类型”等验证错误可以直接传给前端。

## 8. 建议的实施顺序

### 阶段 A：恢复编译

1. 更新 Aeroric `src-tauri/Cargo.lock`。
2. 补齐 `ConnectionConfig` 4 个字段。
3. 补齐两个 SQL option 的 `catalog` 和 `identifier_quote`。
4. Mongo 新参数先传 `None`。
5. schema 新参数先传 `None`。
6. `QueryExecutionOptions.use_transaction` 先设 `None`。
7. SQL builder 直接返回 Result。
8. 设置 `TransferProgress.terminal`。
9. 完成 Redis `RedisCollectionPage` 跨 Rust/TS 的必要适配。

阶段 A 完成标准：

```bash
cd /Users/macbook/Downloads/同步空间/LYX/Aeroric/src-tauri
cargo check --locked
```

通过。

### 阶段 B：接入新能力

按价值和风险建议顺序：

1. Redis 集合分页和筛选。
2. schema 对象筛选、分页、对象类型约束。
3. Mongo projection。
4. 重载函数 signature。
5. 多语句事务开关。
6. catalog 和 identifier quote。
7. Mongo/Elasticsearch routing。
8. 生产连接标记和安全策略。
9. DuckDB init script 与 JDBC agent Java options。

## 9. Rust、Tauri 和 TypeScript 同步矩阵

| 能力 | dbx-core | Aeroric Rust command | `databaseApi.ts` | TS 类型 | UI/Hook | 测试 |
| --- | --- | --- | --- | --- | --- | --- |
| 表数据 catalog | 已支持 | 待传递 | 待增加 | `TableDataRequest` | DatabaseView | table data API |
| identifier quote | 已支持 | 待解析 | 可内部处理 | 可选字段 | 无需直接展示 | SQL 生成 |
| Mongo projection | 已支持 | 待增加 | 待增加 | `MongoFindDocumentsRequest` | MongoBrowser | Mongo API/UI |
| Mongo routing | 已支持 | 待增加 | 待增加 | update request | Mongo 编辑器 | update API |
| Redis typed page | 已支持 | 必须改返回类型 | 必须改泛型 | 新 union | `useRedisBrowser` | Redis state/API |
| Redis filter | 已支持 | 待增加 | 待增加 | load-more request | Redis Browser | filter/paging |
| 对象分页 | 已支持 | 待增加 | 待增加 | list options | 对象树 | tree loading |
| 对象 signature | 已支持 | 待增加 | 待增加 | object source request | source viewer | overloaded routine |
| 多语句事务 | 已支持 | 待增加 | 待增加 | execute request | SQL editor | query API |
| transfer terminal | 已支持 | 必须赋值 | 事件无需改命令 | progress type | transfer UI | terminal state |
| production 标记 | 已支持 | 配置需补齐 | 连接 API 已传 JSON | connection form | safety UI | round trip/safety |

任何一项都应按“一次改完整行”的方式提交：Rust 参数、Tauri invoke、TS 类型、UI 调用和测试同时更新，避免出现编译通过但运行时参数名不匹配。

## 10. 建议测试

### 10.1 DBX

```bash
cd /Users/macbook/Downloads/同步空间/LYX/dbx
pnpm test
pnpm exec vue-tsc --noEmit --project apps/desktop/tsconfig.json
pnpm lint
pnpm build
cargo check -p dbx-core --locked
cargo test -p dbx-core --test database_capabilities
git diff --check
```

### 10.2 Aeroric Rust

```bash
cd /Users/macbook/Downloads/同步空间/LYX/Aeroric/src-tauri
cargo fmt --check
cargo check --locked
cargo test --locked
```

### 10.3 Aeroric 前端

```bash
cd /Users/macbook/Downloads/同步空间/LYX/Aeroric
npm run lint
npm run test
npm run build
```

重点回归：

- SQL 单语句和多语句执行
- 表数据分页与 count
- Redis list/set/hash/zset 首屏和 load more
- Mongo filter/sort/update
- 对象树加载和函数源码
- 数据传输完成、失败、取消
- 旧 `database-connections-v2.json` 读取
- 只读连接仍阻止写操作

## 11. Cargo.lock 更新方式

因为 Aeroric 使用 path dependency，DBX 依赖变化必须写入 Aeroric 的 `src-tauri/Cargo.lock`。

建议：

```bash
cd /Users/macbook/Downloads/同步空间/LYX/Aeroric/src-tauri
cargo check
git diff -- Cargo.lock
cargo check --locked
```

只接受与新 DBX 依赖树一致的锁文件变化。当前隔离检查预期仅增加 `chrono` 和 `quick-xml 0.37.5` 的依赖引用；如果实际 diff 大幅升级大量 crate，应先检查本机 Cargo 解析是否改变了版本范围。

## 12. 回滚方案

### 12.1 回滚 DBX

```bash
cd /Users/macbook/Downloads/同步空间/LYX/dbx
git switch backup/pre-upstream-merge-20260713
```

如需保留 `main` 名称，不要直接执行破坏性 reset；先创建一个新 worktree 或由负责人确认后再移动分支。

### 12.2 回滚 Aeroric

Aeroric 原工作区在本次检查中未修改。实际迭代时应先提交或备份：

```text
src-tauri/Cargo.lock
src-tauri/src/database/*.rs
src/lib/databaseApi.ts
src/types/database.ts
src/hooks/useRedisBrowser.ts
相关组件和测试
```

数据回滚前备份：

```text
~/.aeroric/database-connections-v2.json
~/.aeroric/dbx-core.db
```

## 13. 许可证风险

本地 DBX `LICENSE` 是 MIT，Copyright Aho1ic；目标上游提交 `ae0e3a2a` 的 `LICENSE` 是 Apache-2.0。

这不是普通的冲突保留问题。把大量 Apache-2.0 上游代码合入后，仅在根目录放置 MIT 文本不等于可以移除上游许可证、版权和 NOTICE 义务。Aeroric 发布二进制、源码或内置 DBX 内核前，应完成以下审查：

1. 确认 fork 对上游代码的许可证标注方式。
2. 保留适用的 Apache-2.0 文本和版权声明。
3. 检查上游是否包含 NOTICE 文件或第三方许可证清单。
4. 确认 Aeroric 自身许可证与 DBX 依赖分发方式兼容。

本节是工程风险提示，不是法律意见。

## 14. 后续升级固定流程

以后迭代 DBX Core 建议固定执行：

```bash
# DBX
git fetch origin --prune
git branch backup/pre-upstream-merge-$(date +%Y%m%d)
git merge origin/main
pnpm test
cargo check -p dbx-core --locked

# Aeroric
cd ../Aeroric/src-tauri
cargo check
cargo check --locked
cd ..
npm run lint
npm run test
npm run build
```

每次升级都记录：

- DBX 起始和目标 commit
- 最近版本标签
- `dbx-core` API 变化
- Aeroric Cargo.lock diff
- Rust 编译错误及修复
- Tauri/TypeScript 参数同步
- 数据迁移和许可证影响

这样 Aeroric 的“DBX 内核升级”才是可验证、可回滚的依赖升级，而不是只把兄弟仓库拉到最新后依赖编译器逐个报错。
