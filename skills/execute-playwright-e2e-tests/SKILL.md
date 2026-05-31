---
name: execute-playwright-e2e-tests
description: Execute Playwright E2E automated tests and record traceable run results. Use when Codex needs to run tests derived from `テストケース_E2E自動.md`, parse Playwright JSON reporter output for `TC-E2E-*`, create timestamped executed Markdown and CSV copies with Pass/Fail/N/A per test case, save raw logs and JSON results, and append discovered bugs to `e2e_発見issue一覧.md` with `E2E-BUG-001` style IDs.
---

# Execute Playwright E2E Tests

## Overview

Run Playwright E2E tests, map JSON reporter results back to `TC-E2E-*` test cases, and save human-readable execution records. Prefer deterministic recording through the bundled script; do not infer `Pass` from the overall command result when an individual `TC-E2E-*` is absent.

Default to Japanese output. Do not edit product code, specifications, README files, or the source `テストケース_E2E自動.md`; write only timestamped execution artifacts and the E2E issue list.

## Workflow

1. Gather source material in this order:
   - User instructions, especially command, target, browser/project scope, output directory, timestamp preference, and whether dependency/browser installation is approved.
   - `テスト成果物/テストケース_E2E自動.md`.
   - `テスト成果物/Playwright_E2Eテスト実装結果.md`.
   - `テスト成果物/未実装テストケース_E2E自動.md`.
   - Playwright test files and helpers.
   - `playwright.config.*` and `package.json`.
   - Specifications, README, and target implementation.
2. Determine the test command:
   - Use the user-provided command if present.
   - Otherwise prefer the command recorded in `Playwright_E2Eテスト実装結果.md`.
   - Otherwise use `package.json` / Playwright config.
   - Default to `npx playwright test --reporter=json`.
   - If dependencies or browsers are missing, do not install unless the user explicitly approved it; run the recorder and let it record `N/A` with an infrastructure issue if the command cannot produce case-level results.
3. Run the recorder script. Prefer this shape:

```powershell
python skills\execute-playwright-e2e-tests\scripts\record_playwright_e2e_test_run.py --command-name "npx playwright test --reporter=json" -- npx playwright test --reporter=json
```

4. Review generated artifacts:
   - Timestamped executed Markdown.
   - Timestamped executed CSV.
   - Timestamped raw log.
   - Timestamped Playwright JSON result file.
   - `テスト成果物/e2e_発見issue一覧.md`.
5. Report output paths, command, summary counts, and any newly created `E2E-BUG-*`.

## Result Mapping Rules

- Extract `TC-E2E-*` IDs from Playwright JSON test titles.
- For the same `TC-E2E-*` across multiple browser projects:
  - If any project/result failed, mark `Fail`.
  - If every captured result passed and at least one result exists, mark `Pass`.
  - If all captured results are skipped, missing, interrupted without ID mapping, or otherwise not executable, mark `N/A`.
- If JSON cannot be parsed, use log-line regex as a fallback only when a line contains both `TC-E2E-*` and an explicit pass/fail word.
- If the command fails but no `TC-E2E-*` failure can be identified, mark every row `N/A` and create a `P0` infrastructure issue.
- Preserve the source `テストケース_E2E自動.md`; write results only to timestamped copies.

## Recorder Script

Use `scripts/record_playwright_e2e_test_run.py`.

Default inputs and outputs:

| Purpose | Default |
|---|---|
| Input test cases | `テスト成果物/テストケース_E2E自動.md` |
| Output directory | `テスト成果物` |
| Issue file | `テスト成果物/e2e_発見issue一覧.md` |
| Executed Markdown | `yyyyMMddHHmmss_テストケース_E2E自動_実行済み.md` |
| Executed CSV | `yyyyMMddHHmmss_テストケース_E2E自動_実行済み.csv` |
| Raw log | `yyyyMMddHHmmss_E2E自動テスト実行ログ.txt` |
| JSON result | `yyyyMMddHHmmss_Playwright_E2E実行結果.json` |

Important options:

```text
--test-cases PATH     Input Markdown test case table.
--output-dir PATH     Directory for execution artifacts.
--issue-file PATH     Existing/new E2E issue Markdown file.
--timestamp VALUE     Timestamp override in yyyyMMddHHmmss form.
--command-name TEXT   Command text written to the execution record.
--json-file PATH      Parse an existing Playwright JSON result instead of running a command.
--log-file PATH       Save/parse an existing raw log together with --json-file or fallback parsing.
--exit-code NUMBER    Exit code to record with --json-file / --log-file.
--fail-on-test-failure
                     Return the test command exit code after artifacts are written.
--                   Command to execute and capture.
```

## Output Columns

The executed Markdown and CSV copy the source test case table and append these columns:

| Column | Meaning |
|---|---|
| `実行結果` | `Pass`, `Fail`, or `N/A` |
| `実行日時` | Timestamp used for the run |
| `実行コマンド` | Command name passed to the recorder |
| `ブラウザ/プロジェクト結果` | Per-Playwright-project summary, such as `chromium:Pass, firefox:Fail` |
| `Bug ID` | `E2E-BUG-*` IDs created for failed rows, or blank |
| `実行メモ` | Short reason, such as parsed status or why the row is `N/A` |

## Issue Rules

When a row is `Fail`, append a row to `e2e_発見issue一覧.md`:

```markdown
| Bug ID | 要約 | 優先度 | どこで何がどうなったか | 期待結果 | トレーサビリティ | 発見日時 | 関連実行済みテストケース | 関連Playwrightプロジェクト |
|---|---|---|---|---|---|---|---|---|
```

Use `E2E-BUG-001` style IDs. If the issue file already contains `E2E-BUG-*`, continue from the largest number.

Priority mapping:

| Test case priority | Issue priority |
|---|---|
| `高` | `P1` |
| `中` | `P2` |
| `低` | `P3` |
| Command-wide infrastructure failure | `P0` |

Traceability must include at least the test case ID and available `TDxxx`, `TVxxx`, `TAxxx`, spec, and risk IDs.

## Before Finishing

- Confirm the test command ran, or record why it could not run.
- Confirm every `TC-E2E-*` row in the source table appears in the executed Markdown and CSV.
- Confirm every row has one of `Pass`, `Fail`, or `N/A`.
- Confirm failed rows have a `Bug ID` and a matching issue row.
- Confirm `N/A` rows explain why they could not be mapped.
- Mention generated Markdown, CSV, raw log, JSON result, issue file, and command summary in the final response.
