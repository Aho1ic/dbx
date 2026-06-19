# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DBX is an open-source database management tool supporting 40+ databases. It ships as a ~15 MB desktop app (Tauri), Docker/web service, CLI, and MCP server. Built with a Vue 3 + TypeScript frontend and Rust backend.

## Commands

### Development

```bash
pnpm install                  # Install dependencies
pnpm dev:tauri                # Run desktop app (Tauri + Vite)
pnpm dev                      # Run Vite frontend only (port 1420)
pnpm dev:backend              # Run web backend (Rust cargo watch, dbx-web crate)
pnpm dev:web                  # Run web mode (port 5173) — pair with dev:backend; this mode talks to dbx-web over HTTP instead of Tauri commands
```

Java 17 is only required when packaging the JDBC plugin (`plugins/jdbc/`).

Linux requires system deps first:

```bash
sudo apt-get install -y libwebkit2gtk-4.1-dev libgtk-3-dev libappindicator3-dev librsvg2-dev patchelf libssl-dev
```

### Build & Check

```bash
pnpm build                    # Type-check (vue-tsc) + Vite production build
pnpm tauri build              # Full desktop app build (produces installer in src-tauri/target/release/bundle/)
pnpm check                    # Full check: oxfmt + lint + type-check + test
pnpm lint                     # oxlint with Vue plugin
pnpm fmt                      # oxfmt for TS/Vue files (printWidth 120, double quotes)
cargo fmt --check             # Check Rust formatting (max_width 120)
cargo clippy --workspace --locked  # Rust linter (run in CI)
cargo check --workspace --locked  # Check Rust compilation
```

### Testing

```bash
pnpm test                     # Run app-level tests (tsx + node:test)
pnpm test:packages            # Run all package tests (node-core, cli, mcp-server)
pnpm --filter @dbx-app/node-core test   # Test node-core only
pnpm --filter @dbx-app/cli test         # Test CLI only
pnpm --filter @dbx-app/mcp-server test  # Test MCP server only
cargo test --workspace --locked         # Run all Rust tests
cargo test -p dbx-core --test database_capabilities  # Test database driver metadata
```

### Packaging

```bash
pnpm publish:dry-run          # Build + pack all packages (pre-publish validation)
```

## Architecture

### Workspace Layout

```
├── apps/desktop/         # Vue 3 frontend (Tauri desktop shell)
├── src-tauri/            # Tauri native commands + Rust glue code
├── crates/
│   ├── dbx-core/         # Shared Rust database engine (connections, queries, exports, AI, schema)
│   └── dbx-web/          # Docker/web backend service
├── packages/
│   ├── node-core/        # Shared Node.js core library (@dbx-app/node-core)
│   ├── cli/              # CLI tool (@dbx-app/cli)
│   ├── mcp-server/       # MCP server (@dbx-app/mcp-server)
│   └── app-tests/        # Integration tests
├── plugins/jdbc/         # JDBC plugin for extended DB support
├── deploy/               # Docker + deployment configs
└── docs/                 # Documentation site
```

### Frontend (apps/desktop/)

- **Framework**: Vue 3 + TypeScript + Pinia stores + Tailwind CSS v4 + shadcn-vue + reka-ui
- **Editor**: CodeMirror 6 with SQL language support
- **Charts**: ECharts (vue-echarts)
- **i18n**: vue-i18n with locale files in `src/i18n/locales/`
- **Path alias**: `@/` maps to `src/`
- **Key stores**: `connectionStore`, `queryStore`, `historyStore`, `savedSqlStore`, `settingsStore`
- **Components**: organized by feature — `editor/`, `grid/`, `connection/`, `objects/`, `structure/`, `transfer/`, `sidebar/`, `config/`, `export/`, `import/`, `diagram/`, `diff/`, `explain/`, `search/`, `redis/`, `mongo/`

### Backend (Rust)

- **dbx-core** is the shared engine: database connections, SQL execution, query results, schema introspection, data export/import, AI integration, cloud sync, SQL analysis/dialect handling. All database drivers live here under `src/db/`.
- **src-tauri** is the Tauri desktop shell — it exposes `dbx-core` functionality as Tauri commands to the frontend. Commands live in `src/commands/`.
- **dbx-web** provides the same backend as an HTTP service for Docker/web deployment.
- Database driver metadata is centrally defined in `crates/dbx-core/assets/database-drivers.manifest.json`.

### Node Packages

- **node-core** — shared Node.js bindings used by CLI and MCP server
- **cli** — command-line interface for DBX
- **mcp-server** — Model Context Protocol server (allows AI agents like Claude Code, Cursor, Windsurf to query databases via DBX connections)

## Adding a New Database Driver

This is a cross-cutting task that touches multiple layers. Start here:

1. Update `crates/dbx-core/assets/database-drivers.manifest.json` — this is the single source of truth for driver mode, MCP/CLI routing, agent keys, and capability expectations.
2. Add/update the driver in `crates/dbx-core/src/db/`.
3. Run the driver metadata tests to validate:
   ```bash
   cargo test -p dbx-core --test database_capabilities
   pnpm --filter @dbx-app/node-core exec tsx --test tests/driver-manifest.test.ts
   pnpm --filter @dbx-app/mcp-server exec tsx --test tests/driver-manifest.test.ts
   ```

## CI

The GitHub Actions CI (`ci.yml`) runs two parallel jobs on every push/PR to `main`:

- **frontend**: oxfmt check → vue-tsc → app tests → package tests → publish dry-run
- **rust**: cargo fmt → cargo clippy → cargo check → cargo test

There is also a **jdbc** job that validates JDBC plugin version bumps.

## Pre-commit Hooks

The `.husky/pre-commit` hook runs:
1. `lint-staged` (oxfmt for staged TS/Vue files)
2. `rustfmt` on staged `.rs` files in `src-tauri/`, `crates/dbx-core/`, `crates/dbx-web/`

## Conventions

- **Commit messages**: Conventional Commits format, e.g. `fix(app): clamp window size`, `feat(core): add DuckDB support`
- **Rust edition**: 2021, minimum rust-version 1.77.2, max line width 120
- **Node**: >=22.13.0, pnpm 10.27.0
- **License**: AGPL-3.0-only
