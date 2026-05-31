---
name: review-test-analysis
description: Review Japanese Markdown test analysis artifacts and questionnaires against a test plan, product specifications, and QA analysis quality criteria. Use when Codex needs to assess or improve テスト分析, including both missing viewpoints and whether the viewpoints are necessary and sufficient for the product risks, prioritize findings, fix P0/P1/P2 fix-worthy issues in the analysis artifacts, re-review until no P0/P1/P2 fix-worthy issues remain, and save the final review result as Markdown.
---

# Review Test Analysis

## Overview

Review and improve a test analysis artifact by checking whether it can feed good test design. Focus on coverage, traceability, viewpoint quality, risk-based depth, necessary-and-sufficient viewpoint coverage, open questions, the `Source Structure Inventory`, and whether the analysis stays at viewpoint level instead of becoming detailed test cases.

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
4. Inventory source-defined structures before judging the analysis: input fields, finite lists, enums, state sets, events, decision tables, pricing/tax/rate tiers, role/permission sets, supported environments, input ranges, boundary values, thresholds, formal/regression assets, performance thresholds, exception conditions, defaults, and explicitly documented exclusions.
   - Cross-check this independent inventory against the analysis `Source Structure Inventory`.
   - Treat missing expansion policy, unexplained representative sampling, or unknown expected split shape as review findings.
5. Review the test analysis using the review perspectives below.
6. List findings with priority, grounded in the analysis and source material.
7. Fix all `P0`, `P1`, and `P2` findings that are actually fixable from available information. Fix `P3` findings only when the correction is low-risk and clearly supported by the source material.
8. Re-review the edited artifacts. Repeat review and fix until no `P0`, `P1`, or `P2` findings remain.
9. Save the final review result as Markdown. If the user does not specify a path, save it next to the reviewed analysis as `テスト分析レビュー結果.md`.

## Priority Rules

Use these priorities consistently:

- **P0 - Blocker**: The analysis cannot be used for test design. Examples: missing analysis target, missing viewpoint table, missing `Source Structure Inventory`, no traceability to test approaches, or severe contradiction with the test plan.
- **P1 - High**: The analysis is usable but has a problem that should be fixed before relying on it. Examples: missing coverage for a test approach, high-risk area too thin, generic QA viewpoints not considered for a relevant target type, missing required question, major specification traceability gap, viewpoint granularity that prevents test design, boundary or abnormal behavior compressed into one vague row for a high-risk area, source-defined finite/boundary/environment structures missing from `Source Structure Inventory`, high-risk `代表抽出` without rationale/residual risk, or formal `TAxxx` coverage that still leaves important defect classes untested.
- **P2 - Medium**: The analysis can be used, but clarity, completeness, or maintainability should be improved. Examples: minor duplication, unclear wording, weak categorization, or non-critical missing references.
- **P3 - Low**: Nice-to-have cleanup. Examples: formatting polish, wording consistency, or optional extra examples.

Treat `P0`, `P1`, and `P2` as fix-worthy findings. Continue the fix/re-review loop until none remain, except when the finding cannot be fixed because required information is unavailable; in that case, record the blocker clearly and add or confirm a questionnaire entry. Treat `P3` as optional cleanup.

## Necessary And Sufficient Viewpoint Review

Do not treat the analysis as sufficient merely because every `TAxxx` appears at least once. The review must judge whether the viewpoint set is strong enough to become meaningful test design.

For each high-risk product risk or high-risk `TAxxx`, check whether the analysis includes, or explicitly justifies not including:

- Normal or representative behavior.
- Boundary or threshold behavior, including just-below, exact-boundary, and just-above patterns when relevant.
- Abnormal, invalid, missing, malformed, excessive, or contradictory input/state behavior.
- State transition, ordering, retry, repeated execution, or interaction behavior when the target has state or workflow.
- Relevant generic QA concerns for the target type, such as security/privacy, performance/reliability, compatibility, accessibility/usability, persistence/data integrity, concurrency/timing, configuration/environment, observability, or locale/time/numeric display.
- Case-splitting hints in `備考` when one viewpoint contains many meaningful values or conditions.
- Preservation of source-defined finite lists, boundaries, tiers, thresholds, supported environments, defaults, and exclusions so later design does not have to rediscover them.
- A complete `Source Structure Inventory` with a concrete `展開方針` for each source-defined finite set, boundary set, state/event set, environment matrix, input item, performance threshold, formal asset, and exception condition.

