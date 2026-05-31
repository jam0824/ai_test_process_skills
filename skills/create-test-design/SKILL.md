---
name: create-test-design
description: Create Japanese Markdown test design artifacts from test analysis viewpoints, questionnaires, test plans, specifications, README files, existing tests, and implementation notes. Use when Codex needs to derive traceable detailed test designs (テスト設計), test patterns, conditions, execution methods, expected-result judgment points, and a Markdown questionnaire for unknowns from テスト分析.
---

# Create Test Design

## Overview

Create a test design document that answers "how should each test viewpoint be tested?" at the design-pattern level. Keep the output more concrete than test analysis, but do not turn it into low-level execution logs or fully scripted test cases unless the user explicitly asks.

Default to Japanese output. Preserve traceability from each test design back to the originating test viewpoint, test approach, specification, and product risk.

## Workflow

1. Locate the test analysis. If not specified, prefer `テスト成果物/テスト分析.md` or similarly named Markdown files.
2. Locate the related analysis questionnaire. If not specified, prefer `テスト成果物/テスト分析_質問票.md`.
3. Locate the test plan. If not specified, prefer `テスト成果物/テスト計画書.md`.
4. Gather source material in this order:
   - User-provided design instructions, constraints, and target artifacts.
   - Test analysis, especially every `TVxxx` viewpoint and its traceability.
   - Test analysis questionnaire, especially unresolved questions that affect design.
   - Test plan, especially `TAxxx` approaches, product risks, scope, and exit criteria.
   - Product specifications such as `spec/`, `docs/`, files named `仕様書`, requirement IDs, or feature lists.
   - README and user-facing documentation.
   - Existing tests and implementation files only when they clarify testability, inputs, outputs, or missing design detail.
5. Extract every test viewpoint ID from the analysis, such as `TV001`, `TV002`, and its approach ID, category, viewpoint, specification reference, risk ID, and notes.
6. Create one or more test designs for every viewpoint. Split high-risk, boundary, abnormal, calculation, security, performance, compatibility, and accessibility viewpoints into multiple design rows when one row would hide important patterns.
7. If a design depends on unanswered information, keep the design row, set `状態` to `質問待ち`, mark unclear fields as `要確認`, and add a linked question to the design questionnaire.
8. If design reveals a missing analysis viewpoint, product risk, or test approach, update upstream artifacts directly when supported by source material. Record all changes in the design document.
9. Save the test design document and questionnaire. If the user does not specify paths, save them next to the analysis as `テスト設計.md` and `テスト設計_質問票.md`.

## Output: Test Design

Use this Markdown structure:

```markdown
# テスト設計

## 1. 設計対象
## 2. 参照資料
## 3. テスト設計
## 4. 質問待ち項目
## 5. 上流成果物への追記・更新
## 6. カバレッジ確認
```

The `## 3. テスト設計` section must be grouped by `テストレベル/タイプ`. Use headings such as `### 3.1 Unit` and repeat this traceability table in each group:

```markdown
| テスト設計ID | テスト観点ID | テストアプローチID | テストレベル/タイプ | 優先度 | テストパターン | 条件/入力 | 実施方法 | 期待結果/判定観点 | 仕様 | リスクID | 状態 |
|---|---|---|---|---|---|---|---|---|---|---|---|
```

Column guidance:

- **テスト設計ID**: Use stable IDs such as `TD001`, `TD002`, `TD003`. Keep IDs unique and sequential.
- **テスト観点ID**: Reference the originating `TVxxx`. Every `TVxxx` from the analysis must appear at least once.
- **テストアプローチID**: Reference the originating `TAxxx`. Use the value from the analysis unless an upstream update is made.
- **テストレベル/タイプ**: Use values such as `Unit`, `Integration`, `E2E`, `Security`, `Performance`, `Compatibility`, `Accessibility`, `Manual`, `Code review`, `Exploratory`, or `Regression`. Treat `Unit` and `Integration` as test levels, and security, performance, compatibility, accessibility, manual, code review, exploratory, and regression as test types or focus areas.
- **優先度**: Use `高`, `中`, or `低`. Prioritize by product risk, user impact, defect likelihood, and execution value.
- **テストパターン**: Name the design pattern concisely, such as representative value, boundary value, invalid input, browser comparison, random fixed condition, or code review.
- **条件/入力**: State concrete input conditions, data combinations, environment conditions, or `要確認`.
- **実施方法**: State how to test, such as automated unit test, existing test extension, browser E2E, manual browser check, DevTools network check, performance measurement, or code review.
- **期待結果/判定観点**: State the pass/fail judgment point. If the expected value or threshold is unknown, use `要確認` and link a question.
- **仕様**: Reference specification sections, feature IDs, README sections, existing tests, or `要確認`.
- **リスクID**: Reference product risk IDs. Use `なし` when no direct risk exists.
- **状態**: Use `設計済み`, `質問待ち`, or `上流更新済み` as the base values.

