---
name: review-test-cases
description: Review Japanese Markdown and CSV test case artifacts against test design, questionnaires, test analysis, test plans, specifications, and QA execution quality criteria. Use when Codex needs to assess or improve テストケース files, including separate code-based, E2E automated, human-executed, question-wait Markdown files, the companion human-executed CSV, traceability from TC-* to TDxxx/TVxxx/TAxxx, question-wait handling, one-TC-one-independently-reportable-judgment readiness, or test-case executability; prioritize findings, fix P0/P1/P2 fix-worthy issues, re-review until no P0/P1/P2 fix-worthy issues remain, and save the final review result as Markdown.
---

# Review Test Cases

## Overview

Review and improve test case artifacts so they can be handed to implementers or human testers without losing traceability, coverage, or executability. The default artifact set is four Markdown files: code-based, E2E automated, human-executed, and question-wait test cases, plus a companion CSV for human-executed cases. Focus on traceability, test design coverage, execution category validity, case granularity, input clarity, step reproducibility, expected-result judgment, question-wait handling, human CSV parity, risk alignment, evidence, gaps, and maintainability.

Default to Japanese output. This skill may edit the reviewed test case files when the user asks for the full review-and-fix workflow. Do not edit product specifications, README files, product code, existing tests, or unrelated artifacts unless the user explicitly asks. Edit upstream QA artifacts only when the test case review uncovers a clear design-, analysis-, or plan-level gap that should be fixed and the user request allows fixing related artifacts.

## Core Review Gate

Apply this gate before treating traceability coverage as sufficient:

- A test design row may group a condition family, but an executable test case row must be one concrete execution and one independently reportable Pass/Fail/N/A judgment.
- If a failed `TC-*` would require reading subtest output, loop labels, screenshots for multiple environments, or manual notes to know which condition failed, the `TC-*` is too broad unless it explicitly defines an aggregate-judgment scenario.
- Values, environments, roles, API statuses, file types, and data states that can fail independently should normally be separate `TC-*` rows.
- Vague executor-choice words such as `など`, `付近`, `適切`, `任意`, `複数`, `各`, `代表`, `正常値`, and `異常値` are findings unless the row provides concrete values or is marked `要確認`.
- Cross-row shortcuts such as `同上`, `前述と同じ`, `同条件`, and `同様` are findings because each executable row must stand alone.
- Inputs that name only internal variables, derived states, or intermediate conditions are findings unless the row also states how to create that state through executable setup, fixtures, API arguments, files, UI operations, database records, mocks, clocks, or dependency responses.
- Expected results with multiple independent observation points are findings unless the row explicitly defines a single scenario or aggregate judgment.
- Markdown table integrity is part of executability. Broken column counts or unescaped `|` characters in cells are at least `P1` findings.

## Workflow

1. Locate the test case artifacts. If the user does not specify them, prefer this four-file set:
   - `テスト成果物/テストケース_コードベース.md`
   - `テスト成果物/テストケース_E2E自動.md`
   - `テスト成果物/テストケース_人間実行.md`
   - `テスト成果物/テストケース_質問待ち.md`
   - `テスト成果物/テストケース_人間実行.csv`
   If only a legacy consolidated `テスト成果物/テストケース.md` exists, review it as a legacy artifact and consider missing split files as a structural finding only when the current user request or skill version requires split files.
2. Gather source material in this order:
   - User-provided review instructions and acceptance criteria.
   - Test case files, especially every `TC-*` row, file placement, execution category, status, expected result, evidence, coverage table, and human CSV row.
   - Test design and design questionnaire, especially every `TDxxx` row and `DQxxx` linked to question-wait cases.
   - Test analysis and analysis questionnaire.
   - Test plan, especially test approaches, product risks, scope, and exit criteria.
   - Product specifications such as `spec/`, `docs/`, files named `仕様書`, requirement IDs, or feature lists.
   - README, existing tests, QA artifacts, and implementation files only when they clarify testability, inputs, outputs, or existing coverage.
