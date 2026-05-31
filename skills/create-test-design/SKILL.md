---
name: create-test-design
description: Create Japanese Markdown test design artifacts from test analysis viewpoints, questionnaires, test plans, specifications, README files, existing tests, and implementation notes. Use when Codex needs to expand test viewpoints into traceable, sufficiently decomposed test designs (テスト設計), test patterns, conditions, execution methods, expected-result judgment points, and a Markdown questionnaire for unknowns from テスト分析.
---

# Create Test Design

## Overview

Create a test design document that answers "how should each test viewpoint be tested?" at the design-pattern level. Keep the output more concrete than test analysis, but do not turn it into low-level execution logs or fully scripted test cases unless the user explicitly asks.

Default to Japanese output. Preserve traceability from each test design back to the originating test viewpoint, test approach, specification, and product risk.

When test analysis records origin or decomposition hints in `備考` such as `由来: 仕様準拠`, `由来: 汎用QA`, or `ケース分解候補: 境界直前/境界/境界直後`, consume those hints during design. Keep the existing output table columns unchanged; express technique, partition, and decomposition intent inside `テストパターン`, `条件/入力`, `期待結果/判定観点`, and `状態`.

## Workflow

1. Locate the test analysis. If not specified, prefer `テスト成果物/テスト分析.md` or similarly named Markdown files.
2. Locate the related analysis questionnaire. If not specified, prefer `テスト成果物/テスト分析_質問票.md`.
3. Locate the test plan. If not specified, prefer `テスト成果物/テスト計画書.md`.
4. Gather source material in this order:
   - User-provided design instructions, constraints, and target artifacts.
   - Test analysis, especially every `TVxxx` viewpoint and its traceability.
   - Test analysis questionnaire, especially unresolved questions that affect design.
   - Test plan, especially `TAxxx` approaches, product risks, scope, and exit criteria.
   - Product specifications such as `spec/`, `docs/`, files named `仕様書`, requirement IDs, or feature lists.
   - README and user-facing documentation.
   - Existing tests and implementation files only when they clarify testability, inputs, outputs, or missing design detail.
5. Extract every test viewpoint ID from the analysis, such as `TV001`, `TV002`, and its approach ID, category, viewpoint, specification reference, risk ID, priority, and notes.
   - Preserve analysis notes such as `由来`, `ケース分解候補`, unresolved questions, and source confidence.
6. Apply the Design Expansion Model to every viewpoint.
   - Choose one or more generic test design techniques appropriate to the target type and risk.
   - Create one or more test designs for every viewpoint.
   - Split high-risk, boundary, abnormal, calculation, security, performance, compatibility, accessibility, state, combination, recovery, persistence, concurrency, and environment-difference viewpoints into multiple design rows when one row would hide important defect classes.
7. If a design depends on unanswered information, keep the design row, set `状態` to `質問待ち`, mark unclear fields as `要確認`, and add a linked question to the design questionnaire.
8. If design reveals a missing analysis viewpoint, product risk, or test approach, update upstream artifacts directly when supported by source material. Record all changes in the design document.
9. Run the design density self-check before finishing.
10. Save the test design document and questionnaire. If the user does not specify paths, save them next to the analysis as `テスト設計.md` and `テスト設計_質問票.md`.

## Design Expansion Model

For each `TVxxx`, expand from analysis-level intent into design-level patterns in this order:

1. Confirm the viewpoint source and risk.
   - `由来: 仕様準拠` means the design must preserve the explicit requirement or acceptance condition.
   - `由来: 汎用QA` means the design must translate the general QA concern into a target-appropriate pattern.
2. Select the applicable generic test design technique.
   - Record the technique name or pattern family in `テストパターン`.
   - Do not add new columns to the design table.
3. Decompose meaningful partitions.
   - Use `ケース分解候補` from analysis when present.
   - Split into multiple `TDxxx` rows when different values, states, roles, environments, timings, error modes, or recovery paths need distinct expected results or execution methods.
