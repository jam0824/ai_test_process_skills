const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const APP_URL = pathToFileURL(path.resolve(__dirname, '../../sample_app/retirement_simulator.html')).href;

async function openApp(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(APP_URL);
  await expect(page.locator('h1')).toHaveText('老後資金シミュレーター');
  return errors;
}

async function addSalaryChange(page, age, salary) {
  await page.locator('#toggleSalaryChanges').click();
  const panel = page.locator('#salaryChanges');
  if (await panel.evaluate((el) => getComputedStyle(el).display) === 'none') {
    await page.locator('#toggleSalaryChanges').click();
  }
  await page.locator('#addSalaryChange').click();
  const item = page.locator('.salary-change-item').last();
  await item.locator('.salary-change-age').fill(String(age));
  await item.locator('.salary-change-salary').fill(String(salary));
}

async function runWithNoRandomEvents(page) {
  await page.locator('#eventProb').fill('0');
  await page.locator('#runBtn').click();
  await expect(page.locator('#output')).toContainText('-- 30歳1月 --');
}

function percentile95(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * 0.95) - 1];
}

test('TC-E2E-001 給与変更UIの表示追加削除', async ({ page }) => {
  // TC: TC-E2E-001 | TD: TD021 | TV: TV014 | TA: TA004 | Risk: R004 | Spec: F008,3.1.2
  await openApp(page);
  await expect(page.locator('#salaryChanges')).toBeHidden();
  await page.locator('#toggleSalaryChanges').click();
  await expect(page.locator('#salaryChanges')).toBeVisible();
  await page.locator('#addSalaryChange').click();
  await expect(page.locator('.salary-change-item')).toHaveCount(1);
  await page.locator('.salary-change-item button').click();
  await expect(page.locator('.salary-change-item')).toHaveCount(0);
});

test('TC-E2E-002 給与変更UIから計算反映', async ({ page }) => {
  // TC: TC-E2E-002 | TD: TD022 | TV: TV016 | TA: TA004 | Risk: R004,R006 | Spec: F008
  await openApp(page);
  await addSalaryChange(page, 35, 4000000);
  await runWithNoRandomEvents(page);
  await expect(page.locator('#output')).toContainText('-- 35歳1月 --');
  await expect(page.locator('#output')).toContainText('[年収: ¥4,000,000]');
});

test('TC-E2E-003 入力変更後の連続実行', async ({ page }) => {
  // TC: TC-E2E-003 | TD: TD023 | TV: TV024 | TA: TA006 | Risk: R006,R009 | Spec: 6.2
  const errors = await openApp(page);
  await page.locator('#salary').fill('3000000');
  await runWithNoRandomEvents(page);
  const first = await page.locator('#output').textContent();
  await page.locator('#salary').fill('6000000');
  await page.locator('#runBtn').click();
  const second = await page.locator('#output').textContent();
  expect(second).not.toEqual(first);
  expect(errors).toEqual([]);
});

test('TC-E2E-004 デフォルト基本フロー', async ({ page }) => {
  // TC: TC-E2E-004 | TD: TD024 | TV: TV037 | TA: TA011 | Risk: R002,R006 | Spec: 1.2,F006,F007
  const errors = await openApp(page);
  await page.locator('#runBtn').click();
  await expect(page.locator('#output')).toContainText('-- 30歳1月 --');
  await expect(page.locator('#output')).toContainText('-- 100歳12月 --');
  expect(errors).toEqual([]);
});

test('TC-E2E-005 複数給与変更シナリオ', async ({ page }) => {
  // TC: TC-E2E-005 | TD: TD025 | TV: TV038 | TA: TA011 | Risk: R004,R006 | Spec: F008,README
  await openApp(page);
  await addSalaryChange(page, 35, 4000000);
  await addSalaryChange(page, 40, 7000000);
  await runWithNoRandomEvents(page);
  const output = page.locator('#output');
  await expect(output).toContainText('[年収: ¥4,000,000]');
  await expect(output).toContainText('[年収: ¥7,000,000]');
});

test('TC-E2E-006 初期値確認', async ({ page }) => {
  // TC: TC-E2E-006 | TD: TD027 | TV: TV021 | TA: TA006 | Risk: R006 | Spec: 3.1.2,3.1.3
  await openApp(page);
  const expected = {
    startAge: '30',
    retirementAge: '65',
    pensionStartAge: '65',
    gapIncome: '0',
    salary: '3000000',
    monthlyPension: '145000',
    initialCash: '1000000',
    initialInv: '0',
    expenseCurrent: '155600',
    expenseGap: '228000',
    expenseRetired: '228000',
    investRate: '20',
    interest: '4',
    eventProb: '1',
  };
  for (const [id, value] of Object.entries(expected)) {
    await expect(page.locator(`#${id}`)).toHaveValue(value);
  }
});

