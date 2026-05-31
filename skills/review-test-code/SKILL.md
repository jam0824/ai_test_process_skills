---
name: review-test-code
description: Review executable code-based test implementations against traceable Markdown test cases, implementation reports, unimplemented-case lists, specifications, and target code. Use when Codex needs to assess or improve unit, integration, regression, or code-level automated tests generated from `テストケース_コードベース.md` / `TC-CB-*`; prioritize findings, fix P0/P1/P2 fix-worthy issues in test code or related QA artifacts, rerun tests, repeat until no P0/P1/P2 fix-worthy issues remain, and save the final review result as Markdown.
---

# Review Test Code

## Overview

Review and improve code-based automated tests so they are traceable, runnable, deterministic, meaningful, and maintainable. Focus on whether the implemented tests truly verify the specified target code and whether unimplemented or question-wait cases are honestly documented.

Default to Japanese output. This skill may edit test code, test helpers, implementation reports, and unimplemented-case Markdown files when the user asks for the full review-and-fix workflow. Do not edit product code, product specifications, README files, or unrelated artifacts unless the user explicitly asks.

## Workflow

1. Locate the review target. If the user does not specify paths, prefer:
   - Test code files referenced by `テスト成果物/テストコード実装結果.md`.
   - `テスト成果物/テストコード実装結果.md`.
   - `テスト成果物/未実装テストケース_コードベース.md`.
   - `テスト成果物/テストケース_コードベース.md`.
   - `テスト成果物/テストケース_質問待ち.md`.
2. Gather source material in this order:
   - User-provided review instructions and acceptance criteria.
   - Test code and test helpers.
   - Test code implementation result report.
   - Unimplemented code-based test case list.
   - Code-based and question-wait Markdown test case files.
   - Test design, design questionnaire, test analysis, and test plan.
   - Product specifications, README, existing tests, project configuration, and target implementation.
3. Identify:
   - target code under test,
   - test runner and command,
   - implemented `TC-CB-*`,
   - unimplemented `TC-CB-*`,
   - question-wait / `要確認` cases,
   - test files and helper files.
4. Run the relevant tests before or during review when feasible. If tests cannot run, record the blocker and review statically as far as possible.
5. Review using the perspectives below.
6. List findings with priority.
7. Fix all `P0`, `P1`, and `P2` findings that are actually fixable from available information. Fix `P3` findings only when low-risk and clearly supported.
8. Re-run the relevant tests after code changes.
9. Re-review the edited artifacts. Repeat review/fix/test until no `P0`, `P1`, or `P2` findings remain.
10. Save the final review result as Markdown. If no path is specified, save `テスト成果物/テストコードレビュー結果.md`.

## Priority Rules

Use these priorities consistently:

- **P0 - Blocker**: The test implementation cannot be trusted or run. Examples: test command fails, test file has syntax/runtime errors, tests do not load the target, many implemented `TC-CB-*` are missing, traceability is absent, or tests verify copied logic instead of the target.
- **P1 - High**: The tests are runnable but should be fixed before relying on them. Examples: implementable `TC-CB-*` missing, question-wait or `要確認` case asserted without basis, weak assertion for high-risk behavior, nondeterministic random test, target mismatch, wrong test framework/use, false-positive test, unimplemented case missing from the unimplemented list, or failing diagnostics too vague to debug.
- **P2 - Medium**: The tests can be used but should be improved. Examples: moderate duplication, inconsistent helper style, brittle display-string assertions where a more semantic assertion is easy, incomplete implementation report, unclear test data names, or minor maintainability issue.
- **P3 - Low**: Nice-to-have cleanup. Examples: formatting polish, wording consistency, optional comments, or small naming refinements.

Treat `P0`, `P1`, and `P2` as fix-worthy findings. Continue the loop until none remain, except when the issue cannot be fixed because required stakeholder information or environment setup is unavailable; in that case, move or confirm the affected case in the unimplemented-case file with the relevant question ID or blocker. Treat `P3` as optional cleanup.

## Review Perspectives

Review from these perspectives:

- **Traceability**: Confirm each implemented test maps to `TC-CB-*` and includes nearby `TDxxx`, `TVxxx`, `TAxxx`, specification, and risk information.
- **Test case coverage**: Confirm all implementable code-based test cases are implemented, and non-implemented cases are listed in `未実装テストケース_コードベース.md` with concrete reasons.
- **Unimplemented case management**: Confirm `質問待ち`, `要確認`, technically blocked, or target-mismatch cases are not hidden; reasons and required follow-up are specific.
- **Actual target verification**: Confirm tests exercise the specified target code, not a copied or reimplemented version of the logic unless the repository intentionally uses an existing harness and documents the limitation.
- **Expected-value basis**: Confirm numeric and state expectations are supported by test cases, specifications, README, existing tests, or clear contracts.
- **Assertion strength**: Confirm tests assert meaningful outcomes, not just "result exists", especially for high-risk calculation, transition, permission, recovery, randomness, or data-integrity behavior.
- **Independence**: Confirm tests do not rely on execution order, leaked global state, leftover DOM, altered random functions, files, network, clocks, or locale state.
- **Determinism**: Confirm randomness, time, locale, floating-point tolerance, and environment differences are controlled or explicitly left unimplemented.
- **Test level/type validity**: Confirm Unit / Integration / Regression cases are implemented at the right level, and E2E/human-only cases are not forced into code-based tests.
- **Maintainability**: Confirm helpers reduce real duplication, failure messages are useful, test data names are readable, and test organization follows the project style.
- **Execution readiness**: Confirm commands are clear, dependencies are available or documented, and the tests can run locally and in CI without unnecessary setup.
- **Failure diagnostics**: Confirm failures show enough context, such as test case ID, input condition, expected value, actual value, or target condition/scenario.
- **Test data validity**: Confirm input data matches the source test case and does not accidentally trigger unrelated side effects that invalidate the assertion.
- **Coupling and brittleness**: Confirm tests avoid unnecessary private implementation details and do not overfit wording/format unless that output is the contract.
- **Safety**: Confirm tests do not perform external network access, destructive filesystem operations, hidden dependency installation, or environment mutation beyond the test scope.

## Finding Format

During each review pass, present findings first and sort by priority. Use this table:

```markdown
| 優先度 | 観点 | 問題 | 場所 | 影響 | 修正方針 |
|---|---|---|---|---|---|
```

Guidelines:

- Ground every finding in concrete files, test names, line references, test case IDs, reports, or source artifacts.
- Do not create a finding merely because optional detail is absent.
- Treat missing implementation for an implementable high-risk `TC-CB-*` as at least `P1`.
- Treat a test that does not exercise the target code as at least `P1`, and `P0` if widespread.
- Treat any unsupported assertion for a `質問待ち` / `要確認` case as at least `P1`.
- Treat a nondeterministic or flaky test for a high-risk behavior as at least `P1`.
- Treat a failed test command as `P0` unless the failure is clearly environmental and documented.
- Treat missing unimplemented-case tracking for a blocked `TC-CB-*` as at least `P1`.
- Mark unavailable source facts as `要確認`; do not invent them.

## Fix Rules

When fixing:

- Preserve the product code unless explicitly asked to change it.
- Prefer fixing test code, test helpers, implementation reports, and unimplemented-case Markdown.
- Keep traceability IDs stable. Do not rename `TC-CB-*`, `TDxxx`, `TVxxx`, or `TAxxx`.
- If a test is unsupported because expectation or execution policy is unclear, remove or skip the unsafe assertion and add/update the unimplemented-case Markdown.
- If a test loads copied target logic, refactor the test to load the actual target when feasible; otherwise document the limitation as a finding.
- If a test is flaky due to randomness, control randomness with existing seams, scoped monkeypatching, seed, or deterministic inputs. Restore global state after the test.
- If numeric expectations require tolerance, use source-supported tolerance. If tolerance is unknown, move the case to unimplemented/question-wait rather than guessing.
- Re-run only the relevant test command after changes.
- Update `テストコード実装結果.md` when implemented counts, unimplemented counts, commands, or file paths change.
- Do not add new dependencies unless the user explicitly approves or the repository already has that dependency.

## Final Review Result

Save a Markdown review result with this structure:

```markdown
# テストコードレビュー結果

## 1. レビュー対象
## 2. 参照資料
## 3. レビュー観点
## 4. レビュー・修正サマリー
## 5. 最終レビュー結果
## 6. 実行結果
## 7. 残課題
```

Final result requirements:

- Include reviewed test code, implementation report, unimplemented-case file, source test cases, target code, and final review result path.
- Include the review perspectives applied.
- Summarize each review/fix/test iteration.
- State clearly that no `P0`, `P1`, or `P2` findings remain, or explain any remaining fix-worthy finding that could not be fixed.
- List remaining `P3` issues, if any, with recommended next actions.
- Mention every file updated during review.
- Include final implemented/unimplemented counts and final test command/result.
