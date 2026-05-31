# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: retirement_simulator.e2e.spec.js >> TC-E2E-013 必須注意表示の文言
- Location: tests\e2e\retirement_simulator.e2e.spec.js:186:1

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "金融助言ではない"
Received string:    "
  老後資金シミュレーター···
    🔒 プライバシー重視: このアプリケーションはネットワーク通信をせずローカルで動くので安心してください。あなたの財務情報が外部に送信されることはありません。······
    シミュレーション開始年齢:·
    退職年齢:·
    年金開始年齢:·
    退職後収入(月額):·
    給与(年収):··················
        📈 給与変更設定を表示/非表示······················
      転職・昇進による給与変更··············
        ➕ 給与変更を追加············
    年金月額:·
    開始時貯金:·
    開始時投資残高:·
    現役時生活費(月額):·
    退職～年金開始期間の生活費(月額):·
    老後生活費(月額):·
    投資率(%):·
    利回り(年%):·
    イベント発生率(月%):·
    開始··········
    function calculateNetMonthly(salaryAnnual) {
      const social = salaryAnnual * 0.14;
      const taxable = Math.max(0, salaryAnnual - social - 480000);
      const brackets = [
        { up:1950000, rate:0.05 },{ up:3300000, rate:0.10 },
        { up:6950000, rate:0.20 },{ up:9000000, rate:0.23 },
        { up:18000000, rate:0.33 },{ up:40000000, rate:0.40 },
        { up:Infinity, rate:0.45 }
      ];
      let tax=0, prev=0;
      for(const b of brackets){ if(taxable<=prev) break; const amt=Math.min(b.up, taxable)-prev; tax+=amt*b.rate; prev=b.up; }
      const resident = taxable * 0.10;
      return (salaryAnnual - social - tax - resident) / 12;
    }·
    function simulateRetirement(opts) {
      const {
        startAge, retirementAge, pensionStartAge, gapIncome,
        salary, salaryChanges, monthlyPension,
        initialCash, initialInv,
        expenseCurrent, expenseGap, expenseRetired,
        investRate, annualInterest,
        eventProb, eventTypes
      } = opts;·
      // 年齢に応じた給与を取得する関数
      function getCurrentSalary(age) {
        let currentSalary = salary;
        if (salaryChanges && salaryChanges.length > 0) {
          // 年齢に応じて適用される給与変更を探す（降順でソート済み）
          for (const change of salaryChanges) {
            if (age >= change.age) {
              currentSalary = change.salary;
              break;
            }
          }
        }
        return currentSalary;
      }·
      let cash = initialCash;
      let investBal = initialInv;
      const lines = [];·
      for(let age = startAge; age <= 100; age++){
        for(let m = 1; m <= 12; m++){
          // 年初 投資残高へ利息適用
          if(m === 1 && age > startAge){
            const before = investBal;
            investBal *= (1 + annualInterest);
            lines.push(`== ${age}歳 1月: 投資利息 ==`);
            lines.push(`  投資: ¥${before.toLocaleString()} → ¥${Math.round(investBal).toLocaleString()}`);
          }
          // 収入判定
          let incomeText = '';
          if(age < retirementAge){
            const currentSalary = getCurrentSalary(age);
            const net = calculateNetMonthly(currentSalary);
            const invAmt = net * investRate;
            investBal += invAmt;
            cash += (net - invAmt);
            incomeText = `給与: ¥${Math.round(net).toLocaleString()} (投資: ¥${Math.round(invAmt).toLocaleString()})`;
            // 給与変更があった場合は年収も表示
            if (currentSalary !== salary) {
              incomeText += ` [年収: ¥${currentSalary.toLocaleString()}]`;
            }
          } else if(age < pensionStartAge){
            cash += gapIncome;
            incomeText = `退職後収入: ¥${gapIncome.toLocaleString()}`;
          } else {
            cash += monthlyPension;
            incomeText = `年金: ¥${monthlyPension.toLocaleString()}`;
          }
          // 生活費差引
          let cost;
          if(age < retirementAge) cost = expenseCurrent;
          else if(age < pensionStartAge) cost = expenseGap;
          else cost = expenseRetired;
          cash -= cost;
          // イベント
          const evtLines = [];
          if(Math.random() < eventProb){
            const e = eventTypes[Math.floor(Math.random()*eventTypes.length)];
            cash -= e.cost;
            evtLines.push(`▶ ${e.name}: ¥${e.cost.toLocaleString()}`);
          }
          // 投資補填
          if(cash < 0 && investBal > 0){
            const need = -cash;
            const draw = Math.min(investBal, need);
            const tax = draw * 0.2;  // 20%の税金
            investBal -= (draw + tax);  // 補填額 + 税金を引く
            cash += draw;  // 現金には補填額のみ追加
            evtLines.push(`🔄 投資から補填: ¥${draw.toLocaleString()} (税金: ¥${Math.round(tax).toLocaleString()})`);
          }
          // 出力
          lines.push(`-- ${age}歳${m}月 --`);
          lines.push(`  ${incomeText}`);
          lines.push(`  生活費: ¥${cost.toLocaleString()}`);
          evtLines.forEach(l => lines.push(`  ${l}`));
          const total = cash + investBal;
          lines.push(`  現金: ¥${Math.round(cash).toLocaleString()} 投資: ¥${Math.round(investBal).toLocaleString()} 総資産: ¥${Math.round(total).toLocaleString()}`);
        }
      }
      return lines;
    }·
    function runSimulation(){
      const get = id => parseFloat(document.getElementById(id).value) || 0;·······
      // 給与変更設定を取得
      const salaryChanges = [];
      const salaryChangeElements = document.querySelectorAll('.salary-change-item');
      salaryChangeElements.forEach(element => {
        const age = parseFloat(element.querySelector('.salary-change-age').value);
        const salary = parseFloat(element.querySelector('.salary-change-salary').value);
        if (age > 0 && salary > 0) {
          salaryChanges.push({ age, salary });
        }
      });
      // 年齢の降順でソート（新しい設定が優先）
      salaryChanges.sort((a, b) => b.age - a.age);·······
      const opts = {
        startAge: get('startAge'), retirementAge: get('retirementAge'),
        pensionStartAge: get('pensionStartAge'), gapIncome: get('gapIncome'),
        salary: get('salary'), salaryChanges: salaryChanges, monthlyPension: get('monthlyPension'),
        initialCash: get('initialCash'), initialInv: get('initialInv'),
        expenseCurrent: get('expenseCurrent'), expenseGap: get('expenseGap'), expenseRetired: get('expenseRetired'),
        investRate: get('investRate')/100, annualInterest: get('interest')/100,
        eventProb: get('eventProb')/100,
        eventTypes: [
          {name:'入院',cost:200000},{name:'歯科治療',cost:50000},{name:'薬の購入',cost:20000},
          {name:'家電故障',cost:100000},{name:'車検',cost:80000},{name:'冠婚葬祭',cost:120000},
          {name:'健康診断',cost:30000},{name:'引越し',cost:200000}
        ]
      };
      const res = simulateRetirement(opts);
      document.getElementById('output').textContent = res.join('\\n');
    }·
    function runTests(){
      console.assert(calculateNetMonthly(0)===0,'net0');
      console.assert(calculateNetMonthly(1200000)>0,'net>0');
      // gapIncome test
      const optsGap={startAge:65, retirementAge:65, pensionStartAge:67, gapIncome:5000,
        salary:0, monthlyPension:0, initialCash:0, initialInv:0,
        expenseCurrent:100, expenseGap:200, expenseRetired:300,
        investRate:0, annualInterest:0, eventProb:0, eventTypes:[]};
      const outGap=simulateRetirement(optsGap);
      console.assert(outGap[0].includes('退職後収入: ¥5,000'),'gap income line');
      console.assert(outGap[1].includes('生活費: ¥200'),'gap expense line');
    }·
    document.addEventListener('DOMContentLoaded',()=>{
      runTests();
      document.getElementById('runBtn').addEventListener('click',runSimulation);·······
      // 給与変更設定の表示/非表示トグル
      document.getElementById('toggleSalaryChanges').addEventListener('click', function() {
        const salaryChanges = document.getElementById('salaryChanges');
        if (salaryChanges.style.display === 'none') {
          salaryChanges.style.display = 'block';
        } else {
          salaryChanges.style.display = 'none';
        }
      });·······
      // 給与変更を追加
      document.getElementById('addSalaryChange').addEventListener('click', function() {
        addSalaryChangeItem();
      });
    });·
    // 給与変更項目を追加する関数
    function addSalaryChangeItem() {
      const container = document.getElementById('salaryChangesList');
      const itemCount = container.children.length;·······
      const itemDiv = document.createElement('div');
      itemDiv.className = 'salary-change-item';
      itemDiv.style.cssText = 'margin: 5px 0; padding: 10px; border: 1px solid #ccc; border-radius: 3px; background-color: white;';·······
      itemDiv.innerHTML = `
        <div style=\"display: flex; align-items: center; gap: 10px;\">
          <label style=\"margin: 0;\">
            年齢: <input type=\"number\" class=\"salary-change-age\" min=\"0\" max=\"100\" style=\"width: 60px;\" placeholder=\"35\">歳から
          </label>
          <label style=\"margin: 0;\">
            年収: <input type=\"number\" class=\"salary-change-salary\" min=\"0\" style=\"width: 120px;\" placeholder=\"4000000\">円
          </label>
          <button type=\"button\" onclick=\"this.parentElement.parentElement.remove()\"·
                  style=\"background-color: #f44336; color: white; border: none; padding: 3px 8px; cursor: pointer; border-radius: 3px;\">
            削除
          </button>
        </div>
      `;·······
      container.appendChild(itemDiv);
    }·····
