# テストケース（E2E自動）

## 1. 作成対象

- テスト設計: `テスト成果物/テスト設計.md`
- テスト対象画面: `sample_app/retirement_simulator.html`
- E2E自動テスト想定: Playwright

## 2. 参照資料

- `spec/仕様書.md`
- `sample_app/README.md`
- `sample_app/retirement_simulator.html`
- `playwright.config.js`
- `package.json`
- `テスト成果物/テスト分析.md`
- `テスト成果物/テスト計画書.md`

## 3. E2E自動テストで実行するテストケース

| テストケースID | 元テスト設計ID | テスト観点ID | テストアプローチID | 実行区分 | テストレベル/タイプ | 優先度 | テストケース名 | 前提条件 | 入力/データ | 手順 | 期待結果 | 確認方法/証跡 | 関連質問ID | 仕様 | リスクID | 状態 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-E2E-001 | TD021 | TV014 | TA004 | E2E自動 | Integration | 高 | 給与変更設定を表示する | アプリをブラウザで開く | `#toggleSalaryChanges` を1回クリック | 初期状態を確認し、ボタンをクリックして `#salaryChanges` の表示状態を読む | `#salaryChanges` が表示状態になる | Playwright実行ログとDOM状態 | なし | F008、3.1.2 | R004 | 作成済み |
| TC-E2E-002 | TD021 | TV014 | TA004 | E2E自動 | Integration | 高 | 給与変更行を追加する | 給与変更設定が表示状態 | `#addSalaryChange` を1回クリック | ボタンをクリックし、`.salary-change-item` の件数を確認する | 給与変更行が1件追加される | Playwright実行ログとDOM状態 | なし | F008、3.1.2 | R004 | 作成済み |
| TC-E2E-003 | TD021 | TV014 | TA004 | E2E自動 | Integration | 高 | 給与変更行を削除する | 給与変更行が1件存在する | 追加済み行の削除ボタンを1回クリック | 削除ボタンをクリックし、`.salary-change-item` の件数を確認する | 給与変更行が0件になる | Playwright実行ログとDOM状態 | なし | F008、3.1.2 | R004 | 作成済み |
| TC-E2E-004 | TD022 | TV016 | TA004 | E2E自動 | Integration | 高 | UI給与変更が計算へ反映される | アプリをブラウザで開く | 給与変更 `age=35; salary=4000000` | 給与変更を追加して開始し、35歳1月の出力を読む | `[年収: ¥4,000,000]` が表示され、給与額が400万円ベースになる | Playwright実行ログと出力テキスト | なし | F008 | R004, R006 | 作成済み |
| TC-E2E-005 | TD023 | TV024 | TA006 | E2E自動 | Integration | 中 | 入力変更後の連続実行で出力が置換される | アプリをブラウザで開く | 1回目 `salary=3000000`; 2回目 `salary=6000000` | 1回目を開始し出力を記録、給与を600万円に変更して再度開始する | `#output` が2回目の結果に置換され、前回結果の重複やJavaScript例外がない | Playwright実行ログとconsoleログ | なし | 6.2 | R006, R009 | 作成済み |
| TC-E2E-006 | TD024 | TV037 | TA011 | E2E自動 | Integration | 高 | デフォルト条件の最初の月を確認する | アプリをブラウザで開く | 初期値のまま開始 | 開始ボタンをクリックし、出力の先頭を読む | `-- 30歳1月 --` と給与行が表示される | Playwright実行ログと出力テキスト | なし | 1.2、F006、F007 | R002, R006 | 作成済み |
| TC-E2E-007 | TD024 | TV037 | TA011 | E2E自動 | Integration | 高 | デフォルト条件の最後の月を確認する | アプリをブラウザで開く | 初期値のまま開始 | 開始ボタンをクリックし、出力の末尾を読む | `-- 100歳12月 --` が表示される | Playwright実行ログと出力テキスト | なし | 1.2、F006、F007 | R002, R006 | 作成済み |
| TC-E2E-008 | TD025 | TV038 | TA011 | E2E自動 | Integration | 高 | 35歳給与変更シナリオ | アプリをブラウザで開く | 給与変更 `age=35; salary=4000000` | 給与変更を追加して開始し、35歳1月を確認する | 35歳1月以降に `[年収: ¥4,000,000]` が表示される | Playwright実行ログと出力テキスト | なし | F008、README 使用例 | R004, R006 | 作成済み |
| TC-E2E-009 | TD025 | TV038 | TA011 | E2E自動 | Integration | 高 | 40歳給与変更シナリオ | アプリをブラウザで開く | 給与変更 `age=40; salary=7000000` | 給与変更を追加して開始し、40歳1月を確認する | 40歳1月以降に `[年収: ¥7,000,000]` が表示される | Playwright実行ログと出力テキスト | なし | F008、README 使用例 | R004, R006 | 作成済み |
| TC-E2E-010 | TD025 | TV038 | TA011 | E2E自動 | Integration | 高 | 退職後給与変更は表示に影響しない | アプリをブラウザで開く | `retirementAge=65; salaryChange age=70; salary=7000000` | 給与変更を追加して開始し、70歳1月を確認する | 70歳は年金期間のため `[年収: ¥7,000,000]` が表示されない | Playwright実行ログと出力テキスト | なし | F008、README 使用例 | R004, R006 | 作成済み |
| TC-E2E-011 | TD027 | TV021 | TA006 | E2E自動 | E2E | 高 | 初期値 startAge | アプリをブラウザで開く | `#startAge` | DOM valueを読む | 値が`30`である | Playwright実行ログ | なし | 3.1.2、3.1.3 | R006 | 作成済み |
| TC-E2E-012 | TD027 | TV021 | TA006 | E2E自動 | E2E | 高 | 初期値 retirementAge | アプリをブラウザで開く | `#retirementAge` | DOM valueを読む | 値が`65`である | Playwright実行ログ | なし | 3.1.2、3.1.3 | R006 | 作成済み |
| TC-E2E-013 | TD027 | TV021 | TA006 | E2E自動 | E2E | 高 | 初期値 pensionStartAge | アプリをブラウザで開く | `#pensionStartAge` | DOM valueを読む | 値が`65`である | Playwright実行ログ | なし | 3.1.2、3.1.3 | R006 | 作成済み |
| TC-E2E-014 | TD027 | TV021 | TA006 | E2E自動 | E2E | 高 | 初期値 gapIncome | アプリをブラウザで開く | `#gapIncome` | DOM valueを読む | 値が`0`である | Playwright実行ログ | なし | 3.1.2、3.1.3 | R006 | 作成済み |
| TC-E2E-015 | TD027 | TV021 | TA006 | E2E自動 | E2E | 高 | 初期値 salary | アプリをブラウザで開く | `#salary` | DOM valueを読む | 値が`3000000`である | Playwright実行ログ | なし | 3.1.2、3.1.3 | R006 | 作成済み |
| TC-E2E-016 | TD027 | TV021 | TA006 | E2E自動 | E2E | 高 | 初期値 monthlyPension | アプリをブラウザで開く | `#monthlyPension` | DOM valueを読む | 値が`145000`である | Playwright実行ログ | なし | 3.1.2、3.1.3 | R006 | 作成済み |
| TC-E2E-017 | TD027 | TV021 | TA006 | E2E自動 | E2E | 高 | 初期値 initialCash | アプリをブラウザで開く | `#initialCash` | DOM valueを読む | 値が`1000000`である | Playwright実行ログ | なし | 3.1.2、3.1.3 | R006 | 作成済み |
| TC-E2E-018 | TD027 | TV021 | TA006 | E2E自動 | E2E | 高 | 初期値 initialInv | アプリをブラウザで開く | `#initialInv` | DOM valueを読む | 値が`0`である | Playwright実行ログ | なし | 3.1.2、3.1.3 | R006 | 作成済み |
| TC-E2E-019 | TD027 | TV021 | TA006 | E2E自動 | E2E | 高 | 初期値 expenseCurrent | アプリをブラウザで開く | `#expenseCurrent` | DOM valueを読む | 値が`155600`である | Playwright実行ログ | なし | 3.1.2、3.1.3 | R006 | 作成済み |
| TC-E2E-020 | TD027 | TV021 | TA006 | E2E自動 | E2E | 高 | 初期値 expenseGap | アプリをブラウザで開く | `#expenseGap` | DOM valueを読む | 値が`228000`である | Playwright実行ログ | なし | 3.1.2、3.1.3 | R006 | 作成済み |
| TC-E2E-021 | TD027 | TV021 | TA006 | E2E自動 | E2E | 高 | 初期値 expenseRetired | アプリをブラウザで開く | `#expenseRetired` | DOM valueを読む | 値が`228000`である | Playwright実行ログ | なし | 3.1.2、3.1.3 | R006 | 作成済み |
| TC-E2E-022 | TD027 | TV021 | TA006 | E2E自動 | E2E | 高 | 初期値 investRate | アプリをブラウザで開く | `#investRate` | DOM valueを読む | 値が`20`である | Playwright実行ログ | なし | 3.1.2、3.1.3 | R006 | 作成済み |
| TC-E2E-023 | TD027 | TV021 | TA006 | E2E自動 | E2E | 高 | 初期値 interest | アプリをブラウザで開く | `#interest` | DOM valueを読む | 値が`4`である | Playwright実行ログ | なし | 3.1.2、3.1.3 | R006 | 作成済み |
| TC-E2E-024 | TD027 | TV021 | TA006 | E2E自動 | E2E | 高 | 初期値 eventProb | アプリをブラウザで開く | `#eventProb` | DOM valueを読む | 値が`1`である | Playwright実行ログ | なし | 3.1.2、3.1.3 | R006 | 作成済み |
| TC-E2E-025 | TD027 | TV021 | TA006 | E2E自動 | E2E | 高 | 初期値で開始結果が表示される | アプリをブラウザで開く | 初期値のまま開始 | 開始ボタンをクリックする | `#output` に月次結果が表示される | Playwright実行ログと出力テキスト | なし | 3.1.2、3.1.3 | R006 | 作成済み |
| TC-E2E-026 | TD028 | TV022 | TA006 | E2E自動 | E2E | 中 | 結果表示の等幅フォント | アプリをブラウザで開く | `#output` | CSS `font-family` を読む | 等幅フォントが指定されている | Playwright実行ログ | なし | 3.1.3 | R006 | 作成済み |
| TC-E2E-027 | TD028 | TV022 | TA006 | E2E自動 | E2E | 中 | 結果表示のpre-wrap | アプリをブラウザで開く | `#output` | CSS `white-space` を読む | `pre-wrap` である | Playwright実行ログ | なし | 3.1.3 | R006 | 作成済み |
| TC-E2E-028 | TD028 | TV022 | TA006 | E2E自動 | E2E | 中 | 結果表示の最大高さ | アプリをブラウザで開く | `#output` | CSS `max-height` を読む | `400px` である | Playwright実行ログ | なし | 3.1.3 | R006 | 作成済み |
| TC-E2E-029 | TD028 | TV022 | TA006 | E2E自動 | E2E | 中 | 結果表示の背景色 | アプリをブラウザで開く | `#output` | CSS `background-color` を読む | `#f9f9f9` 相当である | Playwright実行ログ | なし | 3.1.3 | R006 | 作成済み |
| TC-E2E-030 | TD028 | TV022 | TA006 | E2E自動 | E2E | 中 | 結果表示のボーダー | アプリをブラウザで開く | `#output` | CSS `border` を読む | `1px solid #ddd` 相当である | Playwright実行ログ | なし | 3.1.3 | R006 | 作成済み |
| TC-E2E-031 | TD028 | TV022 | TA006 | E2E自動 | E2E | 中 | 結果表示のスクロール可能性 | アプリをブラウザで開く | 初期値のまま開始 | 出力後の `scrollHeight` と `clientHeight` を比較する | 長い結果でスクロール可能な状態になる | Playwright実行ログ | なし | 3.1.3 | R006 | 作成済み |
| TC-E2E-032 | TD029 | TV023 | TA006 | E2E自動 | E2E | 高 | HTML断片が結果で実行されない | アプリをブラウザで開く | `salary` DOM値を `<img src=x onerror=alert(1)>` に設定 | 値を設定して開始し、DOM注入とダイアログ発生を監視する | `#output` はHTMLを解釈せず、script実行やDOM注入が発生しない | Playwright実行ログとconsole/dialog監視 | なし | 3.1.3、8.2 | R006 | 作成済み |
| TC-E2E-033 | TD030 | TV041 | TA006 | E2E自動 | E2E | 高 | startAge属性 | アプリをブラウザで開く | `#startAge` | `type` と `min` を読む | `type=number; min=0` である | Playwright実行ログ | なし | 3.1.2、7.1 | R006, R008 | 作成済み |
| TC-E2E-034 | TD030 | TV041 | TA006 | E2E自動 | E2E | 高 | retirementAge属性 | アプリをブラウザで開く | `#retirementAge` | `type` と `min` を読む | `type=number; min=0` である | Playwright実行ログ | なし | 3.1.2、7.1 | R006, R008 | 作成済み |
| TC-E2E-035 | TD030 | TV041 | TA006 | E2E自動 | E2E | 高 | pensionStartAge属性 | アプリをブラウザで開く | `#pensionStartAge` | `type` と `min` を読む | `type=number; min=0` である | Playwright実行ログ | なし | 3.1.2、7.1 | R006, R008 | 作成済み |
| TC-E2E-036 | TD030 | TV041 | TA006 | E2E自動 | E2E | 高 | gapIncome属性 | アプリをブラウザで開く | `#gapIncome` | `type` と `min` を読む | `type=number; min=0` である | Playwright実行ログ | なし | 3.1.2、7.1 | R006, R008 | 作成済み |
| TC-E2E-037 | TD030 | TV041 | TA006 | E2E自動 | E2E | 高 | salary属性 | アプリをブラウザで開く | `#salary` | `type` と `min` を読む | `type=number; min=0` である | Playwright実行ログ | なし | 3.1.2、7.1 | R006, R008 | 作成済み |
| TC-E2E-038 | TD030 | TV041 | TA006 | E2E自動 | E2E | 高 | monthlyPension属性 | アプリをブラウザで開く | `#monthlyPension` | `type` と `min` を読む | `type=number; min=0` である | Playwright実行ログ | なし | 3.1.2、7.1 | R006, R008 | 作成済み |
| TC-E2E-039 | TD030 | TV041 | TA006 | E2E自動 | E2E | 高 | initialCash属性 | アプリをブラウザで開く | `#initialCash` | `type` と `min` を読む | `type=number; min=0` である | Playwright実行ログ | なし | 3.1.2、7.1 | R006, R008 | 作成済み |
| TC-E2E-040 | TD030 | TV041 | TA006 | E2E自動 | E2E | 高 | initialInv属性 | アプリをブラウザで開く | `#initialInv` | `type` と `min` を読む | `type=number; min=0` である | Playwright実行ログ | なし | 3.1.2、7.1 | R006, R008 | 作成済み |
| TC-E2E-041 | TD030 | TV041 | TA006 | E2E自動 | E2E | 高 | expenseCurrent属性 | アプリをブラウザで開く | `#expenseCurrent` | `type` と `min` を読む | `type=number; min=0` である | Playwright実行ログ | なし | 3.1.2、7.1 | R006, R008 | 作成済み |
| TC-E2E-042 | TD030 | TV041 | TA006 | E2E自動 | E2E | 高 | expenseGap属性 | アプリをブラウザで開く | `#expenseGap` | `type` と `min` を読む | `type=number; min=0` である | Playwright実行ログ | なし | 3.1.2、7.1 | R006, R008 | 作成済み |
| TC-E2E-043 | TD030 | TV041 | TA006 | E2E自動 | E2E | 高 | expenseRetired属性 | アプリをブラウザで開く | `#expenseRetired` | `type` と `min` を読む | `type=number; min=0` である | Playwright実行ログ | なし | 3.1.2、7.1 | R006, R008 | 作成済み |
| TC-E2E-044 | TD030 | TV041 | TA006 | E2E自動 | E2E | 高 | investRate min属性 | アプリをブラウザで開く | `#investRate` | `min` を読む | `min=0` である | Playwright実行ログ | なし | 3.1.2、7.1 | R006, R008 | 作成済み |
| TC-E2E-045 | TD030 | TV041 | TA006 | E2E自動 | E2E | 高 | investRate max属性 | アプリをブラウザで開く | `#investRate` | `max` を読む | `max=100` である | Playwright実行ログ | なし | 3.1.2、7.1 | R006, R008 | 作成済み |
| TC-E2E-046 | TD030 | TV041 | TA006 | E2E自動 | E2E | 高 | interest min属性 | アプリをブラウザで開く | `#interest` | `min` を読む | `min=0` である | Playwright実行ログ | なし | 3.1.2、7.1 | R006, R008 | 作成済み |
| TC-E2E-047 | TD030 | TV041 | TA006 | E2E自動 | E2E | 高 | interest step属性 | アプリをブラウザで開く | `#interest` | `step` を読む | `step=0.1` である | Playwright実行ログ | なし | 3.1.2、7.1 | R006, R008 | 作成済み |
| TC-E2E-048 | TD030 | TV041 | TA006 | E2E自動 | E2E | 高 | eventProb min属性 | アプリをブラウザで開く | `#eventProb` | `min` を読む | `min=0` である | Playwright実行ログ | なし | 3.1.2、7.1 | R006, R008 | 作成済み |
| TC-E2E-049 | TD030 | TV041 | TA006 | E2E自動 | E2E | 高 | eventProb max属性 | アプリをブラウザで開く | `#eventProb` | `max` を読む | `max=100` である | Playwright実行ログ | なし | 3.1.2、7.1 | R006, R008 | 作成済み |
| TC-E2E-050 | TD030 | TV041 | TA006 | E2E自動 | E2E | 高 | salaryChangeAge min属性 | 給与変更行が1件存在する | `.salary-change-age` | `min` を読む | `min=1` である | Playwright実行ログ | なし | 3.1.2、7.1 | R006, R008 | 作成済み |
| TC-E2E-051 | TD030 | TV041 | TA006 | E2E自動 | E2E | 高 | salaryChangeAge max属性 | 給与変更行が1件存在する | `.salary-change-age` | `max` を読む | `max=100` である | Playwright実行ログ | なし | 3.1.2、7.1 | R006, R008 | 作成済み |
| TC-E2E-052 | TD030 | TV041 | TA006 | E2E自動 | E2E | 高 | salaryChangeSalary min属性 | 給与変更行が1件存在する | `.salary-change-salary` | `min` を読む | `min=0` である | Playwright実行ログ | なし | 3.1.2、7.1 | R006, R008 | 作成済み |
| TC-E2E-053 | TD031 | TV034 | TA010 | E2E自動 | E2E | 中 | 注意表示の外部送信なし | アプリをブラウザで開く | 初期画面本文 | 注意表示テキストを取得する | 財務情報が外部送信されない旨を利用者が確認できる | Playwright実行ログと画面テキスト | なし | 3.1.4、11.1 | R010 | 作成済み |
| TC-E2E-054 | TD031 | TV034 | TA010 | E2E自動 | E2E | 中 | 注意表示の助言非該当 | アプリをブラウザで開く | 初期画面本文 | 注意表示テキストを取得する | 金融助言、投資助言、税務助言ではない旨を確認できる | Playwright実行ログと画面テキスト | なし | 3.1.4、11.1 | R010 | 作成済み |
| TC-E2E-055 | TD031 | TV034 | TA010 | E2E自動 | E2E | 中 | 注意表示の制度差と個人差 | アプリをブラウザで開く | 初期画面本文 | 注意表示テキストを取得する | 実制度差や個人差の確認が必要である旨を確認できる | Playwright実行ログと画面テキスト | なし | 3.1.4、11.1 | R010 | 作成済み |
| TC-E2E-056 | TD033 | TV025 | TA007 | E2E自動 | Security | 高 | 起動時の外部通信なし | request監視を有効にする | アプリを開く | ページロード中のHTTP(S) requestを記録する | 外部HTTP(S)リクエストが発生しない | Playwright requestログ | なし | 1.3、8.1 | R007 | 作成済み |
| TC-E2E-057 | TD033 | TV025 | TA007 | E2E自動 | Security | 高 | 入力開始時の外部通信なし | request監視を有効にする | `salary=4000000` を入力して開始 | 入力と開始操作中のHTTP(S) requestを記録する | 外部HTTP(S)リクエストが発生しない | Playwright requestログ | なし | 1.3、8.1 | R007 | 作成済み |
| TC-E2E-058 | TD033 | TV025 | TA007 | E2E自動 | Security | 高 | 給与変更操作時の外部通信なし | request監視を有効にする | 給与変更 `age=35; salary=4000000` | 給与変更表示、追加、入力、開始中のHTTP(S) requestを記録する | 外部HTTP(S)リクエストが発生しない | Playwright requestログ | なし | 1.3、8.1 | R007 | 作成済み |
| TC-E2E-059 | TD035 | TV027 | TA007 | E2E自動 | Security | 高 | localStorageに永続化しない | アプリをブラウザで開く | `salary=4000000` を入力して開始 | 操作後のlocalStorageキー数を確認する | localStorageにアプリ入力データが保存されない | Playwright実行ログ | なし | 4.2、8.1 | R007 | 作成済み |
| TC-E2E-060 | TD035 | TV027 | TA007 | E2E自動 | Security | 高 | sessionStorageに永続化しない | アプリをブラウザで開く | `salary=4000000` を入力して開始 | 操作後のsessionStorageキー数を確認する | sessionStorageにアプリ入力データが保存されない | Playwright実行ログ | なし | 4.2、8.1 | R007 | 作成済み |
| TC-E2E-061 | TD035 | TV027 | TA007 | E2E自動 | Security | 高 | Cookieに永続化しない | アプリをブラウザで開く | `salary=4000000` を入力して開始 | 操作後のCookieを確認する | 入力データを保持するCookieが作成されない | Playwright実行ログ | なし | 4.2、8.1 | R007 | 作成済み |
| TC-E2E-062 | TD037 | TV031 | TA009 | E2E自動 | Performance | 中 | 計算処理95パーセンタイル | Chromiumで実行する | デフォルト入力; `eventProb=0`; ウォームアップ3回; 測定10回 | `simulateRetirement()` 前後の `performance.now()` を測定する | 95パーセンタイルが100ms以下である | Playwright性能ログ | なし | 6.2 | R009 | 作成済み |
| TC-E2E-063 | TD038 | TV032 | TA009 | E2E自動 | Performance | 中 | 描画処理95パーセンタイル | Chromiumかつviewport 1280x720 | デフォルト入力; `eventProb=0`; ウォームアップ3回; 測定10回 | 開始クリックから `#output` 更新完了までを測定する | 95パーセンタイルが200ms以下である | Playwright性能ログ | なし | 6.2 | R009 | 作成済み |
| TC-E2E-064 | TD039 | TV033 | TA009 | E2E自動 | Performance | 中 | 10回連続実行の信頼性 | Chromiumで実行する | `salary` を3000000から3900000まで100000ずつ増やす | 10回連続で開始し、console errorと出力置換を確認する | 例外、古い結果混入、明確な表示遅延がない | Playwright実行ログとconsoleログ | なし | 6.2 | R009 | 作成済み |
| TC-E2E-065 | TD040 | TV028 | TA008 | E2E自動 | Compatibility | 中 | Chromium主要フロー | Playwright project `chromium` | 初期値のまま開始 | 主要フローを実行しconsole errorを監視する | 結果が表示され、JavaScript例外がない | Playwrightプロジェクト別ログ | なし | 7.3 | R008 | 作成済み |
| TC-E2E-066 | TD040 | TV028 | TA008 | E2E自動 | Compatibility | 中 | Firefox主要フロー | Playwright project `firefox` | 初期値のまま開始 | 主要フローを実行しconsole errorを監視する | 結果が表示され、JavaScript例外がない | Playwrightプロジェクト別ログ | なし | 7.3 | R008 | 作成済み |
| TC-E2E-067 | TD040 | TV028 | TA008 | E2E自動 | Compatibility | 中 | WebKit主要フロー | Playwright project `webkit` | 初期値のまま開始 | 主要フローを実行しconsole errorを監視する | 結果が表示され、JavaScript例外がない | Playwrightプロジェクト別ログ | なし | 7.3 | R008 | 作成済み |
| TC-E2E-068 | TD041 | TV029 | TA008 | E2E自動 | Compatibility | 中 | Chromium数値入力差異 | Playwright project `chromium` | `salary=4000000` | 数値入力を変更して開始する | 入力でき、結果生成が止まらない | Playwrightプロジェクト別ログ | なし | 7.1、9.4 | R008 | 作成済み |
| TC-E2E-069 | TD041 | TV029 | TA008 | E2E自動 | Compatibility | 中 | Firefox数値入力差異 | Playwright project `firefox` | `salary=4000000` | 数値入力を変更して開始する | 入力でき、結果生成が止まらない | Playwrightプロジェクト別ログ | なし | 7.1、9.4 | R008 | 作成済み |
| TC-E2E-070 | TD041 | TV029 | TA008 | E2E自動 | Compatibility | 中 | WebKit数値入力差異 | Playwright project `webkit` | `salary=4000000` | 数値入力を変更して開始する | 入力でき、結果生成が止まらない | Playwrightプロジェクト別ログ | なし | 7.1、9.4 | R008 | 作成済み |
| TC-E2E-071 | TD042 | TV030 | TA008 | E2E自動 | Compatibility | 中 | viewport 800x600の操作可能性 | Chromiumで実行する | viewport `800x600` | 初期値のまま開始し、入力欄と結果表示を確認する | 主要操作が可能で結果が読める | Playwrightスクリーンショットと実行ログ | なし | 11.2、13 | R008 | 作成済み |
| TC-E2E-072 | TD042 | TV030 | TA008 | E2E自動 | Compatibility | 中 | viewport 1280x720の操作可能性 | Chromiumで実行する | viewport `1280x720` | 初期値のまま開始し、入力欄と結果表示を確認する | 主要操作が可能で結果が読める | Playwrightスクリーンショットと実行ログ | なし | 11.2、13 | R008 | 作成済み |

