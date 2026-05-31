---
name: review-test-plan
description: Review Japanese Markdown test plans against product specifications and QA planning quality criteria, prioritize findings, fix high-priority issues in the test plan, re-review until no high-priority fix-worthy issues remain, and save the final review result as Markdown. Use when Codex needs to assess or improve a テスト計画書, test strategy document, QA plan, traceable test planning artifact, use-case/scenario testing strategy, generic QA coverage, or downstream analysis/design depth expectations.
---

# Review Test Plan

## Overview

Review and improve a test plan by checking whether it is useful, traceable, risk-based, executable, appropriately scoped, and strong enough to guide downstream test analysis and design. Default to Japanese output and save the final review result as a Markdown artifact.

Treat plan completeness as necessary but not sufficient. A plan can contain risks and approaches but still be too weak if high-risk flows, use-case/scenario strategy, generic QA areas, or downstream depth expectations are missing.

This skill is allowed to edit the test plan being reviewed when the user asks for the full review-and-fix workflow. Do not edit source specifications, README files, product code, or unrelated artifacts unless the user explicitly asks.

## Workflow

1. Locate the test plan to review. If the user does not specify one, prefer Markdown files under `テスト成果物/`, `test artifacts/`, `docs/`, or similar QA artifact directories.
2. Gather source material in this order:
   - User-provided review instructions and acceptance criteria.
   - Product specifications such as `spec/`, `docs/`, files named `仕様書`, requirement IDs, or feature lists.
   - README and user-facing product documentation.
   - Existing tests, QA artifacts, and implementation files only when they clarify the plan.
3. Review the test plan using the review perspectives below.
4. List findings with priority. Include exact section names or file locations where possible.
5. Fix all `P0` and `P1` findings that are actually fixable from available information. Fix `P2` findings only when the correction is low-risk and clearly supported by the source material.
6. Re-review the edited test plan. Repeat the review and fix loop until no `P0` or `P1` findings remain.
7. Save the final review result as Markdown. If the user does not specify a path, save it next to the reviewed plan as `テスト計画レビュー結果.md`.

## Priority Rules

Use these priorities consistently:

- **P0 - Blocker**: The plan cannot be used safely as a test plan. Examples: missing test item, missing source document, missing core required sections, or a severe contradiction with the specification.
- **P1 - High**: The plan is usable but has a problem that should be fixed before relying on it. Examples: major spec coverage gap, high product risk not addressed, important user/operator/system flow lacks use-case or scenario-based strategy, missing risk-to-approach traceability, high-risk approach is too vague to guide analysis/design, relevant generic QA area is unconsidered for high-risk behavior, vague exit criteria for critical testing, missing review-quality gate for critical artifacts, or misleading scope.
- **P2 - Medium**: The plan can be used, but clarity or completeness should be improved. Examples: weak wording, minor traceability gaps, reviewability issues, or unsupported but non-critical assumptions.
- **P3 - Low**: Nice-to-have cleanup. Examples: formatting polish, wording consistency, or optional extra detail.

Treat `P0` and `P1` as high-priority fix-worthy findings. Continue the fix/re-review loop until none remain.

## Necessary And Sufficient Planning Review

Use this review to judge whether the plan gives downstream skills enough direction without turning into analysis, design, or test cases.

- A high-risk product risk should have one or more strategy-level approaches that indicate the expected depth of downstream analysis and design.
- If user, operator, or system-to-system goals are central to confidence, the plan should include use-case/scenario-based testing or explicitly explain why it is out of scope.
- Use-case/scenario strategy should identify target flows at a planning level: actor or user class, goal, risk, and rough priority. It should leave preconditions, main flow, alternative flow, exception flow, and postconditions to analysis/design.
- Relevant generic QA areas should be considered at plan level: input/boundary/abnormal data, state transitions, combinations, security/privacy, performance/reliability, compatibility, accessibility/usability, persistence, concurrency/timing, localization, and observability/logging.
- The plan should include exit criteria or residual-risk handling that prevents later artifacts from shipping with unresolved high-priority review findings unless explicitly accepted.
- Do not require every QA category for every product. Raise findings when the omission is inconsistent with product risk, user impact, or source material.

## Review Perspectives

Review from these perspectives:

- **Purpose validity**: Confirm the test purpose is clear and matches the product and the risk of using it.
- **Specification traceability**: Confirm test items, risks, scope, and approaches trace back to source specifications, feature IDs, requirement IDs, or document sections.
- **Risk analysis validity**: Confirm product risks are plausible, scored consistently, and drive the test focus.
- **Scope clarity**: Confirm in-scope and out-of-scope items are clear, not contradictory, and do not silently exclude important behavior.
- **Test approach appropriateness**: Confirm Unit, Integration, E2E, Security, Performance, Compatibility, Accessibility, Exploratory, or Regression approaches are chosen at the right level and remain strategy-level rather than detailed test cases.
- **Use-case/scenario strategy**: Confirm important user, operator, or system-to-system flows are covered by use-case/scenario-based testing when those flows drive confidence or risk.
- **Generic QA planning coverage**: Confirm relevant generic QA areas are considered and tied to risks or scope where appropriate.
- **Downstream depth guidance**: Confirm high-risk approaches tell later analysis/design what kind of depth is expected, such as boundaries, abnormal paths, state transitions, combinations, security, performance, compatibility, accessibility, recovery, persistence, concurrency, or observability.
- **Exit criteria measurability**: Confirm completion criteria can be judged and include defect handling, residual risk, regression, and approval where relevant.
- **Artifact quality gates**: Confirm the plan accounts for review outcomes for downstream artifacts when quality of analysis, design, cases, or automation matters.
- **Execution feasibility**: Confirm the plan can realistically be executed with the stated target files, environments, tools, and existing tests.
- **Product-specific concerns**: Check for concerns implied by the product, such as randomness/reproducibility, offline behavior, privacy, XSS or dynamic UI generation, performance with large outputs, and risks of users overtrusting financial or safety-sensitive results.

## Finding Format

During each review pass, present findings first and sort by priority. Use this table:

```markdown
| 優先度 | 観点 | 問題 | 場所 | 影響 | 修正方針 |
|---|---|---|---|---|---|
```

Guidelines:

- Ground every finding in the test plan and source material.
- Do not create a finding just because an optional detail is absent.
- Treat a high-risk user or operator flow without a use-case/scenario strategy as `P1` unless the plan explicitly excludes it with a defensible reason.
- Treat a high-risk product risk with only vague "test this" wording and no downstream depth expectation as `P1`.
- Treat missing consideration of a relevant generic QA area as `P1` when it affects high-risk behavior and `P2` when the impact is moderate.
- Treat exit criteria that allow unresolved `P0/P1` downstream artifact review findings without approval or residual-risk handling as `P1` when critical testing depends on those artifacts.
- Mark unavailable source facts as `要確認`; do not invent them.
- If no findings exist at a priority, say so clearly.

## Fix Rules

When fixing the test plan:

- Preserve the document's existing style and section order unless the issue requires structural correction.
- Fix high-priority issues directly in the test plan using source-supported content.
- Do not over-expand the plan into detailed test cases unless the test plan already uses that level or the user asks for it.
- Prefer adding traceability IDs, references, measurable criteria, or explicit `要確認` notes over vague prose.
- Add use-case/scenario-based approaches at strategy level when critical flows need them; do not decompose detailed scenario steps in the plan.
- Add downstream depth expectations to high-risk approaches when analysis/design would otherwise be under-directed.
- Add generic QA approaches only when product context or risk justifies them.
- Add `要確認` for unknown supported environments, thresholds, roles, data volume, acceptance criteria, or artifact quality gates.
- Record what was changed so the final review result can explain the iteration.

## Final Review Result

Save a Markdown review result with this structure:

```markdown
# テスト計画レビュー結果

## 1. レビュー対象
## 2. 参照資料
## 3. レビュー観点
## 4. レビュー・修正サマリー
## 5. 最終レビュー結果
## 6. 残課題
```

Final result requirements:

- Include the reviewed test plan path and final review result path.
- Include the source documents used.
- Include the review perspectives applied.
- Include a short necessary-and-sufficient planning summary, including use-case/scenario strategy, high-risk downstream depth expectations, and generic QA coverage.
- Summarize each review/fix iteration.
- State clearly that no `P0` or `P1` findings remain, or explain any remaining high-priority finding that could not be fixed because required information was unavailable.
- List remaining `P2` and `P3` issues, if any, with recommended next actions.
