---
name: create-test-report
description: Create a frozen HTML test execution report from current Japanese test artifacts and latest execution result folders. Use when Codex needs to snapshot test plans, analysis, design, test cases, executed results, bug lists, unanswered/question-wait cases, unimplemented cases, and raw evidence into `テスト成果物/report/yyyyMMddHHmmss_report/`.
---

# Create Test Report

## Overview

Create a human-readable HTML test execution report and freeze the current test artifact state. The report prioritizes status visibility over final judgment: do not output an overall pass/fail judgment because human-executed tests may still be incomplete.

## Workflow

1. Gather source material in this order:
   - User instructions, especially timestamp, report root, or explicit execution result folders.
   - `テスト成果物/テスト計画書.md`.
   - `テスト成果物/テスト分析.md`.
   - `テスト成果物/テスト設計.md`.
   - `テスト成果物/テストケース_コードベース.md`, `テストケース_E2E自動.md`, `テストケース_人間実行.md`, `テストケース_質問待ち.md`.
   - `テスト成果物/未実装テストケース_コードベース.md`, `未実装テストケース_E2E自動.md`.
   - Latest `テスト成果物/report/*_コードベーステスト` and `テスト成果物/report/*_e2e自動テスト`, unless the user specifies folders.
   - Codebase bug list `コードベース_発見issue一覧.md`; fall back to legacy `発見issue一覧.md` only when the new file is absent.
   - E2E bug list `e2e_発見issue一覧.md`.
2. Run the bundled report generator. Default command:

```powershell
python skills\create-test-report\scripts\create_test_report.py
```

3. Review generated output:
   - `テスト成果物/report/yyyyMMddHHmmss_report/index.html`.
   - `md/` copies of Markdown artifacts.
   - `html/` HTML views of Markdown artifacts.
   - `raw/` copies of CSV, JSON, and log evidence.
4. Report the `report_dir`, `report_html`, selected execution folders, and summary counts.

## Report Structure

`index.html` must place these sections at the top, in this order:

1. `テスト結果サマリー`
2. `Failサマリー`
3. `バグリスト`
4. `まだ実行していないテストケース`
5. `質問待ちのテストケース`
6. `未実装のテストケース`
7. `成果物リンク`
8. `実行証跡`

Do not include an overall quality judgment.

Sections 4-6 must not inline full test case lists in `index.html`. Show counts and links to dedicated detail HTML pages instead:

- `html/未実行テストケース.html`
- `html/質問待ちのテストケース.html`
- `html/未実装のテストケース.html`

## Script Interface

Use `scripts/create_test_report.py`.

Options:

```text
--artifacts-dir PATH       Source artifact directory. Default: テスト成果物
--report-root PATH         Report root. Default: テスト成果物/report
--timestamp VALUE          Timestamp in yyyyMMddHHmmss. Default: current time
--codebase-run-dir PATH    Codebase execution folder. Default: latest *_コードベーステスト
--e2e-run-dir PATH         E2E execution folder. Default: latest *_e2e自動テスト
```

Expected stdout:

```text
report_dir=...
report_html=...
summary=Total:... Executed:... Pass:... Fail:... N/A:... PassRate:...
codebase_run_dir=...
e2e_run_dir=...
```

## Aggregation Rules

- Total test cases: unique `テストケースID` values found in imported test case and unimplemented-case Markdown files.
- `Pass`: executed Markdown rows with `実行結果=Pass`.
- `Fail`: executed Markdown rows with `実行結果=Fail`.
- `N/A`: executed Markdown rows with `実行結果=N/A`.
- Executed test cases: `Pass + Fail`.
- Pass rate: `Pass / (Pass + Fail)`. Do not include `N/A` in the denominator.
- Not-yet-executed test cases: total test case IDs that do not appear in selected executed Markdown files.
- Question-wait cases: rows from `テストケース_質問待ち.md`.
- Unimplemented cases: rows from `未実装テストケース_コードベース.md` and `未実装テストケース_E2E自動.md`.
- Fail priority summary:
  - Prefer priority recorded in the issue list.
  - If no issue priority exists, convert test case priority as `高=P1`, `中=P2`, `低=P3`.
  - Output `P0`, `P1`, `P2`, `P3`, `優先度未設定`, and total.

## Output Rules

- Create `テスト成果物/report/yyyyMMddHHmmss_report/`.
- If the same timestamp report already exists, recreate the generated `md/`, `html/`, `raw/`, and `index.html` outputs so stale duplicate files do not remain.
- Keep Markdown copies in `md/`.
- Convert Markdown artifacts to HTML in `html/`.
- Create dedicated detail HTML pages for not-yet-executed, question-wait, and unimplemented test cases.
- Copy CSV, JSON, and log evidence to `raw/`.
- HTML conversion must strip ANSI color codes from Playwright output.
- Links in `index.html` should point to files inside the generated report folder.
- For codebase bugs, prefer `コードベース_発見issue一覧.md`; keep compatibility with old `発見issue一覧.md` execution folders.
- Do not edit source artifacts, test code, product code, specifications, or execution-result folders.

## Before Finishing

- Confirm `index.html` exists.
- Confirm Markdown copies exist under `md/`.
- Confirm HTML views exist for bug lists, executed test cases, test plan, test analysis, and test design.
- Confirm CSV, JSON, and logs are copied under `raw/` when available.
- Confirm the top sections appear in the required order.
- Confirm Pass rate uses `Pass / (Pass + Fail)` and excludes `N/A`.
- Mention the generated report path and summary in the final response.
