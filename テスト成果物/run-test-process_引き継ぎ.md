# run-test-process 引き継ぎ

## 目的
仕様書 v1.3 を正として、老後資金シミュレーターのQA成果物、テスト実装、実行記録、HTMLレポートを作成する。

## 対象
- 仕様: `spec/仕様書.md`
- 対象コード: `sample_app/retirement_simulator.html`
- 参照README: `sample_app/README.md`
- 成果物フォルダ: `テスト成果物/`

## 現在の状態
- Planフェーズ完了。
- Analysisフェーズ完了。
- Designフェーズ完了。
- 次は Cases and implementation gate フェーズ: split test case files、CSV、横断レビュー、Implementation Entry Gateを作成する。

## 重要な制約
- 仕様書、README、プロダクトコードは編集しない。
- 依存やブラウザが不足しても、ユーザー承認なしにインストールしない。
- 人間実行テストは自動実行しない。
- `sample_app/test_retirement_simulator.html` は仕様上正式資産だが未存在のため、欠落として記録する。

## 次フェーズ完了条件
- `テストケース_コードベース.md`、`テストケース_E2E自動.md`、`テストケース_人間実行.md`、`テストケース_質問待ち.md`、`テストケース_人間実行.csv` がある。
- `Case Expansion Ledger` が全 `TD001-TD027` を期待TC数27/実TC数27で充足している。
- `テスト成果物横断レビュー結果.md` の Implementation Entry Gate が実装開始可になっている。
