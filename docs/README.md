# Documentation Index

This directory is split into three layers:

## 1. Canonical current-state docs

Use these first when you need to understand the live repo as it exists now.

- `docs/00_system_overview.md`
- `docs/01_core_architecture.md`
- `docs/02_database_schema.md`
- `docs/03_server_actions_api.md`
- `docs/04_frontend_ui_mapping.md`
- `docs/05_operations_runbook.md`
- `docs/06_release_checklist.md`
- `docs/07_naming_and_change_governance.md`
- `docs/08_feature_inventory.md`
- `docs/09_change_history.md`

## 2. Active governance docs

Use these when you need to understand why the current state exists, what was accepted, and what exact-v0 constraints governed the work.

- `docs/migration/post-p6-exact-v0-enhancement-spec.md`
- `docs/migration/post-p6-schema-compatibility-plan.md`
- `docs/migration/post-p6-route-ownership-plan.md`
- `docs/migration/post-p6-phase-tracker.md`
- `docs/migration/post-p6-audit-log.md`

## 3. Historical reference docs

Use these for origin/history only. They are not the current behavior contract.

- `DEVELOPMENT_LOG.md`
- `docs/migration/v0-fidelity-production-migration-spec.md`
- `docs/migration/v0-phase-tracker.md`
- `docs/migration/v0-audit-log.md`

## Update rules

- if a load-bearing product/runtime/schema/route/feed/email/renderer/query behavior changes, update the relevant canonical docs in `docs/`
- if the change is part of an accepted program or phase, also update the active governance docs in `docs/migration/post-p6-*.md`
- do not rewrite historical docs to describe current runtime; instead, add current-state corrections to the canonical docs or the active governance docs

## Quick-start reading order

1. `docs/00_system_overview.md`
2. `docs/08_feature_inventory.md`
3. `docs/01_core_architecture.md`
4. `docs/03_server_actions_api.md`
5. `docs/05_operations_runbook.md`
6. `docs/09_change_history.md`
