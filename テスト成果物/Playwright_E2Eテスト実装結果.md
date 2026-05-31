# Playwright E2Eテスト実装結果

## 1. 実装対象

- 対象: `sample_app/retirement_simulator.html`
- 入力テストケース: `テスト成果物/テストケース_E2E自動.md`
- 実装先: `tests/e2e/retirement_simulator.e2e.spec.js`
- Playwright構成: `playwright.config.js`

## 2. 実装内容

| 区分 | 内容 |
|---|---|
| Playwright最小構成 | `package.json`、`playwright.config.js` を追加 |
| E2E spec | `TC-E2E-001`〜`TC-E2E-003`、`TC-E2E-008`〜`TC-E2E-021`、`TC-E2E-027`〜`TC-E2E-033`、`TC-E2E-036`〜`TC-E2E-055`、`TC-E2E-061`〜`TC-E2E-063`、`TC-E2E-065`〜`TC-E2E-069`、`TC-E2E-080`〜`TC-E2E-082` を実装 |
| 未実装分離 | 質問待ち・要確認・正式ブラウザ/性能閾値未確定のケースを `テスト成果物/未実装テストケース_E2E自動.md` に分離 |
| トレーサビリティ | 各 `test()` 名に `TC-E2E-*` と日本語意図を含め、直近コメントに `TD`、`TV`、`TA`、`Risk`、`Spec` を記録 |

## 3. 実行方法

依存関係は自動インストールしていない。初回実行時は以下を実行する。

```powershell
npm install
npx playwright install
npm run test:e2e
```

別の対象HTMLやURLを指定する場合は `E2E_TARGET` を使う。

```powershell
$env:E2E_TARGET = "D:\codes\RetirementSimulatorWithAITest\sample_app\retirement_simulator.html"
npm run test:e2e
```

## 4. 未実装ケース

未実装ケースは `テスト成果物/未実装テストケース_E2E自動.md` に記録した。主な理由は以下。

| 理由 | 対象例 |
|---|---|
| 年齢順序や給与変更重複の仕様が未確定 | `TC-E2E-004`〜`TC-E2E-007`、`TC-E2E-022`〜`TC-E2E-026` |
| 乱数固定・分布検証方法が未確定 | `TC-E2E-034`、`TC-E2E-035` |
| XSS・DOM改ざんの期待結果と脅威モデルが未確定 | `TC-E2E-056`〜`TC-E2E-058` |
| 性能閾値・メモリ測定方法が未確定 | `TC-E2E-059`、`TC-E2E-060`、`TC-E2E-064` |
| 正式な対象ブラウザ、バージョン、viewportが未確定 | `TC-E2E-070`〜`TC-E2E-079` |

## 5. 確認結果

| 確認 | 結果 |
|---|---|
| JavaScript構文確認 | `node --check tests\e2e\retirement_simulator.e2e.spec.js` 成功 |
| Playwright設定構文確認 | `node --check playwright.config.js` 成功 |
| `package.json` JSON確認 | `JSON.parse` 成功 |
| Playwright実行 | 未実施。依存関係未インストールのため |

## 6. 補足

- `TC-E2E-010` はテストケースの期待どおり「開始年齢101歳でも結果表示される」ことを検証するため、現在実装が空出力になる場合はFailする想定。
- `TC-E2E-065`〜`TC-E2E-069`、`TC-E2E-080`〜`TC-E2E-082` は現在のPlaywright構成のChromium上で実装した。正式なマルチブラウザ確認は `DQ010`、`DQ011` の回答後に追加する。
