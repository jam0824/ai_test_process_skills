#!/usr/bin/env python3
"""Record Playwright E2E execution results against a Markdown TC-E2E table."""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import shutil
import subprocess
import sys
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable, Any


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")


TC_RE = re.compile(r"\bTC-E2E-\d{3}\b")
BUG_RE = re.compile(r"\bE2E-BUG-(\d+)\b")
PASS_WORD_RE = re.compile(r"\b(PASS|PASSED|pass|passed|ok)\b|成功|合格", re.IGNORECASE)
FAIL_WORD_RE = re.compile(
    r"\b(FAIL|FAILED|fail|failed|not ok|ERROR|Error|timedOut|interrupted)\b|失敗|不合格",
    re.IGNORECASE,
)

RESULT_COLUMNS = ["実行結果", "実行日時", "実行コマンド", "ブラウザ/プロジェクト結果", "Bug ID", "実行メモ"]
ISSUE_HEADER = [
    "Bug ID",
    "要約",
    "優先度",
    "どこで何がどうなったか",
    "期待結果",
    "トレーサビリティ",
    "発見日時",
    "関連実行済みテストケース",
    "関連Playwrightプロジェクト",
]


@dataclass
class CommandResult:
    stdout: str
    stderr: str
    text: str
    exit_code: int


@dataclass
class TableBlock:
    start: int
    end: int
    header: list[str]
    separator: str
    rows: list[list[str]]


@dataclass
class RunEntry:
    tc_id: str
    project: str
    status: str
    raw_status: str
    title: str
    duration_ms: str
    error: str
    location: str


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
    raise ValueError("テストケースID を含む TC-E2E Markdown table was not found.")


def normalize_row(row: list[str], width: int) -> list[str]:
    if len(row) < width:
        return row + [""] * (width - len(row))
    return row[:width]


def markdown_escape(value: str) -> str:
    return value.replace("\n", "<br>").replace("|", "\\|")


def run_command(command: list[str]) -> CommandResult:
    executable = command[0]
    if os.name == "nt" and not Path(executable).suffix:
        cmd_executable = f"{executable}.cmd"
        if shutil.which(cmd_executable) is not None:
            command = [cmd_executable] + command[1:]
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
    return CommandResult(stdout=completed.stdout, stderr=completed.stderr, text=text, exit_code=completed.returncode)


def load_execution(args: argparse.Namespace) -> CommandResult:
    stdout = ""
    stderr = ""
    exit_code = args.exit_code
    if args.json_file:
        stdout = Path(args.json_file).read_text(encoding="utf-8", errors="replace")
    if args.log_file:
        stderr = Path(args.log_file).read_text(encoding="utf-8", errors="replace")
    if args.json_file or args.log_file:
        text = stdout
        if stderr:
            text += ("\n" if text and not text.endswith("\n") else "") + stderr
        return CommandResult(stdout=stdout, stderr=stderr, text=text, exit_code=exit_code)
    if not args.command:
        return run_command(["npx", "playwright", "test", "--reporter=json"])
    return run_command(args.command)


def parse_json_from_text(text: str) -> tuple[dict[str, Any] | None, str]:
    stripped = text.strip()
    if not stripped:
        return None, "JSON output is empty."
    try:
        value = json.loads(stripped)
        if isinstance(value, dict):
            return value, ""
        return None, "JSON root is not an object."
    except json.JSONDecodeError as first_error:
        start = stripped.find("{")
        end = stripped.rfind("}")
        if start >= 0 and end > start:
            try:
                value = json.loads(stripped[start : end + 1])
                if isinstance(value, dict):
                    return value, ""
            except json.JSONDecodeError:
                pass
        return None, f"Could not parse Playwright JSON: {first_error}"


def status_from_raw(raw_status: str) -> str:
    normalized = raw_status.strip()
    if normalized == "passed":
        return "Pass"
    if normalized in {"failed", "timedOut", "interrupted"}:
        return "Fail"
    return "N/A"


