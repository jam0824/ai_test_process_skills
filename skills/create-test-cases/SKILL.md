---
name: create-test-cases
description: Create Japanese Markdown test case tables from test design artifacts, design questionnaires, test analysis, test plans, specifications, README files, existing tests, and implementation notes. Use when Codex needs to expand each TDxxx design pattern into traceable human-readable test cases, split cases by execution category such as code-based tests, E2E automated tests, and human-executed tests, and preserve coverage from test design to test cases.
---

# Create Test Cases

## Overview

Create Markdown test cases that answer "what exactly should be executed or checked?" from a test design document. Keep the output human-readable and implementation-neutral: write test case tables, not automation code or detailed test result logs.

Default to Japanese output. Preserve traceability from each test case back to the originating test design, test viewpoint, test approach, specification, product risk, and related question when applicable.

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
5. Expand every `TDxxx` into at least one test case. Split the design into multiple cases when its condition/input contains multiple representative values, boundary values, abnormal values, browser targets, scenarios, or question-wait conditions.
6. Classify each test case into one execution category: code-based, E2E automated, or human-executed.
7. Keep `質問待ち` designs as test cases. Set `状態` to `質問待ち`, set `期待結果` to `要確認` where needed, and link the relevant `DQxxx`.
8. If test case creation reveals a missing design, missing question, missing viewpoint, or plan-level gap, update the appropriate upstream artifact when supported by source material. Record all changes in the test case document.
9. Save the test case document. If the user does not specify a path, save it next to the design as `テストケース.md`.

## Output: Test Cases

Use this Markdown structure:

```markdown
# テストケース

## 1. 作成対象
## 2. 参照資料
## 3. コードベースで実行するテストケース
## 4. E2E自動テストで実行するテストケース
## 5. 人間が実行する必要があるテストケース
## 6. 質問待ちケース
## 7. 上流成果物への追記・更新
## 8. カバレッジ確認
```

Each test case section must use this table:

```markdown
| テストケースID | 元テスト設計ID | テスト観点ID | テストアプローチID | 実行区分 | テストレベル/タイプ | 優先度 | テストケース名 | 前提条件 | 入力/データ | 手順 | 期待結果 | 確認方法/証跡 | 関連質問ID | 仕様 | リスクID | 状態 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
```

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
- **テストケース名**: Name the concrete case in a short phrase.
- **前提条件**: State setup, environment, browser, data, or `なし`.
- **入力/データ**: State the concrete values, scenario, browser, file, or condition to use.
- **手順**: State readable execution steps. Do not write automation code.
- **期待結果**: State pass/fail criteria. Use `要確認` only when the expected result truly depends on unanswered questions.
- **確認方法/証跡**: State evidence such as unit test result, E2E execution log, screenshot, browser output, DevTools Network record, performance measurement, or code review record.
- **関連質問ID**: Link `DQxxx` for question-wait cases. Use `なし` when no related question exists.
- **仕様**: Reference specification sections, feature IDs, README sections, existing tests, or `要確認`.
- **リスクID**: Reference product risk IDs. Use `なし` when no direct risk exists.
- **状態**: Use `作成済み`, `質問待ち`, or `上流更新済み`.

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

Use condition-by-condition splitting:

- Split comma-separated or enumerated inputs into separate test cases when they represent different meaningful values, such as `300万円`, `600万円`, and `1000万円`.
- Split boundary sets when each value may expose a different defect, such as `0%`, `100%`, `100%超`, age boundaries, browser names, or scenario names.
- Keep one test case when the condition is naturally checked as one sequence or one scenario, such as a long-term simulation or one cross-feature integration flow.
- Keep `TDxxx` stable. Do not renumber design IDs; create multiple `TC-*` rows that reference the same `TDxxx`.
- Avoid inventing precise values that are not supported. Use source values, design values, README examples, or `要確認`.

## Question-Wait Cases

Handle unanswered design questions without losing coverage:

- Create a test case for each `質問待ち` design row.
- Put the case in the most appropriate execution category and also list it under `## 6. 質問待ちケース`.
- Set `関連質問ID` to the linked `DQxxx`.
- Set `状態` to `質問待ち`.
- Use `要確認` for the part of the expected result, environment, threshold, or evidence that cannot be decided.
- Do not silently assume stakeholder answers.

## Upstream Updates

Update upstream artifacts when test case creation discovers:

- A missing test design needed to cover a test viewpoint or risk.
- A missing question needed to make a test case executable.
- A traceability error between `TC-*`, `TDxxx`, `TVxxx`, `TAxxx`, specification references, or risk IDs.
- A significant analysis or plan-level gap that is clear from source material.

When updating:

- Preserve existing file names, section order, ID style, and table style.
- Add new IDs sequentially, such as `TD064`, `DQ018`, `TV064`, `TA019`, or `R012`.
- Record each update under `## 7. 上流成果物への追記・更新`.
- Prefer explicit `要確認` and questionnaire entries over unsupported assumptions.
- Do not edit product specifications, README files, product code, existing tests, or unrelated artifacts unless the user explicitly asks.

## Coverage Requirements

In `## 8. カバレッジ確認`, include a table that maps each `TDxxx` to one or more `TC-*` IDs and its coverage status:

```markdown
| テスト設計ID | 対応テストケースID | 実行区分 | 状態 | カバー状況 |
|---|---|---|---|---|
```

Before finishing:

- Confirm every `TDxxx` from the test design appears in the coverage table.
- Confirm every `質問待ち` test case has a `DQxxx`.
- Confirm all three execution categories exist, even if one category has few cases.
- Confirm test cases are readable by humans and do not contain automation code.
- Confirm source-supported expected results are concrete, and unsupported expectations are explicitly `要確認`.
