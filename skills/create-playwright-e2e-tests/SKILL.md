---
name: create-playwright-e2e-tests
description: Create Playwright E2E automated test code from traceable Markdown E2E test cases. Use when Codex needs to turn `テストケース_E2E自動.md` / `TC-E2E-*` rows into JavaScript Playwright tests for a user-specified target file, URL, app entrypoint, component, or page; preserve TC/TD/TV/TA/R traceability, create minimal Playwright configuration when absent, and save question-wait or unsupported cases to `未実装テストケース_E2E自動.md`.
---

# Create Playwright E2E Tests

## Overview

Implement Playwright E2E automated tests from `テストケース_E2E自動.md` while keeping QA artifact traceability visible in both code and reports. Default to JavaScript Playwright tests with Japanese-readable test titles.

This skill is for E2E browser automation only. Do not use it for code-level unit/integration tests or human-only manual checks.

## Required Target

Do not implement tests unless the user explicitly provides a concrete E2E target.

Valid targets include:

- A local HTML file, such as `src/example.html`.
- A URL, such as `http://127.0.0.1:4173/`.
- A route or app entrypoint, such as `/example-feature`.
- A page/component path when the repository already has a running app convention.

If the user does not provide the target, stop before editing files and ask for it. Do not infer the target only from `テストケース_E2E自動.md`, README, or existing files.

## Workflow

1. Confirm the user-specified target exists or can be opened unambiguously.
2. Gather source material in this order:
   - User instructions, especially target, desired browser scope, output path, and whether to create minimal Playwright config.
   - `テスト成果物/テストケース_E2E自動.md`.
   - `テスト成果物/テストケース_質問待ち.md`.
   - `テスト成果物/テスト設計.md`.
   - `テスト成果物/テスト設計_質問票.md`.
   - Specifications, README, existing tests, and implementation.
   - Project configuration such as `package.json`, `playwright.config.js`, existing `tests/e2e`, and CI scripts.
3. Select the Playwright setup:
   - If the repo already has Playwright config, test directory, helper style, fixtures, or scripts, follow them.
   - If Playwright config is absent, create the minimal JavaScript setup described below.
   - Do not install dependencies unless the user explicitly approves. Record required install commands in the implementation report.
4. Classify test cases:
   - Implement `TC-E2E-*` rows with `状態=作成済み` or `状態=上流更新済み` when the expected result is automatable and source-supported.
   - Put question-wait, `要確認`, target-mismatch, unsupported-browser, unsupported-performance-threshold, environment-ambiguous, or unsafe-to-automate rows into `テスト成果物/未実装テストケース_E2E自動.md`.
   - Also scan `テストケース_質問待ち.md` for `実行区分=E2E自動` or `TC-E2E-*` rows and list them in the unimplemented file.
5. Create or update Playwright test files. Default path when no local convention exists:
   - `tests/e2e/<target-name>.e2e.spec.js`.
6. Add traceability near every Playwright test.
7. Run Playwright tests only when dependencies and browsers are already available, or after the user approves installation/setup. Otherwise record the blocker.
8. Save or update `テスト成果物/Playwright_E2Eテスト実装結果.md`.

## Minimal Playwright Setup

When the repository has no Playwright setup, create the smallest useful JavaScript setup.

For `package.json`:

- If it exists, preserve existing content and add only missing E2E-related entries.
- If it does not exist, create one with `private: true`, `scripts.test:e2e`, and `@playwright/test` in `devDependencies`.
- If no version policy exists and dependencies are not being installed in this turn, use `latest` for `@playwright/test` and record `npm install` / `npx playwright install` as required follow-up.

Minimum script:

```json
{
  "scripts": {
    "test:e2e": "playwright test"
  }
}
```

Default `playwright.config.js`:

```js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

Add more browser projects only when the user requests them or the repository already supports them. If formal browser versions are unspecified, keep non-Chromium compatibility cases unimplemented instead of guessing.

## Test Code Rules

Use JavaScript Playwright test titles with Japanese intent and the source ID:

```js
test('TC-E2E-001 入力検証 - 不正な数値', async ({ page }) => {
  // TC: TC-E2E-001 | TD: TD003 | TV: TV003 | TA: TA001 | Risk: R001, R006 | Spec: spec/仕様書.md 7.2, 11.1
});
```

Traceability requirements:

- Every implemented test title includes its `TC-E2E-*`.
- Every implemented test has a nearby traceability comment containing `TC`, `TD`, `TV`, `TA`, `Risk`, and `Spec`.
- If one Playwright test covers multiple `TC-E2E-*`, the title or comments must list every covered ID and the assertions must remain independently diagnosable.
- Prefer one Playwright `test(...)` per test case unless local project style strongly favors parameterization.

Automation guidance:

- Use robust locators based on labels, roles, text, or stable IDs. Prefer `getByLabel`, `getByRole`, and `locator('#id')` over brittle CSS paths.
- For local HTML files, use `pathToFileURL(path.resolve(targetPath)).href` unless the user specifies a server URL.
- Capture console errors with `page.on('console')` and `page.on('pageerror')` when the test case expects no JavaScript errors.
- Capture network requests with `page.on('request')` for security cases such as "external communication does not occur".
- Use screenshots only as evidence or failure diagnostics, not as the primary assertion unless the test case requires visual proof.
- Use `performance.now()` or `page.evaluate()` for performance cases only when the threshold and measurement environment are specified.
- Do not assert exact large output snapshots unless the test case requires that exact rendering; prefer semantic checks for important lines, values, and absence of `NaN` / `Infinity`.

## Implementation Boundaries

Implement only when the expected result can be judged from the source artifacts.

Implementable examples:

- Result area updates after clicking a start button.
- Console/page errors do not occur.
- Output does not contain `NaN` or `Infinity`.
- A configured input, status, event, or calculated value appears in the result.
- Network requests are not made during local execution.

Move to unimplemented when:

- `状態=質問待ち`.
- `期待結果` contains `要確認`.
- `関連質問ID` is not `なし`.
- Formal browser versions, performance thresholds, tolerance, evidence format, or target environment are unclear.
- The case needs unsupported browsers or a platform unavailable in the current repo.
- The specified target does not expose the UI or behavior needed for the case.
- Implementing the case would require product-code changes, hidden dependency installation, external services, or unsupported test seams.

## Unimplemented E2E Cases

Create or update `テスト成果物/未実装テストケース_E2E自動.md` whenever at least one E2E automated case cannot be implemented safely.

Use this structure:

```markdown
# 未実装テストケース（E2E自動）

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

Use concrete reasons such as:

- `質問待ち`
- `期待結果が要確認`
- `対象ブラウザ未確定`
- `性能測定環境未確定`
- `Playwright依存関係追加の承認待ち`
- `対象外: 指定ターゲットに該当UIがない`
- `自動化困難: 目視判断または人間の探索が必要`

## Output Report

Create or update `テスト成果物/Playwright_E2Eテスト実装結果.md`.

Use this structure:

```markdown
# Playwright E2Eテスト実装結果

## 1. 実装対象
## 2. 参照資料
## 3. Playwright構成
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

In `## 6. 実行結果`, record one of:

- Actual command and pass/fail result, when Playwright could run.
- `未実行`, with exact reason and required commands, when dependencies or browsers are missing.

## Before Finishing

- Confirm the user explicitly provided the E2E target.
- Confirm the Playwright setup follows existing project conventions or the minimal setup above.
- Confirm every implemented test maps to a `TC-E2E-*` row.
- Confirm every implemented test has visible `TD`, `TV`, `TA`, spec, and risk traceability.
- Confirm no question-wait or `要確認` case was turned into an unsupported assertion.
- Confirm every blocked E2E case is listed in `未実装テストケース_E2E自動.md`.
- Run Playwright tests when feasible; otherwise record why they could not run and what command is needed.
