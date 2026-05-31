---
name: review-test-design
description: Review Japanese Markdown test design artifacts and design questionnaires against test analysis, test plans, specifications, and QA design quality criteria. Use when Codex needs to assess or improve テスト設計, traceable test design tables, necessary-and-sufficient design depth, test level/type grouping, or design questionnaires; prioritize findings, fix P0/P1/P2 fix-worthy issues, re-review until no P0/P1/P2 fix-worthy issues remain, and save the final review result as Markdown.
---

# Review Test Design

## Overview

Review and improve a test design artifact by checking whether it can move smoothly into test case creation and execution. Focus on traceability, viewpoint coverage, necessary-and-sufficient design depth, test level/type assignment, test pattern specificity, conditions, expected-result judgment, questionnaire handling, execution feasibility, upstream consistency, anti-compression, and maintainability.

Treat formal coverage as necessary but not sufficient. A `TVxxx` that appears only once may still be under-designed when its risk, analysis `備考`, or generic QA technique implies multiple partitions, states, environments, roles, or failure modes.

Default to Japanese output. This skill may edit the reviewed test design and design questionnaire when the user asks for the full review-and-fix workflow. Do not edit product specifications, README files, product code, existing tests, or unrelated artifacts unless the user explicitly asks. Edit upstream QA artifacts only when the design review uncovers a clear analysis-level or plan-level gap that should be fixed and the user request allows fixing related artifacts.

## Workflow

1. Locate the test design artifact. If the user does not specify one, prefer `テスト成果物/テスト設計.md` or similarly named Markdown files.
2. Locate the related design questionnaire. If not specified, prefer `テスト成果物/テスト設計_質問票.md`.
3. Gather source material in this order:
   - User-provided review instructions and acceptance criteria.
   - Test design and design questionnaire.
   - Test analysis and analysis questionnaire.
   - Test plan, especially test approaches, product risks, scope, and exit criteria.
   - Product specifications such as `spec/`, `docs/`, files named `仕様書`, requirement IDs, or feature lists.
   - README, existing tests, QA artifacts, and implementation files only when they clarify the design.
4. Review the test design using the review perspectives below.
5. List findings with priority, grounded in the design and source material.
6. Fix all `P0`, `P1`, and `P2` findings that are actually fixable from available information. Fix `P3` findings only when the correction is low-risk and clearly supported by the source material.
7. Re-review the edited artifacts. Repeat review and fix until no `P0`, `P1`, or `P2` findings remain.
8. Save the final review result as Markdown. If the user does not specify a path, save it next to the reviewed design as `テスト設計レビュー結果.md`.

## Priority Rules

Use these priorities consistently:

- **P0 - Blocker**: The design cannot be used for test case creation. Examples: missing design target, missing design table, no `TDxxx` IDs, missing traceability to `TVxxx`, or broken question-wait management that makes many rows unverifiable.
- **P1 - High**: The design is usable but has a problem that should be fixed before relying on it. Examples: missing coverage for any `TVxxx`, high-risk area too thin, high-risk `TVxxx` compressed into one broad `TDxxx`, ignored `ケース分解候補`, missing or unsuitable design technique, downstream test case creation would collapse many conditions into one case, untestable or judgment-impossible expected result, missing required question, wrong test level/type that would mislead execution, or contradiction with analysis or plan.
- **P2 - Medium**: The design can be used, but clarity, completeness, or maintainability should be improved. Examples: minor duplication, vague condition/input, weak grouping, inconsistent terminology, or non-critical missing references.
- **P3 - Low**: Nice-to-have cleanup. Examples: formatting polish, wording consistency, or optional extra examples.

Treat `P0`, `P1`, and `P2` as fix-worthy findings. Continue the fix/re-review loop until none remain, except when the finding cannot be fixed because required information is unavailable; in that case, record the blocker clearly and add or confirm a questionnaire entry. Treat `P3` as optional cleanup.

