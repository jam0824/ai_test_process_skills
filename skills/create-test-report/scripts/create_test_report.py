from __future__ import annotations

import argparse
import csv
import hashlib
import html
import json
import os
import re
import shutil
import stat
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from urllib.parse import quote


ANSI_RE = re.compile(r"\x1b\[[0-?]*[ -/]*[@-~]")
TC_RE = re.compile(r"\bTC-[A-Z0-9]+-\d+\b")

CORE_MD_FILES = [
    ("テスト計画", "テスト計画書.md"),
    ("テスト計画レビュー", "テスト計画レビュー結果.md"),
    ("テスト分析", "テスト分析.md"),
    ("テスト分析質問票", "テスト分析_質問票.md"),
    ("テスト分析レビュー", "テスト分析レビュー結果.md"),
    ("テスト設計", "テスト設計.md"),
    ("テスト設計質問票", "テスト設計_質問票.md"),
    ("テスト設計レビュー", "テスト設計レビュー結果.md"),
    ("テストケース（コードベース）", "テストケース_コードベース.md"),
    ("テストケース（E2E自動）", "テストケース_E2E自動.md"),
    ("テストケース（人間実行）", "テストケース_人間実行.md"),
    ("テストケース（質問待ち）", "テストケース_質問待ち.md"),
    ("テストケースレビュー", "テストケースレビュー結果.md"),
    ("テスト成果物横断レビュー", "テスト成果物横断レビュー結果.md"),
    ("未実装テストケース（コードベース）", "未実装テストケース_コードベース.md"),
    ("未実装テストケース（E2E自動）", "未実装テストケース_E2E自動.md"),
    ("テストコードレビュー", "テストコードレビュー結果.md"),
    ("Playwright E2Eテストレビュー", "Playwright_E2Eテストレビュー結果.md"),
    ("テストレポートレビュー", "テストレポートレビュー結果.md"),
]

CORE_RAW_FILES = [
    ("テストケース（人間実行CSV）", "テストケース_人間実行.csv"),
]

STATUS_RANK = {"N/A": 1, "Pass": 2, "Fail": 3}
CODEBASE_ISSUE_FILE = "コードベース_発見issue一覧.md"
LEGACY_CODEBASE_ISSUE_FILE = "発見issue一覧.md"
E2E_ISSUE_FILE = "e2e_発見issue一覧.md"


@dataclass
class Table:
    header: list[str]
    rows: list[dict[str, str]]


@dataclass
class CopiedFile:
    label: str
    source: Path
    md_path: Path | None = None
    html_path: Path | None = None
    raw_path: Path | None = None


def strip_ansi(value: str) -> str:
    return ANSI_RE.sub("", value)


def split_markdown_row(line: str) -> list[str]:
    text = line.strip()
    if text.startswith("|"):
        text = text[1:]
    if text.endswith("|"):
        text = text[:-1]
    cells: list[str] = []
    current: list[str] = []
    escaped = False
    for char in text:
        if escaped:
            current.append(char)
            escaped = False
        elif char == "\\":
            escaped = True
            current.append(char)
        elif char == "|":
            cells.append("".join(current).strip())
            current = []
        else:
            current.append(char)
    cells.append("".join(current).strip())
    return cells


def is_table_separator(line: str) -> bool:
    if not line.strip().startswith("|"):
        return False
    cells = split_markdown_row(line)
    if not cells:
        return False
    for cell in cells:
        normalized = cell.replace(":", "").replace("-", "").strip()
        if normalized:
            return False
        if cell.count("-") < 3:
            return False
    return True


def parse_tables(markdown: str) -> list[Table]:
    lines = markdown.splitlines()
    tables: list[Table] = []
    index = 0
    while index + 1 < len(lines):
        if lines[index].strip().startswith("|") and is_table_separator(lines[index + 1]):
            header = split_markdown_row(lines[index])
            rows: list[dict[str, str]] = []
            index += 2
            while index < len(lines) and lines[index].strip().startswith("|"):
                cells = split_markdown_row(lines[index])
                row = {header[i]: cells[i] if i < len(cells) else "" for i in range(len(header))}
                rows.append(row)
                index += 1
            tables.append(Table(header=header, rows=rows))
            continue
        index += 1
    return tables


def load_tables(path: Path) -> list[Table]:
    if not path.exists():
        return []
    return parse_tables(path.read_text(encoding="utf-8", errors="replace"))


def first_table_with(path: Path, columns: list[str]) -> Table | None:
    for table in load_tables(path):
        if all(column in table.header for column in columns):
            return table
    return None