4. Define conditions and expected judgment.
   - Put value ranges, partitions, states, preconditions, input classes, or environment combinations in `条件/入力`.
   - Put observable outcomes, invariants, acceptance criteria, logs/evidence, or failure-handling expectations in `期待結果/判定観点`.
5. Mark uncertainty explicitly.
   - Use `状態=質問待ち` and add a questionnaire item when a design depends on unsupported assumptions.

The output should prepare executable units for later test case creation. A later case-generation skill should be able to create concrete cases from each `TDxxx` without guessing the intended partition or risk.

## Generic Test Design Technique Catalog

Use this catalog generically across application types such as Web UI, API, CLI, libraries, batch jobs, data processing, mobile, reports, documents, integrations, and infrastructure tools. Select only techniques that fit the target and risk.

- **Equivalence partitioning / 同値分割**: Valid, invalid, empty, null, missing, malformed, unsupported, duplicated, and minimum/maximum representative classes.
- **Boundary value analysis / 境界値分析**: Just below, at, just above, minimum, maximum, overflow, underflow, precision, length, count, date/time, and numeric display boundaries.
- **Decision table / デシジョンテーブル**: Business rules, eligibility, permissions, feature flags, configuration combinations, and conditional outputs.
- **State transition / 状態遷移**: Initial, intermediate, terminal, retry, cancel, timeout, recovery, repeated operation, and invalid transition patterns.
- **Pairwise or combinatorial design**: Browser/device, OS/runtime, locale, role, data type, configuration, integration mode, and feature option combinations.
- **Lifecycle or CRUD matrix**: Create, read, update, delete, restore, archive, import, export, idempotency, and reprocessing patterns.
- **Role and permission matrix**: Unauthenticated, authenticated, authorized, unauthorized, owner, member, administrator, read-only, and external actor patterns.
- **Compatibility matrix**: Platform, browser, device, viewport, dependency version, file format, protocol, and backward/forward compatibility patterns.
- **Error and recovery patterns**: Validation error, system error, network failure, partial failure, retry, rollback, compensation, user correction, and degraded operation.
- **Security and privacy patterns**: Injection, authorization bypass, sensitive data exposure, auditability, session/token handling, rate limits, and data minimization.
- **Performance and reliability patterns**: Normal load, peak load, sustained load, large data, timeout, resource exhaustion, restart, failover, and graceful degradation.
- **Accessibility and usability patterns**: Keyboard operation, focus order, screen reader names, contrast, resize/reflow, error comprehension, and efficient repeated operation.
- **Data integrity and persistence patterns**: Save/load, transaction boundary, consistency, uniqueness, ordering, rounding, migration, backup/restore, and cross-session behavior.
- **Concurrency and timing patterns**: Simultaneous operation, race condition, locking, eventual consistency, delayed processing, scheduled execution, and clock/time-zone effects.
- **Observability and evidence patterns**: Logs, audit records, metrics, trace IDs, exported evidence, failure messages, and operator-visible diagnostics.

## Anti-Compression Rules

Do not compress materially different design concerns into a single broad row when that would make later test cases vague or too few.

- For high-risk viewpoints, do not combine normal, boundary, and abnormal patterns into one row unless the expected judgment is truly identical and the partitions are still explicit.
- Do not hide `境界直前/境界/境界直後`, `最小/最大/超過`, or `空/不正/未指定` inside one generic boundary row when separate outcomes matter.
- Do not combine role/permission, state/lifecycle, browser/platform, locale/time, or configuration differences into one row when they change behavior or risk.
- Do not combine success, validation failure, system failure, retry, rollback, and recovery into one row for high-risk behavior.
- Keep design rows focused enough that test cases can be generated mechanically from the row, but stop before click-by-click or command-by-command procedure details.

## Design Density Self-Check

Before saving, inspect the design density from the perspective of downstream test case creation.

