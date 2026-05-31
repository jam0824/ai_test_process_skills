---
name: create-test-code
description: Create executable test code from traceable code-based Markdown test cases and separately document unimplemented code-based cases. Use when Codex needs to turn `テストケース_コードベース.md`, `TC-CB-*` rows, or similar code-level test case tables into actual unit, integration, regression, or code-level automated tests for a user-specified target file, module, class, function, or component; choose the appropriate language/framework from the repository, preserve TC/TD/TV/TA/R traceability, save question-wait or `要確認` cases to `未実装テストケース_コードベース.md`, and stop when no concrete test target is provided.
---

# Create Test Code

## Overview

Implement executable tests from code-based test cases while preserving traceability to the QA artifacts. Default to Japanese-facing test names where the chosen language and framework can handle them safely.

This skill writes test code, not E2E browser automation and not manual test procedures. Use it for `コードベース` test cases such as `Unit`, `Integration`, and `Regression`.

## Required Target

Do not implement tests unless the user provides a concrete test target.

A valid target is a specific file, module, class, function, component, or package path, such as:

- `src/example.html`
- `src/calc.ts`
- `app/services/tax_calculator.py`
- `calculateNetMonthly()`

If the target is missing or ambiguous, stop before editing files and ask the user to specify the target. Do not infer a target only from the existence of test cases.

## Workflow

1. Confirm the user-specified test target exists or can be located unambiguously.
2. Locate code-based test cases. If not specified, prefer `テスト成果物/テストケース_コードベース.md`.
3. Gather source material in this order:
   - User instructions, especially target, framework preference, output path, and scope.
   - Code-based test case rows, especially `TC-CB-*`, `TDxxx`, `TVxxx`, `TAxxx`, expected result, risk ID, and state.
   - Test design and design questionnaire.
   - Test analysis and test plan.
   - Specifications, README, existing tests, and implementation.
   - Project configuration such as `package.json`, `pyproject.toml`, `pytest.ini`, `pom.xml`, `build.gradle`, `go.mod`, `Cargo.toml`, `.csproj`, or existing test directories.
4. Select the test framework from repository evidence. Prefer existing test runners, scripts, dependencies, naming conventions, and helper utilities.
5. Classify code-based cases into implementation targets and unimplemented/pending targets:
   - Include rows with `状態=作成済み` or `状態=上流更新済み`.
   - Do not invent assertions for `状態=質問待ち`, `期待結果=要確認`, or cases whose expected value depends on unanswered questions.
   - Save question-wait, `要確認`, target-mismatch, unsupported-framework, or technically blocked cases to `テスト成果物/未実装テストケース_コードベース.md`.
6. Create or update test files in the repository's normal test location.
7. Add traceability near every test.
8. Run the relevant tests when feasible. If a runner or dependency is missing, report the blocker and do not silently install dependencies.
9. Save or update a concise implementation report. If no path is specified, use `テスト成果物/テストコード実装結果.md` and reference the unimplemented-case file.

## Framework Selection

Prefer the project's existing stack over adding a new one.

Use these defaults only when the repository does not already establish a stronger pattern:

| Target / Repo Evidence | Preferred Test Style |
|---|---|
| JavaScript/TypeScript with `vitest` | Vitest `describe` / `test` |
| JavaScript/TypeScript with `jest` | Jest `describe` / `test` |
| JavaScript/TypeScript with `node:test` or no dependency | Node built-in `node:test` when feasible |
| Browser-only HTML/JS without module exports | Existing HTML test harness, or a small local harness that loads the target without external dependencies |
| Python | `pytest` if present; otherwise `unittest` |
| Go | Standard `testing` package |
| Rust | `cargo test` with `#[test]` |
| Java | JUnit already used by the project, preferably JUnit 5 when present |
| C#/.NET | Existing xUnit/NUnit/MSTest convention |
| Ruby | Existing RSpec/Minitest convention |
| PHP | Existing PHPUnit/Pest convention |

If no practical test runner exists and adding one would change project dependencies, pause and ask before adding dependencies.

## Test Naming

Make test intent readable in Japanese when practical.

- For frameworks with string test names, put the traceability ID and Japanese intent in the test name:

```js
test("TC-CB-001 年収300万円の月手取りを計算できる", () => {
  // ...
});
```

- For Python, Ruby, Java, C#, or other languages where Unicode method names may be fragile for tooling, prefer stable ASCII identifiers plus Japanese display names, docstrings, annotations, or comments.
- If method names can safely be Japanese in the language and repository style, use them. Otherwise preserve readability through the framework's display-name feature or a traceability comment.
- Keep IDs in test names when the framework output can display them.

## Traceability Rules

Every implemented test must trace to its source test case.

