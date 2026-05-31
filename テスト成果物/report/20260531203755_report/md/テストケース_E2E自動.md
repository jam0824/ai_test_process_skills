# テストケース（E2E自動）

## 1. 作成対象
`sample_app/retirement_simulator.html` をPlaywrightで開くE2E自動テスト。

## 2. 参照資料
- `テスト成果物/テスト設計.md`
- `spec/仕様書.md`
- `sample_app/retirement_simulator.html`
- `playwright.config.js`

## 3. E2E自動テストで実行するテストケース
| テストケースID | 元テスト設計ID | テスト観点ID | テストアプローチID | 実行区分 | テストレベル/タイプ | 優先度 | テストケース名 | 前提条件 | 入力/データ | 手順 | 期待結果 | 確認方法/証跡 | 関連質問ID | 仕様 | リスクID | 状態 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-E2E-001 | TD018 | TV004 | TA004 | E2E自動 | E2E | 中 | デフォルト実行の表示丸めと桁区切り | Playwrightで対象HTMLを開ける | デフォルト入力値 | 開始ボタンをクリックし出力テキストを読む | 給与と生活費と資産行が整数円かつ桁区切りで表示される | Playwright JSON、スクリーンショットは失敗時 | なし | 3.1.3 | R001 | 作成済み |
| TC-E2E-002 | TD019 | TV015 | TA004 | E2E自動 | E2E | 高 | UI初期値と属性 | Playwrightで対象HTMLを開ける | 初期表示 | 主要入力のvalue、min、max、stepを取得する | 仕様表に一致し、給与変更年齢入力はmin=1かつmax=100 | Playwright JSON | なし | 3.1.2 | R004、R006 | 作成済み |
| TC-E2E-003 | TD020 | TV016 | TA004 | E2E自動 | E2E | 高 | デフォルト実行でNaNとInfinityが出ない | Playwrightで対象HTMLを開ける | デフォルト入力値 | 開始ボタンをクリックし出力全体を読む | 30歳1月が表示され、`NaN` と `Infinity` が含まれない | Playwright JSON | なし | F006、7.2 | R006 | 作成済み |
| TC-E2E-004 | TD021 | TV006 | TA004 | E2E自動 | E2E | 高 | 退職後収入期間の表示 | Playwrightで対象HTMLを開ける | retirementAge=65、pensionStartAge=67、gapIncome=5000、eventProb=0 | 値を入力し開始ボタンをクリックする | 65歳1月に退職後収入5000円が表示される | Playwright JSON | なし | 2.2 F002 | R002 | 作成済み |
| TC-E2E-005 | TD022 | TV017 | TA004 | E2E自動 | E2E | 高 | 単一給与変更UI反映 | Playwrightで対象HTMLを開ける | 給与変更35歳4000000円 | 給与変更エリアを表示し1件追加して開始する | 35歳1月に年収4000000円が表示される | Playwright JSON | なし | F008 | R004 | 作成済み |
| TC-E2E-006 | TD023 | TV017 | TA004 | E2E自動 | E2E | 高 | 同一年齢給与変更UIは最後を優先 | Playwrightで対象HTMLを開ける | 35歳4000000円を追加後に35歳5000000円を追加 | 2件の給与変更を追加して開始する | 35歳1月に年収5000000円が表示される | Playwright JSON | なし | F008 | R004 | 作成済み |
| TC-E2E-007 | TD024 | TV018 | TA005 | E2E自動 | Security | 高 | 外部通信なし | Playwrightで対象HTMLを開ける | デフォルト入力値 | ページ表示から開始クリックまでリクエストを監視する | ローカルHTML以外のHTTP(S)リクエストが発生しない | Playwright JSON | なし | 8.1 | R007 | 作成済み |
| TC-E2E-008 | TD025 | TV019 | TA005 | E2E自動 | Security | 高 | 結果表示はHTMLを実行しない | Playwrightで対象HTMLを開ける | salary入力へDOM経由でHTML断片相当の文字列を設定 | 開始ボタンをクリックしDOMを調べる | 結果エリアにscript要素が作られず、HTML断片が実行されない | Playwright JSON | なし | 3.1.3、8.2 | R007 | 作成済み |
| TC-E2E-009 | TD026 | TV020 | TA006 | E2E自動 | Performance | 中 | 標準条件の描画性能 | PlaywrightのChromium相当で実行できる | デフォルト入力値、eventProb=0 | ウォームアップ後に10回開始し所要時間を測定する | 95パーセンタイルが200ms以下 | Playwright JSON | なし | 6.2 | R008 | 作成済み |
| TC-E2E-010 | TD027 | TV021 | TA006 | E2E自動 | E2E | 中 | 連続実行で出力を置換 | Playwrightで対象HTMLを開ける | 1回目salary=3000000、2回目salary=4000000 | 2回開始し出力の先頭と件数を比較する | 2回目の結果は置換され、重複追記や例外がない | Playwright JSON | なし | 6.2 | R008 | 作成済み |
| TC-E2E-011 | TD028 | TV022 | TA007 | E2E自動 | Compatibility | 中 | 代表ブラウザで主要フロー | Playwright configの各プロジェクトで実行する | デフォルト入力値 | 開始ボタンをクリックし結果表示を確認する | 各代表プロジェクトで結果が表示される。1プロジェクトでも失敗すればFail | Playwright JSON | なし | 7.3 | R009 | 作成済み |
| TC-E2E-012 | TD029 | TV023 | TA007 | E2E自動 | Accessibility | 中 | キーボードで給与変更を操作 | Playwrightで対象HTMLを開ける | キーボード操作のみ | TabとEnterで給与変更表示、追加、開始を行う | マウスなしで主要操作ができる | Playwright JSON | なし | 9.4 | R009 | 作成済み |
| TC-E2E-013 | TD030 | TV025 | TA009 | E2E自動 | E2E | 中 | 必須注意表示の文言 | Playwrightで対象HTMLを開ける | 初期表示 | bodyテキストを読む | プライバシー、金融助言ではない、税務助言ではない、実制度差分の確認が読める | Playwright JSON | なし | 3.1.4、11.1 | R011 | 作成済み |

## 4. 上流成果物への追記・更新
なし。

## 5. カバレッジ確認
| テスト設計ID | 対応テストケースID | 実行区分 | 状態 | 出力ファイル | カバー状況 |
|---|---|---|---|---|---|
| TD018 | TC-E2E-001 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD019 | TC-E2E-002 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD020 | TC-E2E-003 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD021 | TC-E2E-004 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD022 | TC-E2E-005 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD023 | TC-E2E-006 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD024 | TC-E2E-007 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD025 | TC-E2E-008 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD026 | TC-E2E-009 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD027 | TC-E2E-010 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD028 | TC-E2E-011 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD029 | TC-E2E-012 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD030 | TC-E2E-013 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
