---
name: create-test-analysis
description: Create Japanese Markdown test analysis artifacts from a test plan, specifications, README files, existing tests, and implementation notes. Use when Codex needs to run a three-pass analysis that first derives specification-driven test viewpoints (テスト観点), then adds generally expected QA viewpoints for the target type, then re-examines whether additional missing viewpoints should be added, preserves traceability, updates the test plan when new risks or approaches should be added, and saves a Markdown questionnaire for open questions.
---

# Create Test Analysis

## Overview

Create a test analysis document that answers "what should be tested?" at the viewpoint level. Keep the output more detailed than a test plan but less concrete than test cases; do not write step-by-step procedures or expected results unless the user explicitly asks.

The analysis must use a three-pass model:

1. **Specification-driven pass**: derive viewpoints from explicitly documented requirements, test approaches, risks, README behavior, and existing tests.
2. **Generic QA pass**: classify the target type and add generally expected QA viewpoints that are not explicit in the source material but are commonly needed to make the analysis sufficient.
3. **Additional viewpoint challenge pass**: re-read the current analysis against the source material, risks, target type, and downstream design readiness, then add any materially missing viewpoints, questions, or plan updates that Pass 1 and Pass 2 still missed.

Default to Japanese output. Preserve traceability from each analysis viewpoint back to the originating test approach, specification, and risk.

## Workflow

1. Locate the test plan. If not specified, prefer `テスト成果物/テスト計画書.md` or similarly named Markdown files.
2. Gather source material in this order:
   - User-provided analysis instructions.
   - Test plan, especially product risks and test approaches.
   - Product specifications such as `spec/`, `docs/`, files named `仕様書`, requirement IDs, or feature lists.
   - README and user-facing documentation.
   - Existing tests and implementation files only when they clarify behavior or missing viewpoints.
3. Extract every test approach ID from the test plan, such as `TA001`, `TA002`, and its content, specification reference, risk ID, related scope, and exit-condition implications.
4. Create a **Source Structure Inventory（仕様構造インベントリ）** before writing viewpoints. Look for input fields, finite lists, enums, state sets, events, decision tables, pricing/tax/rate tiers, role/permission sets, supported environments, input ranges, boundary values, thresholds, formal/regression assets, performance thresholds, exception conditions, defaults, and explicitly documented exclusions.
   - Assign each structure one expansion policy: `全件展開`, `境界展開`, `組み合わせ展開`, `代表抽出`, or `質問待ち`.
   - Do not use a fixed minimum number of future cases. Preserve enough source structure for later skills to calculate the expected case yield from the source itself.
   - Source-defined finite sets are `全件展開` by default. Use `代表抽出` only for low-risk, large, same-judgment sets, and record the rationale and residual risk.
   - Boundary sets are `境界展開` by default when the boundary is meaningful; preserve `直前 / 境界 / 直後` or equivalent `below / at / above` hints when applicable.
   - Environment matrices are `組み合わせ展開` or `全件展開` when each environment can independently Pass/Fail. If aggregation may be acceptable, record the aggregate judgment rule needed downstream.
5. Run **Pass 1: Specification-Driven Viewpoints**. Derive viewpoints that cover all test approaches from explicitly documented specifications, README behavior, existing tests, product risks, constraints, acceptance thresholds, and the source-defined structures found above.
6. Run **Pass 2: Generic QA Viewpoints**. Classify the test target type in generic terms, such as Web UI, API, CLI, library/module, batch/job, data pipeline, mobile app, document/report output, integration, infrastructure, or configuration-driven system. Compare the Pass 1 viewpoints against the Generic QA Viewpoint Catalog below and add source-supported or generally necessary viewpoints that are missing.
7. Run **Pass 3: Additional Viewpoint Challenge**. Re-examine the draft analysis and ask whether any additional test viewpoints are still missing. Focus on bug-escape scenarios, overlooked high-risk combinations, downstream design readiness, traceability gaps, source structures without enough viewpoint coverage, and unclear assumptions that should become questions.
8. Mark each viewpoint's origin in the existing `備考` column. Use phrases such as `由来: 仕様準拠`, `由来: 汎用QA`, `由来: 追加観点検討`, and `ケース分解候補: 境界直前/境界/境界直後`. Do not add new table columns.
9. If analysis reveals a missing product risk or missing test approach that belongs in the test plan, update the test plan directly and record the change in the analysis document.
10. If information is unclear or should be asked of stakeholders, save it in a Markdown questionnaire. Do not invent expected values, supported environments, owners, or thresholds.
11. Perform the viewpoint-density self-check described below, then save the test analysis document and questionnaire. If the user does not specify paths, save them next to the test plan as `テスト分析.md` and `テスト分析_質問票.md`.