- For each high-risk `TVxxx`, check whether normal, boundary, abnormal, state/combination, and relevant non-functional or security concerns have appropriate `TDxxx` rows.
- If a high-risk `TVxxx` has only one design row, either split it or record why one row is sufficient.
- If `ケース分解候補` exists, confirm that each meaningful candidate is visible in `テストパターン` or `条件/入力`.
- If a design row would require the next skill to infer values, states, roles, environments, or expected results, refine it or mark it `質問待ち`.
- Avoid adding low-value rows only to increase count; sufficiency means risk-appropriate coverage, not mechanical expansion.

## Output: Test Design

Use this Markdown structure:

```markdown
# テスト設計

## 1. 設計対象
## 2. 参照資料
## 3. テスト設計
## 4. 質問待ち項目
## 5. 上流成果物への追記・更新
## 6. カバレッジ確認
```

The `## 3. テスト設計` section must be grouped by `テストレベル/タイプ`. Use headings such as `### 3.1 Unit` and repeat this traceability table in each group:

```markdown
| テスト設計ID | テスト観点ID | テストアプローチID | テストレベル/タイプ | 優先度 | テストパターン | 条件/入力 | 実施方法 | 期待結果/判定観点 | 仕様 | リスクID | 状態 |
|---|---|---|---|---|---|---|---|---|---|---|---|
```

Column guidance:

- **テスト設計ID**: Use stable IDs such as `TD001`, `TD002`, `TD003`. Keep IDs unique and sequential.
- **テスト観点ID**: Reference the originating `TVxxx`. Every `TVxxx` from the analysis must appear at least once.
- **テストアプローチID**: Reference the originating `TAxxx`. Use the value from the analysis unless an upstream update is made.
- **テストレベル/タイプ**: Use values such as `Unit`, `Integration`, `E2E`, `Security`, `Performance`, `Compatibility`, `Accessibility`, `Manual`, `Code review`, `Exploratory`, or `Regression`. Treat `Unit` and `Integration` as test levels, and security, performance, compatibility, accessibility, manual, code review, exploratory, and regression as test types or focus areas.
- **優先度**: Use `高`, `中`, or `低`. Prioritize by product risk, user impact, defect likelihood, and execution value.
- **テストパターン**: Name the design pattern concisely, such as representative value, boundary value, invalid input, browser comparison, random fixed condition, or code review.
- **条件/入力**: State concrete input conditions, data combinations, environment conditions, or `要確認`.
- **実施方法**: State how to test, such as automated unit test, existing test extension, browser E2E, manual browser check, DevTools network check, performance measurement, or code review.
- **期待結果/判定観点**: State the pass/fail judgment point. If the expected value or threshold is unknown, use `要確認` and link a question.
- **仕様**: Reference specification sections, feature IDs, README sections, existing tests, or `要確認`.
- **リスクID**: Reference product risk IDs. Use `なし` when no direct risk exists.
- **状態**: Use `設計済み`, `質問待ち`, or `上流更新済み` as the base values.

## Test Design Guidance

Derive design rows using these patterns as applicable. These categories may be used as `テストパターン` values or as part of a more specific pattern label.

- **Representative values**: Typical user scenarios, README examples, default values, common ranges.
- **Boundary values**: Minimum, maximum, zero, empty, threshold transitions, age boundaries, percentage boundaries, tax brackets.
- **Abnormal values**: Negative, blank, non-numeric, decimal where integers are expected, too large, inconsistent ranges, impossible combinations.
- **State and sequence**: Add/delete/update flows, repeated execution, before/after actions, cross-period carryover.
- **Calculation detail**: Formula inputs, rounding, ordering, tax handling, totals, precision, and expected-value source.
- **Integration behavior**: Cross-feature combinations, random event plus investment withdrawal, UI input to result output.
- **Compatibility**: Browser differences, device or viewport conditions, `file://` execution, locale/currency formatting.
- **Usability/accessibility**: Keyboard operation, focus, labels, readability, scrollability, warning visibility.
- **Security/privacy**: XSS/input interpretation, dynamic HTML generation, external communication, local-only behavior.
- **Performance/reliability**: Runtime, rendering volume, repeated execution, memory growth, long-running simulations.
- **Exploratory**: High-risk combinations, ambiguous requirements, user misunderstanding, overtrust, surprising outputs.

