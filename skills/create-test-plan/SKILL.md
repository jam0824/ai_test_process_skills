---
name: create-test-plan
description: Create Japanese Markdown test plan documents from product requirements, README files, specifications, existing tests, implementation notes, and user-provided source data. Use when Codex needs to draft or revise a test plan (テスト計画書) that defines test objectives, referenced documents, test items, scope, exit criteria, product risk scoring, traceable high-level test approaches, use-case/scenario testing strategy, and downstream analysis/design depth expectations.
---

# Create Test Plan

## Overview

Create a Markdown test plan that defines the overall testing strategy for a product. Keep the output at test-planning level; do not expand into detailed test analysis, test cases, or test design unless the user explicitly asks.

Default to Japanese output. Match another language only when the user asks for it or all source material clearly uses another language.

The plan should decide which testing approaches are needed and how much depth downstream analysis and design should provide. It should not enumerate detailed viewpoints or test cases, but it should prevent later artifacts from becoming too thin by naming high-risk flows, use cases, generic QA areas, quality gates, and unresolved assumptions.

## Workflow

1. Gather source material in this order:
   - User-provided files, pasted data, goals, and constraints.
   - Product specifications in likely locations such as `spec/`, `docs/`, or files named `仕様書`.
   - `README` files and user-facing documentation.
   - Existing tests, QA artifacts, and test result documents.
   - Implementation files only to clarify actual behavior or risk.
2. Extract product context: product purpose, users, architecture, runtime environment, main features, use cases, data handled, constraints, and existing test assets.
3. Identify planning drivers:
   - High-risk product areas and critical user or operator flows.
   - Product types and interfaces such as Web UI, API, CLI, library, batch, data processing, mobile, reports/documents, integrations, or infrastructure tools.
   - Generic QA areas that are relevant at plan level, such as boundary values, abnormal values, state transitions, combinations, security/privacy, performance/reliability, compatibility, accessibility, persistence, concurrency/timing, localization, and observability/logging.
4. Draft the test plan with every required section below. Add optional sections only when the source material supports them or they reduce ambiguity.
5. Mark missing information as `未確定` or `要確認`. Do not invent owners, schedules, tools, supported environments, or acceptance thresholds that are not supported by the source material.
6. Before finalizing, verify that all required sections exist, every product risk has 発生確率, 影響度, and リスク度, and high-risk areas have downstream analysis/design depth expectations.

## Required Output Structure

Use these headings in this order:

```markdown
# テスト計画書

## 1. テスト目的
## 2. ドキュメント
## 3. テストアイテム
## 4. テストスコープ
## 5. テスト終了条件
## 6. プロダクトリスク
## 7. テストアプローチ
```

Required section guidance:

- **テスト目的**: State why testing is being performed and what confidence the plan should provide.
- **ドキュメント**: List referenced documents, paths, or data sources. Include each source's role in the plan when useful.
- **テストアイテム**: List the product, functions, screens, APIs, data flows, calculations, integrations, or artifacts under test.
- **テストスコープ**: Define what parts of the test items are in scope. If exclusions or boundaries are unclear, state them as `未確定` or `要確認`.
- **テスト終了条件**: Define completion criteria for test execution, defect handling, regression, unresolved risk, and sign-off. Use source-supported thresholds; otherwise mark thresholds as `要確認`.
- **プロダクトリスク**: Use a Markdown table with numeric risk scoring.
- **テストアプローチ**: Use a traceability table that links each high-level approach to source specifications and related product risks.

In `テスト終了条件`, include artifact-quality gates when useful, such as no unresolved `P0/P1` findings in test plan, analysis, design, and test case reviews; unresolved high-risk assumptions are approved or explicitly deferred; and residual risks are recorded. Do not invent organizational approval rules when sources do not provide them; mark them `要確認`.

## Product Risk Scoring

Use `発生確率(1-5) × 影響度(1-5) = リスク度`.

Recommended table columns:

```markdown
| ID | リスク | 根拠/対象 | 発生確率(1-5) | 影響度(1-5) | リスク度 | 対応方針 |
|---|---|---|---:|---:|---:|---|
```

Scoring guidance:

- 5: Very likely or severe business/user impact.
- 3: Plausible or moderate impact.
- 1: Rare or low impact.
- Treat `15-25` as high priority, `8-14` as medium priority, and `1-7` as low priority when prioritizing test focus.
- Base scores on product context. For example, financial calculations, privacy-sensitive data, irreversible operations, security boundaries, and compliance-sensitive behavior usually deserve higher impact.

## Test Approach Guidance

List test approaches in a Markdown table. Each row must be a strategy-level approach, not a detailed test case.

Required table columns:

```markdown
| テストアプローチID | 内容 | 仕様 | リスクID |
|---|---|---|---|
```

Column guidance:

- **テストアプローチID**: Use stable IDs such as `TA001`, `TA002`, `TA003`. Keep IDs unique and sequential.
- **内容**: State the testing style and target behavior in one concise sentence, such as Unit test for calculation boundaries or E2E test for a critical user flow.
- **仕様**: Link or name the source specification sections, feature IDs, requirement IDs, files, or headings that justify the approach. Use `要確認` if the source specification is unclear.
- **リスクID**: List related product risk IDs such as `R001, R003`. Use `なし` when there is no direct product risk.

Choose approaches by risk and behavior type:

- **Unit test**: Use for deterministic calculations, validation rules, state transitions, formatting, boundary values, and error handling.
- **Integration test**: Use for interactions between modules, data persistence, API contracts, background jobs, external services, and cross-component data flow.
- **E2E test**: Use for critical user journeys, screen-to-result flows, form input/output, browser behavior, and regression paths that must work as a whole.
- **Use-case/scenario-based test**: Use for important user, operator, or system-to-system goals where preconditions, main flow, alternative flow, exception flow, and postconditions determine confidence. At plan level, identify target use cases and priority; leave detailed scenario decomposition to test analysis and design.
- **Security test**: Use for authentication, authorization, input sanitization, XSS/CSRF/injection risks, privacy, secrets, dependencies, and network behavior.
- **Performance test**: Use for heavy calculations, large datasets, rendering volume, startup time, response time, and resource usage.
- **Compatibility/accessibility test**: Use when browser/device support, responsive UI, keyboard operation, screen reader behavior, or locale/currency formatting matters.
- **Exploratory test**: Use for high-risk areas with ambiguous requirements, complex user workflows, or behaviors affected by randomness or many parameter combinations.

Do not list detailed test cases in the plan. Instead, identify target areas, the testing style that should be applied, and the traceability back to specifications and risk IDs.

## Downstream Depth Expectations

Use the plan to set expectations for later analysis and design without doing their work.

- For each high-risk product risk, ensure at least one test approach tells downstream skills which kind of depth is expected, such as use-case flow coverage, boundary coverage, abnormal/error coverage, state/transition coverage, combination coverage, security/privacy coverage, performance/reliability coverage, compatibility/accessibility coverage, or observability/evidence coverage.
- For important use cases, state the target user or actor, goal, and risk at a high level. Downstream analysis should decompose preconditions, main flows, alternative flows, exception flows, and postconditions.
- For product types with common failure modes, add strategy-level approaches for relevant generic QA areas. Avoid making a mechanical checklist of every QA category when the product context does not justify it.
- If an approach depends on unknown environments, thresholds, roles, data volume, supported formats, or acceptance criteria, mark the approach or exit criteria as `要確認`.

## Generic QA Planning Catalog

Consider this catalog when choosing plan-level approaches. Include only relevant items and keep them strategy-level.

- Input validation, boundary values, equivalence classes, malformed or missing data.
- Use cases, user journeys, actor goals, alternative flows, exception flows, and recovery flows.
- State transitions, lifecycle operations, retry/cancel/timeout behavior, and invalid transitions.
- Business rules, decision tables, roles, permissions, and configuration differences.
- Cross-component integration, API contracts, data persistence, transactions, import/export, and batch reprocessing.
- Security, privacy, sensitive data handling, auditability, authentication, authorization, and dependency risks.
- Performance, reliability, scalability, large data, long-running work, resource limits, and graceful degradation.
- Compatibility across browsers, devices, OS/runtime versions, file formats, protocols, and dependency versions.
- Accessibility, usability, keyboard operation, screen reader behavior, readability, and error comprehension.
- Localization, time zones, calendars, numeric/currency/date formatting, precision, and rounding.
- Concurrency, timing, scheduling, eventual consistency, idempotency, and race conditions.
- Observability, logs, metrics, traceability, exported evidence, and operational diagnostics.

## Optional Sections

Add these only when useful and supported by the source material:

- テスト環境
- 前提条件
- 除外事項
- 役割/体制
- スケジュール
- 成果物
- 未決事項
- 後続成果物の品質ゲート
- 対象ユースケース/主要シナリオ

## Quality Checklist

Before delivering the test plan:

- Confirm every user-requested item is present.
- Confirm all referenced documents are named clearly.
- Confirm product risks have numeric 発生確率, 影響度, and computed リスク度.
- Confirm test approaches are listed in a table with テストアプローチID, 内容, 仕様, and リスクID.
- Confirm test approaches mention appropriate levels such as Unit, Integration, E2E, Security, Performance, Compatibility, Accessibility, or Exploratory when relevant.
- Confirm use-case/scenario-based testing is considered when important user, operator, or system-to-system flows determine product confidence.
- Confirm high-risk risks have downstream depth expectations that can guide test analysis and design without becoming detailed test cases.
- Confirm relevant generic QA planning areas were considered and either included or reasonably left out based on product context.
- Confirm exit criteria include review quality gates or residual-risk handling when they matter for the request.
- Confirm each test approach links to at least one specification source or is explicitly marked `要確認`, and links to product risks when applicable.
- Confirm assumptions and unknowns are clearly labeled instead of silently filled in.