## 4. 上流成果物への追記・更新

追記・更新なし。

## 5. カバレッジ確認

| テスト設計ID | 対応テストケースID | 実行区分 | 状態 | 出力ファイル | カバー状況 |
|---|---|---|---|---|---|
| TD021 | TC-E2E-001, TC-E2E-002, TC-E2E-003 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD022 | TC-E2E-004 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD023 | TC-E2E-005 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD024 | TC-E2E-006, TC-E2E-007 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD025 | TC-E2E-008, TC-E2E-009, TC-E2E-010 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD027 | TC-E2E-011, TC-E2E-012, TC-E2E-013, TC-E2E-014, TC-E2E-015, TC-E2E-016, TC-E2E-017, TC-E2E-018, TC-E2E-019, TC-E2E-020, TC-E2E-021, TC-E2E-022, TC-E2E-023, TC-E2E-024, TC-E2E-025 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD028 | TC-E2E-026, TC-E2E-027, TC-E2E-028, TC-E2E-029, TC-E2E-030, TC-E2E-031 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD029 | TC-E2E-032 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD030 | TC-E2E-033, TC-E2E-034, TC-E2E-035, TC-E2E-036, TC-E2E-037, TC-E2E-038, TC-E2E-039, TC-E2E-040, TC-E2E-041, TC-E2E-042, TC-E2E-043, TC-E2E-044, TC-E2E-045, TC-E2E-046, TC-E2E-047, TC-E2E-048, TC-E2E-049, TC-E2E-050, TC-E2E-051, TC-E2E-052 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD031 | TC-E2E-053, TC-E2E-054, TC-E2E-055 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD033 | TC-E2E-056, TC-E2E-057, TC-E2E-058 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD035 | TC-E2E-059, TC-E2E-060, TC-E2E-061 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD037 | TC-E2E-062 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD038 | TC-E2E-063 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD039 | TC-E2E-064 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD040 | TC-E2E-065, TC-E2E-066, TC-E2E-067 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD041 | TC-E2E-068, TC-E2E-069, TC-E2E-070 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
| TD042 | TC-E2E-071, TC-E2E-072 | E2E自動 | 作成済み | テストケース_E2E自動.md | カバー |