## Test Design Guidance

Derive design rows using these patterns as applicable:

- **Representative values**: Typical user scenarios, README examples, default values, common ranges.
- **Boundary values**: Minimum, maximum, zero, empty, threshold transitions, age boundaries, percentage boundaries, tax brackets.
- **Abnormal values**: Negative, blank, non-numeric, decimal where integers are expected, too large, inconsistent ranges, impossible combinations.
- **State and sequence**: Add/delete/update flows, repeated execution, before/after actions, cross-period carryover.
- **Calculation detail**: Formula inputs, rounding, ordering, tax handling, totals, precision, and expected-value source.
- **Integration behavior**: Cross-feature combinations, random event plus investment withdrawal, UI input to result output.
- **Compatibility**: Browser differences, device or viewport conditions, `file://` execution, locale/currency formatting.
- **Usability/accessibility**: Keyboard operation, focus, labels, readability, scrollability, warning visibility.
- **Security/privacy**: XSS/input interpretation, dynamic HTML generation, external communication, local-only behavior.
- **Performance/reliability**: Runtime, rendering volume, repeated execution, memory growth, long-running simulations.
- **Exploratory**: High-risk combinations, ambiguous requirements, user misunderstanding, overtrust, surprising outputs.

Keep each design row actionable enough for later test case creation. Do not over-specify exact click-by-click procedures unless the source material already defines them or the user explicitly asks.

## Upstream Updates

Update upstream artifacts when test design discovers:

- A missing test viewpoint needed to cover a test approach or product risk.
- A missing product risk or missing test approach that is important enough to track at plan level.
- A traceability error between `TDxxx`, `TVxxx`, `TAxxx`, specification references, or risk IDs.
- A question that invalidates an existing analysis or plan statement unless clarified.

When updating:

- Preserve existing file names, section order, ID style, and table style.
- Add new IDs sequentially, such as `TV064`, `TA019`, or `R012`.
- Record each update under `## 5. 上流成果物への追記・更新`.
- Prefer explicit `要確認` and questionnaire entries over unsupported assumptions.
- Do not edit product specifications, README files, product code, or unrelated artifacts unless the user explicitly asks.

## Output: Questionnaire

Save questions as Markdown with this structure:

```markdown
# テスト設計 質問票

## 1. 質問一覧
| 質問ID | 関連テスト設計ID | 関連テスト観点ID | 関連テストアプローチID | 質問 | 回答が必要な理由 | 回答者候補 | 優先度 |
|---|---|---|---|---|---|---|---|
```

Question guidance:

- Ask only questions that affect test design, expected results, input patterns, execution method, environment, evidence, automation feasibility, or upstream artifact updates.
- Carry forward unresolved analysis questions when they still block test design, and link them to the affected `TDxxx`.
- Use concrete questions about expected values, rounding tolerance, target browsers, performance measurement method, randomness control, accessibility criteria, evidence format, and acceptable behavior for ambiguous edge cases.
- Use priorities `高`, `中`, and `低`.
- If there are no questions, still save the questionnaire and state `現時点で質問はありません。`

## Coverage Requirements

- Confirm every `TVxxx` from the test analysis appears in the design table.
- Confirm every `TAxxx` from the test plan remains covered through at least one `TDxxx`.
- Confirm every high-risk product risk has enough design depth to support later test case creation.
- Confirm all `質問待ち` rows have linked questionnaire entries.
- Confirm all upstream updates are actually applied and documented.

## Quality Checklist

Before finishing:

- Confirm the design document and questionnaire are saved at the requested or default paths.
- Confirm `## 3. テスト設計` is grouped by `テストレベル/タイプ`, and each group repeats the table header.
- Confirm each design row has `TDxxx`, `TVxxx`, `TAxxx`, test level/type, priority, condition/input, execution method, expected-result judgment, specification reference, risk ID or `なし`, and status.
- Confirm the design is detailed enough to become test cases, but is not merely a test execution log.
- Confirm unsupported details are marked `要確認` rather than invented.
- Confirm the questionnaire only contains questions that materially affect design or execution.
- Confirm traceability from `TDxxx` to `TVxxx`, `TAxxx`, specification, and `Rxxx` is clear.