## Three-Pass Analysis Model

### Pass 1: Specification-Driven Viewpoints

Use Pass 1 to preserve strict requirement traceability. For each `TAxxx`, create viewpoints from:

- Explicit functional requirements, business rules, UI rules, data contracts, algorithms, workflow descriptions, and documented examples.
- Product risks, scope boundaries, exclusions, exit criteria, and required evidence.
- README usage instructions and existing test descriptions when they clarify expected behavior.
- Existing implementation details only when they clarify testability or reveal a documented behavior gap.

Pass 1 viewpoints should usually use `備考` values such as `由来: 仕様準拠` or `由来: 既存テスト`.

### Source Structure Preservation

When a source document defines a finite structure, preserve enough of that structure for later test design to expand it without rediscovery.

- For finite lists, enums, status values, roles, event types, supported platforms, browser sets, currencies, locales, file formats, and similar source-defined sets, either name the list in the viewpoint or add a `備考` note such as `対象リスト: ...` or `代表/全件判断: ...`.
- For ranges, thresholds, tiers, brackets, service levels, performance limits, date/time cutovers, or validity rules, include the relevant boundary set or point to the exact source section in `仕様` and add a case-splitting hint such as `ケース分解候補: 最小/最大/境界直前/境界/境界直後`.
- Do not convert the analysis into detailed cases. Preserve the structure compactly so downstream design can decide representative, pairwise, risk-based, or exhaustive coverage intentionally.
- If the source-defined structure is too large to list in the table, summarize its category and cite the source section precisely.

### Source Structure Inventory Contract

The analysis must include a `Source Structure Inventory` section. It is the upstream source for later expected test-case counts, so do not replace it with prose.

Use this table:

```markdown
| 構造ID | 種別 | 仕様 | 構造内容 | 展開方針 | 関連リスクID | 代表抽出理由/残留リスク | 下流分割ヒント |
|---|---|---|---|---|---|---|---|
```

Guidance:

- **構造ID**: Use stable IDs such as `SSI001`, `SSI002`, `SSI003`.
- **種別**: Use values such as `入力項目`, `有限リスト`, `境界値`, `状態`, `イベント`, `環境マトリクス`, `正式資産`, `性能閾値`, `例外条件`, `デフォルト`, or `除外`.
- **構造内容**: List concrete values, ranges, boundaries, states, events, environments, or cite the exact source section when the structure is too large.
- **展開方針**: Use only `全件展開`, `境界展開`, `組み合わせ展開`, `代表抽出`, or `質問待ち`.
- **代表抽出理由/残留リスク**: Required when `展開方針=代表抽出`, and especially required for any high-risk structure. High-risk representative extraction without rationale is a creation defect.
- **下流分割ヒント**: State the expected split shape, such as `全要素`, `直前/境界/直後`, `各環境別`, `ペアワイズ候補`, `1つでも失敗ならFail`, or `要確認`.

Broad words such as `代表値`, `異常値`, `各`, `複数`, `など`, and `適切` are blocker smells in this inventory unless concrete values, expected split shape, or `質問待ち` are also present.

### Pass 2: Generic QA Viewpoints

Use Pass 2 to challenge whether the Pass 1 analysis is sufficient for the target type. This pass must stay product-agnostic: do not add examples or expectations tied to a specific sample application unless the source material already supports them.

For each target type present in the product, compare Pass 1 against the Generic QA Viewpoint Catalog. Add missing viewpoints when they are generally necessary for the target's reliability, security, usability, operability, compatibility, or testability. When the source material does not define the expected result, create a viewpoint with `仕様=要確認` or add a questionnaire entry instead of guessing.

Pass 2 viewpoints should use `備考` values such as `由来: 汎用QA`, `追加候補`, `質問票あり`, and `ケース分解候補: ...`.

### Pass 3: Additional Viewpoint Challenge

Use Pass 3 as a deliberate gap-finding pass after Pass 1 and Pass 2 are already reflected in the table. Do not merely proofread the text. Actively look for missing viewpoints that could still let an important defect escape.

