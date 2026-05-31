---
name: review-test-design
description: Review Japanese Markdown test design artifacts and design questionnaires against test analysis, test plans, specifications, and QA design quality criteria. Use when Codex needs to assess or improve テスト設計, traceable test design tables, test level/type grouping, or design questionnaires; prioritize findings, fix high-priority issues, re-review until no high-priority fix-worthy issues remain, and save the final review result as Markdown.
---

# Review Test Design

## Overview

Review and improve a test design artifact by checking whether it can move smoothly into test case creation and execution. Focus on traceability, viewpoint coverage, risk-based depth, test level/type assignment, test pattern specificity, conditions, expected-result judgment, questionnaire handling, execution feasibility, upstream consistency, and maintainability.

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
6. Fix all `P0` and `P1` findings that are actually fixable from available information. Fix `P2` findings only when the correction is low-risk and clearly supported by the source material.
7. Re-review the edited artifacts. Repeat review and fix until no `P0` or `P1` findings remain.
8. Save the final review result as Markdown. If the user does not specify a path, save it next to the reviewed design as `テスト設計レビュー結果.md`.

## Priority Rules

Use these priorities consistently:

- **P0 - Blocker**: The design cannot be used for test case creation. Examples: missing design target, missing design table, no `TDxxx` IDs, missing traceability to `TVxxx`, or broken question-wait management that makes many rows unverifiable.
- **P1 - High**: The design is usable but has a problem that should be fixed before relying on it. Examples: missing coverage for any `TVxxx`, high-risk area too thin, untestable or judgment-impossible expected result, missing required question, wrong test level/type that would mislead execution, or contradiction with analysis or plan.
- **P2 - Medium**: The design can be used, but clarity, completeness, or maintainability should be improved. Examples: minor duplication, vague condition/input, weak grouping, inconsistent terminology, or non-critical missing references.
- **P3 - Low**: Nice-to-have cleanup. Examples: formatting polish, wording consistency, or optional extra examples.

Treat `P0` and `P1` as high-priority fix-worthy findings. Continue the fix/re-review loop until none remain, except when the finding cannot be fixed because required information is unavailable; in that case, record the blocker clearly and add or confirm a questionnaire entry.

## Review Perspectives

Review from these perspectives:

- **Traceability**: Confirm each `TDxxx` links to a `TVxxx`, `TAxxx`, specification reference, and risk ID or `なし`.
- **Viewpoint coverage**: Confirm every `TVxxx` from the test analysis has at least one design row.
- **Risk-based depth**: Confirm high-risk areas have enough design rows across representative, boundary, abnormal, integration, security, performance, compatibility, or exploratory concerns.
- **Test level/type validity**: Confirm `Unit`, `Integration`, `E2E`, `Security`, `Performance`, `Compatibility`, `Accessibility`, `Manual`, `Code review`, `Exploratory`, and `Regression` are assigned appropriately and grouped by `テストレベル/タイプ`.
- **Test pattern specificity**: Confirm each design states what pattern is being tested clearly enough to become a test case.
- **Condition/input clarity**: Confirm input values, states, data combinations, environment conditions, and preconditions are concrete or explicitly marked `要確認`.
- **Expected-result judgment clarity**: Confirm the pass/fail judgment can be made. If an expected value, threshold, tolerance, environment, or acceptance rule is unknown, it must be marked `要確認` and linked to the questionnaire.
- **Question-wait management**: Confirm each `質問待ち` design row is represented in `## 4. 質問待ち項目` and in `テスト設計_質問票.md`.
- **Execution feasibility**: Confirm execution methods are realistic using available automation, existing tests, manual browser checks, code review, DevTools, or measurable criteria.
- **Duplication, gaps, and contradictions**: Confirm there is no harmful duplication, missing valuable design, contradiction between design and questionnaire, or unsupported assumption.
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
- Treat a `質問待ち` row without a linked questionnaire entry as at least `P1`.
- Treat an expected-result judgment that cannot be used for pass/fail and is not marked `要確認` as at least `P1`.
- Mark unavailable source facts as `要確認`; do not invent them.
- If no findings exist at a priority, say so clearly.

## Fix Rules

When fixing artifacts:

- Preserve existing file names, section order, ID style, `TDxxx` stability, and traceability style unless the issue requires structural correction.
- Fix high-priority issues directly in the test design or design questionnaire using source-supported content.
- Add design IDs sequentially, such as `TD064`, and question IDs sequentially according to the file's existing style, such as `DQ018`.
- Keep the artifact at test-design level. Do not expand into low-level click-by-click test cases or execution results unless explicitly requested.
- Prefer explicit traceability, `要確認`, and questionnaire entries over vague assumptions.
- If the review reveals a missing analysis viewpoint, add the viewpoint to the test analysis and record the action in the final review result.
- If the review reveals a necessary test plan update, update the test plan and record the action in the final review result.
- Do not edit product specifications, README files, product code, or existing tests unless explicitly requested.

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
- Summarize each review/fix iteration.
- State clearly that no `P0` or `P1` findings remain, or explain any remaining high-priority finding that could not be fixed because required information was unavailable.
- List remaining `P2` and `P3` issues, if any, with recommended next actions.
- Mention any updates made to the test design, design questionnaire, test analysis, analysis questionnaire, or test plan.
