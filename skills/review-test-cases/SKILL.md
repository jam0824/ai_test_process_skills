---
name: review-test-cases
description: Review Japanese Markdown test case artifacts against test design, questionnaires, test analysis, test plans, specifications, and QA execution quality criteria. Use when Codex needs to assess or improve テストケース files, including separate code-based, E2E automated, human-executed, and question-wait Markdown files, traceability from TC-* to TDxxx/TVxxx/TAxxx, question-wait handling, or test-case readiness; prioritize findings, fix high-priority issues, re-review until no high-priority fix-worthy issues remain, and save the final review result as Markdown.
---

# Review Test Cases

## Overview

Review and improve test case artifacts so they can be handed to implementers or human testers without losing traceability, coverage, or executability. The default artifact set is four Markdown files: code-based, E2E automated, human-executed, and question-wait test cases. Focus on traceability, test design coverage, execution category validity, case granularity, input clarity, step reproducibility, expected-result judgment, question-wait handling, risk alignment, evidence, gaps, and maintainability.

Default to Japanese output. This skill may edit the reviewed test case files when the user asks for the full review-and-fix workflow. Do not edit product specifications, README files, product code, existing tests, or unrelated artifacts unless the user explicitly asks. Edit upstream QA artifacts only when the test case review uncovers a clear design-, analysis-, or plan-level gap that should be fixed and the user request allows fixing related artifacts.

## Workflow

1. Locate the test case artifacts. If the user does not specify them, prefer this four-file set:
   - `テスト成果物/テストケース_コードベース.md`
   - `テスト成果物/テストケース_E2E自動.md`
   - `テスト成果物/テストケース_人間実行.md`
   - `テスト成果物/テストケース_質問待ち.md`
   If only a legacy consolidated `テスト成果物/テストケース.md` exists, review it as a legacy artifact and consider missing split files as a structural finding only when the current user request or skill version requires split files.
2. Gather source material in this order:
   - User-provided review instructions and acceptance criteria.
   - Test case files, especially every `TC-*` row, file placement, execution category, status, expected result, evidence, and coverage table.
   - Test design and design questionnaire, especially every `TDxxx` row and `DQxxx` linked to question-wait cases.
   - Test analysis and analysis questionnaire.
   - Test plan, especially test approaches, product risks, scope, and exit criteria.
   - Product specifications such as `spec/`, `docs/`, files named `仕様書`, requirement IDs, or feature lists.
   - README, existing tests, QA artifacts, and implementation files only when they clarify testability, inputs, outputs, or existing coverage.
3. Review the test cases using the review perspectives below.
4. List findings with priority, grounded in the test cases and source material.
5. Fix all `P0` and `P1` findings that are actually fixable from available information. Fix `P2` findings only when the correction is low-risk and clearly supported by the source material.
6. Re-review the edited artifacts. Repeat review and fix until no `P0` or `P1` findings remain.
7. Save the final review result as Markdown. If the user does not specify a path, save it next to the reviewed test case files as `テストケースレビュー結果.md`.

## Priority Rules

Use these priorities consistently:

- **P0 - Blocker**: The test cases cannot be used for execution or downstream automation. Examples: missing required test case files, missing test case tables, no `TC-*` IDs, missing execution-category structure, severe Markdown table breakage, or coverage tables missing enough information to determine whether `TDxxx` designs are covered.
- **P1 - High**: The test cases are usable but have a problem that should be fixed before relying on them. Examples: any `TDxxx` from the test design is not covered across the artifact set, missing traceability to `TDxxx`/`TVxxx`/`TAxxx`, high-risk area too thin, impossible or ambiguous execution steps, expected result that cannot be judged and is not marked `要確認`, question-wait case without `DQxxx`, serious execution-category misclassification or wrong file placement, duplicate `TC-*` across files without an explicit duplication policy, or contradiction with test design or plan.
- **P2 - Medium**: The test cases can be used, but clarity, completeness, or maintainability should be improved. Examples: minor duplication, vague preconditions, weak evidence description, inconsistent terminology, non-critical missing reference, or case granularity that is somewhat uneven.
- **P3 - Low**: Nice-to-have cleanup. Examples: formatting polish, wording consistency, or optional extra examples.

Treat `P0` and `P1` as high-priority fix-worthy findings. Continue the fix/re-review loop until none remain, except when the finding cannot be fixed because required information is unavailable; in that case, record the blocker clearly and add or confirm a questionnaire entry.

## Review Perspectives

Review from these perspectives:

- **Traceability**: Confirm each `TC-*` links to a valid `TDxxx`, `TVxxx`, `TAxxx`, specification reference, and risk ID or `なし`.
- **Test design coverage**: Confirm every `TDxxx` from the test design appears in at least one test case across the split files and in a coverage table.
- **File structure and placement**: Confirm the artifact set has `テストケース_コードベース.md`, `テストケース_E2E自動.md`, `テストケース_人間実行.md`, and `テストケース_質問待ち.md`, unless the user explicitly requested a legacy consolidated file.
- **Execution category validity**: Confirm cases are naturally classified as `コードベース`, `E2E自動`, or `人間実行`, and that non-question-wait cases are placed in the matching execution file.
- **Test case granularity**: Confirm each case is split at a practical execution unit, especially for representative values, boundary values, abnormal values, browser differences, and question-wait conditions.
- **Precondition and input clarity**: Confirm setup, initial state, browser/environment, concrete values, and data conditions are clear or explicitly marked `要確認`.
- **Step reproducibility**: Confirm a human tester or automation implementer can reproduce the same execution from the written steps without hidden assumptions.
- **Expected-result judgment clarity**: Confirm pass/fail judgment can be made. If an expected value, threshold, tolerance, environment, or acceptance rule is unknown, it must be marked `要確認` and linked to a question ID.
- **Question-wait management**: Confirm every `質問待ち` case has a `DQxxx`, appears in `テストケース_質問待ち.md`, keeps its planned `実行区分`, and is not duplicated into execution files unless the user explicitly requested duplicate listing.
- **Priority and risk alignment**: Confirm high-risk or high-priority designs lead to sufficient high-priority test cases, and low-risk checks are not over-expanded without reason.
- **Confirmation method and evidence validity**: Confirm `確認方法/証跡` states suitable evidence such as unit test results, E2E logs, screenshots, browser output, DevTools records, performance measurements, or code review records.
- **Duplication, gaps, and contradictions**: Confirm there is no harmful duplication, missing valuable case, contradiction between cases and design, or unsupported assumption.
- **Upstream alignment**: Confirm the cases remain consistent with the test design, design questionnaire, test analysis, analysis questionnaire, test plan, product risks, and scope.
- **Maintainability**: Confirm ID prefixes, numbering, terminology, state values, table structure, and coverage mapping are consistent and easy to update.

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
- Fix high-priority issues directly in the relevant test case files using source-supported content.
- Add test case IDs sequentially within the matching execution category, such as `TC-CB-044`, `TC-E2E-083`, or `TC-MAN-035`.
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
- State clearly that no `P0` or `P1` findings remain, or explain any remaining high-priority finding that could not be fixed because required information was unavailable.
- List remaining `P2` and `P3` issues, if any, with recommended next actions.
- Mention any updates made to the test cases, test design, design questionnaire, test analysis, analysis questionnaire, or test plan.