def error_text_from_result(result: dict[str, Any]) -> str:
    parts: list[str] = []
    for key in ["error", "errors"]:
        value = result.get(key)
        if isinstance(value, dict):
            parts.append(str(value.get("message") or value.get("stack") or value))
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, dict):
                    parts.append(str(item.get("message") or item.get("stack") or item))
                else:
                    parts.append(str(item))
        elif value:
            parts.append(str(value))
    combined = " ".join(part.strip() for part in parts if part and part.strip())
    return combined[:700]


def spec_location(spec: dict[str, Any]) -> str:
    file_name = str(spec.get("file") or "")
    line = spec.get("line")
    if line:
        return f"{file_name}:{line}"
    return file_name


def extract_entries_from_json(data: dict[str, Any]) -> dict[str, list[RunEntry]]:
    entries: dict[str, list[RunEntry]] = defaultdict(list)

    def visit_suite(suite: dict[str, Any]) -> None:
        for spec in suite.get("specs", []) or []:
            title = str(spec.get("title") or "")
            ids = sorted(set(TC_RE.findall(title)))
            if not ids:
                continue
            location = spec_location(spec)
            tests = spec.get("tests", []) or []
            if not tests:
                for tc_id in ids:
                    entries[tc_id].append(
                        RunEntry(
                            tc_id=tc_id,
                            project="unknown",
                            status="N/A",
                            raw_status="missing",
                            title=title,
                            duration_ms="",
                            error="No Playwright test entries were present in JSON.",
                            location=location,
                        )
                    )
                continue
            for test in tests:
                project = str(test.get("projectName") or test.get("projectId") or "unknown")
                results = test.get("results", []) or []
                if not results:
                    raw_status = str(test.get("status") or "missing")
                    status = status_from_raw(raw_status)
                    for tc_id in ids:
                        entries[tc_id].append(
                            RunEntry(
                                tc_id=tc_id,
                                project=project,
                                status=status,
                                raw_status=raw_status,
                                title=title,
                                duration_ms="",
                                error="No result entry was present for this project.",
                                location=location,
                            )
                        )
                    continue
                for result in results:
                    raw_status = str(result.get("status") or "unknown")
                    status = status_from_raw(raw_status)
                    duration = result.get("duration")
                    duration_ms = "" if duration is None else str(duration)
                    error = error_text_from_result(result)
                    for tc_id in ids:
                        entries[tc_id].append(
                            RunEntry(
                                tc_id=tc_id,
                                project=project,
                                status=status,
                                raw_status=raw_status,
                                title=title,
                                duration_ms=duration_ms,
                                error=error,
                                location=location,
                            )
                        )
        for child in suite.get("suites", []) or []:
            visit_suite(child)

    for suite in data.get("suites", []) or []:
        visit_suite(suite)
    return entries


def extract_entries_from_log(log_text: str) -> dict[str, list[RunEntry]]:
    entries: dict[str, list[RunEntry]] = defaultdict(list)
    for line in log_text.splitlines():
        ids = sorted(set(TC_RE.findall(line)))
        if not ids:
            continue
        failed = bool(FAIL_WORD_RE.search(line))
        passed = (not failed) and bool(PASS_WORD_RE.search(line))
        if not failed and not passed:
            continue
        project_match = re.search(r"\[([A-Za-z0-9_-]+)\]", line)
        project = project_match.group(1) if project_match else "log"
        for tc_id in ids:
            entries[tc_id].append(
                RunEntry(
                    tc_id=tc_id,
                    project=project,
                    status="Fail" if failed else "Pass",
                    raw_status="failed" if failed else "passed",
                    title=line.strip(),
                    duration_ms="",
                    error=line.strip() if failed else "",
                    location="raw log",
                )
            )
    return entries


def aggregate_status(entries: list[RunEntry]) -> str:
    if not entries:
        return "N/A"
    if any(entry.status == "Fail" for entry in entries):
        return "Fail"
    if all(entry.status == "Pass" for entry in entries):
        return "Pass"
    return "N/A"