Review the draft analysis from these angles:

- **Bug-escape imagination**: Consider plausible serious defects a user, stakeholder, or maintainer would care about, then confirm each is covered by a viewpoint, a questionnaire item, or an explicit out-of-scope note.
- **High-risk cross-check**: For each high-risk `TAxxx` or `Rxxx`, confirm normal, boundary, abnormal, state/interaction, and relevant non-functional/security concerns are represented with enough granularity.
- **Source Structure Inventory coverage**: Confirm every `SSIxxx` row has at least one related viewpoint or a clear reason it does not need one.
- **Combination and interaction gaps**: Look for meaningful interactions between source-defined structures, user flows, environments, permissions, data states, timing, and configuration that neither Pass 1 nor Pass 2 covered.
- **Downstream design readiness**: Confirm downstream design can split the viewpoint into concrete patterns without rediscovering source values, inventing expected results, or guessing representative extraction rules.
- **Question and assumption surfacing**: Convert unclear expectations into `仕様=要確認` viewpoints and questionnaire rows when the uncertainty affects coverage, acceptance, or execution.

Add a new viewpoint only when it is materially different from existing Pass 1 or Pass 2 viewpoints. If Pass 3 finds no additions, record that explicitly in `## 6. カバレッジ確認`, such as `Pass 3では追加すべき独立観点なし。既存観点でカバー済み。`

Pass 3 viewpoints should use `備考` values such as `由来: 追加観点検討`, `バグ逃し想定`, `下流設計補強`, `質問票あり`, and `ケース分解候補: ...`.

## Generic QA Viewpoint Catalog

Use this catalog in Pass 2. Select only categories relevant to the target type and risk level; do not mechanically add every item to every product.

- **Input values and validation**: required/optional fields, empty values, null-equivalent values, invalid types, malformed values, whitespace, duplicates, ranges, length, decimal/precision, large values, special characters, encoding, file size, and upload/download shape.
- **Equivalence classes and boundaries**: minimum, maximum, just below/above thresholds, inclusive/exclusive boundaries, same-value conditions, overlapping ranges, unsupported values, default boundaries, and transition points.
- **State transitions and lifecycle**: create/read/update/delete, first use, repeated use, reset, cancel, retry, back/forward, undo/redo, timeout, restart, persistence, cleanup, and stale state.
- **Combinations and interactions**: pairwise or high-risk combinations, feature interactions, conflicting settings, ordering dependencies, precedence rules, permissions plus data state, and cross-step carryover.
- **Error handling and recovery**: validation errors, recoverable failures, partial failure, unavailable dependency, retry exhaustion, user cancellation, rollback, safe degradation, and useful error messages.
- **Security and privacy**: injection, XSS, CSRF, SSRF, authentication, authorization, secrets, PII handling, local-only guarantees, data retention, dependency trust, transport security, and auditability.
- **Performance and reliability**: response time, throughput, large data, long-running operations, resource usage, memory growth, concurrency, repeated execution, idempotency, and failure isolation.
- **Compatibility and portability**: browser, OS, device, viewport, runtime version, locale, timezone, file path, environment variables, network mode, and backward compatibility.
- **Accessibility and usability**: keyboard operation, focus order, labels, screen reader semantics, contrast, layout readability, responsive behavior, discoverability, destructive-action clarity, and helpful feedback.
- **Persistence and data integrity**: save/load, schema migration, duplicate prevention, referential integrity, sorting/filtering, rounding, aggregation, serialization, import/export, and corruption handling.
- **Concurrency and timing**: simultaneous users/actions, race conditions, debouncing, async ordering, clock changes, scheduled jobs, eventual consistency, and timeout boundaries.
- **Randomness and nondeterminism**: seed/control strategy, probability extremes, repeatability, flaky outputs, randomized order, and stable evidence capture.
- **Locale, time, and numeric display**: currency, units, date/time formats, daylight saving time, calendars, number separators, rounding, precision, and language fallback.
- **Configuration and environment differences**: defaults, missing config, invalid config, feature flags, secrets, deployment profiles, offline/online modes, and fallback behavior.
- **Observability, logs, and evidence**: user-visible messages, logs, metrics, audit trails, trace IDs, screenshots, raw outputs, and reproducible failure evidence.

## Viewpoint Density Self-Check

