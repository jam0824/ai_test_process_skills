---
name: execute-codebase-tests
description: Execute code-based automated tests and record traceable run results. Use when Codex needs to run tests derived from `テストケース_コードベース.md`, create timestamped executed Markdown and CSV copies with Pass/Fail/N/A per `TC-CB-*`, save raw logs, and append discovered bugs to `発見issue一覧.md` with `BUG-001` style IDs.
---

# Execute Codebase Tests

## Overview

Run code-based tests, map the output back to `TC-CB-*` test cases, and save human-readable execution records. The skill is language-agnostic: choose the test command from the repository, then use the bundled recorder to produce Markdown, CSV, raw log, and discovered issue artifacts.

## Workflow

1. Gather source material in this order:
   - User instructions, especially test command, target, scope, output directory, and timestamp preference.
   - `テスト成果物/テストケース_コードベース.md`.
   - `テスト成果物/テストコード実装結果.md`.
   - `テスト成果物/未実装テストケース_コードベース.md`.
   - Test code files and helpers.
   - Specifications, README, and target implementation.
2. Determine the test command:
   - Use the user-provided command if present.
   - Otherwise prefer the command recorded in `テストコード実装結果.md`.
   - Otherwise infer from repository configuration and existing test files, such as `package.json`, `pyproject.toml`, `pytest.ini`, `go.mod`, `Cargo.toml`, `.csproj`, or existing CI scripts.
   - If there are multiple plausible commands and choosing the wrong one could misrecord results, ask before running.
3. Run the recorder script with the chosen command. Prefer this shape:

```powershell
python skills\execute-codebase-tests\scripts\record_codebase_test_run.py --command-name "node --test sample_app\retirement_simulator.test.js" -- node --test sample_app\retirement_simulator.test.js
```

4. Review the generated artifacts:
   - Timestamped executed Markdown.
   - Timestamped executed CSV.
   - Timestamped raw log.
   - `発見issue一覧.md`.
5. Report the output paths, command, summary counts, and any newly created `BUG-*`.

## Result Mapping Rules

- Only mark a row `Pass` or `Fail` when the test output contains the row's `TC-CB-*` ID with a detectable pass/fail status.
- If a `TC-CB-*` row does not appear in the output, mark it `N/A`; do not infer `Pass` from the overall command result.
- If the test command fails but no `TC-CB-*` failure can be identified, mark rows `N/A` and create a `P0` infrastructure issue only when the command failure prevents meaningful result capture.
- `Fail` wins over `Pass` if the same `TC-CB-*` appears with both statuses.
- Preserve the original `テストケース_コードベース.md`; write results only to timestamped copies.

## Recorder Script

Use `scripts/record_codebase_test_run.py` for deterministic recording.

Default inputs and outputs:

| Purpose | Default |
|---|---|
| Input test cases | `テスト成果物/テストケース_コードベース.md` |
| Output directory | `テスト成果物` |
| Issue file | `テスト成果物/発見issue一覧.md` |
| Executed Markdown | `yyyyMMddHHmmss_テストケース_コードベース_実行済み.md` |
| Executed CSV | `yyyyMMddHHmmss_テストケース_コードベース_実行済み.csv` |
| Raw log | `yyyyMMddHHmmss_コードベーステスト実行ログ.txt` |

Important options:

```text
--test-cases PATH     Input Markdown test case table.
--output-dir PATH     Directory for executed Markdown, CSV, raw log, and issue file.
--issue-file PATH     Existing/new issue Markdown file.
--timestamp VALUE     Timestamp override in yyyyMMddHHmmss form.
--command-name TEXT   Command text written to the execution record.
--log-file PATH       Parse an existing log instead of running a command.
--exit-code NUMBER    Exit code to record with --log-file.
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
| `Bug ID` | `BUG-*` IDs created for failed rows, or blank |
| `実行メモ` | Short reason, such as parsed status or why the row is `N/A` |

## Issue Rules

When a row is `Fail`, append a row to `発見issue一覧.md` using this table:

```markdown
| Bug ID | 要約 | 優先度 | 何がどうなったか | 期待結果 | トレーサビリティ | 発見日時 | 関連実行済みテストケース |
|---|---|---|---|---|---|---|---|
```

Use `BUG-001` style IDs. If the issue file already contains `BUG-*`, continue from the largest number.

Priority mapping:

| Test case priority | Issue priority |
|---|---|
| `高` | `P1` |
| `中` | `P2` |
| `低` | `P3` |
| Command-wide infrastructure failure | `P0` |

Traceability must include at least the test case ID and available `TDxxx`, `TVxxx`, `TAxxx`, spec, and risk IDs.

## Before Finishing

- Confirm the test command actually ran, or record why it could not run.
- Confirm every `TC-CB-*` row in the source table appears in the executed Markdown and CSV.
- Confirm every row has one of `Pass`, `Fail`, or `N/A`.
- Confirm failed rows have a `Bug ID` and a matching issue row.
- Confirm `N/A` rows explain why they could not be mapped.
- Mention the generated Markdown, CSV, raw log, issue file, and command summary in the final response.
