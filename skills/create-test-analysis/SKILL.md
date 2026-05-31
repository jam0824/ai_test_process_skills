---
name: create-test-analysis
description: Create Japanese Markdown test analysis artifacts from a test plan, specifications, README files, existing tests, and implementation notes. Use when Codex needs to derive traceable test viewpoints (テスト観点), cover every test approach from a test plan, identify normal, abnormal, boundary, compatibility, usability, security, performance, and exploratory concerns, update the test plan when new risks or approaches should be added, and save a Markdown questionnaire for open questions.
---

# Create Test Analysis

## Overview

Create a test analysis document that answers "what should be tested?" at the viewpoint level. Keep the output more detailed than a test plan but less concrete than test cases; do not write step-by-step procedures or expected results unless the user explicitly asks.

Default to Japanese output. Preserve traceability from each analysis viewpoint back to the originating test approach, specification, and risk.

## Workflow

1. Locate the test plan. If not specified, prefer `テスト成果物/テスト計画書.md` or similarly named Markdown files.
2. Gather source material in this order:
   - User-provided analysis instructions.
   - Test plan, especially product risks and test approaches.
   - Product specifications such as `spec/`, `docs/`, files named `仕様書`, requirement IDs, or feature lists.
   - README and user-facing documentation.
   - Existing tests and implementation files only when they clarify behavior or missing viewpoints.
3. Extract every test approach ID from the test plan, such as `TA001`, `TA002`, and its content, specification reference, and risk ID.
4. Derive test viewpoints that cover all test approaches. Add additional viewpoints for normal, abnormal, boundary, compatibility, default value, usability, security, performance, data, state, timing, randomness, and exploratory concerns when relevant.
5. If analysis reveals a missing product risk or missing test approach that belongs in the test plan, update the test plan directly and record the change in the analysis document.
6. If information is unclear or should be asked of stakeholders, save it in a Markdown questionnaire.
7. Save the test analysis document and questionnaire. If the user does not specify paths, save them next to the test plan as `テスト分析.md` and `テスト分析_質問票.md`.

## Test Viewpoint Guidance

For each test approach, derive viewpoints from these categories as applicable:

- **Normal behavior**: Typical user inputs, standard scenarios, expected flows, documented examples.
- **Default values**: Initial values, default selections, initial display, default output, no-input behavior.
- **Boundary values**: Min/max values, zero, empty, same-age boundaries, age or date transition points, tax brackets, percentages 0% and 100%.
- **Abnormal values**: Invalid, missing, negative, too large, decimal, non-numeric, inconsistent combinations, impossible ranges.
- **State transitions**: Before/after actions, add/delete flows, repeated execution, reset-like behavior, data not persisting.
- **Data and calculation**: Formulas, rounding, ordering, totals, tax handling, random event effects, precision.
- **Compatibility**: Browsers, devices, screen sizes, locales, file execution mode, JavaScript availability.
- **Usability/accessibility**: Keyboard operation, focus order, readable output, scrollability, labels, operability at supported resolution.
- **Security/privacy**: Input sanitization, XSS, external communication, external dependencies, local-only behavior.
- **Performance/reliability**: Response time, large output, repeated runs, random behavior reproducibility, long simulations.
- **Exploratory concerns**: Combinations likely to surprise users, ambiguous requirements, high-risk workflows, overtrust or misunderstanding.

## Output: Test Analysis

Use this Markdown structure:

```markdown
# テスト分析

## 1. 分析対象
## 2. 参照資料
## 3. テスト観点
## 4. テスト計画への追記・更新
## 5. カバレッジ確認
## 6. 未決事項
```

The `## 3. テスト観点` section must use a traceability table:

```markdown
| テスト観点ID | テストアプローチID | 観点カテゴリ | テスト観点 | 仕様 | リスクID | 備考 |
|---|---|---|---|---|---|---|
```

Column guidance:

- **テスト観点ID**: Use stable IDs such as `TV001`, `TV002`, `TV003`. Keep IDs unique and sequential.
- **テストアプローチID**: Use the originating test approach ID. If a viewpoint is newly discovered outside the plan, use `追加候補` and add a corresponding test plan update when warranted.
- **観点カテゴリ**: Use categories such as 正常系, デフォルト値, 境界値, 異常系, 状態遷移, 計算, 互換性, ユーザビリティ, アクセシビリティ, セキュリティ, 性能, 探索的.
- **テスト観点**: State what should be tested in one concise sentence. Do not include detailed test steps.
- **仕様**: Reference specification sections, feature IDs, README sections, or `要確認`.
- **リスクID**: Reference product risk IDs. Use `なし` when no direct risk exists.
- **備考**: Add short notes such as `質問票あり`, `計画追記済み`, or key constraints.

Coverage requirements:

- Every test approach in the test plan must have at least one test viewpoint.
- High-risk approaches should usually have multiple viewpoints across normal, boundary, abnormal, and interaction concerns.
- Include default value and compatibility viewpoints when the product has UI inputs or browser/device constraints.
- Include questions instead of silently deciding unknown business rules, target environments, owners, thresholds, or acceptance criteria.

## Updating The Test Plan

Update the test plan when analysis discovers:

- A product risk that is important enough to track at plan level.
- A test approach needed to cover a significant category not represented in the plan.
- A traceability issue where an existing approach has the wrong specification reference or risk ID.
- An exit condition or scope statement that conflicts with the analysis.

When updating:

- Preserve the existing style, IDs, and section order.
- Add new risk IDs or approach IDs sequentially.
- Record each change under `## 4. テスト計画への追記・更新`.
- Do not add unsupported details. Use `要確認` and the questionnaire when stakeholder input is needed.

## Output: Questionnaire

Save questions as Markdown with this structure:

```markdown
# テスト分析 質問票

## 1. 質問一覧
| 質問ID | 関連テスト観点ID | 関連テストアプローチID | 質問 | 回答が必要な理由 | 回答者候補 | 優先度 |
|---|---|---|---|---|---|---|
```

Question guidance:

- Ask only questions that affect analysis, test design, acceptance criteria, execution feasibility, or plan updates.
- Prefer concrete questions such as supported browser versions, performance measurement method, default value rationale, acceptable rounding tolerance, random behavior reproducibility, and formal regression asset status.
- Use priorities `高`, `中`, `低`.
- If there are no questions, still save the questionnaire and state `現時点で質問はありません。`

## Quality Checklist

Before finishing:

- Confirm all test approach IDs from the test plan appear in the analysis coverage.
- Confirm each test viewpoint has a viewpoint ID, approach traceability, specification reference, and risk ID or `なし`.
- Confirm normal, boundary, abnormal, default value, compatibility, security/privacy, performance, and exploratory concerns are considered when relevant.
- Confirm any test plan updates are actually applied and documented.
- Confirm open questions are saved in a questionnaire Markdown file.
- Confirm the analysis stays at viewpoint level and does not become detailed test cases.
