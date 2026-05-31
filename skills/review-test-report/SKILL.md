---
name: review-test-report
description: Review Japanese HTML/Markdown test execution reports against QA artifacts, execution results, issue lists, review results, and evidence completeness. Use when Codex needs to assess or improve a final テスト実行レポート, report snapshot folder, index.html, summary counts, Fail/issue visibility, not-run/question-wait/unimplemented visibility, artifact links, raw evidence links, source freshness, traceability, security redaction, or report readability; prioritize findings, fix P0/P1/P2 fix-worthy issues, re-review until no P0/P1/P2 fix-worthy issues remain, and save the final review result as Markdown.
---

# Review Test Report

## Overview

Review and improve a generated test execution report so it is a trustworthy final visibility artifact. Focus on whether the report accurately snapshots the intended QA artifacts, execution results, issue lists, review results, unresolved states, and raw evidence without hiding failures or over-stating release quality.

Default to Japanese output. This skill may edit the generated report, report generator, or report inputs when the user asks for the full review-and-fix workflow and the fix is clearly supported by available artifacts. Prefer fixing the repeatable source of a report defect, such as the report generator or selected input folders, then regenerating the report. Do not edit product specifications, README files, product code, or unrelated artifacts unless the user explicitly asks.

## Workflow

1. Locate the report to review. If the user does not specify one, prefer the latest `テスト成果物/report/*_report/` folder containing `index.html`.
2. Gather source material in this order:
   - User-provided review instructions and acceptance criteria.
   - The generated report folder: `index.html`, `md/`, `html/`, `raw/`, screenshots, logs, JSON, CSV, and selected execution folder references.
   - Source QA artifacts such as test plan, test analysis, questionnaires, test design, test cases, unimplemented cases, and question-wait cases.
   - Review result artifacts such as test plan, analysis, design, test case, code, E2E, cross-artifact, and report reviews.
   - Execution result folders for codebase and E2E tests, including executed-case Markdown/CSV, logs, raw JSON, screenshots, and issue lists.
   - Product specifications and README only when needed to verify required formal assets, evidence, security, or reporting obligations.
   - Report generator scripts or templates only when the report appears generated or a repeatable fix is needed.
3. Independently recalculate the main counts from the selected source artifacts and execution results. Do not rely only on the report's displayed numbers.
4. Check static links from `index.html` and detail pages to copied Markdown, HTML, raw evidence, and manifest files.
5. Review the report using the review perspectives below.
6. List findings with priority, grounded in concrete report files and source artifacts.
7. Fix all `P0`, `P1`, and `P2` findings that are actually fixable from available information. Fix `P3` findings only when the correction is low-risk and clearly supported.
8. Re-review the edited or regenerated report. Repeat the review and fix loop until no `P0`, `P1`, or `P2` findings remain, except when a finding cannot be fixed because required information is unavailable. In that case, record the unresolved item clearly.
9. Save the final review result as Markdown. If the user does not specify a path, save it as `テスト成果物/テストレポートレビュー結果.md`.

## Priority Rules

Use these priorities consistently:

- **P0 - Blocker**: The report cannot be trusted or used. Examples: `index.html` is missing or cannot open, the report uses the wrong execution result folder, major counts are materially wrong, Fail results are hidden, required raw evidence is missing while results are presented as supported, links to core report pages are broken, or sensitive secrets are exposed.
- **P1 - High**: The report is usable but has a problem that should be fixed before relying on it. Examples: required top-level sections are missing, Pass rate or execution rate uses the wrong denominator, P0/P1/P2 Fail or issue counts are wrong, not-run/question-wait/unimplemented cases are invisible, review result artifacts with remaining P0/P1/P2 findings are omitted, issue lists cannot be traced to failed cases, required formal/regression assets are not reported, or source freshness is misleading.
- **P2 - Medium**: The report can be used, but clarity, completeness, or maintainability should be improved. Examples: minor count mismatch, duplicate rows that do not hide severity, optional review/questionnaire artifact missing from links, weak source timestamp/select-folder disclosure, unclear link labels, non-critical raw evidence omitted, minor traceability weakness, or display/readability issues.
- **P3 - Low**: Nice-to-have cleanup. Examples: wording polish, table styling improvement, optional grouping, or cosmetic ordering.

Treat `P0`, `P1`, and `P2` as fix-worthy findings. Continue the fix/re-review loop until none remain, except when the finding cannot be fixed because required information is unavailable. Treat `P3` as optional cleanup.

## Review Perspectives

Review from these perspectives:

- **Report existence and structure**: Confirm the report folder exists, `index.html` exists, detail pages exist, and the report can be opened as a static artifact.
- **Source freshness and selection**: Confirm the report states or clearly implies generation timestamp, selected artifact root, selected execution folders, and whether the snapshot is expected to reflect the current source artifacts.
- **Required section order**: Confirm top sections appear in the expected order when the report standard defines one, such as summary, Fail summary, bug list, not-run cases, question-wait cases, unimplemented cases, artifact links, and execution evidence.
- **Summary count accuracy**: Reconcile total cases, executed cases, Pass, Fail, N/A, execution rate, Pass rate, not-run, question-wait, and unimplemented counts against source Markdown/CSV/JSON. Count unique test case IDs unless the report explicitly defines another rule.
- **Aggregation semantics**: Confirm formulas are documented and correct. Pass rate should exclude `N/A` when defined as `Pass / (Pass + Fail)`. Distinguish not-run, N/A, question-wait, unimplemented, skipped, blocked, excluded, infrastructure-failed, and human-run-not-yet-executed states when the source artifacts distinguish them.
- **Multiple execution result policy**: Confirm repeated executions or environment/browser matrix rows for the same `TC-*` are handled by an explicit policy, such as latest result, most severe result, or environment-separated result. The report should not silently merge contradictory `Pass` and `Fail` outcomes.
- **Duplicate and table extraction integrity**: Confirm the report does not double-count the same `TC-*` because a source artifact contains multiple tables, coverage tables, traceability tables, or summary tables. Detail pages should not contain empty duplicate rows.
- **Fail and issue visibility**: Confirm every failed case is visible in summary/detail views, maps to a bug or issue entry when available, preserves priority, and can be traced back to execution evidence.
- **Priority aggregation**: Confirm `P0`, `P1`, `P2`, `P3`, and unset priority counts reflect issue lists or documented fallback rules, and do not downgrade high-severity failures.
- **Unfinished work visibility**: Confirm not-run, question-wait, unimplemented, N/A, human-execution pending, infrastructure-blocked, and manually excluded cases are visible and not silently treated as Pass.
- **Review gate visibility**: Confirm available review result artifacts are linked or summarized, especially any remaining `P0`, `P1`, or `P2` findings from planning, analysis, design, case, code, E2E, cross-artifact, or prior report reviews.
- **Artifact link completeness**: Confirm links exist for current plan, analysis, questionnaires, design, test cases, human CSV, unimplemented lists, issue lists, executed-case results, review results, and report details when those artifacts exist.
- **Raw evidence completeness**: Confirm expected CSV, JSON, logs, screenshots, traces, videos, or browser outputs are copied or linked, and the links resolve inside the report package or to clearly documented external paths.
- **Traceability**: Confirm the report preserves enough IDs to navigate from specification/risk to `TAxxx`, `TVxxx`, `TDxxx`, `TC-*`, execution result, `BUG-*` or `E2E-BUG-*`, and evidence.
- **Formal/regression asset reporting**: Confirm source-defined formal, required, bundled, golden, contract, certification, compatibility, or regression test assets appear in the report with existence, execution status, evidence, or missing-asset issue handling.
- **No over-judgment**: Confirm the report does not declare overall product acceptance, release readiness, or final quality when human tests, unresolved questions, unimplemented cases, or high-priority findings remain, unless an explicit human approval artifact supports that conclusion.
- **Static portability**: Confirm the report is usable after moving the folder: relative links work, required files are copied, and unnecessary absolute local paths are avoided.
- **Security and privacy**: Confirm the report does not expose credentials, API keys, bearer tokens, cookies, refresh tokens, `.env` values, personal information, private URLs, internal hostnames, full environment dumps, or excessive local machine details. Redact or mark as internal-only when needed.
- **HTML/readability**: Confirm Markdown-to-HTML conversion is legible, ANSI color codes are stripped, Japanese text is not garbled, tables are readable, and detail pages are not overloaded when summary links would suffice.

## Recalculation Procedure

Use this procedure when the source artifacts are available:

1. Identify the intended source set from user instructions, report text, `raw/manifest.json`, selected execution folder lines, or latest matching execution folders.
2. Parse primary test case tables from source artifacts or copied `md/` files. Count rows by unique `TC-*` only when the table represents actual executable, question-wait, or unimplemented cases. Exclude coverage, traceability, review, and summary tables even if they contain `テストケースID`.
3. Parse executed-case tables from selected run folders or copied report `md/` files. Use rows with both `テストケースID` and `実行結果`.
4. For duplicate execution rows with the same `TC-*`, determine whether the report documents a policy. If no policy is documented, raise a finding. If a policy is documented, recalculate using that policy and compare.
5. Recalculate `Pass`, `Fail`, `N/A`, `Executed`, `PassRate`, ordinary not-run, question-wait, and unimplemented counts. Keep unfinished categories mutually understandable; do not let question-wait or unimplemented cases disappear into generic not-run without explanation.
6. Parse issue lists and recalculate priority counts using the report's documented priority source and fallback. Confirm failed cases can be traced to issue IDs when issue artifacts exist.
7. Compare recalculated values with `index.html` and detail pages. A small display-only mismatch can be `P2`; a mismatch that changes risk perception is `P1` or `P0`.
8. Check every local `href` in `index.html` and important detail pages. The target should exist under the report folder unless the link is intentionally external and labeled as such.
9. Review any review result artifacts that exist. If they contain remaining `P0`, `P1`, or `P2`, confirm the report surfaces that fact or links the artifact prominently enough for final readers.
10. Scan copied Markdown, HTML, JSON, CSV, and logs for practical secret patterns such as `api_key`, `secret`, `token`, `Authorization: Bearer`, `password`, cookies, private email addresses, and `.env`-style assignments. Do not over-report harmless test dummy values.