## Necessary And Sufficient Design Review

Use this review to judge whether the design has enough depth, not merely whether rows exist.

- A `TDxxx` row must be concrete enough that a later test-case creator can generate executable cases without guessing the intended partition, state, role, environment, or expected result.
- For high-risk `TVxxx`, verify that the design covers the technique-appropriate partitions: representative values, boundaries, abnormal values, state transitions, combinations, environments, error/recovery paths, security/privacy, performance/reliability, accessibility/usability, persistence, concurrency, or observability as applicable.
- If the analysis `備考` includes `ケース分解候補`, the design must reflect it in multiple rows or explicitly document why splitting is unnecessary or blocked by missing information.
- If the analysis `備考` includes `由来: 汎用QA`, confirm that the generic concern was translated into a target-appropriate test design pattern, not copied as a vague label.
- Imagine the downstream case yield: if the current design would likely produce only one broad test case for many materially different conditions, classify the issue as `P1` for high-risk areas and `P2` for lower-risk areas.
- Imagine typical escaped bugs at design level: validation gaps, off-by-one boundaries, authorization bypass, missing rollback, stale persistence, race conditions, locale/time errors, unsupported platforms, unclear accessibility judgment, or missing evidence. If the current design would not expose a high-impact escaped bug, add or require a design row.

## Review Perspectives

Review from these perspectives:

- **Traceability**: Confirm each `TDxxx` links to a `TVxxx`, `TAxxx`, specification reference, and risk ID or `なし`.
- **Viewpoint coverage**: Confirm every `TVxxx` from the test analysis has at least one design row.
- **Necessary and sufficient design depth**: Confirm each design is deep enough for its risk and generic QA concern, without demanding irrelevant rows.
- **Risk-based depth**: Confirm high-risk areas have enough design rows across representative, boundary, abnormal, state, combination, integration, security, performance, compatibility, accessibility, recovery, persistence, concurrency, or exploratory concerns.
- **Analysis hint consumption**: Confirm `由来`, `ケース分解候補`, unresolved questions, and risk notes in analysis `備考` are reflected, explicitly deferred, or questioned.
- **Design technique adequacy**: Confirm the chosen technique, such as equivalence partitioning, boundary value analysis, decision table, state transition, pairwise, role matrix, compatibility matrix, or error/recovery pattern, fits the viewpoint.
- **Anti-compression and decomposability**: Confirm one broad row does not hide distinct values, states, roles, environments, failures, or expected results that should become separate designs.
- **Downstream case yield**: Confirm later test case creation would produce enough meaningful cases from the `TDxxx` rows, especially for high-risk viewpoints.
- **Test level/type validity**: Confirm `Unit`, `Integration`, `E2E`, `Security`, `Performance`, `Compatibility`, `Accessibility`, `Manual`, `Code review`, `Exploratory`, and `Regression` are assigned appropriately and grouped by `テストレベル/タイプ`.
- **Test pattern specificity**: Confirm each design states what pattern is being tested clearly enough to become a test case.
- **Condition/input clarity**: Confirm input values, states, data combinations, environment conditions, and preconditions are concrete or explicitly marked `要確認`.
- **Expected-result judgment clarity**: Confirm the pass/fail judgment can be made. If an expected value, threshold, tolerance, environment, or acceptance rule is unknown, it must be marked `要確認` and linked to the questionnaire.
- **Question-wait management**: Confirm each `質問待ち` design row is represented in `## 4. 質問待ち項目` and in `テスト設計_質問票.md`.
- **Execution feasibility**: Confirm execution methods are realistic using available automation, existing tests, manual browser checks, code review, DevTools, or measurable criteria.
- **Duplication, gaps, and contradictions**: Confirm there is no harmful duplication, missing valuable design, contradiction between design and questionnaire, or unsupported assumption.
- **Escaped-bug imagination**: List typical bugs that could pass through the current design and require added design rows or questionnaire items when impact is material.
- **Upstream alignment**: Confirm the design remains consistent with the test analysis, analysis questionnaire, test plan, product risks, and scope.
- **Maintainability**: Confirm IDs, terminology, grouping, priority, and table structure are consistent and easy to update.

