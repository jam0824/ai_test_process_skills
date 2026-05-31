---
name: review-test-analysis
description: Review Japanese Markdown test analysis artifacts and questionnaires against a test plan, product specifications, and QA analysis quality criteria. Use when Codex needs to assess or improve テスト分析, including both missing viewpoints and whether the viewpoints are necessary and sufficient for the product risks, prioritize findings, fix high-priority issues in the analysis artifacts, re-review until no high-priority fix-worthy issues remain, and save the final review result as Markdown.
---

# Review Test Analysis

## Overview

Review and improve a test analysis artifact by checking whether it can feed good test design. Focus on coverage, traceability, viewpoint quality, risk-based depth, necessary-and-sufficient viewpoint coverage, open questions, and whether the analysis stays at viewpoint level instead of becoming detailed test cases.

Default to Japanese output. This skill may edit the reviewed test analysis and questionnaire when the user asks for the full review-and-fix workflow. Do not edit product specifications, README files, product code, or unrelated artifacts unless the user explicitly asks. Edit the test plan only when the analysis review uncovers a clear plan-level gap that should be fixed and the user request allows fixing related artifacts.

## Workflow

1. Locate the test analysis artifact. If the user does not specify one, prefer `テスト成果物/テスト分析.md` or similarly named Markdown files.
2. Locate the related questionnaire. If not specified, prefer `テスト成果物/テスト分析_質問票.md`.
3. Gather source material in this order:
   - User-provided review instructions and acceptance criteria.
   - Test analysis and questionnaire.
   - Test plan, especially test approaches, product risks, scope, and exit criteria.
   - Product specifications such as `spec/`, `docs/`, files named `仕様書`, requirement IDs, or feature lists.
   - README, existing tests, QA artifacts, and implementation files only when they clarify the analysis.
4. Review the test analysis using the review perspectives below.
5. List findings with priority, grounded in the analysis and source material.
6. Fix all `P0` and `P1` findings that are actually fixable from available information. Fix `P2` findings only when the correction is low-risk and clearly supported by the source material.
7. Re-review the edited artifacts. Repeat review and fix until no `P0` or `P1` findings remain.
8. Save the final review result as Markdown. If the user does not specify a path, save it next to the reviewed analysis as `テスト分析レビュー結果.md`.

## Priority Rules

Use these priorities consistently:

- **P0 - Blocker**: The analysis cannot be used for test design. Examples: missing analysis target, missing viewpoint table, no traceability to test approaches, or severe contradiction with the test plan.
- **P1 - High**: The analysis is usable but has a problem that should be fixed before relying on it. Examples: missing coverage for a test approach, high-risk area too thin, generic QA viewpoints not considered for a relevant target type, missing required question, major specification traceability gap, viewpoint granularity that prevents test design, boundary or abnormal behavior compressed into one vague row for a high-risk area, or formal `TAxxx` coverage that still leaves important defect classes untested.
- **P2 - Medium**: The analysis can be used, but clarity, completeness, or maintainability should be improved. Examples: minor duplication, unclear wording, weak categorization, or non-critical missing references.
- **P3 - Low**: Nice-to-have cleanup. Examples: formatting polish, wording consistency, or optional extra examples.

Treat `P0` and `P1` as high-priority fix-worthy findings. Continue the fix/re-review loop until none remain.

## Necessary And Sufficient Viewpoint Review

Do not treat the analysis as sufficient merely because every `TAxxx` appears at least once. The review must judge whether the viewpoint set is strong enough to become meaningful test design.

For each high-risk product risk or high-risk `TAxxx`, check whether the analysis includes, or explicitly justifies not including:

- Normal or representative behavior.
- Boundary or threshold behavior, including just-below, exact-boundary, and just-above patterns when relevant.
- Abnormal, invalid, missing, malformed, excessive, or contradictory input/state behavior.
- State transition, ordering, retry, repeated execution, or interaction behavior when the target has state or workflow.
- Relevant generic QA concerns for the target type, such as security/privacy, performance/reliability, compatibility, accessibility/usability, persistence/data integrity, concurrency/timing, configuration/environment, observability, or locale/time/numeric display.
- Case-splitting hints in `備考` when one viewpoint contains many meaningful values or conditions.

If a high-risk area has only a normal-flow viewpoint, only representative values, or a single broad boundary row that would collapse many cases downstream, record a `P1` finding and add or request additional viewpoints. For medium or low-risk areas, minor thinness is usually `P2` unless it blocks test design or hides a likely serious defect.

The review must also perform a "bug escape imagination" pass: list the typical bugs that could slip through if the current analysis were used as-is. If a likely escaped bug maps to a high-impact risk and can be addressed from available information, add or require a viewpoint. If the expected result is unclear, add or require a questionnaire entry.

## Review Perspectives

Review from these perspectives:

- **Test plan alignment**: Confirm all test approaches from the plan, such as `TA001`, are covered and that related product risks, scope, and exit conditions are respected.
- **Specification traceability**: Confirm each viewpoint links to a specification section, feature ID, README section, existing test, or is explicitly marked `要確認`.
- **Viewpoint granularity**: Confirm viewpoints are more concrete than test-plan approaches but not detailed test cases. They should be ready to become test design conditions.
- **Viewpoint category coverage**: Confirm normal, default value, boundary, abnormal, state transition, calculation, compatibility, usability, accessibility, security, performance, regression, and exploratory concerns are included when relevant.
- **Risk-based depth**: Confirm high-risk areas have enough viewpoints and low-risk areas are not over-expanded at the expense of critical behavior.
- **Necessary and sufficient coverage**: Confirm the viewpoint set is neither merely formal nor too shallow to produce effective test design. A single `TVxxx` for a `TAxxx` is not enough when the risk, target type, or behavior complexity requires multiple defect classes.
- **High-risk viewpoint density**: Confirm high-risk `TAxxx` and `Rxxx` entries have sufficient normal, boundary, abnormal, state/combination, and relevant generic QA coverage.
- **Generic QA catalog alignment**: Confirm the analysis considered generally expected QA categories for the target type, not only the requirements explicitly written in the specification.
- **Boundary and abnormal quality**: Confirm values such as zero, empty, negative, maximum, decimal, over-maximum, age transitions, inconsistent ranges, asset depletion, and random behavior are considered when relevant.
- **Boundary and abnormal decomposability**: Confirm broad boundary or abnormal viewpoints include enough detail or `備考` case-splitting hints to be decomposed into meaningful designs later.
- **Bug escape imagination**: Identify typical bugs that would likely pass undetected if the current analysis were used as-is, then decide whether they require new viewpoints, questions, or plan updates.
- **Downstream design readiness**: Confirm viewpoints include enough category, condition, origin, and case-splitting information for `create-test-design` to avoid collapsing many cases into one.
- **Questionnaire validity**: Confirm questions are necessary, specific, prioritized, and linked to viewpoint IDs and test approach IDs. Questions should unblock test design, acceptance criteria, execution feasibility, or plan updates.
- **Test plan update judgment**: Confirm the analysis identifies whether new risks or approaches require updates to the test plan, and that the update or no-update decision is justified.
- **Execution feasibility**: Confirm viewpoints can realistically become tests using available tools, existing tests, manual browser checks, code review, or measurable criteria.
- **Duplication, gaps, and contradictions**: Confirm there is no harmful duplication, missing high-value viewpoint, contradiction between analysis and questionnaire, or unsupported assumption.

## Finding Format

During each review pass, present findings first and sort by priority. Use this table:

```markdown
| 優先度 | 観点 | 問題 | 場所 | 影響 | 修正方針 |
|---|---|---|---|---|---|
```

Guidelines:

- Ground every finding in the analysis, questionnaire, test plan, or source material.
- Do not create a finding merely because optional detail is absent.
- Treat missing coverage for any test approach as at least `P1`.
- Treat high-risk viewpoint thinness as `P1` when the analysis would allow important defects to escape, even if the `TAxxx` appears in the table.
- Treat missing consideration of relevant generic QA categories as `P1` for high-risk areas and usually `P2` for medium or low-risk areas.
- Treat boundary, abnormal, or combination viewpoints that are too broad to become useful test design as `P1` when attached to high-risk functionality.
- Treat a likely serious "bug escape" found during review as `P1` when it can be addressed from available information; use `P2` when it is lower impact or mostly clarity-related.
- Treat a missing question that blocks test design or acceptance criteria as at least `P1`.
- Mark unavailable source facts as `要確認`; do not invent them.
- If no findings exist at a priority, say so clearly.

## Fix Rules

When fixing the analysis artifacts:

- Preserve existing file names, section order, ID style, and traceability style unless the issue requires structural correction.
- Fix high-priority issues directly in the test analysis or questionnaire using source-supported content.
- Add viewpoint IDs sequentially, such as `TV064`, and question IDs sequentially, such as `Q018`.
- Keep analysis at viewpoint level. Do not add detailed test steps or expected results unless explicitly requested.
- Prefer explicit traceability, `要確認`, or questionnaire entries over vague assumptions.
- When fixing high-risk thinness, add multiple focused viewpoints rather than one broad catch-all row. Preserve the existing table shape and put origin/case-splitting information in `備考`.
- When fixing generic QA omissions, add only relevant target-type viewpoints and mark unsupported expectations as `要確認` or questionnaire items.
- When a "bug escape" cannot be resolved from source material, add or confirm a questionnaire entry instead of inventing expected behavior.
- If the analysis reveals a necessary test plan update, update the test plan and record that action in the final review result.

## Final Review Result

Save a Markdown review result with this structure:

```markdown
# テスト分析レビュー結果

## 1. レビュー対象
## 2. 参照資料
## 3. レビュー観点
## 4. レビュー・修正サマリー
## 5. 最終レビュー結果
## 6. 残課題
```

Final result requirements:

- Include the reviewed analysis path, questionnaire path, and final review result path.
- Include the test plan and source documents used.
- Include the review perspectives applied.
- Summarize each review/fix iteration.
- Include a short summary of the necessary/sufficient review, especially high-risk viewpoint density and any bug-escape concerns found.
- State clearly that no `P0` or `P1` findings remain, or explain any remaining high-priority finding that could not be fixed because required information was unavailable.
- List remaining `P2` and `P3` issues, if any, with recommended next actions.
- Mention any updates made to the test analysis, questionnaire, or test plan.