Before saving, check whether each high-risk `TAxxx` has enough viewpoint depth. High-risk areas usually need multiple viewpoint categories, not just one representative normal-flow viewpoint.

For high-risk approaches, confirm that the analysis includes, or explicitly explains why it does not include:

- Normal or representative behavior.
- Boundary or threshold behavior.
- Abnormal, invalid, or missing input behavior.
- State transition, ordering, or interaction behavior when the target has state.
- Security/privacy, reliability/performance, compatibility, or accessibility behavior when relevant to the target type.
- Case-splitting hints in `備考` when a single viewpoint contains multiple meaningful values or conditions.

If a high-risk approach lacks these categories and the missing category is relevant, add viewpoints or questions before finalizing.

## Test Viewpoint Guidance

For each test approach, derive viewpoints from these categories as applicable:

- **Normal behavior**: Typical user inputs, standard scenarios, expected flows, documented examples.
- **Default values**: Initial values, default selections, initial display, default output, no-input behavior.
- **Boundary values**: Min/max values, zero, empty, same-value boundaries, date/time transition points, tier thresholds, percentages 0% and 100%.
- **Abnormal values**: Invalid, missing, negative, too large, decimal, non-numeric, inconsistent combinations, impossible ranges.
- **State transitions**: Before/after actions, add/delete flows, repeated execution, reset-like behavior, data not persisting.
- **Data and calculation**: Formulas, rounding, ordering, totals, business-rule handling, nondeterministic input effects, precision.
- **Compatibility**: Browsers, devices, screen sizes, locales, file execution mode, JavaScript availability.
- **Usability/accessibility**: Keyboard operation, focus order, readable output, scrollability, labels, operability at supported resolution.
- **Security/privacy**: Input sanitization, XSS, external communication, external dependencies, local-only behavior.
- **Performance/reliability**: Response time, large output, repeated runs, nondeterministic behavior reproducibility, long-running operations.
- **Exploratory concerns**: Combinations likely to surprise users, ambiguous requirements, high-risk workflows, overtrust or misunderstanding.

When one viewpoint contains many meaningful values or conditions, do not turn it into detailed test cases, but add a compact case-splitting hint in `備考`, such as `ケース分解候補: 最小/最大/最大超` or `ケース分解候補: 初回/再実行/削除後`.

When values in the same category have different expected handling, do not hide the difference behind one vague viewpoint. Split the viewpoint or state the handling difference in `備考`, for example `期待処理差分: 空は既定値/範囲外はエラー/未対応値は無視`.

Avoid unresolved question-style viewpoints such as `扱えるか確認する`, `問題ないか確認する`, or `適切に処理されるか` unless they are classified. Rewrite them as one of:

- A confirmed viewpoint with the expected handling from the source.
- A `仕様=要確認` viewpoint linked to the questionnaire.
- A source-supported precondition or exclusion, noted as `仕様前提` or `対象外確認` in `備考`.

## Output: Test Analysis

Use this Markdown structure:

```markdown
# テスト分析

## 1. 分析対象
## 2. 参照資料
## 3. Source Structure Inventory（仕様構造インベントリ）
## 4. テスト観点
## 5. テスト計画への追記・更新
## 6. カバレッジ確認
## 7. 未決事項
```

The `## 3. Source Structure Inventory（仕様構造インベントリ）` section must use the table defined in the `Source Structure Inventory Contract` section.

The `## 4. テスト観点` section must use a traceability table:

```markdown
| テスト観点ID | テストアプローチID | 観点カテゴリ | テスト観点 | 仕様 | リスクID | 備考 |
|---|---|---|---|---|---|---|
```

Column guidance:

- **テスト観点ID**: Use stable IDs such as `TV001`, `TV002`, `TV003`. Keep IDs unique and sequential.
- **テストアプローチID**: Use the originating test approach ID. If a viewpoint is newly discovered outside the plan, use `追加候補` and add a corresponding test plan update when warranted.
- **観点カテゴリ**: Use categories such as 正常系, デフォルト値, 境界値, 異常系, 状態遷移, 計算, 互換性, ユーザビリティ, アクセシビリティ, セキュリティ, 性能, 探索的.
- **テスト観点**: State what should be tested in one concise sentence. Do not include detailed test steps.
- **仕様**: Reference specification sections, feature IDs, README sections, or `要確認`.
- **リスクID**: Reference product risk IDs. Use `なし` when no direct risk exists.
- **備考**: Add short notes such as `由来: 仕様準拠`, `由来: 汎用QA`, `質問票あり`, `計画追記済み`, `追加候補`, or `ケース分解候補: 境界直前/境界/境界直後`.

