---
name: review-test-artifacts
description: Review Japanese QA artifacts end-to-end across test plans, test analysis, questionnaires, test design, and test case files. Use when Codex needs to find gaps, missing coverage, weak traceability, contradictions, or insufficient detail across テスト計画書, テスト分析, テスト設計, and テストケース; prioritize findings, fix high-priority issues across the appropriate QA artifacts, re-review until no high-priority fix-worthy issues remain, and save the final cross-artifact review result as Markdown.
---

# Review Test Artifacts

## Overview

Review and improve a complete QA artifact set from test plan through test cases. Focus on whether the artifacts form a coherent chain from product specification and risks to approaches, viewpoints, designs, executable cases, question-wait items, final coverage, and the coverage-count artifacts needed before implementation: `Source Structure Inventory`, `Expected Case Yield`, and `Case Expansion Ledger`.

Default to Japanese output. This skill may edit QA artifacts when the user asks for the full review-and-fix workflow. Do not edit product specifications, README files, product code, existing tests, or unrelated artifacts unless the user explicitly asks.

## Workflow

1. Locate the QA artifacts. If the user does not specify paths, prefer:
   - `テスト成果物/テスト計画書.md`
   - `テスト成果物/テスト分析.md`
   - `テスト成果物/テスト分析_質問票.md`
   - `テスト成果物/テスト設計.md`
   - `テスト成果物/テスト設計_質問票.md`
   - `テスト成果物/テストケース_コードベース.md`
   - `テスト成果物/テストケース_E2E自動.md`
   - `テスト成果物/テストケース_人間実行.md`
   - `テスト成果物/テストケース_質問待ち.md`
   - If split test case files do not exist, use legacy `テスト成果物/テストケース.md`.
2. Gather source material in this order:
   - User-provided review instructions and acceptance criteria.
   - Test plan, especially scope, risks, test approaches, exit criteria, and unresolved items.
   - Test analysis and analysis questionnaire.
   - Test design and design questionnaire.
   - Test case files, including split execution files and question-wait file.
   - Existing review results only as supporting history, never as a substitute for reviewing the current artifacts.
   - Product specifications such as `spec/`, `docs/`, files named `仕様書`, requirement IDs, or feature lists.
   - README, existing tests, and implementation files only when they clarify requirements, testability, inputs, outputs, or existing coverage.
3. Build an ID map for the whole artifact chain:
   - Product risks: `Rxxx`
   - Test approaches: `TAxxx`
   - Test viewpoints: `TVxxx`
   - Test designs: `TDxxx`
   - Test cases: `TC-*`
   - Questions: use the existing file's question ID style, such as `Qxxx`, `AQxxx`, or `DQxxx`.
4. Review the artifact set using the review perspectives below.
5. Run the **Implementation Entry Gate** before allowing code or E2E implementation to start.
6. List findings with priority, grounded in concrete artifact locations.
7. Fix all `P0` and `P1` findings that are actually fixable from available information. Fix `P2` findings only when the correction is low-risk and clearly supported by source material.
8. Re-review the edited artifacts. Repeat review and fix until no `P0` or `P1` findings remain.
9. Save the final review result as Markdown. If the user does not specify a path, save it as `テスト成果物/テスト成果物横断レビュー結果.md`.

## Priority Rules

Use these priorities consistently:

- **P0 - Blocker**: The artifact set cannot be used as a coherent QA baseline or cannot enter implementation. Examples: missing required artifact, broken core table structure, missing `Source Structure Inventory`, missing `Expected Case Yield`, missing `Case Expansion Ledger`, no traceability chain, no test cases for the design, or a severe contradiction that makes downstream work unreliable.
- **P1 - High**: The artifact set is usable but has a problem that should be fixed before relying on it. Examples: high-risk product area not covered downstream, missing `TAxxx` to `TVxxx` to `TDxxx` to `TC-*` chain, unanswered question not represented downstream, expected result impossible to judge without `要確認`, test case file split inconsistent with the current convention, plan/design/case contradiction, unexplained expected-case shortfall, or high-risk representative sampling without residual-risk rationale.
- **P2 - Medium**: The artifact set can be used, but clarity, completeness, or maintainability should be improved. Examples: minor traceability weakness, unclear wording, useful but non-critical missing question, uneven granularity, or weak evidence description.
- **P3 - Low**: Nice-to-have cleanup. Examples: formatting polish, wording consistency, or optional extra cross-reference.

