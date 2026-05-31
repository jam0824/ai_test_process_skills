const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const appUrl = pathToFileURL(path.resolve(__dirname, '../../sample_app/retirement_simulator.html')).href;

async function openApp(page, options = {}) {
  const { requests, consoleErrors } = options;
  if (requests) {
    page.on('request', (request) => requests.push(request.url()));
  }
  if (consoleErrors) {
    page.on('console', (message) => {
      if (['error', 'warning'].includes(message.type())) {
        consoleErrors.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));
  }
  await page.goto(appUrl);
}

async function runSimulation(page) {
  await page.locator('#runBtn').click();
  await expect(page.locator('#output')).not.toBeEmpty();
  return page.locator('#output').textContent();
}

function percentile95(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * 0.95) - 1];
}

test('TC-E2E-001 給与変更UIの追加削除ができる', async ({ page }) => {
  // TC: TC-E2E-001 | TD: TD021 | TV: TV016 | TA: TA005 | Risk: R004 | Spec: spec/仕様書.md 2.2 F008, 3.1.2
  await openApp(page);
  await page.locator('#toggleSalaryChanges').click();
  await expect(page.locator('#salaryChanges')).toBeVisible();

  await page.locator('#addSalaryChange').click();
  await page.locator('#addSalaryChange').click();
  await expect(page.locator('.salary-change-item')).toHaveCount(2);

  await page.locator('.salary-change-age').nth(0).fill('35');
  await page.locator('.salary-change-salary').nth(0).fill('4000000');
  await page.locator('.salary-change-age').nth(1).fill('40');
  await page.locator('.salary-change-salary').nth(1).fill('5000000');

  await page.locator('.salary-change-item').nth(0).getByRole('button', { name: '削除' }).click();
  await expect(page.locator('.salary-change-item')).toHaveCount(1);

  const output = await runSimulation(page);
  expect(output).toContain('[年収: ¥5,000,000]');
});

test('TC-E2E-002 デフォルト開始で月次結果を表示できる', async ({ page }) => {
  // TC: TC-E2E-002 | TD: TD022 | TV: TV021 | TA: TA006 | Risk: R001,R002 | Spec: spec/仕様書.md 3.1.2, 3.1.3
  await openApp(page);
  const output = await runSimulation(page);
  expect(output).toContain('-- 30歳1月 --');
  expect(output).toContain('-- 100歳12月 --');
  expect(output).toMatch(/現金: ¥-?[\d,]+ 投資: ¥-?[\d,]+ 総資産: ¥-?[\d,]+/);
});

test('TC-E2E-003 出力エリアのスタイルが仕様に合う', async ({ page }) => {
  // TC: TC-E2E-003 | TD: TD023 | TV: TV022 | TA: TA006 | Risk: R002 | Spec: spec/仕様書.md 3.1.3
  await openApp(page);
  await runSimulation(page);
  const style = await page.locator('#output').evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      whiteSpace: computed.whiteSpace,
      backgroundColor: computed.backgroundColor,
      borderTopWidth: computed.borderTopWidth,
      borderTopStyle: computed.borderTopStyle,
      maxHeight: computed.maxHeight,
      overflowY: computed.overflowY,
      fontFamily: computed.fontFamily,
    };
  });
  expect(style.whiteSpace).toBe('pre-wrap');
  expect(style.backgroundColor).toBe('rgb(249, 249, 249)');
  expect(style.borderTopWidth).toBe('1px');
  expect(style.borderTopStyle).toBe('solid');
  expect(style.maxHeight).toBe('400px');
  expect(['auto', 'scroll']).toContain(style.overflowY);
  expect(style.fontFamily.toLowerCase()).toContain('monospace');
});

test('TC-E2E-004 結果表示はHTMLとして解釈されない', async ({ page }) => {
  // TC: TC-E2E-004 | TD: TD024 | TV: TV024 | TA: TA007 | Risk: R007 | Spec: spec/仕様書.md 3.1.3, 8.2
  await openApp(page);
  await page.evaluate(() => {
    window.__retirementSimulatorXss = false;
    document.getElementById('salary').value = '<img src=x onerror="window.__retirementSimulatorXss=true">';
  });
  await runSimulation(page);
  const xssFlag = await page.evaluate(() => window.__retirementSimulatorXss);
  const injectedImages = await page.locator('#output img').count();
  expect(xssFlag).toBe(false);
  expect(injectedImages).toBe(0);
});