3. Review the test cases using the review perspectives below. Run the Core Review Gate and compressed-condition scan before concluding that coverage is acceptable.
4. List findings with priority, grounded in the test cases and source material.
5. Fix all `P0`, `P1`, and `P2` findings that are actually fixable from available information. Fix `P3` findings only when the correction is low-risk and clearly supported by the source material.
6. Re-review the edited artifacts. Repeat review and fix until no `P0`, `P1`, or `P2` findings remain.
7. Save the final review result as Markdown. If the user does not specify a path, save it next to the reviewed test case files as `テストケースレビュー結果.md`.

## Priority Rules

Use these priorities consistently:

- **P0 - Blocker**: The test cases cannot be used for execution or downstream automation. Examples: missing required test case files, missing test case tables, no `TC-*` IDs, missing execution-category structure, severe Markdown table breakage across an artifact, CSV that cannot be parsed at all, or coverage tables missing enough information to determine whether `TDxxx` designs are covered.
- **P1 - High**: The test cases are usable but have a problem that should be fixed before relying on them. Examples: any `TDxxx` from the test design is not covered across the artifact set, missing traceability to `TDxxx`/`TVxxx`/`TAxxx`, high-risk area too thin, impossible or ambiguous execution steps, cross-row shortcuts that make a row non-standalone, inputs that are only internal/derived state with no executable setup, multiple independently meaningful inputs/boundaries/abnormal values/browsers/environments/roles/API statuses/file types/data states compressed into one executable `TC-*` row without an explicit aggregate-judgment rationale, multiple independent expected observations in one row, expected result that cannot be judged and is not marked `要確認`, question-wait case without `DQxxx`, Markdown table row column mismatch, missing required human CSV, human CSV missing or adding `TC-MAN-*` rows compared with the Markdown human file, serious CSV header/quoting errors, serious execution-category misclassification or wrong file placement, duplicate `TC-*` across files without an explicit duplication policy, or contradiction with test design or plan.
- **P2 - Medium**: The test cases can be used, but clarity, completeness, or maintainability should be improved. Examples: minor duplication, vague preconditions, weak evidence description, inconsistent terminology, non-critical missing reference, low-risk case granularity that is somewhat uneven but still independently reportable, or aggregate-case rationale that is present but weak.
- **P3 - Low**: Nice-to-have cleanup. Examples: formatting polish, wording consistency, or optional extra examples.

Treat `P0`, `P1`, and `P2` as fix-worthy findings. Continue the fix/re-review loop until none remain, except when the finding cannot be fixed because required information is unavailable; in that case, record the blocker clearly and add or confirm a questionnaire entry. Treat `P3` as optional cleanup.

## Review Perspectives

Review from these perspectives:

- **Traceability**: Confirm each `TC-*` links to a valid `TDxxx`, `TVxxx`, `TAxxx`, specification reference, and risk ID or `なし`.
- **Test design coverage**: Confirm every `TDxxx` from the test design appears in at least one test case across the split files and in a coverage table.
- **File structure and placement**: Confirm the artifact set has `テストケース_コードベース.md`, `テストケース_E2E自動.md`, `テストケース_人間実行.md`, and `テストケース_質問待ち.md`, unless the user explicitly requested a legacy consolidated file.
- **Human CSV parity**: Confirm `テストケース_人間実行.csv` exists, is parseable, has the required header, contains the same non-question-wait `TC-MAN-*` rows as `テストケース_人間実行.md`, and keeps shared field values aligned.
- **Execution category validity**: Confirm cases are naturally classified as `コードベース`, `E2E自動`, or `人間実行`, and that non-question-wait cases are placed in the matching execution file.
- **Test case granularity**: Confirm each case is split at a practical execution unit, especially for representative values, boundary values, abnormal values, browser/environment differences, roles, API statuses, file types, data states, and question-wait conditions. A practical unit is one independently reportable Pass/Fail/N/A judgment, not one automation loop, one parameter table, one checklist with hidden sub-results, or one broad row copied from test design.
- **Row independence**: Confirm every executable row can be executed by reading that row alone. Flag `同上`, `前述と同じ`, `同条件`, `同様`, and references to another row for setup, input, steps, or expected result.
- **Precondition and input clarity**: Confirm setup, initial state, browser/environment, concrete values, account/role, external dependency state, and data conditions are clear or explicitly marked `要確認`.
- **Executable input validity**: Confirm `入力/データ` describes executable inputs or setup artifacts, not only internal variables, derived values, or target states. If an internal state is the purpose, the row must explain how to create it.
- **Step reproducibility**: Confirm a human tester or automation implementer can reproduce the same execution from the written steps without hidden assumptions.
- **Expected-result judgment clarity**: Confirm pass/fail judgment can be made for one case. If the expected result contains multiple independent observation points, split the row or require an explicit aggregate-judgment rationale. If an expected value, threshold, tolerance, environment, or acceptance rule is unknown, it must be marked `要確認` and linked to a question ID.
- **Question-wait management**: Confirm every `質問待ち` case has a `DQxxx`, appears in `テストケース_質問待ち.md`, keeps its planned `実行区分`, and is not duplicated into execution files unless the user explicitly requested duplicate listing.
- **Priority and risk alignment**: Confirm high-risk or priority-marked designs lead to sufficient risk-aligned test cases, and low-risk checks are not over-expanded without reason.
- **Confirmation method and evidence validity**: Confirm `確認方法/証跡` states suitable evidence such as unit test results, E2E logs, screenshots, browser output, DevTools records, performance measurements, or code review records.
- **Duplication, gaps, and contradictions**: Confirm there is no harmful duplication, missing valuable case, contradiction between cases and design, or unsupported assumption.
- **Upstream alignment**: Confirm the cases remain consistent with the test design, design questionnaire, test analysis, analysis questionnaire, test plan, product risks, and scope.
- **Maintainability**: Confirm ID prefixes, numbering, terminology, state values, table structure, and coverage mapping are consistent and easy to update.
- **Markdown table integrity**: Confirm each table row has the same number of cells as the header and cells do not contain unescaped `|` characters that break parsing.
- **CSV integrity**: Confirm the human CSV uses valid CSV quoting, has no Markdown table syntax, and includes blank execution-record columns such as `実行日`, `実行者`, `実行環境`, `実結果`, `判定`, `証跡リンク`, and `備考`.

## Compressed-Condition Scan

In addition to semantic review, scan executable rows for these common smells:

- Separators in `入力/データ`, `前提条件`, `手順`, or `期待結果`: `/`, `、`, `,`, `・`, `または`, `or`, ranges, and slash lists.
- Boundary bundles: `直前・境界・直後`, `下限/上限`, `min/max`, `0/1/100`, dates around month/year/day boundaries.
- Representative or abnormal bundles: `代表値`, `正常値`, `異常値`, `空欄/文字列/非有限値`, `null/empty/malformed`.
- Environment matrices: browser, OS, device, viewport, orientation, locale, timezone, permission, network, feature flag, build mode, and external service lists.
- Data or actor matrices: user roles, tenants, plans, account states, API statuses, file formats, data sizes, and dependency responses.
- Executor-choice words: `など`, `付近`, `適切`, `任意`, `複数`, `各`, `すべて`, `必要な項目`.
- Cross-row shortcuts: `同上`, `前述と同じ`, `同条件`, `同様`, `上記`, and references that require another row to execute.
- Internal-state-only inputs: `need=...`, `cacheHit=...`, `session expired`, `DB is inconsistent`, `already calculated`, or other target states with no setup method.
- Multiple observation phrases: `最初と最後`, `開始時と終了時`, `前後`, `AとBを確認`, `Xでは...、Yでは...`, multiple screens, multiple output rows, or multiple state transitions.
- Markdown table hazards: unescaped `|`, raw `||`, shell pipes, regex alternation, TypeScript union syntax, or row column counts that differ from the header.
- Human CSV hazards: missing `テストケース_人間実行.csv`, CSV row count or `TC-MAN-*` mismatch with the Markdown human file, missing execution-record columns, invalid quote escaping, unquoted embedded commas/newlines, or Markdown table pipes inside CSV cells.

