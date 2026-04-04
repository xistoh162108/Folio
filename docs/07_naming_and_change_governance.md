# 07. Naming and Change Governance

This document standardizes how future work should be named and documented.

## Canonical doc naming

- numbered docs in `docs/00-09` describe current runtime truth
- active governance docs stay under `docs/migration/post-p6-*`
- historical docs keep their original names and are never quietly repurposed as current-state docs

## Program and phase naming

Existing accepted lineages:

- `v0-*`
  - historical migration lineage
- `R1-R9`
  - post-P6 responsive/runtime baseline
- `H0-H8`
  - post-P6 hardening and production-acceptance line

Future large workstreams must:

1. declare a prefix before implementation starts
2. define that prefix in spec + tracker + audit
3. keep one tracker and one audit thread per workstream

Do not invent ad-hoc prefixes in commit messages only.

## Issue and feature naming

### Phase-local issue IDs

Use:

- `<PHASE>-NN`

Examples:

- `H6-05`
- `H7-02`

Use phase-local issue IDs in audit notes, QA notes, and follow-up lists.

### Cross-cutting feature IDs

Use:

- `FEAT-<SURFACE>-<CAPABILITY>`

Examples:

- `FEAT-PUBLIC-RSS-NOTES`
- `FEAT-ADMIN-SERVICE-LOG`
- `FEAT-PROFILE-RESUME-OVERRIDE`

### Cross-cutting bug IDs

Use:

- `BUG-<SURFACE>-<CAPABILITY>`

Examples:

- `BUG-EDITOR-PENDING-STATE`
- `BUG-RESUME-FAIL-OPEN`

## File and symbol naming

### Components

- route screens:
  - `*-screen.tsx`
- server-bound screen loaders:
  - `*-screen-bound.tsx`
- client-only runtime wrappers:
  - `*-client.tsx`
- shell owners:
  - `*-shell.tsx`

### Server actions

- verb-first camelCase
- examples:
  - `savePost`
  - `deletePostPermanently`
  - `upsertCampaign`

### Contracts

- DTOs:
  - `XxxDTO`
- inputs:
  - `XxxInput`
- results:
  - `XxxResult`
- queries:
  - `XxxQuery`
  - `XxxQueryInput`

### Routes in docs

Document route handlers as:

- `GET /path`
- `POST /path`
- `DELETE /path`

Document feed routes explicitly as feeds, not generic APIs.

### Prisma migrations

Use:

- `YYYYMMDDHHMMSS_<snake_case_purpose>`

Example:

- `20260404190000_add_newsletter_h6_hardening`

### Tests

- unit/integration:
  - `tests/unit/<domain>.test.ts`
- browser e2e:
  - `e2e/<surface>.spec.ts`

## Load-bearing documentation rule

A change is load-bearing if it changes any of:

- product rule
- runtime behavior
- schema or data contract
- route, canonical, or feed behavior
- email lifecycle or template behavior
- renderer/parser behavior
- pagination/search/filter behavior
- non-literal exact-v0 extension scope

Load-bearing changes must update:

- one or more canonical docs in `docs/`
- the active governance docs if the change is part of the accepted program line

## Minimal update matrix

- product/runtime change:
  - `00`, `01`, `04`
- schema/contract change:
  - `02`, `03`
- route/feed/canonical change:
  - `00`, `03`, `04`, `05`, `06`
- email/workflow change:
  - `03`, `05`, `08`, governance docs
- operational or deploy change:
  - `05`, `06`, `09`
- feature landing or removal:
  - `08`, `09`

## Historical record rule

- do not erase older lineages
- summarize them in `docs/09_change_history.md`
- keep current behavior in numbered canonical docs
- keep acceptance reasoning in migration tracker/audit docs
