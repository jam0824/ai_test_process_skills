# e2e_発見issue一覧

| Bug ID | 要約 | 優先度 | どこで何がどうなったか | 期待結果 | トレーサビリティ | 発見日時 | 関連実行済みテストケース | 関連Playwrightプロジェクト |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| E2E-BUG-001 | TC-E2E-012 金融助言ではない旨の必須表示 がFail | P1 | `sample_app/retirement_simulator.html` の画面本文に、期待される「金融助言」または「税務助言」ではない旨の表示が見つからない。Playwrightの `chromium`, `firefox`, `webkit` すべてで同一Fail。 | 金融助言または税務助言ではない旨と実制度や個人差の別途確認が画面上に表示される。 | TC-E2E-012 / 元テスト設計ID: TD034 / テスト観点ID: TV031 / テストアプローチID: TA009 / 仕様: 仕様3.1.4, 11.1 / リスクID: R009 | 20260531222735 | テスト成果物\report\20260531222735_e2e自動テスト\20260531222735_テストケース_E2E自動_実行済み.md | chromium:Fail(failed), firefox:Fail(failed), webkit:Fail(failed) |
