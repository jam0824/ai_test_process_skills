---
name: create-test-cases
description: Create Japanese Markdown test case tables from test design artifacts, design questionnaires, test analysis, test plans, specifications, README files, existing tests, and implementation notes. Use when Codex needs to expand each TDxxx design pattern into execution-ready, independently reportable TC-* test cases, output separate files for code-based tests, E2E automated tests, human-executed tests, question-wait cases, and a companion CSV for human-executed cases, and preserve coverage from test design to test cases.
---

# Create Test Cases

## Overview

Create Markdown test cases that answer "what exactly should be executed or checked?" from a test design document. Keep the output human-readable and implementation-neutral: write test case tables, not automation code or detailed test result logs.

Default to Japanese output. Preserve traceability from each test case back to the originating test design, test viewpoint, test approach, specification, product risk, and related question when applicable.

## Core Principle

Separate test design from executable test cases:

- A test design row may describe a condition family, equivalence class, boundary set, matrix, or scenario outline.
- A test case row must describe one concrete execution and one independently reportable Pass/Fail/N/A judgment.
- Do not copy condition sets from test design directly into `入力/データ`. Instantiate them into concrete cases.
- Parameterized automation is allowed later, but each parameter that can pass/fail independently still needs its own `TC-*` row or an explicit aggregate-judgment rationale.
- The design's `Expected Case Yield` is binding. Each `TDxxx` must expand to the expected number of concrete `TC-*` rows unless the test case file records an accepted representative extraction or aggregate judgment rule.
- Each row must stand alone. Do not rely on another row for setup, inputs, steps, or expected results.
- Test inputs must be executable inputs, not only derived internal variables or intermediate states. When a target state matters, write the external input, API argument, fixture, database row, file content, UI operation, or setup step that creates it.
- If a value, threshold, environment, or expected result cannot be made concrete from source material, create or use a question-wait case instead of guessing.

## Workflow

1. Locate the test design. If not specified, prefer `テスト成果物/テスト設計.md` or similarly named Markdown files.
2. Locate the related design questionnaire. If not specified, prefer `テスト成果物/テスト設計_質問票.md`.
3. Gather source material in this order:
   - User-provided test case instructions, constraints, and target artifacts.
   - Test design, especially every `TDxxx` row and its `テストレベル/タイプ`, condition/input, execution method, expected-result judgment, status, and traceability.
   - Test design questionnaire, especially `DQxxx` rows linked to `質問待ち` designs.
   - Test analysis and analysis questionnaire.
   - Test plan, especially test approaches, product risks, scope, and exit criteria.
   - Product specifications such as `spec/`, `docs/`, files named `仕様書`, requirement IDs, or feature lists.
   - README and user-facing documentation.
   - Existing tests and implementation files only when they clarify testability, inputs, outputs, or existing coverage.
4. Extract every test design ID, such as `TD001`, and its linked `TVxxx`, `TAxxx`, level/type, priority, pattern, condition/input, execution method, expected-result judgment, specification reference, risk ID, and status.
5. Extract every `Expected Case Yield` row from the design. If the design has no yield table, or any `TDxxx` lacks a concrete `期待TC数`, stop and update/review the test design first; do not proceed on "one test per TD" as a fallback.
6. Expand every `TDxxx` into the expected number of test cases by instantiating design conditions into executable cases. Split the design into multiple cases when its condition/input contains multiple representative values, boundary values, abnormal values, browser targets, device/viewport/OS targets, user roles, API statuses, file formats, data states, scenarios, or question-wait conditions. A test case must represent one independently reportable execution/judgment unit; do not keep multiple materially different inputs in one `TC-*` row merely because they share the same expected formula, procedure, helper function, or automation loop.
7. Build a **Case Expansion Ledger（ケース展開台帳）** that maps `TDxxx -> 期待TC数 -> 実TC数 -> 差分 -> 理由` across all output files.
   - If `実TC数 < 期待TC数`, record a concrete representative extraction reason or aggregate judgment rule. Without that, test case creation is incomplete.
   - `全TDに1件以上TCがある` is not sufficient for completion.