test('TC-E2E-007 結果表示スタイル', async ({ page }) => {
  // TC: TC-E2E-007 | TD: TD028 | TV: TV022 | TA: TA006 | Risk: R006 | Spec: 3.1.3
  await openApp(page);
  await runWithNoRandomEvents(page);
  const style = await page.locator('#output').evaluate((el) => {
    const computed = getComputedStyle(el);
    return {
      whiteSpace: computed.whiteSpace,
      maxHeight: computed.maxHeight,
      overflowY: computed.overflowY,
      fontFamily: computed.fontFamily,
      backgroundColor: computed.backgroundColor,
      borderTopStyle: computed.borderTopStyle,
    };
  });
  expect(style.whiteSpace).toBe('pre-wrap');
  expect(style.maxHeight).toBe('400px');
  expect(['auto', 'scroll']).toContain(style.overflowY);
  expect(style.fontFamily.toLowerCase()).toContain('monospace');
  expect(style.backgroundColor).toBe('rgb(249, 249, 249)');
  expect(style.borderTopStyle).toBe('solid');
});

test('TC-E2E-008 出力のHTML解釈防止', async ({ page }) => {
  // TC: TC-E2E-008 | TD: TD029 | TV: TV023 | TA: TA006 | Risk: R006 | Spec: 3.1.3,8.2
  await openApp(page);
  await page.locator('#salary').evaluate((el) => {
    el.value = '<img src=x onerror=window.__xssExecuted=true>';
  });
  await page.locator('#eventProb').fill('0');
  await page.locator('#runBtn').click();
  const xssExecuted = await page.evaluate(() => Boolean(window.__xssExecuted));
  expect(xssExecuted).toBe(false);
  await expect(page.locator('#output img')).toHaveCount(0);
});

test('TC-E2E-009 固定入力属性確認', async ({ page }) => {
  // TC: TC-E2E-009 | TD: TD030 | TV: TV041 | TA: TA006 | Risk: R006,R008 | Spec: 3.1.2,7.1
  await openApp(page);
  const expected = {
    startAge: { min: '0' },
    retirementAge: { min: '0' },
    pensionStartAge: { min: '0' },
    gapIncome: { min: '0' },
    salary: { min: '0' },
    monthlyPension: { min: '0' },
    initialCash: { min: '0' },
    initialInv: { min: '0' },
    expenseCurrent: { min: '0' },
    expenseGap: { min: '0' },
    expenseRetired: { min: '0' },
    investRate: { min: '0', max: '100' },
    interest: { min: '0', step: '0.1' },
    eventProb: { min: '0', max: '100', step: '0.1' },
  };
  for (const [id, attrs] of Object.entries(expected)) {
    for (const [name, value] of Object.entries(attrs)) {
      const actual = await page.locator(`#${id}`).getAttribute(name);
      expect(actual, `${id}.${name}`).toBe(value);
    }
  }
});

test('TC-E2E-010 動的給与変更入力属性確認', async ({ page }) => {
  // TC: TC-E2E-010 | TD: TD030 | TV: TV041 | TA: TA006 | Risk: R006,R008 | Spec: 3.1.2,7.1
  await openApp(page);
  await page.locator('#toggleSalaryChanges').click();
  await page.locator('#addSalaryChange').click();
  const item = page.locator('.salary-change-item').last();
  expect(await item.locator('.salary-change-age').getAttribute('min'), 'salaryChangeAge.min').toBe('1');
  expect(await item.locator('.salary-change-age').getAttribute('max'), 'salaryChangeAge.max').toBe('100');
  expect(await item.locator('.salary-change-salary').getAttribute('min'), 'salaryChangeSalary.min').toBe('0');
});

test('TC-E2E-011 注意表示の必須3要素', async ({ page }) => {
  // TC: TC-E2E-011 | TD: TD031 | TV: TV034 | TA: TA010 | Risk: R010 | Spec: 3.1.4,11.1
  await openApp(page);
  const bodyText = await page.locator('body').innerText();
  expect(bodyText).toContain('外部');
  expect(bodyText).toContain('送信');
  expect(bodyText).toMatch(/金融助言|投資助言/);
  expect(bodyText).toContain('税務助言');
  expect(bodyText).toMatch(/個人差|医療費|介護費|税制|年金制度/);
});