## Finding Format

During each review pass, present findings first and sort by priority. Use this table:

```markdown
| 優先度 | 観点 | 問題 | 場所 | 影響 | 修正方針 |
|---|---|---|---|---|---|
```

Guidelines:

- Ground every finding in the generated report, source artifacts, execution evidence, issue lists, or report generator behavior.
- Do not create a finding merely because an optional artifact does not exist.
- Treat a missing or unreadable `index.html` as `P0`.
- Treat wrong selected execution folders, stale report contents presented as current, or materially incorrect major counts as `P0` when they would mislead the report reader; otherwise use `P1`.
- Treat a missing required top-level section as at least `P1`.
- Treat a Pass-rate denominator error as at least `P1`; raise to `P0` if it reverses the apparent outcome of the test run.
- Treat missing or undocumented handling of contradictory repeated results for the same `TC-*` as `P1` when it can hide a failure, otherwise `P2`.
- Treat hidden Fail results, missing P0/P1/P2 issue visibility, or broken evidence for failed cases as at least `P1`; raise to `P0` when failures are effectively concealed.
- Treat not-run, question-wait, unimplemented, N/A, or human-run-pending cases that are absent from the report as at least `P1`.
- Treat duplicate rows or duplicate counts caused by parsing coverage/traceability tables as `P2`; raise to `P1` if the duplication materially changes status, priority, or release-risk perception.
- Treat missing review result links as `P1` when the review artifact contains or may contain remaining `P0`, `P1`, or `P2` findings; otherwise usually `P2`.
- Treat missing questionnaire or unresolved-item links as `P2`, or `P1` when they block execution or judgment.
- Treat a source-defined formal/regression asset absent from the report as `P1` when the source positions it as required for confidence or acceptance; otherwise usually `P2`.
- Treat broken links to core artifacts or raw evidence as `P1`; use `P2` for non-critical optional links.
- Treat secret/token exposure as `P0`; treat personal information exposure, private URLs, or unnecessary local absolute path exposure as `P2` unless it leaks sensitive information or violates the report's intended audience.
- Mark unavailable source facts as `要確認`; do not invent them.
- If no findings exist at a priority, say so clearly.

## Fix Rules

When fixing the report or its generation:

- Prefer repeatable fixes. If a report generator script, template, or selection rule caused the problem, fix that source and regenerate the report instead of hand-editing only the frozen output.
- Preserve the report folder naming convention and static portability unless the user asks otherwise.
- If regenerating, keep or record the previous report path and provide the new report path in the review result.
- Fix `P0`, `P1`, and `P2` issues directly when the required source information is available.
- Do not change source QA artifacts just to make the report pass. Change source QA artifacts only when they are actually wrong and the user request allows it.
- Add missing review result, questionnaire, issue list, executed-result, and raw evidence links when the artifacts exist.
- Correct summary formulas and counts by reconciling with source tables and raw execution data.
- De-duplicate by stable IDs and source section intent. For example, count rows from execution/case tables, not from traceability, coverage, or summary tables unless the report explicitly reports those tables.
- If duplicate execution rows exist, either preserve environment-separated detail or document and apply a deterministic aggregation policy.
- Keep `Fail`, `N/A`, not-run, question-wait, unimplemented, skipped, and human-run-pending statuses distinct when the source artifacts distinguish them.
- Preserve original failure messages, issue IDs, priorities, test case IDs, and evidence paths when summarizing.
- Redact secrets or sensitive personal data; if redaction would alter evidence meaning, document the redaction.
- Do not edit product specifications, README files, product code, or unrelated test code unless explicitly requested.

## Final Review Result

Save a Markdown review result with this structure:

```markdown
# テストレポートレビュー結果

## 1. レビュー対象
## 2. 参照資料
## 3. レビュー観点
## 4. レビュー・修正サマリー
## 5. 最終レビュー結果
## 6. 残課題
```

Final result requirements:

- Include the reviewed report folder, `index.html`, and final review result path.
- Include selected execution folders and source artifact root when identifiable.
- Include the source artifacts, review results, issue lists, raw evidence, and report generator files used.
- Include the review perspectives applied.
- Summarize each review/fix iteration.
- State the result of summary-count reconciliation, including Pass-rate denominator, duplicate-ID handling, and unfinished-work visibility.
- State whether review result artifacts, questionnaires, formal/regression assets, issue lists, and raw evidence were linked or intentionally absent.
- State whether static links, readability, and security/privacy checks passed.
- State clearly that no `P0`, `P1`, or `P2` findings remain, or explain any remaining fix-worthy finding that could not be fixed because required information was unavailable.
- List remaining `P3` issues, if any, with recommended next actions.
- Mention every report artifact, generator file, or source QA artifact updated during the review.