If a high-risk area has only a normal-flow viewpoint, only representative values, or a single broad boundary row that would collapse many cases downstream, record a `P1` finding and add or request additional viewpoints. For medium or low-risk areas, minor thinness is usually `P2` unless it blocks test design or hides a likely serious defect.

The review must also perform a "bug escape imagination" pass: list the typical bugs that could slip through if the current analysis were used as-is. If a likely escaped bug maps to a high-impact risk and can be addressed from available information, add or require a viewpoint. If the expected result is unclear, add or require a questionnaire entry.

## Review Perspectives

Review from these perspectives:

- **Test plan alignment**: Confirm all test approaches from the plan, such as `TA001`, are covered and that related product risks, scope, and exit conditions are respected.
- **Specification traceability**: Confirm each viewpoint links to a specification section, feature ID, README section, existing test, or is explicitly marked `要確認`.
- **Source structure preservation**: Confirm source-defined finite lists, enums, states, roles, supported environments, boundary sets, thresholds, defaults, and exclusions are represented in viewpoints, `備考`, or precise source references.
- **Source Structure Inventory completeness**: Confirm the analysis includes `Source Structure Inventory`, and that every row has `構造ID`, `種別`, source reference, concrete structure content or precise citation, `展開方針`, and downstream split hints.
- **Expansion policy quality**: Confirm finite sets default to `全件展開`, meaningful boundaries preserve `直前 / 境界 / 直後` or equivalent split hints, environments that can fail independently are not silently aggregated, and `質問待ち` is used when expected values or supported environments are unknown.
- **Representative sampling control**: Confirm `代表抽出` appears only with low-risk/large/same-judgment rationale and residual risk. For high-risk structures, require strong rationale or change to full/boundary/combination expansion.
- **Viewpoint granularity**: Confirm viewpoints are more concrete than test-plan approaches but not detailed test cases. They should be ready to become test design conditions.
- **Viewpoint category coverage**: Confirm normal, default value, boundary, abnormal, state transition, calculation, compatibility, usability, accessibility, security, performance, regression, and exploratory concerns are included when relevant.
- **Risk-based depth**: Confirm high-risk areas have enough viewpoints and low-risk areas are not over-expanded at the expense of critical behavior.
- **Necessary and sufficient coverage**: Confirm the viewpoint set is neither merely formal nor too shallow to produce effective test design. A single `TVxxx` for a `TAxxx` is not enough when the risk, target type, or behavior complexity requires multiple defect classes.
- **High-risk viewpoint density**: Confirm high-risk `TAxxx` and `Rxxx` entries have sufficient normal, boundary, abnormal, state/combination, and relevant generic QA coverage.
- **Generic QA catalog alignment**: Confirm the analysis considered generally expected QA categories for the target type, not only the requirements explicitly written in the specification.
- **Boundary and abnormal quality**: Confirm values such as zero, empty, negative, maximum, decimal, over-maximum, date/time transitions, inconsistent ranges, resource exhaustion, and nondeterministic behavior are considered when relevant.
- **Boundary and abnormal decomposability**: Confirm broad boundary or abnormal viewpoints include enough detail or `備考` case-splitting hints to be decomposed into meaningful designs later.
- **Expected-handling separation**: Confirm values or states with different expected handling are not compressed into one vague viewpoint unless the handling differences are explicit in `備考`.
- **Question-style viewpoint clarity**: Confirm wording such as `扱えるか確認する`, `問題ないか確認する`, or `適切に処理されるか` is rewritten or classified as confirmed behavior, `要確認`, source precondition, or exclusion.
- **Bug escape imagination**: Identify typical bugs that would likely pass undetected if the current analysis were used as-is, then decide whether they require new viewpoints, questions, or plan updates.
- **Downstream design readiness**: Confirm viewpoints include enough category, condition, origin, and case-splitting information for `create-test-design` to avoid collapsing many cases into one.
- **Questionnaire validity**: Confirm questions are necessary, specific, prioritized, and linked to viewpoint IDs and test approach IDs. Questions should unblock test design, acceptance criteria, execution feasibility, or plan updates. If there are no questions, confirm the questionnaire contains no dummy placeholder data rows.
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
- Treat missing `Source Structure Inventory` as `P0`.
- Treat a source-defined finite list, boundary set, event/state set, input item, formal asset, performance threshold, exception condition, or independently failing environment matrix that is absent from the inventory as `P1` when it can affect downstream case yield.
- Treat `代表抽出` without concrete rationale and residual risk as `P1`; raise to `P0` when it hides a high-risk structure so thoroughly that design cannot calculate expected cases.
- Treat broad inventory wording such as `代表値`, `異常値`, `各`, `複数`, `など`, or `適切` as `P1` unless concrete values, expected count/split shape, or `質問待ち` are also present.
- Treat high-risk viewpoint thinness as `P1` when the analysis would allow important defects to escape, even if the `TAxxx` appears in the table.
- Treat missing consideration of relevant generic QA categories as `P1` for high-risk areas and usually `P2` for medium or low-risk areas.
- Treat boundary, abnormal, or combination viewpoints that are too broad to become useful test design as `P1` when attached to high-risk functionality.
- Treat missing preservation of source-defined finite lists, boundary sets, thresholds, or supported-environment sets as `P1` when the structure is tied to high-risk behavior, otherwise usually `P2`.
- Treat a viewpoint that combines values or states with different expected handling as `P1` when it can mislead later design for high-risk behavior, otherwise usually `P2`.
- Treat unresolved question-style wording as `P1` when it hides an acceptance criterion or required stakeholder question, otherwise usually `P2`.
- Treat dummy placeholder rows in a no-question questionnaire as `P2` when they could be consumed as real questions, otherwise `P3`.
- Treat a likely serious "bug escape" found during review as `P1` when it can be addressed from available information; use `P2` when it is lower impact or mostly clarity-related.
- Treat a missing question that blocks test design or acceptance criteria as at least `P1`.
- Mark unavailable source facts as `要確認`; do not invent them.
- If no findings exist at a priority, say so clearly.

