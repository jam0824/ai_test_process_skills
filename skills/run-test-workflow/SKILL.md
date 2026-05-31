---
name: run-test-workflow
description: Orchestrate the full Japanese QA workflow by invoking existing skills in order, from test plan creation through reviews, analysis, design, test cases, code-based and Playwright E2E test implementation, execution recording, and final HTML report generation. Use when Codex needs to run the whole test artifact lifecycle with provided specifications and test targets while leaving human-executed tests unexecuted and visible in the final report.
---

# Run Test Workflow

## Overview

Run the complete test workflow by using the existing specialized skills in a fixed order. This skill is an orchestrator and does not replace the detailed instructions in each child skill; load each child `SKILL.md` before executing that step and follow its input, output, review-loop, and stop-condition rules.

## Required Inputs

Before starting, confirm the user has provided or the repository already contains:

- Product specifications, README, or equivalent reference documents.
- Test target code, URL, HTML, app entrypoint, component, or page.
- Codebase test implementation target.
- E2E automated test implementation target.

If a target needed for implementation is missing and cannot be safely inferred, do not invent it. Record the affected cases as unimplemented or unexecuted and continue toward the final report when possible.

## Workflow Order

Run these steps in this exact order:

1. `$create-test-plan`
2. `$review-test-plan`
3. `$create-test-analysis`
4. `$review-test-analysis`
5. `$create-test-design`
6. `$review-test-design`
7. `$create-test-cases`
8. `$review-test-cases`
9. `$review-test-artifacts`
10. `$create-test-code`
11. `$review-test-code`
12. `$execute-codebase-tests`
13. `$create-playwright-e2e-tests`
14. `$review-playwright-e2e-tests`
15. `$execute-playwright-e2e-tests`
16. `$create-test-report`

For each step:

- Read the child skill's `SKILL.md` just before using it.
- Use the child skill's default output locations unless the user specified alternatives.
- Preserve traceability IDs across artifacts: `TAxxx`, `TVxxx`, `TDxxx`, `TC-*`, `BUG-*`, and `E2E-BUG-*`.
- Report blockers and generated artifact paths before moving to a substantially different phase.

## Gates And Continuation Rules

- After each creation step, confirm the expected artifact exists before starting the corresponding review step.
- Review steps must repeat review/fix/re-review until no fix-worthy `P0` or `P1` findings remain, following each review skill's rules.
- If a review uncovers a clear upstream gap, allow the relevant child review skill to update upstream QA artifacts as defined by that skill.
- If a question-wait or `要確認` item appears, do not guess. Keep it in the questionnaire, question-wait test cases, or unimplemented test case list.
- If a codebase or E2E implementation target is missing, skip only that implementation/execution lane, update the unimplemented or unexecuted records, and continue to `$create-test-report`.
- If dependencies, Playwright browsers, or execution environments are missing, do not install them without user approval. Let the execution-recording skills capture `N/A` or infrastructure issues when appropriate.
- Do not execute human-run test cases. Keep `テストケース_人間実行.md` as a created and reviewed artifact, and let the final report show those cases as not yet executed.

## Phase Details

### Planning Through Test Cases

- `$create-test-plan` creates `テスト成果物/テスト計画書.md`.
- `$review-test-plan` saves `テスト成果物/テスト計画レビュー結果.md`.
- `$create-test-analysis` creates `テスト成果物/テスト分析.md` and `テスト成果物/テスト分析_質問票.md`.
- `$review-test-analysis` saves `テスト成果物/テスト分析レビュー結果.md`.
- `$create-test-design` creates `テスト成果物/テスト設計.md` and `テスト成果物/テスト設計_質問票.md`.
- `$review-test-design` saves `テスト成果物/テスト設計レビュー結果.md`.
- `$create-test-cases` creates split test case files for codebase, E2E automated, human execution, and question-wait cases.
- `$review-test-cases` saves `テスト成果物/テストケースレビュー結果.md`.
- `$review-test-artifacts` reviews plan, analysis, design, and test cases together, then saves `テスト成果物/テスト成果物横断レビュー結果.md`.

### Implementation And Execution

- `$create-test-code` implements codebase automated tests for implementable `テストケース_コードベース.md` cases and records unimplemented cases.
- `$review-test-code` reviews and fixes high-priority issues in the codebase test implementation and saves `テスト成果物/テストコードレビュー結果.md`.
- `$execute-codebase-tests` runs or records codebase tests, producing a timestamped `テスト成果物/report/yyyyMMddHHmmss_コードベーステスト/` folder and `コードベース_発見issue一覧.md`.
- `$create-playwright-e2e-tests` implements Playwright tests for implementable `テストケース_E2E自動.md` cases and records unimplemented E2E cases.
- `$review-playwright-e2e-tests` reviews and fixes high-priority issues in the Playwright E2E implementation and saves `テスト成果物/Playwright_E2Eテストレビュー結果.md`.
- `$execute-playwright-e2e-tests` runs or records E2E tests, producing a timestamped `テスト成果物/report/yyyyMMddHHmmss_e2e自動テスト/` folder and `e2e_発見issue一覧.md`.

### Final Report

- `$create-test-report` snapshots the current QA artifacts and latest execution folders into `テスト成果物/report/yyyyMMddHHmmss_report/`.
- The final report should make remaining `Fail`, `N/A`, not-yet-executed, question-wait, and unimplemented cases visible.
- Human-executed tests remain unexecuted in this workflow and should appear as not-yet-executed unless the user separately provides execution results.

## Final Outputs

At the end, summarize the key artifact paths:

- Test plan, analysis, design, and test case Markdown files.
- Review result Markdown files.
- Codebase and E2E test implementation result files.
- Unimplemented test case lists.
- Codebase and E2E execution result report folders.
- Final HTML test execution report folder and `index.html`.

## Safety

- Do not edit specifications, README files, or product code unless the user explicitly asks.
- Do not install dependencies or browsers without explicit approval.
- Do not treat skipped human-executed tests as failures; show them as not yet executed in the report.
- Continue as far as meaningful even when some lanes are incomplete, so the final report captures the current state instead of hiding gaps.
