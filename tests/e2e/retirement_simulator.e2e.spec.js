const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const appPath = path.resolve(__dirname, '..', '..', 'sample_app', 'retirement_simulator.html');
const appUrl = pathToFileURL(appPath).href;

async function openApp(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(appUrl);
  return errors;
}

async function run(page) {
  await page.locator('#runBtn').click();
  await expect(page.locator('#output')).not.toHaveText('');
  return page.locator('#output').textContent();
}

async function addSalaryChange(page, age, salary) {
  const panel = page.locator('#salaryChanges');
  if (!(await panel.isVisible())) {
    await page.locator('#toggleSalaryChanges').click();
  }
  await page.locator('#addSalaryChange').click();
  const item = page.locator('.salary-change-item').last();
  await item.locator('.salary-change-age').fill(String(age));
  await item.locator('.salary-change-salary').fill(String(salary));
}

test('TC-E2E-001 デフォルト実行の表示丸めと桁区切り', async ({ page }) => {
  // TC: TC-E2E-001 | TD: TD018 | TV: TV004 | TA: TA004 | Risk: R001 | Spec: spec/仕様書.md 3.1.3
  const errors = await openApp(page);
  const output = await run(page);
  expect(output).toContain('給与: ¥188,125');
  expect(output).toContain('生活費: ¥155,600');
  expect(output).toMatch(/現金: ¥[0-9,.-]+ 投資: ¥[0-9,.-]+ 総資産: ¥[0-9,.-]+/);
  expect(errors).toEqual([]);
});

test('TC-E2E-002 UI初期値と属性', async ({ page }) => {
  // TC: TC-E2E-002 | TD: TD019 | TV: TV015 | TA: TA004 | Risk: R004,R006 | Spec: spec/仕様書.md 3.1.2
  await openApp(page);
  await expect(page.locator('#startAge')).toHaveValue('30');
  await expect(page.locator('#retirementAge')).toHaveValue('65');
  await expect(page.locator('#pensionStartAge')).toHaveValue('65');
  await expect(page.locator('#investRate')).toHaveAttribute('max', '100');
  await expect(page.locator('#eventProb')).toHaveAttribute('min', '0');
  await page.locator('#toggleSalaryChanges').click();
  await page.locator('#addSalaryChange').click();
  await expect(page.locator('.salary-change-age').first()).toHaveAttribute('min', '1');
  await expect(page.locator('.salary-change-age').first()).toHaveAttribute('max', '100');
});

test('TC-E2E-003 デフォルト実行でNaNとInfinityが出ない', async ({ page }) => {
  // TC: TC-E2E-003 | TD: TD020 | TV: TV016 | TA: TA004 | Risk: R006 | Spec: spec/仕様書.md F006, 7.2
  await openApp(page);
  const output = await run(page);
  expect(output).toContain('-- 30歳1月 --');
  expect(output).not.toContain('NaN');
  expect(output).not.toContain('Infinity');
});

test('TC-E2E-004 退職後収入期間の表示', async ({ page }) => {
  // TC: TC-E2E-004 | TD: TD021 | TV: TV006 | TA: TA004 | Risk: R002 | Spec: spec/仕様書.md 2.2 F002
  await openApp(page);
  await page.locator('#startAge').fill('65');
  await page.locator('#retirementAge').fill('65');
  await page.locator('#pensionStartAge').fill('67');
  await page.locator('#gapIncome').fill('5000');
  await page.locator('#eventProb').fill('0');
  const output = await run(page);
  expect(output).toContain('-- 65歳1月 --');
  expect(output).toContain('退職後収入: ¥5,000');
});

test('TC-E2E-005 単一給与変更UI反映', async ({ page }) => {
  // TC: TC-E2E-005 | TD: TD022 | TV: TV017 | TA: TA004 | Risk: R004 | Spec: spec/仕様書.md F008
  await openApp(page);
  await page.locator('#startAge').fill('34');
  await page.locator('#retirementAge').fill('36');
  await page.locator('#eventProb').fill('0');
  await addSalaryChange(page, 35, 4000000);
  const output = await run(page);
  expect(output).toContain('-- 35歳1月 --');
  expect(output).toContain('[年収: ¥4,000,000]');
});