def project_summary(entries: list[RunEntry]) -> str:
    if not entries:
        return ""
    by_project: dict[str, list[RunEntry]] = defaultdict(list)
    for entry in entries:
        by_project[entry.project].append(entry)
    parts = []
    for project in sorted(by_project):
        status = aggregate_status(by_project[project])
        raw = ",".join(entry.raw_status for entry in by_project[project])
        parts.append(f"{project}:{status}({raw})")
    return ", ".join(parts)


def first_failure_detail(entries: list[RunEntry]) -> str:
    for entry in entries:
        if entry.status == "Fail":
            detail = entry.error or f"{entry.raw_status} at {entry.location}"
            return f"{entry.project}: {detail}"
    return ""


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
    content = "# e2e_発見issue一覧\n\n" + make_row(ISSUE_HEADER) + "\n" + make_row(["---"] * len(ISSUE_HEADER)) + "\n"
    issue_file.write_text(content, encoding="utf-8")


def append_issues(issue_file: Path, issue_rows: list[list[str]]) -> None:
    ensure_issue_file(issue_file)
    if not issue_rows:
        return
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


def build_memo(status: str, entries: list[RunEntry], command_failed_without_entries: bool) -> str:
    if status == "Pass":
        return "Playwright JSONで対象テストケースIDの全実行成功を確認"
    if status == "Fail":
        detail = first_failure_detail(entries)
        return "Playwright JSONで対象テストケースIDの失敗を確認" + (f": {detail}" if detail else "")
    if command_failed_without_entries:
        return "テストコマンドが失敗し、TC-E2E単位の結果を取得できなかった"
    if entries:
        return "Playwright結果がskippedまたは実行結果なしのためN/A"
    return "Playwright結果にテストケースIDが出力されなかったため結果を紐づけ不可"


