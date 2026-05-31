---
name: create-test-plan
description: Create Japanese Markdown test plan documents from product requirements, README files, specifications, existing tests, implementation notes, and user-provided source data. Use when Codex needs to draft or revise a test plan (テスト計画書) that defines test objectives, referenced documents, test items, scope, exit criteria, product risk scoring, and traceable high-level test approaches.
---

# Create Test Plan

## Overview

Create a Markdown test plan that defines the overall testing strategy for a product. Keep the output at test-planning level; do not expand into detailed test analysis, test cases, or test design unless the user explicitly asks.

Default to Japanese output. Match another language only when the user asks for it or all source material clearly uses another language.

## Workflow

1. Gather source material in this order:
   - User-provided files, pasted data, goals, and constraints.
   - Product specifications in likely locations such as `spec/`, `docs/`, or files named `仕様書`.
   - `README` files and user-facing documentation.
   - Existing tests, QA artifacts, and test result documents.
   - Implementation files only to clarify actual behavior or risk.
2. Extract product context: product purpose, users, architecture, runtime environment, main features, data handled, constraints, and existing test assets.
3. Draft the test plan with every required section below. Add optional sections only when the source material supports them or they reduce ambiguity.
4. Mark missing information as `未確定` or `要確認`. Do not invent owners, schedules, tools, supported environments, or acceptance thresholds that are not supported by the source material.
5. Before finalizing, verify that all required sections exist and every product risk has 発生確率, 影響度, and リスク度.

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
- **Security test**: Use for authentication, authorization, input sanitization, XSS/CSRF/injection risks, privacy, secrets, dependencies, and network behavior.
- **Performance test**: Use for heavy calculations, large datasets, rendering volume, startup time, response time, and resource usage.
- **Compatibility/accessibility test**: Use when browser/device support, responsive UI, keyboard operation, screen reader behavior, or locale/currency formatting matters.
- **Exploratory test**: Use for high-risk areas with ambiguous requirements, complex user workflows, or behaviors affected by randomness or many parameter combinations.

Do not list detailed test cases in the plan. Instead, identify target areas, the testing style that should be applied, and the traceability back to specifications and risk IDs.

## Optional Sections

Add these only when useful and supported by the source material:

- テスト環境
- 前提条件
- 除外事項
- 役割/体制
- スケジュール
- 成果物
- 未決事項

## Quality Checklist

Before delivering the test plan:

- Confirm every user-requested item is present.
- Confirm all referenced documents are named clearly.
- Confirm product risks have numeric 発生確率, 影響度, and computed リスク度.
- Confirm test approaches are listed in a table with テストアプローチID, 内容, 仕様, and リスクID.
- Confirm test approaches mention appropriate levels such as Unit, Integration, E2E, Security, Performance, Compatibility, Accessibility, or Exploratory when relevant.
- Confirm each test approach links to at least one specification source or is explicitly marked `要確認`, and links to product risks when applicable.
- Confirm assumptions and unknowns are clearly labeled instead of silently filled in.