8. Classify each test case into one planned execution category: code-based, E2E automated, or human-executed.
9. Separate question-wait cases from executable cases. Put `状態=質問待ち` cases in the question-wait file, keep their planned `実行区分`, set `期待結果` to `要確認` where needed, and link the relevant `DQxxx`.
10. If test case creation reveals a missing design, missing expected-yield row, missing question, missing viewpoint, or plan-level gap, update the appropriate upstream artifact when supported by source material. Record all changes in the affected test case files.
11. Save the test case files. If the user does not specify paths, save the four files next to the design:
   - `テスト成果物/テストケース_コードベース.md`
   - `テスト成果物/テストケース_E2E自動.md`
   - `テスト成果物/テストケース_人間実行.md`
   - `テスト成果物/テストケース_質問待ち.md`
   - `テスト成果物/テストケース_人間実行.csv`
12. Run the execution-readiness self-check before finishing. Search generated cases for compressed-condition smells such as `/`, `、`, `,`, `・`, `または`, `各`, `すべて`, `複数`, `など`, `付近`, `正常値`, `異常値`, `代表`, `直前`, `境界`, `直後`, browser lists, viewport lists, role lists, and value ranges. Split or mark `要確認` unless the row explicitly documents an aggregate-judgment scenario.
13. Run the row-independence and table-integrity self-check. Confirm no executable row uses `同上`, `前述と同じ`, `同条件`, `同様`, or cross-row references; no row uses only internal/derived values as input; no expected result contains multiple independent observation points; and every Markdown table row has the same number of cells as its header. Escape or rewrite literal `|`, `||`, shell pipes, regex alternation, and TypeScript union syntax inside table cells.
14. Run the human CSV parity self-check. Confirm `テストケース_人間実行.csv` contains the same human-executed `TC-MAN-*` rows as `テストケース_人間実行.md`, has valid CSV quoting, and includes blank execution-record columns for human testers.

## Execution-Ready Case Contract

Every executable `TC-*` row must pass this contract:

- **One judgment**: the row can be reported as one Pass/Fail/N/A without needing sub-results to explain which input failed.
- **Concrete inputs**: the tester or implementer can execute the row without choosing values.
- **Row independence**: the row does not require reading another test case row to know its preconditions, inputs, steps, or expected result. Do not use `同上`, `前述と同じ`, `同条件`, or `同様` in executable rows.
- **Executable inputs**: the row uses actual inputs or setup artifacts the executor can apply. Avoid writing only internal state such as `need=50000`, `cacheHit=true`, `DB is inconsistent`, or `session expired`; instead state how to create that state through API parameters, fixtures, database records, files, UI operations, clock setup, mocks, or dependency responses.
- **Concrete environment**: browser, OS, viewport, role, dataset, feature flag, locale, and external dependency state are concrete when they affect the result.
- **Reproducible steps**: the written steps are sufficient for a human tester or automation implementer to perform the same execution.
- **Judgable expected result**: the expected result names the observable output, state, error, tolerance, or evidence required to pass.
- **One observation unit**: if the expected result says to check separate times, rows, screens, roles, environments, states, or outputs that can fail independently, split them unless the row is explicitly an aggregate scenario.
- **Valid Markdown table**: table cells do not contain unescaped `|` characters or raw syntax that breaks the column count.
- **Traceability preserved**: split rows keep the same source `TDxxx`/`TVxxx`/`TAxxx`/spec/risk references and each appears in coverage.

Do not use broad execution placeholders such as `正常値`, `異常値`, `境界付近`, `いくつかの値`, `必要な項目`, `適切に`, `など`, or cross-row shortcuts such as `同上` in executable rows. Replace them with concrete values or move the row to question-wait with `要確認`.

## Output: Test Case Files

Use four Markdown files by default, plus a companion CSV for human-executed cases. Do not create or update a single combined `テストケース.md` unless the user explicitly asks for a consolidated file.

### Code-Based Test Case File

Save code-based cases to `テスト成果物/テストケース_コードベース.md` using this structure:

```markdown
# テストケース（コードベース）

## 1. 作成対象
## 2. 参照資料
## 3. コードベースで実行するテストケース
## 4. 上流成果物への追記・更新
## 5. カバレッジ確認
## 6. Case Expansion Ledger（ケース展開台帳）
```