test('TC-E2E-006 同一年齢給与変更UIは最後を優先', async ({ page }) => {
  // TC: TC-E2E-006 | TD: TD023 | TV: TV017 | TA: TA004 | Risk: R004 | Spec: spec/仕様書.md F008
  await openApp(page);
  await page.locator('#startAge').fill('35');
  await page.locator('#retirementAge').fill('36');
  await page.locator('#eventProb').fill('0');
  await addSalaryChange(page, 35, 4000000);
  await addSalaryChange(page, 35, 5000000);
  const output = await run(page);
  expect(output).toContain('[年収: ¥5,000,000]');
});

test('TC-E2E-007 外部通信なし', async ({ page }) => {
  // TC: TC-E2E-007 | TD: TD024 | TV: TV018 | TA: TA005 | Risk: R007 | Spec: spec/仕様書.md 8.1
  const externalRequests = [];
  page.on('request', (request) => {
    if (/^https?:\/\//i.test(request.url())) externalRequests.push(request.url());
  });
  await openApp(page);
  await run(page);
  expect(externalRequests).toEqual([]);
});

test('TC-E2E-008 結果表示はHTMLを実行しない', async ({ page }) => {
  // TC: TC-E2E-008 | TD: TD025 | TV: TV019 | TA: TA005 | Risk: R007 | Spec: spec/仕様書.md 3.1.3, 8.2
  await openApp(page);
  await page.evaluate(() => {
    window.__xssMarker = 0;
    document.getElementById('salary').value = '<img src=x onerror="window.__xssMarker=1">';
  });
  await run(page);
  const result = await page.evaluate(() => ({
    marker: window.__xssMarker,
    hasInjectedElement: Boolean(document.querySelector('#output img, #output script')),
  }));
  expect(result).toEqual({ marker: 0, hasInjectedElement: false });
});

test('TC-E2E-009 標準条件の描画性能', async ({ page }) => {
  // TC: TC-E2E-009 | TD: TD026 | TV: TV020 | TA: TA006 | Risk: R008 | Spec: spec/仕様書.md 6.2
  await openApp(page);
  const durations = await page.evaluate(() => {
    document.getElementById('eventProb').value = '0';
    const values = [];
    for (let i = 0; i < 13; i += 1) {
      const start = performance.now();
      runSimulation();
      const end = performance.now();
      if (i >= 3) values.push(end - start);
    }
    return values.sort((a, b) => a - b);
  });
  const p95 = durations[Math.ceil(durations.length * 0.95) - 1];
  expect(p95).toBeLessThanOrEqual(200);
});

test('TC-E2E-010 連続実行で出力を置換', async ({ page }) => {
  // TC: TC-E2E-010 | TD: TD027 | TV: TV021 | TA: TA006 | Risk: R008 | Spec: spec/仕様書.md 6.2
  await openApp(page);
  await page.locator('#startAge').fill('30');
  await page.locator('#retirementAge').fill('31');
  await page.locator('#eventProb').fill('0');
  await page.locator('#salary').fill('3000000');
  const firstOutput = await run(page);
  await page.locator('#salary').fill('4000000');
  const secondOutput = await run(page);
  expect(firstOutput).toContain('給与: ¥188,125');
  expect(secondOutput).not.toContain('給与: ¥188,125');
  expect(secondOutput).toContain('-- 30歳1月 --');
});

test('TC-E2E-011 代表ブラウザで主要フロー', async ({ page }) => {
  // TC: TC-E2E-011 | TD: TD028 | TV: TV022 | TA: TA007 | Risk: R009 | Spec: spec/仕様書.md 7.3
  await openApp(page);
  const output = await run(page);
  expect(output).toContain('-- 30歳1月 --');
  expect(output).toContain('総資産');
});

test('TC-E2E-012 キーボードで給与変更を操作', async ({ page }) => {
  // TC: TC-E2E-012 | TD: TD029 | TV: TV023 | TA: TA007 | Risk: R009 | Spec: spec/仕様書.md 9.4
  await openApp(page);
  await page.locator('#toggleSalaryChanges').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#salaryChanges')).toBeVisible();
  await page.locator('#addSalaryChange').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.salary-change-item')).toHaveCount(1);
  await page.locator('#runBtn').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#output')).toContainText('-- 30歳1月 --');
});

test('TC-E2E-013 必須注意表示の文言', async ({ page }) => {
  // TC: TC-E2E-013 | TD: TD030 | TV: TV025 | TA: TA009 | Risk: R011 | Spec: spec/仕様書.md 3.1.4, 11.1
  await openApp(page);
  const text = await page.locator('body').textContent();
  expect(text).toContain('ネットワーク通信をせず');
  expect(text).toContain('金融助言ではない');
  expect(text).toContain('税務助言ではない');
  expect(text).toContain('実際の税制');
});
