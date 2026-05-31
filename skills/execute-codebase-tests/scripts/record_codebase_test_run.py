#!/usr/bin/env python3
"""Record code-based test execution results against a Markdown TC-CB table."""

from __future__ import annotations

import argparse
import csv
import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable


TC_RE = re.compile(r"\bTC-CB-\d{3}\b")
BUG_RE = re.compile(r"\bBUG-(\d+)\b")
PASS_WORD_RE = re.compile(r"\b(PASS|PASSED|pass|passed|ok)\b|成功|合格", re.IGNORECASE)
FAIL_WORD_RE = re.compile(r"\b(FAIL|FAILED|fail|failed|not ok|ERROR|Error)\b|失敗|不合格", re.IGNORECASE)

RESULT_COLUMNS = ["実行結果", "実行日時", "実行コマンド", "Bug ID", "実行メモ"]
ISSUE_HEADER = [
    "Bug ID",
    "要約",
    "優先度",
    "何がどうなったか",
    "期待結果",
    "トレーサビリティ",
    "発見日時",
    "関連実行済みテストケース",
]


@dataclass
class CommandResult:
    text: str
    exit_code: int


@dataclass
class TableBlock:
    start: int
    end: int
    header: list[str]
    separator: str
    rows: list[list[str]]


def split_row(line: str) -> list[str]:
    stripped = line.strip()
    if stripped.startswith("|"):
        stripped = stripped[1:]
    if stripped.endswith("|"):
        stripped = stripped[:-1]
    return [cell.strip() for cell in stripped.split("|")]


def make_row(cells: Iterable[str]) -> str:
    return "| " + " | ".join(str(cell) for cell in cells) + " |"


def is_separator(line: str) -> bool:
    cells = split_row(line)
    return bool(cells) and all(re.fullmatch(r":?-{3,}:?", cell.strip()) for cell in cells)


def find_test_case_table(lines: list[str]) -> TableBlock:
    for idx, line in enumerate(lines):
        if "テストケースID" not in line or not line.lstrip().startswith("|"):
            continue
        if idx + 1 >= len(lines) or not is_separator(lines[idx + 1]):
            continue
        header = split_row(line)
        rows: list[list[str]] = []
        end = idx + 2
        while end < len(lines) and lines[end].lstrip().startswith("|"):
            if not is_separator(lines[end]):
                rows.append(split_row(lines[end]))
            end += 1
        if any(row and TC_RE.fullmatch(row[0]) for row in rows):
            return TableBlock(idx, end, header, lines[idx + 1].rstrip("\n"), rows)
    raise ValueError("テストケースID を含む TC-CB Markdown table was not found.")


def normalize_row(row: list[str], width: int) -> list[str]:
    if len(row) < width:
        return row + [""] * (width - len(row))
    return row[:width]