These are not automatically defects inside explanatory text, but they require a review decision. Split when each listed item can pass/fail independently. Keep one row only when the row explicitly defines a single scenario flow or an aggregate judgment, and the evidence can support that aggregate judgment.

For Markdown tables, structural hazards are defects when they affect a table row. Rewrite or escape table-breaking text even when the intended test meaning is otherwise clear.

For the human CSV, parse it as CSV rather than by splitting on commas. Validate the parsed header and `テストケースID` values against the Markdown human-executed rows.

## Finding Format

During each review pass, present findings first and sort by priority. Use this table:

```markdown
| 優先度 | 観点 | 問題 | 場所 | 影響 | 修正方針 |
|---|---|---|---|---|---|
```

Guidelines:

- Ground every finding in the test cases, design, questionnaire, analysis, test plan, or source material.
- Do not create a finding merely because optional detail is absent.
- Treat missing coverage for any `TDxxx` as at least `P1`.
- Treat an executable case that lists multiple independent representative values, boundaries, abnormal values, browsers, environments, roles, API statuses, file types, data states, or scenarios in one row as `P1` unless the row explicitly defines an aggregate-judgment scenario.
- Treat a low-risk compressed row as `P2` only when it is still independently reportable and the compression does not hide which condition passed or failed.
- Treat slash-separated, comma-separated, Japanese comma-separated, or range-like values such as `3,000,000/4,000,000/10,000,000円`, `直前/境界/直後`, `空欄/文字列/非有限値`, `Chrome/Firefox/Safari`, or `800x600/1280x720` as review smells; require splitting when each value could produce a distinct result.
- Treat executor-choice words such as `など`, `付近`, `適切`, `任意`, `複数`, `各`, `代表`, `正常値`, or `異常値` as at least `P2`; raise to `P1` when the row cannot be executed or judged without the reviewer choosing values.
- Treat cross-row shortcuts such as `同上`, `前述と同じ`, `同条件`, or `同様` in executable rows as `P1`.
- Treat input/data that only names internal or derived state, without executable setup, as `P1`.
- Treat expected results that contain multiple independent observation points as `P1` unless the row explicitly defines an aggregate scenario.
- Treat Markdown table row column mismatches, or unescaped `|` that breaks a test case row, as `P1`; raise to `P0` when table breakage is widespread enough to prevent reviewing the artifact.
- Treat a missing `テストケース_人間実行.csv` as `P1` when the current artifact standard or user request expects it.
- Treat human CSV `TC-MAN-*` row mismatch against `テストケース_人間実行.md` as `P1`.
- Treat invalid CSV quoting or missing required CSV headers as `P1`; raise to `P0` when the CSV cannot be parsed at all.
- Treat a `質問待ち` case without a linked `DQxxx` as at least `P1`.
- Treat an expected result that cannot be used for pass/fail and is not marked `要確認` as at least `P1`.
- Treat an execution-category mismatch that would send the case to the wrong executor as at least `P1`.
- Treat a `質問待ち` case placed only in an execution file instead of the question-wait file as at least `P1`.
- Treat duplicated `TC-*` rows across split files as at least `P1` unless the user explicitly requested duplicate listing.
- Mark unavailable source facts as `要確認`; do not invent them.
- If no findings exist at a priority, say so clearly.

## Fix Rules

When fixing artifacts:

- Preserve existing file names, section order, ID style, `TC-*` stability, and traceability style unless the issue requires structural correction.
- Fix `P0`, `P1`, and `P2` issues directly in the relevant test case files using source-supported content.
- Add test case IDs sequentially within the matching execution category, such as `TC-CB-044`, `TC-E2E-083`, or `TC-MAN-035`.
- When fixing compressed cases, split the row into multiple `TC-*` rows with one concrete input/condition per row. Preserve the original `TDxxx`, `TVxxx`, `TAxxx`, specification, and risk IDs on each split row, and give each row a test name that identifies the specific value or boundary.
- When a design row intentionally becomes several test cases, update the coverage table so the same `TDxxx` maps to all resulting `TC-*` IDs.
- Replace cross-row shortcuts with full row-local setup, input, step, and expected-result text.
- Replace internal-state-only inputs with executable setup. For example, write the API request, fixture, database record, file content, UI operation, mock response, or clock setting that produces the state.
- Split rows with multiple independent observation points, or add a clear aggregate-judgment rationale only when the scenario truly must be judged as one flow.
- Fix Markdown table hazards by escaping `|`, rewriting `||` and pipe-heavy snippets in prose, or moving code examples outside the table. Recheck column counts after editing.
- Regenerate `テストケース_人間実行.csv` from the Markdown human-executed rows when fixing human case IDs, shared columns, ordering, or wording. Preserve blank execution-record columns.
- Fix CSV quoting with a real CSV writer or careful RFC 4180 escaping. Do not hand-split CSV by commas.
- When the reviewed artifact set includes automation mapping, execution-report templates, or implemented test names, align those references with the split `TC-*` IDs. If those files are out of scope for the user request, record the downstream mismatch as a residual risk instead of silently leaving it unmentioned.
- Do not create suffix IDs such as `TC-CB-001-a` unless the existing project explicitly uses that style; prefer new sequential IDs so each row is independently addressable by tools and reports.
- When converting a legacy consolidated `テストケース.md` to split files, move rows into `テストケース_コードベース.md`, `テストケース_E2E自動.md`, `テストケース_人間実行.md`, or `テストケース_質問待ち.md` according to `実行区分` and `状態`.
- Move `状態=質問待ち` rows to `テストケース_質問待ち.md` and keep their planned `実行区分`; after stakeholder answers are incorporated, move them to the matching execution file and update `状態` to `作成済み`.
- Keep the artifact at test-case table level. Do not implement automation code, test scripts, or execution logs unless explicitly requested.
- Prefer explicit traceability, `要確認`, and questionnaire entries over vague assumptions.
- If the review reveals a missing design row, add it to the test design and then add corresponding test cases.
- If the review reveals a missing question, add it to the design questionnaire and link the affected test cases.
- If the review reveals a missing analysis viewpoint or plan-level issue, update the relevant upstream artifact and record the action in the final review result.
- Do not edit product specifications, README files, product code, or existing tests unless explicitly requested.

## Final Review Result

Save a Markdown review result with this structure:

```markdown
# テストケースレビュー結果

## 1. レビュー対象
## 2. 参照資料
## 3. レビュー観点
## 4. レビュー・修正サマリー
## 5. 最終レビュー結果
## 6. 残課題
```

Final result requirements:

- Include the reviewed test case file paths and final review result path.
- Include the test design, design questionnaire, test analysis, test plan, and source documents used.
- Include the review perspectives applied.
- Summarize each review/fix iteration.
- State the result of the one-TC-one-judgment / compressed-condition scan.
- State the result of row-independence, executable-input, multiple-observation, and Markdown-table-integrity checks.
- State the result of human CSV parity and CSV integrity checks.
- State clearly that no `P0`, `P1`, or `P2` findings remain, or explain any remaining fix-worthy finding that could not be fixed because required information was unavailable.
- List remaining `P3` issues, if any, with recommended next actions.
- Mention any updates made to the test cases, test design, design questionnaire, test analysis, analysis questionnaire, or test plan.