test('TC-E2E-005 外部ネットワークリクエストが発生しない', async ({ page }) => {
  // TC: TC-E2E-005 | TD: TD025,TD030 | TV: TV025 | TA: TA007 | Risk: R009 | Spec: spec/仕様書.md 1.3, 8.1
  const requests = [];
  await openApp(page, { requests });
  await runSimulation(page);
  const externalRequests = requests.filter((url) => /^https?:\/\//.test(url));
  expect(externalRequests).toEqual([]);
});

test('TC-E2E-006 TC-E2E-007 代表ブラウザで主要操作と結果表示が成功する', async ({ page, browserName }) => {
  // TC: TC-E2E-006, TC-E2E-007 | TD: TD026 | TV: TV027 | TA: TA008 | Risk: R011 | Spec: spec/仕様書.md 7.3
  expect(['chromium', 'firefox', 'webkit']).toContain(browserName);
  await openApp(page);
  await page.locator('#eventProb').fill('0');
  const output = await runSimulation(page);
  expect(output).toContain('-- 30歳1月 --');
  expect(output).toContain('総資産:');
});

test('TC-E2E-009 空欄入力でもNaNやInfinityを表示しない', async ({ page }) => {
  // TC: TC-E2E-009 | TD: TD027 | TV: TV028 | TA: TA008 | Risk: R006,R011 | Spec: spec/仕様書.md 7.1, 9.4
  await openApp(page);
  for (const id of ['salary', 'gapIncome', 'monthlyPension', 'initialCash', 'initialInv', 'interest', 'eventProb']) {
    await page.locator(`#${id}`).fill('');
  }
  const output = await runSimulation(page);
  expect(output).not.toContain('NaN');
  expect(output).not.toContain('Infinity');
});

test('TC-E2E-010 指数表記入力でもNaNやInfinityを表示しない', async ({ page }) => {
  // TC: TC-E2E-010 | TD: TD027 | TV: TV028 | TA: TA008 | Risk: R006,R011 | Spec: spec/仕様書.md 7.1, 9.4
  await openApp(page);
  await page.locator('#salary').fill('1e6');
  await page.locator('#initialCash').fill('1e5');
  await page.locator('#eventProb').fill('0');
  const output = await runSimulation(page);
  expect(output).not.toContain('NaN');
  expect(output).not.toContain('Infinity');
});

test('TC-E2E-011 10回連続実行して最後の結果へ更新される', async ({ page }) => {
  // TC: TC-E2E-011 | TD: TD028 | TV: TV031 | TA: TA009 | Risk: R010 | Spec: spec/仕様書.md 6.2
  const consoleErrors = [];
  await openApp(page, { consoleErrors });
  await page.locator('#startAge').fill('100');
  await page.locator('#retirementAge').fill('100');
  await page.locator('#pensionStartAge').fill('100');
  await page.locator('#monthlyPension').fill('0');
  await page.locator('#expenseRetired').fill('0');
  await page.locator('#eventProb').fill('0');

  for (let index = 0; index < 10; index += 1) {
    await page.locator('#initialCash').fill(String(index * 1000));
    await runSimulation(page);
  }

  const output = await page.locator('#output').textContent();
  expect(output).toContain('現金: ¥9,000');
  expect(consoleErrors).toEqual([]);
});

test('TC-E2E-012 注意表示に必須文言が表示される', async ({ page }) => {
  // TC: TC-E2E-012 | TD: TD029 | TV: TV038 | TA: TA012 | Risk: R008 | Spec: spec/仕様書.md 3.1.4
  await openApp(page);
  const bodyText = await page.locator('body').innerText();
  expect(bodyText).toContain('ネットワーク通信');
  expect(bodyText).toMatch(/外部.*送信/);
  expect(bodyText).toContain('金融助言');
  expect(bodyText).toContain('税務助言');
  expect(bodyText).toContain('個人差');
});

test('TC-E2E-013 計算時間95パーセンタイルが100ms以下である', async ({ page }) => {
  // TC: TC-E2E-013 | TD: TD033 | TV: TV029 | TA: TA009 | Risk: R010 | Spec: spec/仕様書.md 6.2
  await openApp(page);
  const durations = await page.evaluate(() => {
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
      eventTypes: [{ name: '検証イベント', cost: 1000 }],
    };
    for (let index = 0; index < 3; index += 1) simulateRetirement(opts);
    return Array.from({ length: 10 }, () => {
      const start = performance.now();
      simulateRetirement(opts);
      return performance.now() - start;
    });
  });
  expect(percentile95(durations)).toBeLessThanOrEqual(100);
});

test('TC-E2E-014 描画時間95パーセンタイルが200ms以下である', async ({ page }) => {
  // TC: TC-E2E-014 | TD: TD034 | TV: TV030 | TA: TA009 | Risk: R010 | Spec: spec/仕様書.md 6.2
  await openApp(page);
  await page.locator('#eventProb').fill('0');
  const durations = [];
  for (let index = 0; index < 3; index += 1) {
    await runSimulation(page);
  }
  for (let index = 0; index < 10; index += 1) {
    const duration = await page.evaluate(async () => {
      const start = performance.now();
      runSimulation();
      await new Promise((resolve) => requestAnimationFrame(resolve));
      return performance.now() - start;
    });
    durations.push(duration);
  }
  expect(percentile95(durations)).toBeLessThanOrEqual(200);
});