### E2E Automated Test Case File

Save E2E automated cases to `テスト成果物/テストケース_E2E自動.md` using this structure:

```markdown
# テストケース（E2E自動）

## 1. 作成対象
## 2. 参照資料
## 3. E2E自動テストで実行するテストケース
## 4. 上流成果物への追記・更新
## 5. カバレッジ確認
## 6. Case Expansion Ledger（ケース展開台帳）
```

### Human-Executed Test Case File

Save human-executed cases to `テスト成果物/テストケース_人間実行.md` using this structure:

```markdown
# テストケース（人間実行）

## 1. 作成対象
## 2. 参照資料
## 3. 人間が実行する必要があるテストケース
## 4. 上流成果物への追記・更新
## 5. カバレッジ確認
## 6. Case Expansion Ledger（ケース展開台帳）
```

Also save the same human-executed cases to `テスト成果物/テストケース_人間実行.csv` for spreadsheet-based execution and recording. Treat the Markdown file as the source of truth and the CSV as a derived companion artifact.

### Question-Wait Test Case File

Save question-wait cases to `テスト成果物/テストケース_質問待ち.md` using this structure:

```markdown
# テストケース（質問待ち）

## 1. 作成対象
## 2. 参照資料
## 3. 質問待ちケース
## 4. 質問一覧
## 5. 回答後の反映方針
## 6. 上流成果物への追記・更新
## 7. カバレッジ確認
## 8. Case Expansion Ledger（ケース展開台帳）
```

Use the same test case table in every file:

```markdown
| テストケースID | 元テスト設計ID | テスト観点ID | テストアプローチID | 実行区分 | テストレベル/タイプ | 優先度 | テストケース名 | 前提条件 | 入力/データ | 手順 | 期待結果 | 確認方法/証跡 | 関連質問ID | 仕様 | リスクID | 状態 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
```

Use this `Case Expansion Ledger` table in each case file or in a common coverage section copied into the case files:

```markdown
| テスト設計ID | 期待TC数 | 実TC数 | 不足数 | 対応テストケースID | 分割方針 | 代表抽出理由 | 集約判定ルール | 状態 |
|---|---|---|---|---|---|---|---|---|
```

Ledger guidance:

- **期待TC数**: Copy or sum from `Expected Case Yield` for the `TDxxx`.
- **実TC数**: Count the concrete `TC-*` rows actually generated across all code-based, E2E, human, and question-wait files.
- **不足数**: Calculate `期待TC数 - 実TC数`. Use `0` when actual count meets or exceeds expected count.
- **対応テストケースID**: List the concrete `TC-*` IDs. If many IDs are listed, use a compact range only when the range is exact and all IDs are present.
- **代表抽出理由** and **集約判定ルール**: Required whenever `実TC数 < 期待TC数` or when one `TC-*` intentionally covers multiple independent source values. State evidence granularity, such as `1つでも失敗ならFail`, when aggregation is used.
- **状態**: Use `充足`, `不足（理由あり）`, `不足（要修正）`, or `質問待ち`.

Do not mark creation complete when any row is `不足（要修正）`. Do not accept "one case exists for every `TDxxx`" as coverage if `実TC数` is below `期待TC数`.

### Human-Executed CSV File

Save human-executed cases to `テスト成果物/テストケース_人間実行.csv` using CSV headers that mirror the Markdown table and add execution-record fields:

```csv
テストケースID,元テスト設計ID,テスト観点ID,テストアプローチID,実行区分,テストレベル/タイプ,優先度,テストケース名,前提条件,入力/データ,手順,期待結果,確認方法/証跡,関連質問ID,仕様,リスクID,状態,実行日,実行者,実行環境,実結果,判定,証跡リンク,備考
```

CSV rules:

- Include only non-question-wait human-executed cases from `テストケース_人間実行.md`.
- Keep `テストケースID` values and all shared columns identical to the Markdown human-executed rows.
- Leave `実行日`, `実行者`, `実行環境`, `実結果`, `判定`, `証跡リンク`, and `備考` blank for testers to fill in.
- Use RFC 4180-style quoting: wrap fields in double quotes when they contain commas, quotes, CR/LF, or leading/trailing spaces; escape inner quotes by doubling them.
- Prefer UTF-8 with BOM when the target users are likely to open the CSV in Excel; otherwise UTF-8 is acceptable.
- Do not put Markdown table pipes or Markdown formatting requirements in the CSV.
- If there are no human-executed cases, still create the CSV with only the header and state that there are no rows.

Column guidance:

- **テストケースID**: Use execution-category prefixes:
  - Code-based: `TC-CB-001`, `TC-CB-002`, ...
  - E2E automated: `TC-E2E-001`, `TC-E2E-002`, ...
  - Human-executed: `TC-MAN-001`, `TC-MAN-002`, ...
- **元テスト設計ID**: Reference one or more `TDxxx`. Every `TDxxx` must appear in at least one test case.
- **テスト観点ID**: Copy the linked `TVxxx`.
- **テストアプローチID**: Copy the linked `TAxxx`.
- **実行区分**: Use exactly `コードベース`, `E2E自動`, or `人間実行`.
- **テストレベル/タイプ**: Copy or normalize the design level/type, such as `Unit`, `Integration`, `E2E`, `Security`, `Performance`, `Compatibility`, `Accessibility`, `Manual`, `Code review`, `Exploratory`, or `Regression`.
- **優先度**: Use `高`, `中`, or `低` from the design unless a split case clearly deserves a different priority.
- **テストケース名**: Name the concrete case in a short phrase. Include the specific value, boundary, role, environment, or condition when it distinguishes the case.
- **前提条件**: State setup, environment, browser, data, account/role, external dependency state, or `なし`. Do not use cross-row shortcuts such as `同上`.
- **入力/データ**: State one concrete executable value, scenario, browser, file, fixture, API argument, database row, dependency response, or condition to use. If multiple values are listed, they must form one inseparable sequence with one aggregate judgment; otherwise split them into separate `TC-*` rows. Do not state only derived internal variables or intermediate states.
- **手順**: State readable execution steps. Do not write automation code. Avoid steps that require the executor to select unspecified values. Include setup steps needed to create any target state.
- **期待結果**: State pass/fail criteria for this one case. If multiple independent observations are needed, split them into separate `TC-*` rows unless this is explicitly an aggregate scenario. Use `要確認` only when the expected result truly depends on unanswered questions.
- **確認方法/証跡**: State evidence such as unit test result, E2E execution log, screenshot, browser output, DevTools Network record, performance measurement, or code review record.
- **関連質問ID**: Link `DQxxx` for question-wait cases. Use `なし` when no related question exists.
- **仕様**: Reference specification sections, feature IDs, README sections, existing tests, or `要確認`.
- **リスクID**: Reference product risk IDs. Use `なし` when no direct risk exists.
- **状態**: Use `作成済み`, `質問待ち`, or `上流更新済み`.

File placement:

- Put `状態=作成済み` or `状態=上流更新済み` code-based cases in `テストケース_コードベース.md`.
- Put `状態=作成済み` or `状態=上流更新済み` E2E automated cases in `テストケース_E2E自動.md`.
- Put `状態=作成済み` or `状態=上流更新済み` human-executed cases in `テストケース_人間実行.md`.
- Put every `状態=質問待ち` case only in `テストケース_質問待ち.md` by default, regardless of planned execution category. Keep the planned `実行区分` and ID prefix so the case can be moved to the appropriate execution file after the question is answered.
- Do not duplicate `質問待ち` rows into the three execution files unless the user explicitly requests duplicate listing.

## Classification Rules

Classify by what should execute or judge the test:

- **コードベースで実行するテストケース**:
  - Use for `Unit`, `Integration`, and `Regression` by default.
  - Include logic, calculations, state transitions, existing test execution, and checks suitable for test code or code-level assertions.
- **E2E自動テストで実行するテストケース**:
  - Use for `E2E` by default.
  - Include browser operations, form input, result rendering, automated console checks, DevTools/Network checks, and Performance API style checks when automatable.
  - Include `Security`, `Performance`, or `Compatibility` cases here when the execution method is browser automation or measurable browser behavior.
