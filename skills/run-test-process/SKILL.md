---
name: run-test-process
description: Orchestrate the full Japanese QA workflow by invoking existing skills in order, from test plan creation through reviews, analysis, design, test cases, code-based and Playwright E2E test implementation, execution recording, final HTML report generation, and final report review. Use when Codex needs to run the whole test artifact lifecycle with provided specifications and test targets while leaving human-executed tests unexecuted and visible in the final report. Runs as a single user-visible workflow while using checkpointed phase handoffs to keep long sessions reliable.
---

# Run Test Workflow

## Overview

Run the complete test workflow by using the existing specialized skills in a fixed order. This skill is an orchestrator and does not replace the detailed instructions in each child skill; load each child `SKILL.md` before executing that step and follow its input, output, review-loop, and stop-condition rules.

The user-facing experience should be one-shot: when the user asks for `$run-test-process`, continue through the final report whenever meaningful progress is possible. Internally, treat the workflow as serial phase workers with checkpointed handoffs, so later steps use saved artifacts instead of relying on a long conversation history.

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
10. **Implementation Entry Gate** (use `$review-test-artifacts` gate output; do not implement tests until it passes)
11. `$create-test-code`
12. `$review-test-code`
13. `$execute-codebase-tests`
14. `$create-playwright-e2e-tests`
15. `$review-playwright-e2e-tests`
16. `$execute-playwright-e2e-tests`
17. `$create-test-report`
18. `$review-test-report`

## Checkpointed Phase Execution

Run the workflow in these phases. Complete each phase, update the checkpoint files, then start the next phase from the saved artifacts and checkpoint state:

1. Plan: `$create-test-plan` + `$review-test-plan`
2. Analysis: `$create-test-analysis` + `$review-test-analysis`
3. Design: `$create-test-design` + `$review-test-design`
4. Cases and implementation gate: `$create-test-cases` + `$review-test-cases` + `$review-test-artifacts` + **Implementation Entry Gate**
5. Codebase automation: `$create-test-code` + `$review-test-code` + `$execute-codebase-tests`
6. Playwright E2E automation: `$create-playwright-e2e-tests` + `$review-playwright-e2e-tests` + `$execute-playwright-e2e-tests`
7. Final report: `$create-test-report` + `$review-test-report`

At the end of every phase, create or update:

- `テスト成果物/run-test-process_進行状況.md`
- `テスト成果物/run-test-process_引き継ぎ.md`

The progress file should record:

- Completed phase and timestamp.
- Generated or updated artifact paths.
- Review status, especially whether any fix-worthy `P0`, `P1`, or `P2` findings remain, and the Implementation Entry Gate result when applicable.
- Question-wait, unimplemented, unexecuted, `N/A`, infrastructure issue, and blocker summaries.
- The exact input artifacts for the next phase.

The handoff file should be concise and task-local. It should contain only the facts the next phase needs: purpose, target files or URLs, constraints, relevant traceability IDs, unresolved decisions, latest execution folders, and the next phase's completion criteria.

When the environment supports child threads, subagents, or background tasks, run each phase in a fresh serial child context by default. Before launching the first child, read `references/serial_subagents.md` and follow its prompt, completion, verification, and close/archive protocol. Start exactly one child at a time; wait for it to complete; verify local artifacts, review stop conditions, gate results, and checkpoint files; close or archive that child when supported; then start the next child. When child execution tools are unavailable, continue in the same thread but explicitly treat `テスト成果物/run-test-process_進行状況.md`, `テスト成果物/run-test-process_引き継ぎ.md`, and the generated QA artifacts as the source of truth for the next phase.

For each step:

- Read the child skill's `SKILL.md` just before using it.
- Use the child skill's default output locations unless the user specified alternatives.
- Preserve traceability IDs across artifacts: `TAxxx`, `TVxxx`, `TDxxx`, `TC-*`, `BUG-*`, and `E2E-BUG-*`.
- Report blockers and generated artifact paths before moving to a substantially different phase.
- Prefer saved artifacts and checkpoint files over conversational memory when deciding what the next step should do.

## Gates And Continuation Rules