Treat `P0` and `P1` as high-priority fix-worthy findings. Continue the fix/re-review loop until none remain, except when the finding cannot be fixed because required information is unavailable; in that case, record the blocker clearly and add or confirm a questionnaire entry.

## Review Perspectives

Review from these perspectives:

- **End-to-end traceability**: Confirm source specifications and product risks flow through `Rxxx`, `TAxxx`, `TVxxx`, `TDxxx`, and `TC-*` without broken IDs or orphaned items.
- **Source Structure Inventory coverage**: Confirm source-defined inputs, finite sets, boundaries, states, events, environments, formal assets, performance thresholds, and exception conditions appear in the analysis inventory with expansion policies.
- **Expected Case Yield coverage**: Confirm every `TDxxx` has a calculated `期待TC数`, linked source structure, expansion policy, and aggregation/representative rationale when applicable.
- **Case Expansion Ledger coverage**: Confirm every `TDxxx` has `期待TC数`, `実TC数`, `不足数`, and corresponding `TC-*` IDs, and independently recompute actual counts across split case files.
- **Approach coverage**: Confirm every test approach in the plan has analysis viewpoints, design rows, and test cases.
- **Viewpoint coverage**: Confirm every test viewpoint has at least one design row and at least one test case through that design.
- **Design coverage**: Confirm every test design row has at least one test case or a question-wait case.
- **Risk-based adequacy**: Confirm high-risk areas have enough depth across normal, boundary, abnormal, integration, security, performance, compatibility, regression, and exploratory coverage.
- **Specification and feature coverage**: Confirm important product features, constraints, UI behavior, algorithms, security requirements, performance goals, and known README scenarios are represented at the appropriate downstream level.
- **Artifact-level granularity**: Confirm the plan remains strategic, analysis remains viewpoint-level, design remains pattern-level, and test cases are executable without becoming automation code.
- **Question management**: Confirm unresolved items are not guessed. Questions should be specific, prioritized, linked to affected upstream/downstream IDs, and reflected in question-wait designs or test cases.
- **Consistency and contradictions**: Confirm scope, risks, priorities, IDs, terminology, expected results, and file names are consistent across artifacts.
- **Execution readiness**: Confirm cases can be executed by the intended actor, have clear inputs, steps, expected results, evidence, and split-file placement.
- **Exit criteria alignment**: Confirm the test cases and question handling are enough to satisfy the test plan's exit criteria or clearly identify remaining blockers.
- **Maintainability**: Confirm IDs, section structures, coverage tables, and update notes are easy to maintain after future changes.

## Implementation Entry Gate

Before allowing `create-test-code`, `create-playwright-e2e-tests`, or any test implementation step to start, cross-check these artifacts:

1. `Source Structure Inventory`: every source-defined finite list, boundary, state/event, environment matrix, formal asset, performance threshold, exception condition, input item, default, and exclusion has an expansion policy.
2. `Expected Case Yield`: every `TDxxx` maps to source structures and a concrete expected `TC-*` count.
3. `Case Expansion Ledger`: every `TDxxx` maps to actual `TC-*` IDs, actual count, shortage count, and any representative/aggregation rationale.

Gate rules:

- Block implementation and return to analysis/design/case creation when any of the three artifacts is missing.
- Block implementation when `実TC数 < 期待TC数` and the shortfall lacks a concrete representative extraction reason, aggregate judgment rule, or linked `質問待ち`.
- Block implementation when high-risk structures are compressed by `代表抽出` without rationale and residual risk.
- Block implementation when `質問待ち` affects expected counts or pass/fail judgment but is not represented in question-wait designs/cases.
- Human-executed, unimplemented, and not-yet-executed cases are acceptable only when they are explicitly recorded as human-run, unimplemented, not-run, or question-wait; do not hide them as covered implementation work.
- Broad words such as `代表値`, `異常値`, `各`, `複数`, `など`, and `適切` are blocker smells unless concrete values and expected counts are present.