- **人間が実行する必要があるテストケース**:
  - Use for `Manual`, `Code review`, `Exploratory`, and automation-hard `Accessibility` by default.
  - Include human judgment, visual readability, exploratory checks, code review, accessibility interpretation, and evidence-format decisions.
- If classification is ambiguous, choose the category most aligned with the design's `実施方法`, and explain the evidence expectation in `確認方法/証跡`.

## Splitting Rules

Use condition-by-condition splitting. Treat splitting as the default whenever independent result reporting would otherwise require subtest labels.

- Split slash-separated, comma-separated, Japanese comma-separated, bullet-enumerated, or range-like inputs into separate test cases when they represent different meaningful values, such as `3,000,000/4,000,000/10,000,000円`, `最小/標準/最大`, `空欄、文字列、非有限値`, `Chrome/Firefox/Safari`, or `800x600/1280x720`.
- Split representative-value sets when each value should have its own Pass/Fail/N/A result in the execution report. For example, `年収3,000,000円`, `年収4,000,000円`, and `年収10,000,000円` should normally become separate `TC-*` rows, even if the same assertion helper or test procedure can be reused.
- Split boundary sets into separate test cases for each boundary class, such as `直前`, `境界`, `直後`, `0`, `1`, `下限`, `下限未満`, `上限`, `上限超`, date/time boundaries, inclusive/exclusive boundaries, and null/empty boundaries.
- Split environment matrices into separate test cases when each environment can pass/fail independently: browser, OS, device, viewport, orientation, locale, timezone, network state, permissions, feature flags, build mode, database state, and external service state.
- Split user/data/API matrices into separate test cases when behavior can differ by role, tenant, plan, account state, data status, API status code, file type, content size, or dependency response.
- Split abnormal-value sets when different values can fail for different reasons, such as empty, null, missing, malformed, non-finite, negative, over-maximum, duplicate, inconsistent, expired, unauthorized, or unsupported values.
- Split cases whenever a later automation implementer would otherwise need a loop, parameter table, or subtest labels to identify which input failed. If a loop is expected in automation, each loop row still needs its own `TC-*` unless the values are only incidental data within one scenario.
- Split cases when one input setup has multiple independent observation points, such as `first and last`, `before and after`, `start and end`, multiple rows in an output, multiple screens, multiple roles, or multiple state transitions. A shared setup does not justify one `TC-*` when the observations can fail independently.
- Split expected results that use phrases like `A and B`, `Xでは...、Yでは...`, `最初と最後`, `開始時と終了時`, or `前後` when each observation can have a different failure cause.
- Keep one test case when the condition is naturally checked as one sequence or one scenario, such as a long-running workflow or one cross-feature integration flow.
- Keep one test case for a multi-step scenario only when the values are part of the same user journey and cannot be judged independently without changing the scenario's meaning.
- When intentionally keeping an aggregate case, state the rationale in `入力/データ` or `期待結果`, such as `互換性マトリクスとして全環境を一括判定し、1環境でも不一致ならFail`. Do not use aggregate cases to hide independent high- or medium-risk conditions.
- Keep `TDxxx` stable. Do not renumber design IDs; create multiple `TC-*` rows that reference the same `TDxxx`.
- Avoid inventing precise values that are not supported. Use source values, design values, README examples, or `要確認`.

## Markdown Table Integrity

Generated tables must remain machine-readable Markdown:

- Keep the same column count for every row in a table.
- Do not place raw `|` inside a table cell. Escape it as `\|`, wrap it in a fenced example outside the table, or rewrite the prose.
- Avoid raw `||`, shell pipes, regex alternation, and TypeScript union syntax inside table cells unless escaped or rewritten.
- Prefer prose such as "`parseFloat(value)` がNaNの場合に0へフォールバックする" over code snippets that contain table delimiters.
- Treat a malformed table as a creation error and fix it before finishing.

## Question-Wait Cases

Handle unanswered design questions without losing coverage:

- Create a test case for each `質問待ち` design row.
- Put the case in `テストケース_質問待ち.md`.
- Keep the planned `実行区分` as `コードベース`, `E2E自動`, or `人間実行` so the destination after answering is clear.
- Set `関連質問ID` to the linked `DQxxx`.
- Set `状態` to `質問待ち`.
- Use `要確認` for the part of the expected result, environment, threshold, or evidence that cannot be decided.
- Do not silently assume stakeholder answers.
- In `## 4. 質問一覧`, include a compact table that maps `DQxxx` to related `TC-*` and `TDxxx` IDs:

```markdown
| 質問ID | 関連テストケースID | 関連テスト設計ID | 質問概要 | 優先度 |
|---|---|---|---|---|
```

- In `## 5. 回答後の反映方針`, state that answered cases should be updated from `質問待ち` to `作成済み` and moved to `テストケース_コードベース.md`, `テストケース_E2E自動.md`, or `テストケース_人間実行.md` according to `実行区分`.

## Upstream Updates

Update upstream artifacts when test case creation discovers:

- A missing test design needed to cover a test viewpoint or risk.
- A missing question needed to make a test case executable.
- A traceability error between `TC-*`, `TDxxx`, `TVxxx`, `TAxxx`, specification references, or risk IDs.
- A significant analysis or plan-level gap that is clear from source material.

When updating:

- Preserve existing file names, section order, ID style, and table style.
- Add new IDs sequentially, such as `TD064`, `DQ018`, `TV064`, `TA019`, or `R012`.
- Record each update under the `上流成果物への追記・更新` section of the affected output file.
- Prefer explicit `要確認` and questionnaire entries over unsupported assumptions.
- Do not edit product specifications, README files, product code, existing tests, or unrelated artifacts unless the user explicitly asks.

## Coverage Requirements

In the `カバレッジ確認` section of each file, include a table that maps relevant `TDxxx` IDs to one or more `TC-*` IDs and its coverage status:

```markdown
| テスト設計ID | 対応テストケースID | 実行区分 | 状態 | 出力ファイル | カバー状況 |
|---|---|---|---|---|---|
```

Before finishing:

- Confirm `Case Expansion Ledger` exists and reconciles every `TDxxx` from `Expected Case Yield`.
- Confirm total and per-`TDxxx` `実TC数` meets `期待TC数`, or any shortfall has a concrete representative extraction rationale, aggregate judgment rule, or `質問待ち`.
- Confirm no row has `不足（要修正）`.
- Confirm every `TDxxx` from the test design appears in the combined coverage across the four files.
- Confirm every `質問待ち` test case has a `DQxxx`.
- Confirm all three execution-category files exist, even if one category has few cases.
- Confirm the question-wait file exists, even if there are no question-wait cases; in that case, state that there are none.
- Confirm the human-executed CSV exists, even if there are no human-executed cases; in that case, include only the header.
- Confirm the human-executed CSV contains the same non-question-wait `TC-MAN-*` rows as `テストケース_人間実行.md`.
- Confirm CSV fields are correctly quoted and the CSV includes blank execution-record fields for human testers.
- Confirm test cases are readable by humans and do not contain automation code.
- Confirm source-supported expected results are concrete, and unsupported expectations are explicitly `要確認`.
- Confirm no `TC-*` row is duplicated across files unless the user explicitly requested duplication.
- Confirm no executable `TC-*` row compresses multiple independently meaningful inputs, boundaries, abnormal values, browsers, environments, roles, API statuses, file types, data states, or scenarios into one row without an explicit aggregate-judgment rationale.
- Confirm no executable `TC-*` row contains unresolved executor-choice words such as `など`, `付近`, `適切`, `任意`, `複数`, `各`, `代表`, `正常値`, or `異常値` unless the row also gives concrete values or is marked `要確認`.
- Confirm no executable `TC-*` row uses cross-row shortcuts such as `同上`, `前述と同じ`, `同条件`, or `同様`.
- Confirm no executable `TC-*` row relies only on internal/derived state instead of executable input or setup.
- Confirm no executable `TC-*` row contains multiple independent observation points in the expected result without an aggregate-judgment rationale.
- Confirm every Markdown table row has the same number of cells as its header and no unescaped `|` breaks the table.
