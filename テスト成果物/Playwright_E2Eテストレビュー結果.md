# Playwright E2Eテストレビュー結果

## 1. レビュー対象

- Playwrightテスト: `tests/e2e/retirement_simulator.e2e.spec.js`
- Playwright設定: `playwright.config.js`
- 実装結果: `テスト成果物/Playwright_E2Eテスト実装結果.md`
- 未実装一覧: `テスト成果物/未実装テストケース_E2E自動.md`
- 入力テストケース: `テスト成果物/テストケース_E2E自動.md`
- 対象ページ: `sample_app/retirement_simulator.html`
- レビュー結果: `テスト成果物/Playwright_E2Eテストレビュー結果.md`

## 2. 参照資料

- `spec/仕様書.md`
- `sample_app/retirement_simulator.html`
- `テスト成果物/テストケース_E2E自動.md`
- `テスト成果物/テスト設計.md`
- `package.json`
- `playwright.config.js`

## 3. レビュー観点

- E2E対象HTMLを正しく `file://` で開いているか。
- 全 `TC-E2E-*` の実装と未実装管理。
- テスト名とコメントの `TC`、`TD`、`TV`、`TA`、`Risk`、`Spec` トレーサビリティ。
- 乱数、性能、ネットワーク、ストレージ、ブラウザ差異の安定性。
- Playwrightらしい `locator` / `expect` / browser project 利用。
- 失敗時に原因が追える診断と証跡が残るか。

## 4. レビュー・修正サマリー

### 1回目レビュー

| 優先度 | 観点 | 問題 | 場所 | 影響 | 修正方針 |
|---|---|---|---|---|---|
| P2 | 失敗診断/実行時間 | 静的属性確認で `toHaveAttribute` の5秒待ちが入り、仕様不一致のFailが遅くなる | `TC-E2E-009`, `TC-E2E-010` | 失敗内容は正しいが、レビューと実行記録が冗長になる | `getAttribute()` で即時取得して `expect(...).toBe(...)` に変更 |

対応:

- `tests/e2e/retirement_simulator.e2e.spec.js` の `TC-E2E-009` と `TC-E2E-010` を修正した。

### 2回目レビュー

`P0` / `P1` のテスト実装上の問題はなし。失敗している3ケースは対象実装の仕様不一致として妥当で、各ブラウザのスクリーンショット、video、traceがPlaywright出力に保存されている。

## 5. 最終レビュー結果

`P0` / `P1` の修正すべきPlaywrightテスト指摘は残っていない。

実装状況:

- 実装済みE2Eケース: 19件。
- 未実装E2Eケース: 0件。
- 非Chromiumでの性能/viewportケースは意図的skipであり、ブラウザ展開後のSkipとして記録する。

## 6. 実行結果

| 実行タイミング | コマンド | 結果 | Browser展開後Pass | Browser展開後Fail | Browser展開後Skip | 備考 |
|---|---|---|---:|---:|---:|---|
| レビュー前 | `npm run test:e2e` | Fail | 40 | 9 | 8 | 初回実行 |
| レビュー後 | `npm run test:e2e` | Fail | 40 | 9 | 8 | 診断改善後。Fail対象は同一 |

失敗中のテストケース:

- `TC-E2E-009`: `eventProb.max` が `100` ではなく未設定。
- `TC-E2E-010`: 給与変更年齢の `min` が `1` ではなく `0`。
- `TC-E2E-011`: 金融/投資/税務助言ではないこと、制度差・個人差確認の表示が不足。

## 7. 残課題

| 優先度 | 内容 | 推奨対応 |
|---|---|---|
| P2 | 3件のFailは対象実装側の仕様不一致として残る | E2E実行記録と最終レポートにFailとして掲載する |