## Finding Format

During each review pass, present findings first and sort by priority. Use this table:

```markdown
| 優先度 | 観点 | 問題 | 場所 | 影響 | 修正方針 |
|---|---|---|---|---|---|
```

Guidelines:

- Ground every finding in the current QA artifacts or source material.
- Do not create a finding merely because optional detail is absent.
- Treat missing downstream coverage for any high-risk `Rxxx` or any `TAxxx` as at least `P1`.
- Treat missing `Source Structure Inventory`, `Expected Case Yield`, or `Case Expansion Ledger` as `P0` when implementation would otherwise proceed.
- Treat `実TC数 < 期待TC数` without a concrete rationale as `P1`; raise to `P0` when the shortage affects high-risk coverage or many rows.
- Treat high-risk source structures marked `代表抽出` without rationale/residual risk as `P1`.
- Treat unresolved `質問待ち` items that affect expected counts, execution feasibility, or pass/fail judgment but are not represented downstream as `P1`.
- Treat a broken `TAxxx` -> `TVxxx` -> `TDxxx` -> `TC-*` chain as at least `P1`.
- Treat a `質問待ち` item that is not linked to the appropriate downstream affected rows as at least `P1` when it blocks execution or judgment.
- Treat a source-supported expected result that remains vague in a test case as at least `P1` when it affects high-risk functionality.
- Mark unavailable source facts as `要確認`; do not invent them.
- If no findings exist at a priority, say so clearly.

## Fix Rules

When fixing artifacts:

- Preserve existing file names, section order, ID style, and traceability style unless the issue requires structural correction.
- Fix high-priority issues in the artifact where the defect originates, then cascade the update downstream.
- If a test plan risk or approach is added or changed, update related analysis viewpoints, design rows, and test cases as needed.
- If an analysis viewpoint is added or changed, update related design rows and test cases as needed.
- If a design row is added or changed, update related test cases as needed.
- If a test case is added, place it in the correct split file: `テストケース_コードベース.md`, `テストケース_E2E自動.md`, `テストケース_人間実行.md`, or `テストケース_質問待ち.md`.
- Add IDs sequentially using each artifact's existing style, such as `R012`, `TA019`, `TV064`, `TD064`, `TC-CB-044`, `TC-E2E-083`, `TC-MAN-035`, or the next question ID style used by that file.
- Prefer explicit traceability, `要確認`, and questionnaire entries over unsupported assumptions.
- Keep each artifact at its proper abstraction level. Do not turn the plan into test cases, analysis into click steps, or design into execution logs.
- Do not edit product specifications, README files, product code, or existing tests unless explicitly requested.

## Final Review Result

Save a Markdown review result with this structure:

```markdown
# テスト成果物横断レビュー結果

## 1. レビュー対象
## 2. 参照資料
## 3. レビュー観点
## 4. レビュー・修正サマリー
## 5. 最終レビュー結果
## 6. 残課題
```

Final result requirements:

- Include all reviewed QA artifact paths and the final review result path.
- Include source documents used.
- Include the review perspectives applied.
- Summarize each review/fix iteration.
- State clearly that no `P0` or `P1` findings remain, or explain any remaining high-priority finding that could not be fixed because required information was unavailable.
- List remaining `P2` and `P3` issues, if any, with recommended next actions.
- Mention every artifact updated during the review.
- Include a compact final coverage summary for the main chains, such as `Rxxx -> TAxxx -> TVxxx -> TDxxx -> TC-*`, at least by count and any exceptions.
- Include the `Implementation Entry Gate` result, including total expected cases, total actual cases, shortage count, accepted representative/aggregate rationales, and whether implementation is allowed to start.
