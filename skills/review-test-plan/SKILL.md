---
name: review-test-plan
description: Review Japanese Markdown test plans against product specifications and QA planning quality criteria, prioritize findings, fix high-priority issues in the test plan, re-review until no high-priority fix-worthy issues remain, and save the final review result as Markdown. Use when Codex needs to assess or improve a テスト計画書, test strategy document, QA plan, or traceable test planning artifact.
---

# Review Test Plan

## Overview

Review and improve a test plan by checking whether it is useful, traceable, risk-based, executable, and appropriately scoped. Default to Japanese output and save the final review result as a Markdown artifact.

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
- **P1 - High**: The plan is usable but has a problem that should be fixed before relying on it. Examples: major spec coverage gap, high product risk not addressed, missing risk-to-approach traceability, vague exit criteria for critical testing, or misleading scope.
- **P2 - Medium**: The plan can be used, but clarity or completeness should be improved. Examples: weak wording, minor traceability gaps, reviewability issues, or unsupported but non-critical assumptions.
- **P3 - Low**: Nice-to-have cleanup. Examples: formatting polish, wording consistency, or optional extra detail.

Treat `P0` and `P1` as high-priority fix-worthy findings. Continue the fix/re-review loop until none remain.

## Review Perspectives

Review from these perspectives:

- **Purpose validity**: Confirm the test purpose is clear and matches the product and the risk of using it.
- **Specification traceability**: Confirm test items, risks, scope, and approaches trace back to source specifications, feature IDs, requirement IDs, or document sections.
- **Risk analysis validity**: Confirm product risks are plausible, scored consistently, and drive the test focus.
- **Scope clarity**: Confirm in-scope and out-of-scope items are clear, not contradictory, and do not silently exclude important behavior.
- **Test approach appropriateness**: Confirm Unit, Integration, E2E, Security, Performance, Compatibility, Accessibility, Exploratory, or Regression approaches are chosen at the right level and remain strategy-level rather than detailed test cases.
- **Exit criteria measurability**: Confirm completion criteria can be judged and include defect handling, residual risk, regression, and approval where relevant.
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
- Mark unavailable source facts as `要確認`; do not invent them.
- If no findings exist at a priority, say so clearly.

## Fix Rules

When fixing the test plan:

- Preserve the document's existing style and section order unless the issue requires structural correction.
- Fix high-priority issues directly in the test plan using source-supported content.
- Do not over-expand the plan into detailed test cases unless the test plan already uses that level or the user asks for it.
- Prefer adding traceability IDs, references, measurable criteria, or explicit `要確認` notes over vague prose.
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
- Summarize each review/fix iteration.
- State clearly that no `P0` or `P1` findings remain, or explain any remaining high-priority finding that could not be fixed because required information was unavailable.
- List remaining `P2` and `P3` issues, if any, with recommended next actions.