test('TC-E2E-012 外部通信なし', async ({ page }) => {
  // TC: TC-E2E-012 | TD: TD033 | TV: TV025 | TA: TA007 | Risk: R007 | Spec: 1.3,8.1
  const externalRequests = [];
  page.on('request', (request) => {
    if (/^https?:\/\//.test(request.url())) externalRequests.push(request.url());
  });
  await openApp(page);
  await page.locator('#salary').fill('4000000');
  await addSalaryChange(page, 35, 5000000);
  await runWithNoRandomEvents(page);
  expect(externalRequests).toEqual([]);
});

test('TC-E2E-013 ストレージ永続化なし', async ({ page }) => {
  // TC: TC-E2E-013 | TD: TD035 | TV: TV027 | TA: TA007 | Risk: R007 | Spec: 4.2,8.1
  await openApp(page);
  await page.locator('#salary').fill('4000000');
  await runWithNoRandomEvents(page);
  const storage = await page.evaluate(() => ({
    localStorage: { ...window.localStorage },
    sessionStorage: { ...window.sessionStorage },
    cookie: document.cookie,
  }));
  expect(storage).toEqual({ localStorage: {}, sessionStorage: {}, cookie: '' });
});

test('TC-E2E-014 計算時間100ms以下', async ({ page, browserName }) => {
  // TC: TC-E2E-014 | TD: TD037 | TV: TV031 | TA: TA009 | Risk: R009 | Spec: 6.2
  test.skip(browserName !== 'chromium', 'performance threshold is defined for Chromium-equivalent standard measurement');
  await openApp(page);
  const measurements = await page.evaluate(() => {
    const opts = {
      startAge: 30,
      retirementAge: 65,
      pensionStartAge: 65,
      gapIncome: 0,
      salary: 3000000,
      salaryChanges: [],
      monthlyPension: 145000,
      initialCash: 1000000,
      initialInv: 0,
      expenseCurrent: 155600,
      expenseGap: 228000,
      expenseRetired: 228000,
      investRate: 0.2,
      annualInterest: 0.04,
      eventProb: 0,
      eventTypes: [{ name: '固定', cost: 1000 }],
    };
    for (let i = 0; i < 3; i += 1) window.simulateRetirement(opts);
    const values = [];
    for (let i = 0; i < 10; i += 1) {
      const start = performance.now();
      window.simulateRetirement(opts);
      values.push(performance.now() - start);
    }
    return values;
  });
  expect(percentile95(measurements)).toBeLessThanOrEqual(100);
});

test('TC-E2E-015 描画時間200ms以下', async ({ page, browserName }) => {
  // TC: TC-E2E-015 | TD: TD038 | TV: TV032 | TA: TA009 | Risk: R009 | Spec: 6.2
  test.skip(browserName !== 'chromium', 'performance threshold is defined for Chromium-equivalent standard measurement');
  await openApp(page);
  await page.locator('#eventProb').fill('0');
  const measurements = await page.evaluate(() => {
    for (let i = 0; i < 3; i += 1) window.runSimulation();
    const values = [];
    for (let i = 0; i < 10; i += 1) {
      const start = performance.now();
      window.runSimulation();
      values.push(performance.now() - start);
    }
    return values;
  });
  expect(percentile95(measurements)).toBeLessThanOrEqual(200);
});

test('TC-E2E-016 10回連続実行', async ({ page, browserName }) => {
  // TC: TC-E2E-016 | TD: TD039 | TV: TV033 | TA: TA009 | Risk: R009 | Spec: 6.2
  test.skip(browserName !== 'chromium', 'continuous performance scenario is recorded on Chromium');
  const errors = await openApp(page);
  await page.locator('#eventProb').fill('0');
  for (let i = 0; i < 10; i += 1) {
    await page.locator('#salary').fill(String(3000000 + i * 100000));
    await page.locator('#runBtn').click();
    await expect(page.locator('#output')).toContainText('-- 30歳1月 --');
  }
  expect(errors).toEqual([]);
});

test('TC-E2E-017 代表3ブラウザ主要フロー', async ({ page }) => {
  // TC: TC-E2E-017 | TD: TD040 | TV: TV028 | TA: TA008 | Risk: R008 | Spec: 7.3
  const errors = await openApp(page);
  await runWithNoRandomEvents(page);
  await expect(page.locator('#output')).toContainText('総資産');
  expect(errors).toEqual([]);
});

test('TC-E2E-018 number input差異確認', async ({ page }) => {
  // TC: TC-E2E-018 | TD: TD041 | TV: TV029 | TA: TA008 | Risk: R008 | Spec: 7.1,9.4
  const errors = await openApp(page);
  await page.locator('#startAge').fill('40');
  await page.locator('#retirementAge').fill('65');
  await page.locator('#pensionStartAge').fill('65');
  await page.locator('#salary').fill('4500000');
  await page.locator('#eventProb').fill('0');
  await page.locator('#runBtn').click();
  await expect(page.locator('#output')).toContainText('-- 40歳1月 --');
  expect(errors).toEqual([]);
});

test('TC-E2E-019 viewport境界確認', async ({ page, browserName }) => {
  // TC: TC-E2E-019 | TD: TD042 | TV: TV030 | TA: TA008 | Risk: R008 | Spec: 11.2,13
  test.skip(browserName !== 'chromium', 'viewport evidence is recorded once on Chromium');
  await page.setViewportSize({ width: 800, height: 600 });
  await openApp(page);
  await runWithNoRandomEvents(page);
  await expect(page.locator('#output')).toBeVisible();
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(page.locator('#runBtn')).toBeVisible();
  await page.setViewportSize({ width: 799, height: 599 });
  await expect(page.locator('#controls')).toBeVisible();
});