Place traceability in a stable comment, metadata block, annotation, or helper call close to the test:

```text
TC: TC-CB-001
TD: TD001
TV: TV001
TA: TA001
Risk: R001
Spec: spec/仕様書.md 2.2 F001
```

For parameterized tests, either:

- include each `TC-CB-*` in the parameter label, or
- keep a nearby table/list mapping each parameter row to `TC-CB-*`.

Do not collapse multiple test cases into one test unless the traceability for each case remains explicit and the assertions remain independently diagnosable.

## Implementation Rules

- Respect existing code style, test structure, fixtures, setup/teardown, import style, and naming.
- Keep test code focused on the target. Do not refactor product code unless the user explicitly asks or testability requires a minimal, well-scoped extraction.
- Prefer testing public or intended test seams. Avoid brittle private implementation checks unless the test case specifically requires code review or internal behavior.
- Use source-supported expected values from the test case, spec, README, existing tests, or implementation contract. Do not create new numeric expectations without a clear source.
- When exact floating-point or formatting assertions are needed, use the tolerance or formatting rule from the artifacts. If it is not specified, do not guess; mark the case pending in the report.
- Keep tests deterministic. For random behavior, use controllable inputs such as 0%/100%, dependency injection, seeding, monkeypatching, or existing test helpers. Do not rely on uncontrolled randomness.
- Avoid external network access, clocks, locale assumptions, file paths, or browser state unless the case requires them and the setup is explicit.
- Add minimal helpers only when they reduce duplication across several traceable tests.

## Unimplemented Code-Based Cases

Create or update `テスト成果物/未実装テストケース_コードベース.md` whenever at least one code-based test case cannot be implemented safely in the current pass.

Use the file even when the reason is expected and healthy, such as an unanswered question. The goal is to keep implementation coverage honest and traceable, not to hide skipped work.

Put these cases in the unimplemented file:

- `状態=質問待ち`
- `期待結果` contains `要確認`
- `関連質問ID` is not `なし`
- The target specified by the user does not include the code needed by the case.
- The case requires a framework, dependency, fixture, browser, clock, randomness control, or test seam that is not currently available and should not be invented.
- The expected value cannot be sourced from test cases, specifications, README, existing tests, or a clear implementation contract.

Use this structure:

```markdown
# 未実装テストケース（コードベース）

## 1. 対象
## 2. 参照資料
## 3. 未実装テストケース
## 4. 実装に必要な確認・対応
## 5. トレーサビリティ確認
```

Use this table for `## 3. 未実装テストケース`:

```markdown
| テストケースID | 元テスト設計ID | テスト観点ID | テストアプローチID | テストレベル/タイプ | 優先度 | テストケース名 | 未実装理由 | 実装に必要な確認・対応 | 関連質問ID | 仕様 | リスクID | 状態 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
```

State the unimplemented reason concretely, for example:

- `質問待ち`
- `期待結果が要確認`
- `対象外: 指定ターゲットに該当ロジックがない`
- `テストシーム未整備`
- `依存関係追加の承認待ち`
- `乱数制御方針未確定`

If there are no unimplemented code-based cases, either omit the file or create it with `該当なし`, following the user's preference or repository convention.

## Output Report

Create or update `テスト成果物/テストコード実装結果.md` unless the user specifies another report path.

Use this structure:

```markdown
# テストコード実装結果

## 1. 実装対象
## 2. 参照資料
## 3. 使用テストフレームワーク
## 4. 実装したテスト
## 5. 未実装テストケース
## 6. 実行結果
## 7. トレーサビリティ確認
```

Use this table for implemented tests:

```markdown
| テストケースID | テスト名 | 実装ファイル | 対象 | テストレベル/タイプ | 仕様 | リスクID | 状態 |
|---|---|---|---|---|---|---|---|
```

In `## 5. 未実装テストケース`, reference `テスト成果物/未実装テストケース_コードベース.md` and summarize counts by reason. Do not duplicate the full table unless the user asks for a single-file report.

Use this compact summary table:

```markdown
| 区分 | 件数 | 主な理由 | 詳細ファイル |
|---|---:|---|---|
```

## Before Finishing

- Confirm the required test target was explicitly provided.
- Confirm every implemented test maps to a `TC-CB-*` row.
- Confirm every implemented `TC-CB-*` has nearby traceability to `TDxxx`, `TVxxx`, `TAxxx`, spec, and risk.
- Confirm no question-wait or `要確認` case was turned into an unsupported assertion.
- Confirm every question-wait, `要確認`, or technically blocked code-based case is listed in `未実装テストケース_コードベース.md`.
- Run the relevant test command when feasible and record the command and result.
- If tests cannot run, explain exactly why and what would be needed.