"
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - heading "老後資金シミュレーター" [level=1] [ref=e2]
  - paragraph [ref=e3]:
    - text: 🔒
    - strong [ref=e4]: "プライバシー重視:"
    - text: このアプリケーションはネットワーク通信をせずローカルで動くので安心してください。あなたの財務情報が外部に送信されることはありません。
  - generic [ref=e5]:
    - generic [ref=e6]:
      - text: "シミュレーション開始年齢:"
      - spinbutton "シミュレーション開始年齢:" [ref=e7]: "30"
    - generic [ref=e8]:
      - text: "退職年齢:"
      - spinbutton "退職年齢:" [ref=e9]: "65"
    - generic [ref=e10]:
      - text: "年金開始年齢:"
      - spinbutton "年金開始年齢:" [ref=e11]: "65"
    - generic [ref=e12]:
      - text: "退職後収入(月額):"
      - spinbutton "退職後収入(月額):" [ref=e13]: "0"
    - generic [ref=e14]:
      - text: "給与(年収):"
      - spinbutton "給与(年収):" [ref=e15]: "3000000"
    - button "📈 給与変更設定を表示/非表示" [ref=e17] [cursor=pointer]
    - generic [ref=e18]:
      - text: "年金月額:"
      - spinbutton "年金月額:" [ref=e19]: "145000"
    - generic [ref=e20]:
      - text: "開始時貯金:"
      - spinbutton "開始時貯金:" [ref=e21]: "1000000"
    - generic [ref=e22]:
      - text: "開始時投資残高:"
      - spinbutton "開始時投資残高:" [ref=e23]: "0"
    - generic [ref=e24]:
      - text: "現役時生活費(月額):"
      - spinbutton "現役時生活費(月額):" [ref=e25]: "155600"
    - generic [ref=e26]:
      - text: "退職～年金開始期間の生活費(月額):"
      - spinbutton "退職～年金開始期間の生活費(月額):" [ref=e27]: "228000"
    - generic [ref=e28]:
      - text: "老後生活費(月額):"
      - spinbutton "老後生活費(月額):" [ref=e29]: "228000"
    - generic [ref=e30]:
      - text: "投資率(%):"
      - spinbutton "投資率(%):" [ref=e31]: "20"
    - generic [ref=e32]:
      - text: "利回り(年%):"
      - spinbutton "利回り(年%):" [ref=e33]: "4"
    - generic [ref=e34]:
      - text: "イベント発生率(月%):"
      - spinbutton "イベント発生率(月%):" [ref=e35]: "1"
    - button "開始" [ref=e36]