def all_rows_with(path: Path, columns: list[str]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for table in load_tables(path):
        if all(column in table.header for column in columns):
            rows.extend(table.rows)
    return rows


def all_test_case_rows(path: Path) -> list[dict[str, str]]:
    """Return only primary case rows, not traceability or coverage helper tables."""
    rows: list[dict[str, str]] = []
    primary_markers = {
        "テストケース名",
        "テスト名",
        "実行区分",
        "前提条件",
        "入力/データ",
        "手順",
        "期待結果",
        "未実装理由",
    }
    helper_markers = {"対応状況", "理由", "カバレッジ", "対応テストケースID"}
    for table in load_tables(path):
        if "テストケースID" not in table.header:
            continue
        header_set = set(table.header)
        if not (header_set & primary_markers):
            continue
        if (header_set & helper_markers) and "テストケース名" not in header_set:
            continue
        rows.extend(table.rows)
    return rows


def priority_to_issue(priority: str) -> str:
    normalized = priority.strip()
    if normalized == "高":
        return "P1"
    if normalized == "中":
        return "P2"
    if normalized == "低":
        return "P3"
    if normalized in {"P0", "P1", "P2", "P3"}:
        return normalized
    return "優先度未設定"


def find_latest_run_dir(report_root: Path, suffix: str) -> Path | None:
    candidates = [path for path in report_root.glob(f"*_{suffix}") if path.is_dir()]
    if not candidates:
        return None

    def key(path: Path) -> str:
        return path.name.split("_", 1)[0]

    return sorted(candidates, key=key)[-1]


def make_unique_path(directory: Path, filename: str) -> Path:
    candidate = directory / filename
    if not candidate.exists():
        return candidate
    stem = candidate.stem
    suffix = candidate.suffix
    number = 2
    while True:
        next_candidate = directory / f"{stem}_{number}{suffix}"
        if not next_candidate.exists():
            return next_candidate
        number += 1


def copy_markdown(label: str, source: Path, md_dir: Path) -> CopiedFile | None:
    if not source.exists():
        return None
    destination = make_unique_path(md_dir, source.name)
    shutil.copy2(source, destination)
    return CopiedFile(label=label, source=source, md_path=destination)


def copy_raw(label: str, source: Path, raw_dir: Path) -> CopiedFile | None:
    if not source.exists():
        return None
    destination = make_unique_path(raw_dir, source.name)
    shutil.copy2(source, destination)
    return CopiedFile(label=label, source=source, raw_path=destination)


def file_fingerprint(path: Path) -> dict[str, object]:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    stat_result = path.stat()
    return {
        "path": str(path),
        "name": path.name,
        "size": stat_result.st_size,
        "mtime": datetime.fromtimestamp(stat_result.st_mtime).isoformat(timespec="seconds"),
        "sha256": digest.hexdigest(),
    }


def relative_url(from_dir: Path, target: Path) -> str:
    rel = os.path.relpath(target, start=from_dir)
    return quote(Path(rel).as_posix())


def root_relative_url(report_dir: Path, target: Path) -> str:
    rel = target.relative_to(report_dir)
    return quote(rel.as_posix())


def inline_markdown(text: str, html_dir: Path, md_link_map: dict[str, Path], raw_link_map: dict[str, Path]) -> str:
    escaped = html.escape(strip_ansi(text))

    def replace_code(match: re.Match[str]) -> str:
        return f"<code>{match.group(1)}</code>"

    escaped = re.sub(r"`([^`]+)`", replace_code, escaped)

    def replace_link(match: re.Match[str]) -> str:
        label = match.group(1)
        target = html.unescape(match.group(2))
        basename = Path(target).name
        href = target
        if basename in md_link_map:
            href = relative_url(html_dir, md_link_map[basename])
        elif basename in raw_link_map:
            href = relative_url(html_dir, raw_link_map[basename])
        return f'<a href="{html.escape(href, quote=True)}">{label}</a>'

    return re.sub(r"\[([^\]]+)\]\(([^)]+)\)", replace_link, escaped)


def render_markdown_html(
    title: str,
    markdown: str,
    html_dir: Path,
    md_link_map: dict[str, Path],
    raw_link_map: dict[str, Path],
) -> str:
    lines = strip_ansi(markdown).splitlines()
    body: list[str] = []
    index = 0
    in_code = False
    code_lines: list[str] = []
    in_list = False

    def close_list() -> None:
        nonlocal in_list
        if in_list:
            body.append("</ul>")
            in_list = False

    while index < len(lines):
        line = lines[index]
        stripped = line.strip()
        if stripped.startswith("```"):
            if in_code:
                body.append("<pre><code>" + html.escape("\n".join(code_lines)) + "</code></pre>")
                code_lines = []
                in_code = False
            else:
                close_list()
                in_code = True
            index += 1
            continue
        if in_code:
            code_lines.append(line)
            index += 1
            continue
        if stripped.startswith("|") and index + 1 < len(lines) and is_table_separator(lines[index + 1]):
            close_list()
            header = split_markdown_row(lines[index])
            body.append('<div class="table-wrap"><table>')
            body.append("<thead><tr>" + "".join(f"<th>{inline_markdown(cell, html_dir, md_link_map, raw_link_map)}</th>" for cell in header) + "</tr></thead>")
            body.append("<tbody>")
            index += 2
            while index < len(lines) and lines[index].strip().startswith("|"):
                cells = split_markdown_row(lines[index])
                body.append("<tr>" + "".join(f"<td>{inline_markdown(cell, html_dir, md_link_map, raw_link_map)}</td>" for cell in cells) + "</tr>")
                index += 1
            body.append("</tbody></table></div>")
            continue
        if not stripped:
            close_list()
            index += 1
            continue
        heading = re.match(r"^(#{1,6})\s+(.*)$", stripped)
        if heading:
            close_list()
            level = min(len(heading.group(1)) + 1, 6)
            body.append(f"<h{level}>{inline_markdown(heading.group(2), html_dir, md_link_map, raw_link_map)}</h{level}>")
            index += 1
            continue
        list_item = re.match(r"^[-*]\s+(.*)$", stripped)
        if list_item:
            if not in_list:
                body.append("<ul>")
                in_list = True
            body.append(f"<li>{inline_markdown(list_item.group(1), html_dir, md_link_map, raw_link_map)}</li>")
            index += 1
            continue
        close_list()
        body.append(f"<p>{inline_markdown(stripped, html_dir, md_link_map, raw_link_map)}</p>")
        index += 1
    close_list()
    if in_code:
        body.append("<pre><code>" + html.escape("\n".join(code_lines)) + "</code></pre>")
    return html_document(title, "\n".join(body))


def html_document(title: str, body: str) -> str:
    return f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html.escape(title)}</title>
  <style>
    :root {{
      color-scheme: light;
      --bg: #f7f7f4;
      --panel: #ffffff;
      --text: #202124;
      --muted: #666b73;
      --border: #d9ddd6;
      --accent: #0f766e;
      --danger: #b42318;
      --warn: #b7791f;
      --ok: #16794c;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: "Segoe UI", "Meiryo", sans-serif;
      line-height: 1.65;
    }}
    header, main {{
      max-width: 1180px;
      margin: 0 auto;
      padding: 24px;
    }}
    header {{
      padding-top: 32px;
      border-bottom: 1px solid var(--border);
    }}
    h1 {{ margin: 0 0 8px; font-size: 32px; }}
    h2 {{ margin-top: 32px; font-size: 24px; border-left: 5px solid var(--accent); padding-left: 10px; }}
    h3 {{ margin-top: 24px; font-size: 18px; }}
    p {{ margin: 8px 0; }}
    a {{ color: #075985; }}
    code {{
      background: #eef2f0;
      border: 1px solid #d7ddda;
      border-radius: 4px;
      padding: 1px 4px;
      font-family: Consolas, monospace;
    }}
    pre {{
      overflow: auto;
      background: #111827;
      color: #f9fafb;
      border-radius: 8px;
      padding: 14px;
    }}
    .grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin: 16px 0;
    }}
    .metric {{
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
    }}
    .metric .label {{ color: var(--muted); font-size: 13px; }}
    .metric .value {{ font-size: 26px; font-weight: 700; margin-top: 4px; }}
    .table-wrap {{
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--panel);
      margin: 12px 0;
    }}
    table {{ width: 100%; border-collapse: collapse; min-width: 720px; }}
    th, td {{ border-bottom: 1px solid var(--border); padding: 8px 10px; text-align: left; vertical-align: top; }}
    th {{ background: #eef2f0; white-space: nowrap; }}
    tr:last-child td {{ border-bottom: 0; }}
    .pill {{ display: inline-block; border-radius: 999px; padding: 2px 8px; font-weight: 700; font-size: 12px; }}
    .pass {{ color: var(--ok); }}
    .fail {{ color: var(--danger); }}
    .na {{ color: var(--warn); }}
  </style>
</head>
<body>
{body}
</body>
</html>
"""


def table_html(headers: list[str], rows: list[list[str]]) -> str:
    head = "".join(f"<th>{html.escape(header)}</th>" for header in headers)
    body_rows = []
    for row in rows:
        body_rows.append("<tr>" + "".join(f"<td>{cell}</td>" for cell in row) + "</tr>")
    return '<div class="table-wrap"><table><thead><tr>' + head + "</tr></thead><tbody>" + "\n".join(body_rows) + "</tbody></table></div>"


def write_detail_page(report_dir: Path, filename: str, title: str, headers: list[str], rows: list[list[str]]) -> Path:
    html_dir = report_dir / "html"
    html_dir.mkdir(parents=True, exist_ok=True)
    output = html_dir / filename
    table_or_empty = table_html(headers, rows) if rows else "<p>対象はありません。</p>"
    body = f"""
<header>
  <h1>{html.escape(title)}</h1>
  <p>件数: <strong>{len(rows)}</strong></p>
  <p><a href="../index.html">テスト実行レポートへ戻る</a></p>
</header>
<main>
  {table_or_empty}
</main>
"""
    output.write_text(html_document(title, body), encoding="utf-8")
    return output


def link(url: str, label: str) -> str:
    return f'<a href="{html.escape(url, quote=True)}">{html.escape(label)}</a>'


def collect_test_cases(artifacts_dir: Path) -> dict[str, dict[str, str]]:
    cases: dict[str, dict[str, str]] = {}
    sources = [
        ("コードベース", "実行対象", artifacts_dir / "テストケース_コードベース.md"),
        ("E2E自動", "実行対象", artifacts_dir / "テストケース_E2E自動.md"),
        ("人間実行", "実行対象", artifacts_dir / "テストケース_人間実行.md"),
        ("質問待ち", "質問待ち", artifacts_dir / "テストケース_質問待ち.md"),
        ("未実装コードベース", "未実装", artifacts_dir / "未実装テストケース_コードベース.md"),
        ("未実装E2E自動", "未実装", artifacts_dir / "未実装テストケース_E2E自動.md"),
    ]
    for category, report_category, path in sources:
        for row in all_test_case_rows(path):
            tc_id = row.get("テストケースID", "")
            if not TC_RE.fullmatch(tc_id):
                continue
            if tc_id not in cases:
                cases[tc_id] = {
                    "テストケースID": tc_id,
                    "区分": row.get("実行区分", category),
                    "優先度": row.get("優先度", ""),
                    "テストケース名": row.get("テストケース名", ""),
                    "状態": row.get("状態", ""),
                    "関連質問ID": row.get("関連質問ID", ""),
                    "未実装理由": row.get("未実装理由", ""),
                    "report_category": report_category,
                    "source_file": path.name,
                }
            else:
                if row.get("関連質問ID"):
                    cases[tc_id]["関連質問ID"] = row.get("関連質問ID", "")
                if row.get("未実装理由"):
                    cases[tc_id]["未実装理由"] = row.get("未実装理由", "")
                if report_category in {"質問待ち", "未実装"}:
                    cases[tc_id]["report_category"] = report_category
                    cases[tc_id]["source_file"] = path.name
                if report_category == "未実装":
                    cases[tc_id]["状態"] = row.get("状態", cases[tc_id].get("状態", ""))
    return cases


def collect_executed(run_dir: Path | None) -> dict[str, dict[str, str]]:
    if run_dir is None:
        return {}
    executed: dict[str, dict[str, str]] = {}
    for path in sorted(run_dir.glob("*_テストケース_*_実行済み.md")):
        for row in all_rows_with(path, ["テストケースID", "実行結果"]):
            tc_id = row.get("テストケースID", "")
            if not TC_RE.fullmatch(tc_id):
                continue
            previous = executed.get(tc_id)
            current_status = row.get("実行結果", "")
            if previous is None or STATUS_RANK.get(current_status, 0) >= STATUS_RANK.get(previous.get("実行結果", ""), 0):
                row = dict(row)
                row["source_file"] = path.name
                executed[tc_id] = row
    return executed


def collect_issues(issue_files: list[Path]) -> tuple[list[dict[str, str]], dict[str, str], dict[str, str]]:
    issues: list[dict[str, str]] = []
    priority_by_bug: dict[str, str] = {}
    priority_by_tc: dict[str, str] = {}
    for path in issue_files:
        for row in all_rows_with(path, ["Bug ID", "優先度"]):
            bug_id = row.get("Bug ID", "")
            if not bug_id:
                continue
            row = dict(row)
            row["source_file"] = path.name
            issues.append(row)
            priority = row.get("優先度", "")
            priority_by_bug[bug_id] = priority
            for tc_id in TC_RE.findall(" ".join(row.values())):
                priority_by_tc[tc_id] = priority
    return issues, priority_by_bug, priority_by_tc


def select_issue_file(run_dir: Path | None, preferred: str, legacy: str | None = None) -> Path | None:
    if not run_dir:
        return None
    preferred_path = run_dir / preferred
    if preferred_path.exists():
        return preferred_path
    if legacy:
        legacy_path = run_dir / legacy
        if legacy_path.exists():
            return legacy_path
    return None


def copy_artifacts(
    artifacts_dir: Path,
    report_dir: Path,
    codebase_run_dir: Path | None,
    e2e_run_dir: Path | None,
) -> tuple[list[CopiedFile], list[CopiedFile]]:
    md_dir = report_dir / "md"
    html_dir = report_dir / "html"
    raw_dir = report_dir / "raw"
    md_dir.mkdir(parents=True, exist_ok=True)
    html_dir.mkdir(parents=True, exist_ok=True)
    raw_dir.mkdir(parents=True, exist_ok=True)

    markdown_files: list[CopiedFile] = []
    raw_files: list[CopiedFile] = []
    for label, filename in CORE_MD_FILES:
        copied = copy_markdown(label, artifacts_dir / filename, md_dir)
        if copied:
            markdown_files.append(copied)
    for label, filename in CORE_RAW_FILES:
        copied = copy_raw(label, artifacts_dir / filename, raw_dir)
        if copied:
            raw_files.append(copied)

    for label, run_dir in [("コードベース実行結果", codebase_run_dir), ("E2E自動実行結果", e2e_run_dir)]:
        if not run_dir:
            continue
        for source in sorted(run_dir.glob("*.md")):
            copied = copy_markdown(f"{label}: {source.name}", source, md_dir)
            if copied:
                markdown_files.append(copied)
        for source in sorted(run_dir.iterdir()):
            if source.suffix.lower() in {".csv", ".json", ".txt", ".log"}:
                copied = copy_raw(f"{label}: {source.name}", source, raw_dir)
                if copied:
                    raw_files.append(copied)

    md_link_map = {copied.md_path.name: (html_dir / (copied.md_path.stem + ".html")) for copied in markdown_files if copied.md_path}
    raw_link_map = {copied.raw_path.name: copied.raw_path for copied in raw_files if copied.raw_path}

    for copied in markdown_files:
        if not copied.md_path:
            continue
        html_path = md_link_map[copied.md_path.name]
        markdown = copied.md_path.read_text(encoding="utf-8", errors="replace")
        html_path.write_text(
            render_markdown_html(copied.label, markdown, html_dir, md_link_map, raw_link_map),
            encoding="utf-8",
        )
        copied.html_path = html_path

    return markdown_files, raw_files


def write_manifest(
    report_dir: Path,
    timestamp: str,
    artifacts_dir: Path,
    codebase_run_dir: Path | None,
    e2e_run_dir: Path | None,
    copied_md: list[CopiedFile],
    raw_files: list[CopiedFile],
) -> CopiedFile:
    raw_dir = report_dir / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = raw_dir / "manifest.json"
    inputs = []
    for copied in [*copied_md, *raw_files]:
        source = copied.source
        if source.exists() and source.is_file():
            item = file_fingerprint(source)
            item["label"] = copied.label
            if copied.md_path:
                item["copied_to"] = str(copied.md_path.relative_to(report_dir))
            elif copied.raw_path:
                item["copied_to"] = str(copied.raw_path.relative_to(report_dir))
            inputs.append(item)
    manifest = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "report_timestamp": timestamp,
        "artifacts_dir": str(artifacts_dir),
        "codebase_run_dir": str(codebase_run_dir) if codebase_run_dir else "",
        "e2e_run_dir": str(e2e_run_dir) if e2e_run_dir else "",
        "inputs": inputs,
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return CopiedFile(label="レポート入力manifest", source=manifest_path, raw_path=manifest_path)


def prepare_report_dir(report_dir: Path) -> None:
    def remove_readonly(function, path, _exc_info) -> None:
        os.chmod(path, stat.S_IWRITE)
        function(path)

    report_dir.mkdir(parents=True, exist_ok=True)
    for name in ["md", "html", "raw"]:
        target = report_dir / name
        if target.exists():
            shutil.rmtree(target, onerror=remove_readonly)
    index = report_dir / "index.html"
    if index.exists():
        index.unlink()


def artifact_link_rows(report_dir: Path, copied_files: list[CopiedFile]) -> list[list[str]]:
    rows: list[list[str]] = []
    for copied in copied_files:
        html_link = link(root_relative_url(report_dir, copied.html_path), "HTML") if copied.html_path else ""
        md_link = link(root_relative_url(report_dir, copied.md_path), "Markdown") if copied.md_path else ""
        rows.append([html.escape(copied.label), html_link, md_link])
    return rows


def raw_link_rows(report_dir: Path, raw_files: list[CopiedFile]) -> list[list[str]]:
    rows: list[list[str]] = []
    for copied in raw_files:
        if copied.raw_path:
            rows.append([html.escape(copied.label), link(root_relative_url(report_dir, copied.raw_path), copied.raw_path.name)])
    return rows


def summarize(
    all_cases: dict[str, dict[str, str]],
    executed: dict[str, dict[str, str]],
    issues: list[dict[str, str]],
    priority_by_bug: dict[str, str],
    priority_by_tc: dict[str, str],
) -> dict[str, object]:
    pass_ids = {tc_id for tc_id, row in executed.items() if row.get("実行結果") == "Pass"}
    fail_ids = {tc_id for tc_id, row in executed.items() if row.get("実行結果") == "Fail"}
    na_ids = {tc_id for tc_id, row in executed.items() if row.get("実行結果") == "N/A"}
    executed_count = len(pass_ids) + len(fail_ids)
    pass_rate = (len(pass_ids) / executed_count * 100) if executed_count else None
    question_wait_ids = {
        tc_id
        for tc_id, row in all_cases.items()
        if row.get("report_category") == "質問待ち"
    }
    unimplemented_ids = {
        tc_id
        for tc_id, row in all_cases.items()
        if row.get("report_category") == "未実装"
    }
    not_run_ids = sorted(set(all_cases) - set(executed) - question_wait_ids - unimplemented_ids)
    question_wait_executed_ids = sorted(question_wait_ids & set(executed))
    unimplemented_executed_ids = sorted(unimplemented_ids & set(executed))

    fail_priority_counts = {"P0": 0, "P1": 0, "P2": 0, "P3": 0, "優先度未設定": 0}
    for tc_id in fail_ids:
        row = executed[tc_id]
        bug_id = row.get("Bug ID", "")
        priority = priority_by_bug.get(bug_id) or priority_by_tc.get(tc_id) or priority_to_issue(row.get("優先度", ""))
        if priority not in fail_priority_counts:
            priority = "優先度未設定"
        fail_priority_counts[priority] += 1

    return {
        "total": len(all_cases),
        "pass": len(pass_ids),
        "fail": len(fail_ids),
        "na": len(na_ids),
        "executed": executed_count,
        "pass_rate": pass_rate,
        "not_run_ids": not_run_ids,
        "question_wait_ids": sorted(question_wait_ids),
        "unimplemented_ids": sorted(unimplemented_ids),
        "question_wait_executed_ids": question_wait_executed_ids,
        "unimplemented_executed_ids": unimplemented_executed_ids,
        "fail_priority_counts": fail_priority_counts,
        "issue_count": len(issues),
    }


def testcase_rows(
    ids: list[str],
    cases: dict[str, dict[str, str]],
    report_dir: Path,
    html_files_by_name: dict[str, Path],
) -> list[list[str]]:
    rows: list[list[str]] = []
    for tc_id in ids:
        case = cases.get(tc_id, {})
        source_name = case.get("source_file", "")
        source_link = ""
        if source_name in html_files_by_name:
            source_link = link(relative_url(report_dir / "html", html_files_by_name[source_name]), source_name)
        rows.append(
            [
                html.escape(tc_id),
                html.escape(case.get("区分", "")),
                html.escape(case.get("優先度", "")),
                html.escape(case.get("テストケース名", "")),
                html.escape(case.get("状態", "")),
                html.escape(case.get("関連質問ID", "")),
                source_link,
            ]
        )
    return rows


def rows_from_markdown_cases(
    path: Path,
    report_dir: Path,
    html_files_by_name: dict[str, Path],
    extra_columns: list[str],
) -> list[list[str]]:
    rows: list[list[str]] = []
    source_link = ""
    if path.name in html_files_by_name:
        source_link = link(relative_url(report_dir / "html", html_files_by_name[path.name]), path.name)
    seen: set[str] = set()
    for row in all_test_case_rows(path):
        tc_id = row.get("テストケースID", "")
        if not TC_RE.fullmatch(tc_id):
            continue
        if tc_id in seen:
            continue
        seen.add(tc_id)
        rows.append(
            [
                html.escape(tc_id),
                html.escape(row.get("実行区分", "")),
                html.escape(row.get("優先度", "")),
                html.escape(row.get("テストケース名", "")),
                html.escape(row.get("状態", "")),
                *[html.escape(row.get(column, "")) for column in extra_columns],
                source_link,
            ]
        )
    return rows


def build_index_html(
    timestamp: str,
    report_dir: Path,
    artifacts_dir: Path,
    codebase_run_dir: Path | None,
    e2e_run_dir: Path | None,
    copied_md: list[CopiedFile],
    raw_files: list[CopiedFile],
    all_cases: dict[str, dict[str, str]],
    executed: dict[str, dict[str, str]],
    issues: list[dict[str, str]],
    selected_issue_file_names: set[str],
    summary: dict[str, object],
) -> str:
    html_files_by_name = {copied.md_path.name: copied.html_path for copied in copied_md if copied.md_path and copied.html_path}
    artifact_rows = artifact_link_rows(report_dir, copied_md)
    raw_rows = raw_link_rows(report_dir, raw_files)
    pass_rate = summary["pass_rate"]
    pass_rate_text = "-" if pass_rate is None else f"{pass_rate:.1f}%"
    total = int(summary["total"])
    executed_count = int(summary["executed"])
    execution_rate = "-" if total == 0 else f"{executed_count / total * 100:.1f}%"
    overlap_notes: list[str] = []
    if summary["question_wait_executed_ids"]:
        overlap_notes.append(f"質問待ちかつ実行結果あり: {len(summary['question_wait_executed_ids'])}件")
    if summary["unimplemented_executed_ids"]:
        overlap_notes.append(f"未実装かつ実行結果あり: {len(summary['unimplemented_executed_ids'])}件")
    overlap_note_html = ""
    if overlap_notes:
        overlap_note_html = (
            "<p>注記: 質問待ちまたは未実装のケースに実行結果がある場合、"
            "実行結果カテゴリと未完了カテゴリの両方に表示する。"
            f"{html.escape('、'.join(overlap_notes))}。</p>"
        )

    issue_rows: list[list[str]] = []
    issue_file_counts: dict[str, int] = {}
    for issue in issues:
        issue_file_counts[issue["source_file"]] = issue_file_counts.get(issue["source_file"], 0) + 1
    bug_list_files = [
        copied
        for copied in copied_md
        if copied.md_path and copied.md_path.name in selected_issue_file_names
    ]
    for copied in bug_list_files:
        source_name = copied.md_path.name
        html_path = copied.html_path
        md_path = copied.md_path
        count = issue_file_counts.get(source_name, 0)
        issue_rows.append(
            [
                html.escape(source_name),
                str(count),
                link(root_relative_url(report_dir, html_path), "HTML") if html_path else "",
                link(root_relative_url(report_dir, md_path), "Markdown") if md_path else "",
            ]
        )
    if not issue_rows:
        issue_rows.append(["バグリスト", "0", "バグは記録されていません", ""])

    fail_priority = summary["fail_priority_counts"]
    fail_rows = [[priority, str(fail_priority[priority])] for priority in ["P0", "P1", "P2", "P3", "優先度未設定"]]
    fail_rows.append(["合計", str(summary["fail"])])

    not_run_rows = testcase_rows(summary["not_run_ids"], all_cases, report_dir, html_files_by_name)
    question_rows = rows_from_markdown_cases(artifacts_dir / "テストケース_質問待ち.md", report_dir, html_files_by_name, ["関連質問ID"])
    unimplemented_rows = []
    for filename in ["未実装テストケース_コードベース.md", "未実装テストケース_E2E自動.md"]:
        unimplemented_rows.extend(rows_from_markdown_cases(artifacts_dir / filename, report_dir, html_files_by_name, ["未実装理由", "関連質問ID"]))
    not_run_page = write_detail_page(
        report_dir,
        "未実行テストケース.html",
        "まだ実行していないテストケース",
        ["テストケースID", "区分", "優先度", "テストケース名", "状態", "関連質問ID", "リンク"],
        not_run_rows,
    )
    question_page = write_detail_page(
        report_dir,
        "質問待ちのテストケース.html",
        "質問待ちのテストケース",
        ["テストケースID", "区分", "優先度", "テストケース名", "状態", "関連質問ID", "リンク"],
        question_rows,
    )
    unimplemented_page = write_detail_page(
        report_dir,
        "未実装のテストケース.html",
        "未実装のテストケース",
        ["テストケースID", "区分", "優先度", "テストケース名", "状態", "未実装理由", "関連質問ID", "リンク"],
        unimplemented_rows,
    )

    body = f"""
<header>
  <h1>テスト実行レポート</h1>
  <p>作成日時: <strong>{html.escape(timestamp)}</strong></p>
  <p>成果物ディレクトリ: <code>{html.escape(str(artifacts_dir))}</code></p>
</header>
<main>
  <section>
    <h2>1. テスト結果サマリー</h2>
    <div class="grid">
      <div class="metric"><div class="label">全テストケース数</div><div class="value">{summary["total"]}</div></div>
      <div class="metric"><div class="label">実行済みテストケース数</div><div class="value">{summary["executed"]}</div></div>
      <div class="metric"><div class="label">実行率</div><div class="value">{execution_rate}</div></div>
      <div class="metric"><div class="label">Pass</div><div class="value pass">{summary["pass"]}</div></div>
      <div class="metric"><div class="label">Pass率</div><div class="value pass">{pass_rate_text}</div></div>
      <div class="metric"><div class="label">Fail</div><div class="value fail">{summary["fail"]}</div></div>
      <div class="metric"><div class="label">N/A</div><div class="value na">{summary["na"]}</div></div>
      <div class="metric"><div class="label">未実行（実行対象）</div><div class="value">{len(summary["not_run_ids"])}</div></div>
      <div class="metric"><div class="label">質問待ち</div><div class="value">{len(question_rows)}</div></div>
      <div class="metric"><div class="label">未実装</div><div class="value">{len(unimplemented_rows)}</div></div>
    </div>
    <p>Pass率 = Pass / (Pass + Fail)。N/Aは分母に含めない。</p>
    <p>未実行（実行対象）は、質問待ちと未実装を除いた未実行ケース数。</p>
    {overlap_note_html}
  </section>

  <section>
    <h2>2. Failサマリー</h2>
    {table_html(["優先度", "Fail数"], fail_rows)}
  </section>

  <section>
    <h2>3. バグリスト</h2>
    {table_html(["バグリスト", "件数", "HTML", "Markdown"], issue_rows)}
  </section>

  <section>
    <h2>4. まだ実行していないテストケース</h2>
    {table_html(["内容", "件数", "リンク"], [["まだ実行していないテストケース", str(len(not_run_rows)), link(root_relative_url(report_dir, not_run_page), "詳細HTML")]])}
  </section>

  <section>
    <h2>5. 質問待ちのテストケース</h2>
    {table_html(["内容", "件数", "リンク"], [["質問待ちのテストケース", str(len(question_rows)), link(root_relative_url(report_dir, question_page), "詳細HTML")]])}
  </section>

  <section>
    <h2>6. 未実装のテストケース</h2>
    {table_html(["内容", "件数", "リンク"], [["未実装のテストケース", str(len(unimplemented_rows)), link(root_relative_url(report_dir, unimplemented_page), "詳細HTML")]])}
  </section>

  <section>
    <h2>7. 成果物リンク</h2>
    {table_html(["成果物", "HTML", "Markdown"], artifact_rows)}
  </section>

  <section>
    <h2>8. 実行証跡</h2>
    <p>コードベース実行結果: <code>{html.escape(str(codebase_run_dir) if codebase_run_dir else "未検出")}</code></p>
    <p>E2E自動実行結果: <code>{html.escape(str(e2e_run_dir) if e2e_run_dir else "未検出")}</code></p>
    {table_html(["証跡", "リンク"], raw_rows) if raw_rows else "<p>実行ログ、CSV、JSONは見つかりませんでした。</p>"}
  </section>
</main>
"""
    return html_document("テスト実行レポート", body)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create a frozen HTML test execution report.")
    parser.add_argument("--artifacts-dir", default="テスト成果物")
    parser.add_argument("--report-root", default="テスト成果物/report")
    parser.add_argument("--timestamp", default=None)
    parser.add_argument("--codebase-run-dir", default=None)
    parser.add_argument("--e2e-run-dir", default=None)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    timestamp = args.timestamp or datetime.now().strftime("%Y%m%d%H%M%S")
    artifacts_dir = Path(args.artifacts_dir)
    report_root = Path(args.report_root)
    report_dir = report_root / f"{timestamp}_report"
    prepare_report_dir(report_dir)

    codebase_run_dir = Path(args.codebase_run_dir) if args.codebase_run_dir else find_latest_run_dir(report_root, "コードベーステスト")
    e2e_run_dir = Path(args.e2e_run_dir) if args.e2e_run_dir else find_latest_run_dir(report_root, "e2e自動テスト")

    copied_md, raw_files = copy_artifacts(artifacts_dir, report_dir, codebase_run_dir, e2e_run_dir)
    manifest = write_manifest(report_dir, timestamp, artifacts_dir, codebase_run_dir, e2e_run_dir, copied_md, raw_files)
    raw_files.append(manifest)
    all_cases = collect_test_cases(artifacts_dir)
    executed = {}
    executed.update(collect_executed(codebase_run_dir))
    executed.update(collect_executed(e2e_run_dir))
    issue_files = []
    codebase_issue_file = select_issue_file(codebase_run_dir, CODEBASE_ISSUE_FILE, LEGACY_CODEBASE_ISSUE_FILE)
    e2e_issue_file = select_issue_file(e2e_run_dir, E2E_ISSUE_FILE)
    for issue_path in [codebase_issue_file, e2e_issue_file]:
        if issue_path:
            issue_files.append(issue_path)
    issues, priority_by_bug, priority_by_tc = collect_issues(issue_files)
    summary = summarize(all_cases, executed, issues, priority_by_bug, priority_by_tc)
    selected_issue_file_names = {path.name for path in issue_files}

    report_html = report_dir / "index.html"
    report_html.write_text(
        build_index_html(
            timestamp=timestamp,
            report_dir=report_dir,
            artifacts_dir=artifacts_dir,
            codebase_run_dir=codebase_run_dir,
            e2e_run_dir=e2e_run_dir,
            copied_md=copied_md,
            raw_files=raw_files,
            all_cases=all_cases,
            executed=executed,
            issues=issues,
            selected_issue_file_names=selected_issue_file_names,
            summary=summary,
        ),
        encoding="utf-8",
    )

    pass_rate = summary["pass_rate"]
    pass_rate_text = "-" if pass_rate is None else f"{pass_rate:.1f}%"
    print(f"report_dir={report_dir}")
    print(f"report_html={report_html}")
    print(
        f"summary=Total:{summary['total']} Executed:{summary['executed']} "
        f"Pass:{summary['pass']} Fail:{summary['fail']} N/A:{summary['na']} "
        f"NotRun:{len(summary['not_run_ids'])} QuestionWait:{len(summary['question_wait_ids'])} "
        f"Unimplemented:{len(summary['unimplemented_ids'])} PassRate:{pass_rate_text}"
    )
    print(f"codebase_run_dir={codebase_run_dir if codebase_run_dir else ''}")
    print(f"e2e_run_dir={e2e_run_dir if e2e_run_dir else ''}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