def run_command(command: list[str]) -> CommandResult:
    completed = subprocess.run(
        command,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    text = completed.stdout
    if completed.stderr:
        text += ("\n" if text and not text.endswith("\n") else "") + completed.stderr
    return CommandResult(text=text, exit_code=completed.returncode)


def load_log(args: argparse.Namespace) -> CommandResult:
    if args.log_file:
        text = Path(args.log_file).read_text(encoding="utf-8", errors="replace")
        return CommandResult(text=text, exit_code=args.exit_code)
    if not args.command:
        raise ValueError("Provide --log-file or a command after --.")
    return run_command(args.command)


def detect_results(log_text: str) -> dict[str, str]:
    statuses: dict[str, str] = {}
    for line in log_text.splitlines():
        ids = TC_RE.findall(line)
        if not ids:
            continue
        failed = bool(FAIL_WORD_RE.search(line))
        passed = (not failed) and bool(PASS_WORD_RE.search(line))
        if not failed and not passed:
            continue
        for tc_id in ids:
            if failed:
                statuses[tc_id] = "Fail"
            elif statuses.get(tc_id) != "Fail":
                statuses[tc_id] = "Pass"
    return statuses


def markdown_escape(value: str) -> str:
    return value.replace("\n", "<br>").replace("|", "\\|")


def priority_to_issue(priority: str) -> str:
    normalized = priority.strip()
    if normalized == "高":
        return "P1"
    if normalized == "中":
        return "P2"
    if normalized == "低":
        return "P3"
    return "P2"


def next_bug_number(issue_file: Path) -> int:
    if not issue_file.exists():
        return 1
    numbers = [int(match.group(1)) for match in BUG_RE.finditer(issue_file.read_text(encoding="utf-8", errors="replace"))]
    return max(numbers, default=0) + 1


def ensure_issue_file(issue_file: Path) -> None:
    if issue_file.exists() and ISSUE_HEADER[0] in issue_file.read_text(encoding="utf-8", errors="replace"):
        return
    issue_file.parent.mkdir(parents=True, exist_ok=True)
    content = "# 発見issue一覧\n\n" + make_row(ISSUE_HEADER) + "\n" + make_row(["---"] * len(ISSUE_HEADER)) + "\n"
    issue_file.write_text(content, encoding="utf-8")


def append_issues(issue_file: Path, issue_rows: list[list[str]]) -> None:
    if not issue_rows:
        ensure_issue_file(issue_file)
        return
    ensure_issue_file(issue_file)
    with issue_file.open("a", encoding="utf-8", newline="") as fh:
        for row in issue_rows:
            fh.write(make_row(markdown_escape(cell) for cell in row) + "\n")


def row_value(row: list[str], header_index: dict[str, int], name: str) -> str:
    idx = header_index.get(name)
    if idx is None or idx >= len(row):
        return ""
    return row[idx]


def build_traceability(row: list[str], header_index: dict[str, int], tc_id: str) -> str:
    parts = [tc_id]
    for name in ["元テスト設計ID", "テスト観点ID", "テストアプローチID", "仕様", "リスクID"]:
        value = row_value(row, header_index, name)
        if value:
            parts.append(f"{name}: {value}")
    return " / ".join(parts)


def update_table(
    table: TableBlock,
    statuses: dict[str, str],
    timestamp: str,
    command_name: str,
    issue_file: Path,
    executed_md: Path,
    exit_code: int,
) -> tuple[list[str], list[list[str]], dict[str, int]]:
    header = [col for col in table.header if col not in RESULT_COLUMNS] + RESULT_COLUMNS
    original_width = len([col for col in table.header if col not in RESULT_COLUMNS])
    header_index = {name: idx for idx, name in enumerate(table.header)}
    new_rows: list[list[str]] = []
    issue_rows: list[list[str]] = []
    summary = {"Pass": 0, "Fail": 0, "N/A": 0}
    bug_number = next_bug_number(issue_file)

    for original_row in table.rows:
        row = normalize_row(original_row, len(table.header))
        base_row = [cell for idx, cell in enumerate(row) if table.header[idx] not in RESULT_COLUMNS]
        tc_id = row_value(row, header_index, "テストケースID") or (row[0] if row else "")
        status = statuses.get(tc_id, "N/A")
        bug_id = ""
        if status == "Pass":
            memo = "実行ログでテストケースIDの成功を確認"
        elif status == "Fail":
            memo = "実行ログでテストケースIDの失敗を確認"
            bug_id = f"BUG-{bug_number:03d}"
            bug_number += 1
            title = row_value(row, header_index, "テストケース名") or tc_id
            issue_rows.append(
                [
                    bug_id,
                    f"{tc_id} {title} がFail",
                    priority_to_issue(row_value(row, header_index, "優先度")),
                    f"{tc_id} がテスト実行でFailになった。詳細は実行ログを参照。",
                    row_value(row, header_index, "期待結果"),
                    build_traceability(row, header_index, tc_id),
                    timestamp,
                    str(executed_md),
                ]
            )
        else:
            if exit_code != 0:
                memo = "テストコマンドは失敗したが、このテストケースIDの結果をログから紐づけられなかった"
            else:
                memo = "実行ログにテストケースIDが出力されなかったため結果を紐づけ不可"
        summary[status] += 1
        new_rows.append(base_row + [status, timestamp, command_name, bug_id, memo])

    if exit_code != 0 and not any(row[2] == "P0" for row in issue_rows) and not any(status == "Fail" for status in statuses.values()):
        bug_id = f"BUG-{bug_number:03d}"
        issue_rows.append(
            [
                bug_id,
                "コードベーステスト実行でID単位の失敗を特定できない",
                "P0",
                f"テストコマンドが終了コード {exit_code} で失敗したが、TC-CB-* と失敗結果を紐づけられなかった。",
                "TC-CB-* ごとに Pass / Fail / N/A を記録できること",
                "全体",
                timestamp,
                str(executed_md),
            ]
        )

    return header, new_rows, summary


def write_outputs(
    source_lines: list[str],
    table: TableBlock,
    header: list[str],
    rows: list[list[str]],
    executed_md: Path,
    executed_csv: Path,
) -> None:
    separator = make_row(["---"] * len(header))
    table_lines = [make_row(header), separator] + [make_row(markdown_escape(cell) for cell in row) for row in rows]
    output_lines = source_lines[: table.start] + [line + "\n" for line in table_lines] + source_lines[table.end :]
    executed_md.write_text("".join(output_lines), encoding="utf-8")
    with executed_csv.open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(header)
        writer.writerows(rows)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Record code-based test execution results.")
    parser.add_argument("--test-cases", default="テスト成果物/テストケース_コードベース.md")
    parser.add_argument("--output-dir", default="テスト成果物")
    parser.add_argument("--issue-file", default=None)
    parser.add_argument("--timestamp", default=None)
    parser.add_argument("--command-name", default=None)
    parser.add_argument("--log-file", default=None)
    parser.add_argument("--exit-code", type=int, default=0)
    parser.add_argument("--fail-on-test-failure", action="store_true")
    parser.add_argument("command", nargs=argparse.REMAINDER)
    args = parser.parse_args(argv)
    if args.command and args.command[0] == "--":
        args.command = args.command[1:]
    return args


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    timestamp = args.timestamp or datetime.now().strftime("%Y%m%d%H%M%S")
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    issue_file = Path(args.issue_file) if args.issue_file else output_dir / "発見issue一覧.md"
    executed_md = output_dir / f"{timestamp}_テストケース_コードベース_実行済み.md"
    executed_csv = output_dir / f"{timestamp}_テストケース_コードベース_実行済み.csv"
    raw_log = output_dir / f"{timestamp}_コードベーステスト実行ログ.txt"
    command_name = args.command_name or (" ".join(args.command) if args.command else f"log-file: {args.log_file}")

    command_result = load_log(args)
    raw_log.write_text(
        f"Command: {command_name}\nExitCode: {command_result.exit_code}\nTimestamp: {timestamp}\n\n{command_result.text}",
        encoding="utf-8",
    )

    source_path = Path(args.test_cases)
    source_lines = source_path.read_text(encoding="utf-8").splitlines(keepends=True)
    table = find_test_case_table(source_lines)
    statuses = detect_results(command_result.text)
    header, rows, summary = update_table(
        table=table,
        statuses=statuses,
        timestamp=timestamp,
        command_name=command_name,
        issue_file=issue_file,
        executed_md=executed_md,
        exit_code=command_result.exit_code,
    )

    bug_ids = [cell for row in rows for cell in [row[header.index("Bug ID")]] if cell]
    header_index = {name: idx for idx, name in enumerate(header)}
    issue_rows: list[list[str]] = []
    for row in rows:
        if row[header_index["実行結果"]] != "Fail":
            continue
        issue_rows.append(
            [
                row[header_index["Bug ID"]],
                f"{row[header_index['テストケースID']]} {row[header_index.get('テストケース名', 0)]} がFail",
                priority_to_issue(row[header_index.get("優先度", -1)] if "優先度" in header_index else ""),
                f"{row[header_index['テストケースID']]} がテスト実行でFailになった。詳細は実行ログを参照。",
                row[header_index.get("期待結果", -1)] if "期待結果" in header_index else "",
                build_traceability(row, header_index, row[header_index["テストケースID"]]),
                timestamp,
                str(executed_md),
            ]
        )

    if command_result.exit_code != 0 and not issue_rows and not any(value == "Fail" for value in statuses.values()):
        bug_number = next_bug_number(issue_file)
        issue_rows.append(
            [
                f"BUG-{bug_number:03d}",
                "コードベーステスト実行でID単位の失敗を特定できない",
                "P0",
                f"テストコマンドが終了コード {command_result.exit_code} で失敗したが、TC-CB-* と失敗結果を紐づけられなかった。",
                "TC-CB-* ごとに Pass / Fail / N/A を記録できること",
                "全体",
                timestamp,
                str(executed_md),
            ]
        )

    append_issues(issue_file, issue_rows)
    write_outputs(source_lines, table, header, rows, executed_md, executed_csv)

    print(f"executed_markdown={executed_md}")
    print(f"executed_csv={executed_csv}")
    print(f"raw_log={raw_log}")
    print(f"issue_file={issue_file}")
    print(f"exit_code={command_result.exit_code}")
    print(f"summary=Pass:{summary['Pass']} Fail:{summary['Fail']} N/A:{summary['N/A']}")
    if issue_rows:
        print("issues=" + ",".join(row[0] for row in issue_rows))

    if args.fail_on_test_failure and command_result.exit_code != 0:
        return command_result.exit_code
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
