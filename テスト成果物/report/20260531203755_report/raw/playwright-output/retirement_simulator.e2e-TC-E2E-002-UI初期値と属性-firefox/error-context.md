# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: retirement_simulator.e2e.spec.js >> TC-E2E-002 UI初期値と属性
- Location: tests\e2e\retirement_simulator.e2e.spec.js:45:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('.salary-change-age').first()
Expected: "1"
Received: "0"
Timeout:  5000ms

Call log:
  - Expect "toHaveAttribute" with timeout 5000ms
  - waiting for locator('.salary-change-age').first()
    13 × locator resolved to <input min="0" max="100" type="number" placeholder="35" class="salary-change-age"/>
       - unexpected value "0"

```

```yaml
- 'spinbutton "年齢: 歳から"'
```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | const path = require('node:path');
  3   | const { pathToFileURL } = require('node:url');
  4   | 
  5   | const appPath = path.resolve(__dirname, '..', '..', 'sample_app', 'retirement_simulator.html');
  6   | const appUrl = pathToFileURL(appPath).href;
  7   | 
  8   | async function openApp(page) {
  9   |   const errors = [];
  10  |   page.on('pageerror', (error) => errors.push(error.message));
  11  |   page.on('console', (message) => {
  12  |     if (message.type() === 'error') errors.push(message.text());
  13  |   });
  14  |   await page.goto(appUrl);
  15  |   return errors;
  16  | }
  17  | 
  18  | async function run(page) {
  19  |   await page.locator('#runBtn').click();
  20  |   await expect(page.locator('#output')).not.toHaveText('');
  21  |   return page.locator('#output').textContent();
  22  | }
  23  | 
  24  | async function addSalaryChange(page, age, salary) {
  25  |   const panel = page.locator('#salaryChanges');
  26  |   if (!(await panel.isVisible())) {
  27  |     await page.locator('#toggleSalaryChanges').click();
  28  |   }
  29  |   await page.locator('#addSalaryChange').click();
  30  |   const item = page.locator('.salary-change-item').last();
  31  |   await item.locator('.salary-change-age').fill(String(age));
  32  |   await item.locator('.salary-change-salary').fill(String(salary));
  33  | }
  34  | 
  35  | test('TC-E2E-001 デフォルト実行の表示丸めと桁区切り', async ({ page }) => {
  36  |   // TC: TC-E2E-001 | TD: TD018 | TV: TV004 | TA: TA004 | Risk: R001 | Spec: spec/仕様書.md 3.1.3
  37  |   const errors = await openApp(page);
  38  |   const output = await run(page);
  39  |   expect(output).toContain('給与: ¥188,125');
  40  |   expect(output).toContain('生活費: ¥155,600');
  41  |   expect(output).toMatch(/現金: ¥[0-9,.-]+ 投資: ¥[0-9,.-]+ 総資産: ¥[0-9,.-]+/);
  42  |   expect(errors).toEqual([]);
  43  | });
  44  | 
  45  | test('TC-E2E-002 UI初期値と属性', async ({ page }) => {
  46  |   // TC: TC-E2E-002 | TD: TD019 | TV: TV015 | TA: TA004 | Risk: R004,R006 | Spec: spec/仕様書.md 3.1.2
  47  |   await openApp(page);
  48  |   await expect(page.locator('#startAge')).toHaveValue('30');
  49  |   await expect(page.locator('#retirementAge')).toHaveValue('65');
  50  |   await expect(page.locator('#pensionStartAge')).toHaveValue('65');
  51  |   await expect(page.locator('#investRate')).toHaveAttribute('max', '100');
  52  |   await expect(page.locator('#eventProb')).toHaveAttribute('min', '0');
  53  |   await page.locator('#toggleSalaryChanges').click();
  54  |   await page.locator('#addSalaryChange').click();
> 55  |   await expect(page.locator('.salary-change-age').first()).toHaveAttribute('min', '1');
      |                                                            ^ Error: expect(locator).toHaveAttribute(expected) failed
  56  |   await expect(page.locator('.salary-change-age').first()).toHaveAttribute('max', '100');
  57  | });
  58  | 
  59  | test('TC-E2E-003 デフォルト実行でNaNとInfinityが出ない', async ({ page }) => {
  60  |   // TC: TC-E2E-003 | TD: TD020 | TV: TV016 | TA: TA004 | Risk: R006 | Spec: spec/仕様書.md F006, 7.2
  61  |   await openApp(page);
  62  |   const output = await run(page);
  63  |   expect(output).toContain('-- 30歳1月 --');
  64  |   expect(output).not.toContain('NaN');
  65  |   expect(output).not.toContain('Infinity');
  66  | });
  67  | 
  68  | test('TC-E2E-004 退職後収入期間の表示', async ({ page }) => {
  69  |   // TC: TC-E2E-004 | TD: TD021 | TV: TV006 | TA: TA004 | Risk: R002 | Spec: spec/仕様書.md 2.2 F002
  70  |   await openApp(page);
  71  |   await page.locator('#startAge').fill('65');
  72  |   await page.locator('#retirementAge').fill('65');
  73  |   await page.locator('#pensionStartAge').fill('67');
  74  |   await page.locator('#gapIncome').fill('5000');
  75  |   await page.locator('#eventProb').fill('0');
  76  |   const output = await run(page);
  77  |   expect(output).toContain('-- 65歳1月 --');
  78  |   expect(output).toContain('退職後収入: ¥5,000');
  79  | });
  80  | 
  81  | test('TC-E2E-005 単一給与変更UI反映', async ({ page }) => {
  82  |   // TC: TC-E2E-005 | TD: TD022 | TV: TV017 | TA: TA004 | Risk: R004 | Spec: spec/仕様書.md F008
  83  |   await openApp(page);
  84  |   await page.locator('#startAge').fill('34');
  85  |   await page.locator('#retirementAge').fill('36');
  86  |   await page.locator('#eventProb').fill('0');
  87  |   await addSalaryChange(page, 35, 4000000);
  88  |   const output = await run(page);
  89  |   expect(output).toContain('-- 35歳1月 --');
  90  |   expect(output).toContain('[年収: ¥4,000,000]');
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
```