```

# Test source

```ts
  91  | });
  92  | 
  93  | test('TC-E2E-006 同一年齢給与変更UIは最後を優先', async ({ page }) => {
  94  |   // TC: TC-E2E-006 | TD: TD023 | TV: TV017 | TA: TA004 | Risk: R004 | Spec: spec/仕様書.md F008
  95  |   await openApp(page);
  96  |   await page.locator('#startAge').fill('35');
  97  |   await page.locator('#retirementAge').fill('36');
  98  |   await page.locator('#eventProb').fill('0');
  99  |   await addSalaryChange(page, 35, 4000000);
  100 |   await addSalaryChange(page, 35, 5000000);
  101 |   const output = await run(page);
  102 |   expect(output).toContain('[年収: ¥5,000,000]');
  103 | });
  104 | 
  105 | test('TC-E2E-007 外部通信なし', async ({ page }) => {
  106 |   // TC: TC-E2E-007 | TD: TD024 | TV: TV018 | TA: TA005 | Risk: R007 | Spec: spec/仕様書.md 8.1
  107 |   const externalRequests = [];
  108 |   page.on('request', (request) => {
  109 |     if (/^https?:\/\//i.test(request.url())) externalRequests.push(request.url());
  110 |   });
  111 |   await openApp(page);
  112 |   await run(page);
  113 |   expect(externalRequests).toEqual([]);
  114 | });
  115 | 
  116 | test('TC-E2E-008 結果表示はHTMLを実行しない', async ({ page }) => {
  117 |   // TC: TC-E2E-008 | TD: TD025 | TV: TV019 | TA: TA005 | Risk: R007 | Spec: spec/仕様書.md 3.1.3, 8.2
  118 |   await openApp(page);
  119 |   await page.evaluate(() => {
  120 |     window.__xssMarker = 0;
  121 |     document.getElementById('salary').value = '<img src=x onerror="window.__xssMarker=1">';
  122 |   });
  123 |   await run(page);
  124 |   const result = await page.evaluate(() => ({
  125 |     marker: window.__xssMarker,
  126 |     hasInjectedElement: Boolean(document.querySelector('#output img, #output script')),
  127 |   }));
  128 |   expect(result).toEqual({ marker: 0, hasInjectedElement: false });
  129 | });
  130 | 
  131 | test('TC-E2E-009 標準条件の描画性能', async ({ page }) => {
  132 |   // TC: TC-E2E-009 | TD: TD026 | TV: TV020 | TA: TA006 | Risk: R008 | Spec: spec/仕様書.md 6.2
  133 |   await openApp(page);
  134 |   const durations = await page.evaluate(() => {
  135 |     document.getElementById('eventProb').value = '0';
  136 |     const values = [];
  137 |     for (let i = 0; i < 13; i += 1) {
  138 |       const start = performance.now();
  139 |       runSimulation();
  140 |       const end = performance.now();
  141 |       if (i >= 3) values.push(end - start);
  142 |     }
  143 |     return values.sort((a, b) => a - b);
  144 |   });
  145 |   const p95 = durations[Math.ceil(durations.length * 0.95) - 1];
  146 |   expect(p95).toBeLessThanOrEqual(200);
  147 | });
  148 | 
  149 | test('TC-E2E-010 連続実行で出力を置換', async ({ page }) => {
  150 |   // TC: TC-E2E-010 | TD: TD027 | TV: TV021 | TA: TA006 | Risk: R008 | Spec: spec/仕様書.md 6.2
  151 |   await openApp(page);
  152 |   await page.locator('#startAge').fill('30');
  153 |   await page.locator('#retirementAge').fill('31');
  154 |   await page.locator('#eventProb').fill('0');
  155 |   await page.locator('#salary').fill('3000000');
  156 |   const firstOutput = await run(page);
  157 |   await page.locator('#salary').fill('4000000');
  158 |   const secondOutput = await run(page);
  159 |   expect(firstOutput).toContain('給与: ¥188,125');
  160 |   expect(secondOutput).not.toContain('給与: ¥188,125');
  161 |   expect(secondOutput).toContain('-- 30歳1月 --');
  162 | });
  163 | 
  164 | test('TC-E2E-011 代表ブラウザで主要フロー', async ({ page }) => {
  165 |   // TC: TC-E2E-011 | TD: TD028 | TV: TV022 | TA: TA007 | Risk: R009 | Spec: spec/仕様書.md 7.3
  166 |   await openApp(page);
  167 |   const output = await run(page);
  168 |   expect(output).toContain('-- 30歳1月 --');
  169 |   expect(output).toContain('総資産');
  170 | });
  171 | 
  172 | test('TC-E2E-012 キーボードで給与変更を操作', async ({ page }) => {
  173 |   // TC: TC-E2E-012 | TD: TD029 | TV: TV023 | TA: TA007 | Risk: R009 | Spec: spec/仕様書.md 9.4
  174 |   await openApp(page);
  175 |   await page.locator('#toggleSalaryChanges').focus();
  176 |   await page.keyboard.press('Enter');
  177 |   await expect(page.locator('#salaryChanges')).toBeVisible();
  178 |   await page.locator('#addSalaryChange').focus();
  179 |   await page.keyboard.press('Enter');
  180 |   await expect(page.locator('.salary-change-item')).toHaveCount(1);
  181 |   await page.locator('#runBtn').focus();
  182 |   await page.keyboard.press('Enter');
  183 |   await expect(page.locator('#output')).toContainText('-- 30歳1月 --');
  184 | });
  185 | 
  186 | test('TC-E2E-013 必須注意表示の文言', async ({ page }) => {
  187 |   // TC: TC-E2E-013 | TD: TD030 | TV: TV025 | TA: TA009 | Risk: R011 | Spec: spec/仕様書.md 3.1.4, 11.1
  188 |   await openApp(page);
  189 |   const text = await page.locator('body').textContent();
  190 |   expect(text).toContain('ネットワーク通信をせず');
> 191 |   expect(text).toContain('金融助言ではない');
      |                ^ Error: expect(received).toContain(expected) // indexOf
  192 |   expect(text).toContain('税務助言ではない');
  193 |   expect(text).toContain('実際の税制');
  194 | });
  195 | 
```