- After each creation step, confirm the expected artifact exists before starting the corresponding review step.
- After each phase, confirm the progress and handoff files exist before starting the next phase.
- If a phase used a child thread or subagent, do not start the next phase until that child has completed and has been closed or archived when the tool supports it.
- Review steps must repeat review/fix/re-review until each child review skill's stop condition is met. For review skills that define `P0`, `P1`, and `P2` as fix-worthy, continue until no fix-worthy `P0`, `P1`, or `P2` findings remain.
- If a review uncovers a clear upstream gap, allow the relevant child review skill to update upstream QA artifacts as defined by that skill.
- If a question-wait or `要確認` item appears, do not guess. Keep it in the questionnaire, question-wait test cases, or unimplemented test case list.
- Before `$create-test-code`, run the **Implementation Entry Gate**:
  - Confirm `Source Structure Inventory`, `Expected Case Yield`, and `Case Expansion Ledger` exist.
  - Cross-check `Source Structure Inventory -> Expected Case Yield -> Case Expansion Ledger` by `SSIxxx`/`TDxxx`.
  - Confirm every `TDxxx` has `期待TC数`, `実TC数`, and `不足数`.
  - If `実TC数 < 期待TC数` without a concrete representative extraction reason, aggregate judgment rule, or linked `質問待ち`, return to `$create-test-design`, `$review-test-design`, `$create-test-cases`, and `$review-test-cases` as needed.
  - If high-risk source structures are compressed without rationale/residual risk, return upstream before implementation.
  - Do not accept "one or more `TC-*` per `TDxxx`" as sufficient unless the expected-vs-actual ledger also passes.
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
- The Implementation Entry Gate must explicitly state whether implementation may start. It must surface total expected cases, total actual cases, shortages, question-wait counts, and accepted representative/aggregate rationales.

### Implementation And Execution

- `$create-test-code` implements codebase automated tests for implementable `テストケース_コードベース.md` cases and records unimplemented cases.
- `$review-test-code` reviews and fixes `P0`/`P1`/`P2` fix-worthy issues in the codebase test implementation and saves `テスト成果物/テストコードレビュー結果.md`.
- `$execute-codebase-tests` runs or records codebase tests, producing a timestamped `テスト成果物/report/yyyyMMddHHmmss_コードベーステスト/` folder and `コードベース_発見issue一覧.md`.
- `$create-playwright-e2e-tests` implements Playwright tests for implementable `テストケース_E2E自動.md` cases and records unimplemented E2E cases.
- `$review-playwright-e2e-tests` reviews and fixes `P0`/`P1`/`P2` fix-worthy issues in the Playwright E2E implementation and saves `テスト成果物/Playwright_E2Eテストレビュー結果.md`.
- `$execute-playwright-e2e-tests` runs or records E2E tests, producing a timestamped `テスト成果物/report/yyyyMMddHHmmss_e2e自動テスト/` folder and `e2e_発見issue一覧.md`.

### Final Report

- `$create-test-report` snapshots the current QA artifacts and latest execution folders into `テスト成果物/report/yyyyMMddHHmmss_report/`.
- `$review-test-report` reviews and fixes `P0`/`P1`/`P2` fix-worthy issues in the generated report and saves `テスト成果物/テストレポートレビュー結果.md`.
- The final report should make remaining `Fail`, `N/A`, not-yet-executed, question-wait, and unimplemented cases visible.
- Human-executed tests remain unexecuted in this workflow and should appear as not-yet-executed unless the user separately provides execution results.

## Final Outputs

At the end, summarize the key artifact paths:

- `テスト成果物/run-test-process_進行状況.md` and `テスト成果物/run-test-process_引き継ぎ.md`.
- Test plan, analysis, design, and test case Markdown files.
- Review result Markdown files.
- Codebase and E2E test implementation result files.
- Unimplemented test case lists.
- Codebase and E2E execution result report folders.
- Final HTML test execution report folder and `index.html`.
- Final test report review result Markdown file.

## Safety

- Do not edit specifications, README files, or product code unless the user explicitly asks.
- Do not install dependencies or browsers without explicit approval.
- Do not treat skipped human-executed tests as failures; show them as not yet executed in the report.
- Continue as far as meaningful even when some lanes are incomplete, so the final report captures the current state instead of hiding gaps.