When analysis `備考` contains a decomposition hint, reflect it in separate rows or explain the reason for not splitting in the design narrative or questionnaire. For example, a boundary hint should result in design patterns that distinguish the relevant boundary classes, not a single opaque row.

Keep each design row actionable enough for later test case creation. Do not over-specify exact click-by-click procedures unless the source material already defines them or the user explicitly asks.

## Upstream Updates

Update upstream artifacts when test design discovers:

- A missing test viewpoint needed to cover a test approach or product risk.
- A missing product risk or missing test approach that is important enough to track at plan level.
- A traceability error between `TDxxx`, `TVxxx`, `TAxxx`, specification references, or risk IDs.
- A question that invalidates an existing analysis or plan statement unless clarified.

When updating:

- Preserve existing file names, section order, ID style, and table style.
- Add new IDs sequentially, such as `TV064`, `TA019`, or `R012`.
- Record each update under `## 5. 上流成果物への追記・更新`.
- Prefer explicit `要確認` and questionnaire entries over unsupported assumptions.
- Do not edit product specifications, README files, product code, or unrelated artifacts unless the user explicitly asks.

## Output: Questionnaire

Save questions as Markdown with this structure:

```markdown
# テスト設計 質問票

## 1. 質問一覧
| 質問ID | 関連テスト設計ID | 関連テスト観点ID | 関連テストアプローチID | 質問 | 回答が必要な理由 | 回答者候補 | 優先度 |
|---|---|---|---|---|---|---|---|
```

Question guidance:

- Ask only questions that affect test design, expected results, input patterns, execution method, environment, evidence, automation feasibility, or upstream artifact updates.
- Carry forward unresolved analysis questions when they still block test design, and link them to the affected `TDxxx`.
- Use concrete questions about expected values, rounding tolerance, target browsers, performance measurement method, randomness control, accessibility criteria, evidence format, and acceptable behavior for ambiguous edge cases.
- Use priorities `高`, `中`, and `低`.
- If there are no questions, still save the questionnaire and state `現時点で質問はありません。`

## Coverage Requirements

- Confirm every `TVxxx` from the test analysis appears in the design table.
- Confirm every `TAxxx` from the test plan remains covered through at least one `TDxxx`.
- Confirm every high-risk product risk has enough design depth to support later test case creation.
- Confirm analysis `備考` was consumed: `由来` should be preserved in intent, and `ケース分解候補` must be reflected or explicitly deferred.
- Confirm selected design techniques are visible in `テストパターン` or clear from the design row.
- Confirm all `質問待ち` rows have linked questionnaire entries.
- Confirm all upstream updates are actually applied and documented.

## Quality Checklist

Before finishing:

- Confirm the design document and questionnaire are saved at the requested or default paths.
- Confirm `## 3. テスト設計` is grouped by `テストレベル/タイプ`, and each group repeats the table header.
- Confirm each design row has `TDxxx`, `TVxxx`, `TAxxx`, test level/type, priority, condition/input, execution method, expected-result judgment, specification reference, risk ID or `なし`, and status.
- Confirm the design table shape is unchanged; no extra columns were added.
- Confirm analysis `備考` origin and decomposition hints were considered.
- Confirm `ケース分解候補` is reflected in `TDxxx` rows or the reason for deferral is recorded.
- Confirm high-risk `TVxxx` entries are decomposed enough to cover normal, boundary, abnormal, state/combination, and relevant non-functional or security concerns where applicable.
- Confirm `テストパターン` makes the selected design technique or pattern family visible.
- Confirm no high-risk row compresses materially different defect classes into one vague design.
- Confirm the design is detailed enough to become test cases, but is not merely a test execution log.
- Confirm unsupported details are marked `要確認` rather than invented.
- Confirm the questionnaire only contains questions that materially affect design or execution.
- Confirm traceability from `TDxxx` to `TVxxx`, `TAxxx`, specification, and `Rxxx` is clear.