## Finding Format

During each review pass, present findings first and sort by priority. Use this table:

```markdown
| 優先度 | 観点 | 問題 | 場所 | 影響 | 修正方針 |
|---|---|---|---|---|---|
```

Guidelines:

- Ground every finding in the design, questionnaire, analysis, test plan, or source material.
- Do not create a finding merely because optional detail is absent.
- Treat missing coverage for any `TVxxx` as at least `P1`.
- Treat a high-risk `TVxxx` that is represented only by a broad, non-decomposable `TDxxx` as `P1` even when formal coverage exists.
- Treat ignored `ケース分解候補` as `P1` for high-risk viewpoints and `P2` for lower-risk viewpoints unless the design explains why splitting is unnecessary.
- Treat missing generic design technique selection as `P1` when it prevents reliable downstream case creation for a high-risk viewpoint.
- Treat a design that would likely generate too few downstream test cases as `P1` for high-risk areas and `P2` for limited-impact areas.
- Treat likely escaped bugs as `P1` when the impact is high, and `P2` when the impact is limited but worth addressing.
- Treat a `質問待ち` row without a linked questionnaire entry as at least `P1`.
- Treat an expected-result judgment that cannot be used for pass/fail and is not marked `要確認` as at least `P1`.
- Mark unavailable source facts as `要確認`; do not invent them.
- If no findings exist at a priority, say so clearly.

## Fix Rules

When fixing artifacts:

- Preserve existing file names, section order, ID style, `TDxxx` stability, and traceability style unless the issue requires structural correction.
- Fix `P0`, `P1`, and `P2` issues directly in the test design or design questionnaire using source-supported content.
- Add design IDs sequentially, such as `TD064`, and question IDs sequentially according to the file's existing style, such as `DQ018`.
- Split broad high-risk design rows into multiple focused `TDxxx` rows when analysis hints, risk, or generic test design techniques require separate partitions.
- Record the selected design technique or pattern family in `テストパターン` rather than adding new columns.
- Reflect `ケース分解候補` in `条件/入力` and `期待結果/判定観点`, or add a questionnaire item when the exact split cannot be supported.
- Keep the artifact at test-design level. Do not expand into low-level click-by-click test cases or execution results unless explicitly requested.
- Prefer explicit traceability, `要確認`, and questionnaire entries over vague assumptions.
- If the review reveals a missing analysis viewpoint, add the viewpoint to the test analysis and record the action in the final review result.
- If the review reveals a necessary test plan update, update the test plan and record the action in the final review result.
- Do not edit product specifications, README files, product code, or existing tests unless explicitly requested.
- Do not add columns to the test design table unless the user explicitly asks for a schema change.

## Final Review Result

Save a Markdown review result with this structure:

```markdown
# テスト設計レビュー結果

## 1. レビュー対象
## 2. 参照資料
## 3. レビュー観点
## 4. レビュー・修正サマリー
## 5. 最終レビュー結果
## 6. 残課題
```

Final result requirements:

- Include the reviewed design path, questionnaire path, and final review result path.
- Include the test analysis, test plan, and source documents used.
- Include the review perspectives applied.
- Include a short necessary-and-sufficient design review summary, including high-risk design density and downstream case-yield concerns.
- Include any typical escaped bugs considered and whether design rows or questionnaire items were added.
- Summarize each review/fix iteration.
- State clearly that no `P0`, `P1`, or `P2` findings remain, or explain any remaining fix-worthy finding that could not be fixed because required information was unavailable.
- List remaining `P3` issues, if any, with recommended next actions.
- Mention any updates made to the test design, design questionnaire, test analysis, analysis questionnaire, or test plan.