Coverage requirements:

- Every source-defined structure that can affect coverage must appear in `Source Structure Inventory`, or be explicitly listed as out of scope with a source reference.
- Every test approach in the test plan must have at least one test viewpoint.
- Every analysis should show that Pass 1, Pass 2, and Pass 3 were performed, either through viewpoint `備考` values or coverage notes.
- High-risk approaches should usually have multiple viewpoints across normal, boundary, abnormal, state/interaction, and relevant non-functional or security concerns.
- Include default value and compatibility viewpoints when the product has UI inputs or browser/device constraints.
- Include generic QA viewpoints when the target type commonly requires them. If no generic QA viewpoint is added for a relevant category, state why in `## 5. カバレッジ確認` or `備考`.
- Include questions instead of silently deciding unknown business rules, target environments, owners, thresholds, or acceptance criteria.

## Updating The Test Plan

Update the test plan when analysis discovers:

- A product risk that is important enough to track at plan level.
- A test approach needed to cover a significant category not represented in the plan.
- A traceability issue where an existing approach has the wrong specification reference or risk ID.
- An exit condition or scope statement that conflicts with the analysis.

When updating:

- Preserve the existing style, IDs, and section order.
- Add new risk IDs or approach IDs sequentially.
- Record each change under `## 4. テスト計画への追記・更新`.
- Do not add unsupported details. Use `要確認` and the questionnaire when stakeholder input is needed.

## Output: Questionnaire

Save questions as Markdown with this structure:

```markdown
# テスト分析 質問票

## 1. 質問一覧
| 質問ID | 関連テスト観点ID | 関連テストアプローチID | 質問 | 回答が必要な理由 | 回答者候補 | 優先度 |
|---|---|---|---|---|---|---|
```

Question guidance:

- Ask only questions that affect analysis, test design, acceptance criteria, execution feasibility, or plan updates.
- Prefer concrete questions such as supported browser versions, performance measurement method, default value rationale, acceptable rounding tolerance, random behavior reproducibility, and formal regression asset status.
- Use priorities `高`, `中`, `低`.
- If there are no questions, still save the questionnaire and state `現時点で質問はありません。`. Do not add a dummy row such as `| - | - | - |`; either omit the table or leave only the header and separator.

## Quality Checklist

Before finishing:

- Confirm all test approach IDs from the test plan appear in the analysis coverage.
- Confirm Pass 1, Pass 2, and Pass 3 were all performed.
- Confirm each test viewpoint has a viewpoint ID, approach traceability, specification reference, and risk ID or `なし`.
- Confirm `Source Structure Inventory` exists and every row has a concrete expansion policy.
- Confirm source-defined finite lists default to `全件展開`, boundary sets preserve below/at/above-style split hints when meaningful, and environment matrices state whether each environment can fail independently.
- Confirm any `代表抽出` row contains risk rationale and residual risk, and any unknown structure is marked `質問待ち`.
- Confirm each viewpoint records its origin in `備考` without adding new columns.
- Confirm normal, boundary, abnormal, default value, compatibility, security/privacy, performance, and exploratory concerns are considered when relevant.
- Confirm high-risk `TAxxx` entries have sufficient viewpoint density across normal, boundary, abnormal, state/combination, and relevant non-functional or security categories.
- Confirm generic QA catalog categories relevant to the target type were considered.
- Confirm Pass 3 either added materially missing viewpoints/questions/plan updates or explicitly recorded that no independent additional viewpoints were found.
- Confirm source-defined finite lists, boundaries, thresholds, supported environments, defaults, and exclusions were preserved or precisely cited for downstream design.
- Confirm case-splitting hints are present in `備考` when a viewpoint would otherwise compress many meaningful test cases.
- Confirm viewpoints with different expected handling are split or explicitly describe the handling difference.
- Confirm question-style viewpoints are classified as confirmed, `要確認`, precondition, or exclusion.
- Confirm any test plan updates are actually applied and documented.
- Confirm open questions are saved in a questionnaire Markdown file.
- Confirm a no-question questionnaire has no dummy placeholder data rows.
- Confirm the analysis stays at viewpoint level and does not become detailed test cases.