## Fix Rules

When fixing the analysis artifacts:

- Preserve existing file names, section order, ID style, and traceability style unless the issue requires structural correction.
- Fix `P0`, `P1`, and `P2` issues directly in the test analysis or questionnaire using source-supported content.
- Add viewpoint IDs sequentially, such as `TV064`, and question IDs sequentially, such as `Q018`.
- Keep analysis at viewpoint level. Do not add detailed test steps or expected results unless explicitly requested.
- Prefer explicit traceability, `要確認`, or questionnaire entries over vague assumptions.
- When fixing high-risk thinness, add multiple focused viewpoints rather than one broad catch-all row. Preserve the existing table shape and put origin/case-splitting information in `備考`.
- When fixing source-structure loss, add compact list/boundary/set information to `備考` or cite the exact source section. Do not expand analysis into detailed test cases.
- When fixing mixed expected handling, split the viewpoint or add a concise `期待処理差分: ...` note.
- When fixing question-style wording, classify it as confirmed behavior, `要確認` plus questionnaire entry, source precondition, or exclusion.
- When fixing generic QA omissions, add only relevant target-type viewpoints and mark unsupported expectations as `要確認` or questionnaire items.
- When fixing a no-question questionnaire, remove dummy placeholder rows and leave `現時点で質問はありません。` with either no table or an empty header-only table.
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
- Include the result of the `Source Structure Inventory` review, including any representative extraction, question-wait structures, and residual undercoverage risk.
- State clearly that no `P0`, `P1`, or `P2` findings remain, or explain any remaining fix-worthy finding that could not be fixed because required information was unavailable.
- List remaining `P3` issues, if any, with recommended next actions.
- Mention any updates made to the test analysis, questionnaire, or test plan.
