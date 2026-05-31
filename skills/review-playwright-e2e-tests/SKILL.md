---
name: review-playwright-e2e-tests
description: Review Playwright E2E automated test implementations against traceable Markdown E2E test cases, implementation reports, unimplemented-case lists, target pages, and project configuration. Use when Codex needs to assess or improve Playwright tests generated from `テストケース_E2E自動.md` / `TC-E2E-*`; prioritize findings, fix P0/P1/P2 fix-worthy issues in test code or related QA artifacts, rerun or statically validate, repeat until no P0/P1/P2 fix-worthy issues remain, and save the final review result as Markdown.
---

# Review Playwright E2E Tests

## Overview

Review and improve Playwright E2E automated tests so they are traceable, runnable, stable, meaningful, and maintainable. Focus on whether the tests exercise the specified browser target and whether unresolved, unsupported, or question-wait cases are honestly separated.

Default to Japanese output. This skill may edit Playwright test code, test helpers, Playwright configuration, `package.json` scripts, implementation reports, and unimplemented-case Markdown files when the user asks for the full review-and-fix workflow. Do not edit product code, specifications, README files, or unrelated artifacts unless the user explicitly asks.

## Workflow

1. Locate the review target. If the user does not specify paths, prefer:
   - Playwright test files referenced by `テスト成果物/Playwright_E2Eテスト実装結果.md`.
   - `tests/e2e/**/*.spec.js`, `tests/e2e/**/*.spec.ts`, or project-local Playwright conventions.
   - `playwright.config.js`, `playwright.config.ts`, and `package.json`.
   - `テスト成果物/Playwright_E2Eテスト実装結果.md`.
   - `テスト成果物/未実装テストケース_E2E自動.md`.
   - `テスト成果物/テストケース_E2E自動.md`.
   - `テスト成果物/テストケース_質問待ち.md`.
2. Gather source material in this order:
   - User-provided review instructions, target path/URL, browser scope, and acceptance criteria.
   - Playwright test code, fixtures, helpers, and configuration.
   - Playwright E2E implementation result report.
   - Unimplemented E2E automated test case list.
   - E2E automated and question-wait Markdown test case files.
   - Test design, design questionnaire, test analysis, and test plan.
   - Product specifications, README, existing tests, target page or app code, and project configuration.
3. Identify:
   - target page, URL, file, component, or app entrypoint under test,
   - Playwright command and browser projects,
   - implemented `TC-E2E-*`,
   - unimplemented `TC-E2E-*`,
   - question-wait / `要確認` cases,
   - helper functions, fixtures, target-loading logic, and environment assumptions.
4. Run Playwright tests when dependencies and browsers are already available. If they are unavailable, do not install without approval; run static checks such as JavaScript/TypeScript syntax checks and record the blocker.
5. Review using the perspectives below.
6. List findings with priority.
7. Fix all `P0`, `P1`, and `P2` findings that are actually fixable from available information. Fix `P3` findings only when low-risk and clearly supported.
8. Re-run the relevant Playwright command or static checks after changes.
9. Re-review the edited artifacts. Repeat review/fix/test until no `P0`, `P1`, or `P2` findings remain.
10. Save the final review result as Markdown. If no path is specified, save `テスト成果物/Playwright_E2Eテストレビュー結果.md`.

## Priority Rules

Use these priorities consistently:

- **P0 - Blocker**: The E2E tests cannot be trusted or run. Examples: test file has syntax/runtime errors, Playwright cannot load the target, test command is broken, many implemented `TC-E2E-*` are missing, traceability is absent, or tests do not exercise the target page.
- **P1 - High**: The tests are runnable but should be fixed before relying on them. Examples: implementable `TC-E2E-*` missing, question-wait or `要確認` case asserted without basis, weak assertion for high-risk behavior, nondeterministic random test, wrong target path/URL, brittle selector that is already avoidable, false-positive assertion, unimplemented case missing from the unimplemented list, or failing diagnostics too vague to debug.
- **P2 - Medium**: The tests can be used but should be improved. Examples: moderate duplication, inconsistent helper style, over-specific display-string assertions, incomplete implementation report, unclear test data names, missing optional evidence, or minor environment portability issue.
- **P3 - Low**: Nice-to-have cleanup. Examples: formatting polish, wording consistency, optional comments, or small naming refinements.

Treat `P0`, `P1`, and `P2` as fix-worthy findings. Continue the loop until none remain, except when the issue cannot be fixed because required stakeholder information or environment setup is unavailable; in that case, move or confirm the affected case in the unimplemented-case file with the relevant question ID or blocker. Treat `P3` as optional cleanup.

## Review Perspectives

Review from these perspectives:

- **Test target validity**: Confirm the tests open the user-specified file, URL, app entrypoint, route, or component and do not silently test the wrong target.
- **Traceability**: Confirm each implemented test name includes `TC-E2E-*` and has nearby `TDxxx`, `TVxxx`, `TAxxx`, specification, and risk information.
- **Test case coverage**: Confirm all implementable `テストケース_E2E自動.md` rows are implemented, and blocked rows are listed in `未実装テストケース_E2E自動.md` with concrete reasons.
- **Unimplemented case management**: Confirm `質問待ち`, `要確認`, unsupported browser, unsupported performance threshold, environment-ambiguous, or unsafe-to-automate cases are not hidden.
- **Assertion validity**: Confirm assertions verify the expected behavior from the source test case, not merely that something rendered.
- **False-positive / false-negative risk**: Confirm tests fail when the intended behavior breaks and do not fail for behavior that the specification allows.
- **Stability and flake resistance**: Confirm tests do not depend on uncontrolled randomness, arbitrary timing, execution order, stale browser state, clocks, locale quirks, network timing, or residual DOM.
- **Test independence**: Confirm each test starts from a clean page and does not rely on previous tests or shared mutable state.
- **Selector robustness**: Prefer stable `id`, role, label, and user-visible locators. Flag brittle structural CSS or text assertions when a better stable selector exists.
- **Input data validity**: Confirm boundary values, abnormal values, blank values, large values, and scenario data match the source case and do not accidentally test a different condition.
- **Playwright idioms**: Confirm the code uses `locator`, `expect`, fixtures, trace/screenshot/video settings, and configuration in a Playwright-appropriate way.
- **Environment portability**: Confirm paths, commands, browser projects, dependency declarations, and target URL handling work for other users when the artifact is distributed.
- **Failure diagnostics**: Confirm failing tests expose the `TC-E2E-*`, input condition, expected outcome, actual issue, screenshot/trace when available, and enough context to debug.
- **Security and performance handling**: Confirm external-network, console-error, XSS, performance, and memory cases are implemented only when their expected result and measurement method are source-supported; otherwise keep them unimplemented.
- **Execution readiness**: Confirm commands are documented, dependencies are declared, Playwright browsers are handled explicitly, and CI/local execution does not require hidden setup.
- **Maintainability**: Confirm helpers remove meaningful duplication, test names are readable, organization follows local conventions, and reports stay consistent with code.

## Finding Format

During each review pass, present findings first and sort by priority. Use this table:

```markdown
| 優先度 | 観点 | 問題 | 場所 | 影響 | 修正方針 |
|---|---|---|---|---|---|
```

Guidelines:

- Ground every finding in concrete files, test names, line references, test case IDs, reports, or source artifacts.
- Do not create a finding merely because optional detail is absent.
- Treat missing implementation for an implementable high-risk `TC-E2E-*` as at least `P1`.
- Treat a test that does not exercise the target page as at least `P1`, and `P0` if widespread.
- Treat unsupported assertion of a `質問待ち` / `要確認` case as at least `P1`.
- Treat uncontrolled randomness, arbitrary sleeps, or timing-dependent assertions for high-risk behavior as at least `P1`.
- Treat a broken Playwright command or syntax error as `P0` unless the failure is clearly environmental and documented.
- Treat missing unimplemented-case tracking for a blocked `TC-E2E-*` as at least `P1`.
- Mark unavailable source facts as `要確認`; do not invent them.

## Fix Rules

When fixing:

- Preserve product code unless explicitly asked to change it.
- Prefer fixing Playwright test code, helpers, Playwright config, package scripts, implementation reports, and unimplemented-case Markdown.
- Keep traceability IDs stable. Do not rename `TC-E2E-*`, `TDxxx`, `TVxxx`, or `TAxxx`.
- If a case is unsupported because expectation, browser scope, performance threshold, evidence format, or execution policy is unclear, remove or skip the unsafe assertion and add/update the unimplemented-case Markdown.
- If a test loads copied target logic or an inferred target, refactor it to load the actual target when feasible; otherwise document the limitation as a finding.
- If a test is flaky due to randomness, control randomness with source-supported inputs, scoped monkeypatching, or deterministic browser setup. Restore modified globals after the test.
- If a test relies on `waitForTimeout`, replace it with locator, event, network, or output-based waiting when feasible.
- If an assertion is too weak for the case, strengthen it using source-supported behavior. Do not invent exact numeric thresholds or visual tolerances.
- If path handling is not portable, prefer `path.resolve`, `pathToFileURL`, URL input via environment variable, or existing repo conventions.
- Re-run only the relevant Playwright command or static checks after changes.
- Update `Playwright_E2Eテスト実装結果.md` when implemented counts, unimplemented counts, commands, configuration, or file paths change.
- Do not add dependencies or install Playwright browsers unless the user explicitly approves or the dependency is already present.

## Final Review Result

Save a Markdown review result with this structure:

```markdown
# Playwright E2Eテストレビュー結果

## 1. レビュー対象
## 2. 参照資料
## 3. レビュー観点
## 4. レビュー・修正サマリー
## 5. 最終レビュー結果
## 6. 実行結果
## 7. 残課題
```

Final result requirements:

- Include reviewed Playwright code, configuration, implementation report, unimplemented-case file, source test cases, target page/app, and final review result path.
- Include the review perspectives applied.
- Summarize each review/fix/test iteration.
- State clearly that no `P0`, `P1`, or `P2` findings remain, or explain any remaining fix-worthy finding that could not be fixed.
- List remaining `P3` issues, if any, with recommended next actions.
- Mention every file updated during review.
- Include final implemented/unimplemented counts and final command/result or static validation result.