def update_table(
    table: TableBlock,
    entries_by_tc: dict[str, list[RunEntry]],
    timestamp: str,
    command_name: str,
    issue_file: Path,
    executed_md: Path,
    command_failed_without_entries: bool,
) -> tuple[list[str], list[list[str]], list[list[str]], dict[str, int]]:
    base_header = [col for col in table.header if col not in RESULT_COLUMNS]
    header = base_header + RESULT_COLUMNS
    original_header_index = {name: idx for idx, name in enumerate(table.header)}
    output_header_index = {name: idx for idx, name in enumerate(header)}
    rows: list[list[str]] = []
    issue_rows: list[list[str]] = []
    summary = {"Pass": 0, "Fail": 0, "N/A": 0}
    bug_number = next_bug_number(issue_file)

    for original_row in table.rows:
        row = normalize_row(original_row, len(table.header))
        base_row = [cell for idx, cell in enumerate(row) if table.header[idx] not in RESULT_COLUMNS]
        base_row = normalize_row(base_row, len(base_header))
        tc_id = row_value(row, original_header_index, "テストケースID") or (row[0] if row else "")
        entries = entries_by_tc.get(tc_id, [])
        status = aggregate_status(entries)
        project_result = project_summary(entries)
        bug_id = ""
        memo = build_memo(status, entries, command_failed_without_entries)
        if status == "Fail":
            bug_id = f"E2E-BUG-{bug_number:03d}"
            bug_number += 1
            title = row_value(row, original_header_index, "テストケース名") or tc_id
            issue_rows.append(
                [
                    bug_id,
                    f"{tc_id} {title} がFail",
                    priority_to_issue(row_value(row, original_header_index, "優先度")),
                    f"{tc_id} がPlaywright E2E実行でFailになった。{first_failure_detail(entries) or '詳細は実行ログを参照。'}",
                    row_value(row, original_header_index, "期待結果"),
                    build_traceability(row, original_header_index, tc_id),
                    timestamp,
                    str(executed_md),
                    project_result,
                ]
            )
        summary[status] += 1
        rows.append(base_row + [status, timestamp, command_name, project_result, bug_id, memo])

    if command_failed_without_entries:
        bug_id = f"E2E-BUG-{bug_number:03d}"
        issue_rows.append(
            [
                bug_id,
                "Playwright E2E実行でID単位の結果を取得できない",
                "P0",
                "Playwrightの実行またはJSON結果取得に失敗し、TC-E2E単位のPass/Failを記録できなかった。",
                "TC-E2E-* ごとに Pass / Fail / N/A を記録できること",
                "全体",
                timestamp,
                str(executed_md),
                "全体",
            ]
        )

    # Keep static analyzers aware that output_header_index is intentionally verified.
    for column in RESULT_COLUMNS:
        if column not in output_header_index:
            raise AssertionError(f"missing output column: {column}")
    return header, rows, issue_rows, summary


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
    parser = argparse.ArgumentParser(description="Record Playwright E2E execution results.")
    parser.add_argument("--test-cases", default="テスト成果物/テストケース_E2E自動.md")
    parser.add_argument("--output-dir", default="テスト成果物")
    parser.add_argument("--issue-file", default=None)
    parser.add_argument("--timestamp", default=None)
    parser.add_argument("--command-name", default=None)
    parser.add_argument("--json-file", default=None)
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
    issue_file = Path(args.issue_file) if args.issue_file else output_dir / "e2e_発見issue一覧.md"
    executed_md = output_dir / f"{timestamp}_テストケース_E2E自動_実行済み.md"
    executed_csv = output_dir / f"{timestamp}_テストケース_E2E自動_実行済み.csv"
    raw_log = output_dir / f"{timestamp}_E2E自動テスト実行ログ.txt"
    json_result = output_dir / f"{timestamp}_Playwright_E2E実行結果.json"
    command_name = args.command_name or (" ".join(args.command) if args.command else "npx playwright test --reporter=json")

    command_result = load_execution(args)
    raw_log.write_text(
        f"Command: {command_name}\nExitCode: {command_result.exit_code}\nTimestamp: {timestamp}\n\n"
        f"--- stdout ---\n{command_result.stdout}\n\n--- stderr/log ---\n{command_result.stderr}",
        encoding="utf-8",
    )

    parsed_json, parse_error = parse_json_from_text(command_result.stdout)
    if parsed_json is None and command_result.stdout != command_result.text:
        parsed_json, parse_error = parse_json_from_text(command_result.text)

    if parsed_json is not None:
        json_result.write_text(json.dumps(parsed_json, ensure_ascii=False, indent=2), encoding="utf-8")
        entries_by_tc = extract_entries_from_json(parsed_json)
    else:
        json_result.write_text(
            json.dumps(
                {
                    "parsed": False,
                    "parse_error": parse_error,
                    "exit_code": command_result.exit_code,
                    "command": command_name,
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )
        entries_by_tc = extract_entries_from_log(command_result.text)

    command_failed_without_entries = command_result.exit_code != 0 and not entries_by_tc

    source_path = Path(args.test_cases)
    source_lines = source_path.read_text(encoding="utf-8").splitlines(keepends=True)
    table = find_test_case_table(source_lines)
    header, rows, issue_rows, summary = update_table(
        table=table,
        entries_by_tc=entries_by_tc,
        timestamp=timestamp,
        command_name=command_name,
        issue_file=issue_file,
        executed_md=executed_md,
        command_failed_without_entries=command_failed_without_entries,
    )
    append_issues(issue_file, issue_rows)
    write_outputs(source_lines, table, header, rows, executed_md, executed_csv)

    print(f"executed_markdown={executed_md}")
    print(f"executed_csv={executed_csv}")
    print(f"raw_log={raw_log}")
    print(f"json_result={json_result}")
    print(f"issue_file={issue_file}")
    print(f"exit_code={command_result.exit_code}")
    print(f"summary=Pass:{summary['Pass']} Fail:{summary['Fail']} N/A:{summary['N/A']}")
    if parsed_json is None:
        print(f"json_parse_error={parse_error}")
    if issue_rows:
        print("issues=" + ",".join(row[0] for row in issue_rows))

    if args.fail_on_test_failure and command_result.exit_code != 0:
        return command_result.exit_code
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
