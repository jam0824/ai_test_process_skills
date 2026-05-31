const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { test, expect } = require('@playwright/test');

const targetPath = path.resolve(__dirname, '../../sample_app/retirement_simulator.html');
const targetUrl = pathToFileURL(targetPath).href;

const fields = {
  startAge: '#startAge',
  retirementAge: '#retirementAge',
  pensionStartAge: '#pensionStartAge',
  gapIncome: '#gapIncome',
  salary: '#salary',
  monthlyPension: '#monthlyPension',
  initialCash: '#initialCash',
  initialInv: '#initialInv',
  expenseCurrent: '#expenseCurrent',
  expenseGap: '#expenseGap',
  expenseRetired: '#expenseRetired',
  investRate: '#investRate',
  interest: '#interest',
  eventProb: '#eventProb',
};

function trace({ tc, td, tv, ta, spec, risk }) {
  return `TC: ${tc} | TD: ${td} | TV: ${tv} | TA: ${ta} | Spec: ${spec} | Risk: ${risk}`;
}

async function openApp(page) {
  await page.goto(targetUrl);
  await expect(page.locator('#controls')).toBeVisible();
}

async function monitorPage(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const dialogs = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('dialog', async dialog => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  return { consoleErrors, pageErrors, dialogs };
}

async function setValues(page, values) {
  for (const [id, value] of Object.entries(values)) {
    const locator = page.locator(fields[id]);
    await locator.fill(String(value));
  }
}

async function setDomValue(page, selector, value) {
  await page.locator(selector).evaluate((element, nextValue) => {
    element.value = nextValue;
  }, value);
}

async function runSimulation(page) {
  await page.locator('#runBtn').click();
  const output = page.locator('#output');
  await expect(output).not.toBeEmpty();
  return output.textContent();
}

async function assertNoInvalidNumbers(text) {
  expect(text).not.toMatch(/\bNaN\b/);
  expect(text).not.toMatch(/\bInfinity\b|∞/);
}

async function assertClean(monitors) {
  expect(monitors.dialogs, 'alert/dialog must not open').toEqual([]);
  expect(monitors.pageErrors, 'page errors must not occur').toEqual([]);
  expect(monitors.consoleErrors, 'console errors must not occur').toEqual([]);
}

async function addSalaryChange(page, age, salary) {
  await page.locator('#toggleSalaryChanges').click();
  await expect(page.locator('#salaryChanges')).toBeVisible();
  await page.locator('#addSalaryChange').click();
  const item = page.locator('.salary-change-item').last();
  await expect(item).toBeVisible();
  await item.locator('.salary-change-age').fill(String(age));
  await item.locator('.salary-change-salary').fill(String(salary));
  return item;
}

async function measureCalculation(page) {
  return page.evaluate(() => {
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
      eventTypes: [],
    };
    const start = performance.now();
    const result = simulateRetirement(opts);
    const durationMs = performance.now() - start;
    return { durationMs, lineCount: result.length };
  });
}

async function measureRender(page) {
  await setValues(page, { eventProb: 0 });
  const output = page.locator('#output');
  const durationMs = await page.evaluate(() => {
    const outputElement = document.getElementById('output');
    outputElement.textContent = '';
    const start = performance.now();
    document.getElementById('runBtn').click();
    return performance.now() - start;
  });
  await expect(output).not.toBeEmpty();
  return { durationMs, textLength: (await output.textContent()).length };
}

async function tabTo(page, selector, maxTabs = 30) {
  for (let i = 0; i < maxTabs; i += 1) {
    if (await page.locator(selector).evaluate(element => document.activeElement === element)) return;
    await page.keyboard.press('Tab');
  }
  expect(await page.locator(selector).evaluate(element => document.activeElement === element)).toBe(true);
}

test.describe('老後資金シミュレーター E2E', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  test('TC-E2E-001 初期値のまま開始', async ({ page }) => {
    // TC: TC-E2E-001 | TD: TD030 | TV: TV020 | TA: TA006 | Spec: README使い方, 仕様2.1, 3.1 | Risk: R002, R003, R009, R013
    const monitors = await monitorPage(page);
    const text = await runSimulation(page);
    await expect(page.getByText('プライバシー重視')).toBeVisible();
    expect(text).toContain('-- 30歳1月 --');
    expect(text).toContain('現金:');
    expect(text).toContain('投資:');
    expect(text).toContain('総資産:');
    await assertClean(monitors);
  });

  test('TC-E2E-002 README使用例 デフォルト', async ({ page }) => {
    // TC: TC-E2E-002 | TD: TD031 | TV: TV021 | TA: TA006 | Spec: README使用例, 仕様2.1, 3.1 | Risk: R002, R003, R005, R009, R013
    const text = await runSimulation(page);
    expect(text).toContain('-- 30歳1月 --');
    expect(text).toContain('給与:');
    expect(text).toContain('総資産:');
  });

  test('TC-E2E-003 README使用例 キャリアアップ', async ({ page }) => {
    // TC: TC-E2E-003 | TD: TD031 | TV: TV021 | TA: TA006 | Spec: README使用例, 仕様2.1, 3.1 | Risk: R002, R003, R005, R009, R013
    await setValues(page, { salary: 4000000, investRate: 25, interest: 4 });
    await addSalaryChange(page, 30, 5000000);
    await page.locator('#addSalaryChange').click();
    const second = page.locator('.salary-change-item').last();
    await second.locator('.salary-change-age').fill('40');
    await second.locator('.salary-change-salary').fill('7000000');
    const text = await runSimulation(page);
    expect(text).toContain('[年収: ¥5,000,000]');
    expect(text).toContain('[年収: ¥7,000,000]');
  });

  test('TC-E2E-004 README使用例 早期退職', async ({ page }) => {
    // TC: TC-E2E-004 | TD: TD031 | TV: TV021 | TA: TA006 | Spec: README使用例, 仕様2.1, 3.1 | Risk: R002, R003, R005, R009, R013
    await setValues(page, { salary: 6000000, retirementAge: 55, investRate: 30, interest: 5, gapIncome: 50000 });
    const text = await runSimulation(page);
    expect(text).toContain('-- 55歳1月 --');
    expect(text).toContain('退職後収入: ¥50,000');
  });

  test('TC-E2E-005 README使用例 資産枯渇', async ({ page }) => {
    // TC: TC-E2E-005 | TD: TD031 | TV: TV021 | TA: TA006 | Spec: README使用例, 仕様2.1, 3.1 | Risk: R002, R003, R005, R009, R013
    const monitors = await monitorPage(page);
    await setValues(page, { initialCash: 0, initialInv: 0, expenseRetired: 300000, retirementAge: 65, pensionStartAge: 65 });
    const text = await runSimulation(page);
    expect(text).toContain('総資産: ¥-');
    await assertClean(monitors);
  });

  test('TC-E2E-006 README使用例 イベント発生', async ({ page }) => {
    // TC: TC-E2E-006 | TD: TD031 | TV: TV021 | TA: TA006 | Spec: README使用例, 仕様2.1, 3.1 | Risk: R002, R003, R005, R009, R013
    await setValues(page, { eventProb: 100 });
    const text = await runSimulation(page);
    expect(text).toMatch(/▶ (入院|歯科治療|薬の購入|家電故障|車検|冠婚葬祭|健康診断|引越し):/);
  });

  test('TC-E2E-007 給与変更トグル操作', async ({ page }) => {
    // TC: TC-E2E-007 | TD: TD032 | TV: TV016 | TA: TA005 | Spec: 仕様2.2 F008, 3.1.2 | Risk: R005, R013
    await expect(page.locator('#salaryChanges')).toBeHidden();
    await page.locator('#toggleSalaryChanges').click();
    await expect(page.locator('#salaryChanges')).toBeVisible();
    await page.locator('#toggleSalaryChanges').click();
    await expect(page.locator('#salaryChanges')).toBeHidden();
  });

  test('TC-E2E-008 給与変更追加操作', async ({ page }) => {
    // TC: TC-E2E-008 | TD: TD032 | TV: TV016 | TA: TA005 | Spec: 仕様2.2 F008, 3.1.2 | Risk: R005, R013
    await addSalaryChange(page, 35, 4000000);
    await expect(page.locator('.salary-change-age')).toHaveCount(1);
    await expect(page.locator('.salary-change-salary')).toHaveCount(1);
    await expect(page.getByRole('button', { name: '削除' })).toHaveCount(1);
  });

  test('TC-E2E-009 給与変更削除操作', async ({ page }) => {
    // TC: TC-E2E-009 | TD: TD032 | TV: TV016 | TA: TA005 | Spec: 仕様2.2 F008, 3.1.2 | Risk: R005, R013
    await addSalaryChange(page, 35, 4000000);
    await page.getByRole('button', { name: '削除' }).click();
    await expect(page.locator('.salary-change-item')).toHaveCount(0);
  });

  test('TC-E2E-010 給与変更開始反映', async ({ page }) => {
    // TC: TC-E2E-010 | TD: TD032 | TV: TV016 | TA: TA005 | Spec: 仕様2.2 F008, 3.1.2 | Risk: R005, R013
    await addSalaryChange(page, 35, 4000000);
    const text = await runSimulation(page);
    expect(text).toContain('-- 35歳1月 --');
    expect(text).toContain('[年収: ¥4,000,000]');
  });

  test('TC-E2E-011 プライバシー説明の視認', async ({ page }) => {
    // TC: TC-E2E-011 | TD: TD033 | TV: TV030 | TA: TA009 | Spec: 仕様3.1.4, 8.1 | Risk: R009
    await expect(page.getByText('ネットワーク通信をせずローカルで動く')).toBeVisible();
    await expect(page.getByText('外部に送信されることはありません')).toBeVisible();
    await runSimulation(page);
    await expect(page.getByText('ネットワーク通信をせずローカルで動く')).toBeVisible();
  });

  test('TC-E2E-012 金融助言ではない旨の必須表示', async ({ page }) => {
    // TC: TC-E2E-012 | TD: TD034 | TV: TV031 | TA: TA009 | Spec: 仕様3.1.4, 11.1 | Risk: R009
    await expect(page.locator('body')).toContainText(/金融助言|税務助言/);
    await expect(page.locator('body')).toContainText(/実制度|個人差|別途確認/);
    await runSimulation(page);
    await expect(page.locator('body')).toContainText(/金融助言|税務助言/);
    await expect(page.locator('body')).toContainText(/実制度|個人差|別途確認/);
  });

  // TC: TC-E2E-013, TC-E2E-014, TC-E2E-015 | TD: TD036 | TV: TV026 | TA: TA007 | Spec: 仕様7.2, 8.2 | Risk: R007
  for (const [tc, name, value, forbidden] of [
    ['TC-E2E-013', 'XSS img onerror入力', '<img src=x onerror=alert(1)>', /<img|onerror|alert/],
    ['TC-E2E-014', 'XSS script入力', '<script>alert(1)</script>', /<script|alert/],
    ['TC-E2E-015', 'XSS記号列入力', '<>"&\'', /<>"&'/],
  ]) {
    test(`${tc} ${name}`, async ({ page }) => {
      // TC: ${tc} | TD: TD036 | TV: TV026 | TA: TA007 | Spec: 仕様7.2, 8.2 | Risk: R007
      const monitors = await monitorPage(page);
      await setValues(page, { retirementAge: 101, pensionStartAge: 101, eventProb: 0 });
      await setDomValue(page, '#salary', value);
      const text = await runSimulation(page);
      expect(text).not.toMatch(forbidden);
      await assertNoInvalidNumbers(text);
      await assertClean(monitors);
    });
  }

  test('TC-E2E-016 Network要求なし', async ({ page }) => {
    // TC: TC-E2E-016 | TD: TD039 | TV: TV029 | TA: TA008 | Spec: 仕様1.3, 8.1 | Risk: R008
    const requests = [];
    page.on('request', request => requests.push(request.url()));
    await setValues(page, { eventProb: 0 });
    await runSimulation(page);
    expect(requests.filter(url => !url.startsWith('file:'))).toEqual([]);
  });

  test('TC-E2E-017 外部リソースなし', async ({ page }) => {
    // TC: TC-E2E-017 | TD: TD039 | TV: TV029 | TA: TA008 | Spec: 仕様1.3, 8.1 | Risk: R008
    const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
    await runSimulation(page);
    const afterResources = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
    expect([...resources, ...afterResources].filter(url => /^https?:\/\//.test(url))).toEqual([]);
  });

  test('TC-E2E-018 ストレージ永続化なし', async ({ page, context }) => {
    // TC: TC-E2E-018 | TD: TD039 | TV: TV029 | TA: TA008 | Spec: 仕様1.3, 8.1 | Risk: R008
    await runSimulation(page);
    const storage = await page.evaluate(async () => ({
      localStorage: Object.keys(window.localStorage),
      sessionStorage: Object.keys(window.sessionStorage),
      indexedDb: indexedDB.databases ? (await indexedDB.databases()).map(db => db.name) : [],
    }));
    expect(storage.localStorage).toEqual([]);
    expect(storage.sessionStorage).toEqual([]);
    expect(storage.indexedDb).toEqual([]);
    expect(await context.cookies()).toEqual([]);
  });

  test('TC-E2E-019 外部API使用なし', async ({ page }) => {
    // TC: TC-E2E-019 | TD: TD039 | TV: TV029 | TA: TA008 | Spec: 仕様1.3, 8.1 | Risk: R008
    const calls = await page.evaluate(async () => {
      const used = [];
      const originalFetch = window.fetch;
      const OriginalXhr = window.XMLHttpRequest;
      const originalBeacon = navigator.sendBeacon;
      window.fetch = (...args) => {
        used.push(`fetch:${args[0]}`);
        return originalFetch(...args);
      };
      window.XMLHttpRequest = function XMLHttpRequestProxy() {
        used.push('XMLHttpRequest');
        return new OriginalXhr();
      };
      navigator.sendBeacon = (...args) => {
        used.push(`sendBeacon:${args[0]}`);
        return originalBeacon.apply(navigator, args);
      };
      document.getElementById('runBtn').click();
      return used;
    });
    expect(calls).toEqual([]);
  });

  // TC: TC-E2E-020, TC-E2E-021, TC-E2E-022, TC-E2E-023, TC-E2E-024, TC-E2E-025, TC-E2E-026, TC-E2E-027, TC-E2E-028, TC-E2E-029 | TD: TD040 | TV: TV033 | TA: TA010 | Spec: 仕様6.2 | Risk: R010
  for (let i = 1; i <= 10; i += 1) {
    const tc = `TC-E2E-${String(19 + i).padStart(3, '0')}`;
    test(`${tc} 計算性能測定${i}回目`, async ({ page }) => {
      // TC: ${tc} | TD: TD040 | TV: TV033 | TA: TA010 | Spec: 仕様6.2 | Risk: R010
      await page.setViewportSize({ width: 1280, height: 720 });
      for (let warmup = 0; warmup < 3; warmup += 1) await measureCalculation(page);
      const result = await measureCalculation(page);
      test.info().annotations.push({ type: 'measurement', description: `calculationMs=${result.durationMs.toFixed(3)}` });
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.lineCount).toBeGreaterThan(0);
    });
  }

  // TC: TC-E2E-030, TC-E2E-031, TC-E2E-032, TC-E2E-033, TC-E2E-034, TC-E2E-035, TC-E2E-036, TC-E2E-037, TC-E2E-038, TC-E2E-039 | TD: TD041 | TV: TV034 | TA: TA010 | Spec: 仕様6.2 | Risk: R010
  for (let i = 1; i <= 10; i += 1) {
    const tc = `TC-E2E-${String(29 + i).padStart(3, '0')}`;
    test(`${tc} 描画性能測定${i}回目`, async ({ page }) => {
      // TC: ${tc} | TD: TD041 | TV: TV034 | TA: TA010 | Spec: 仕様6.2 | Risk: R010
      await page.setViewportSize({ width: 1280, height: 720 });
      for (let warmup = 0; warmup < 3; warmup += 1) await measureRender(page);
      const result = await measureRender(page);
      test.info().annotations.push({ type: 'measurement', description: `renderMs=${result.durationMs.toFixed(3)}` });
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.textLength).toBeGreaterThan(0);
    });
  }

  // TC: TC-E2E-040, TC-E2E-041, TC-E2E-042, TC-E2E-043, TC-E2E-044, TC-E2E-045, TC-E2E-046, TC-E2E-047, TC-E2E-048, TC-E2E-049 | TD: TD042 | TV: TV035 | TA: TA010 | Spec: 仕様6.2 | Risk: R010
  for (let i = 1; i <= 10; i += 1) {
    const tc = `TC-E2E-${String(39 + i).padStart(3, '0')}`;
    const salary = 3000000 + i * 100000;
    test(`${tc} 10回連続実行 ${i}回目`, async ({ page }) => {
      // TC: ${tc} | TD: TD042 | TV: TV035 | TA: TA010 | Spec: 仕様6.2 | Risk: R010
      const monitors = await monitorPage(page);
      let previous = '';
      for (let run = 1; run <= i; run += 1) {
        await setValues(page, { salary: 3000000 + run * 100000, eventProb: 0 });
        const text = await runSimulation(page);
        expect(text).not.toBe(previous);
        expect(text).toContain('-- 30歳1月 --');
        previous = text;
      }
      expect(previous).toContain('給与:');
      expect(await page.locator('#salary').inputValue()).toBe(String(salary));
      await assertClean(monitors);
    });
  }

  // TC: TC-E2E-050, TC-E2E-051, TC-E2E-052 | TD: TD043 | TV: TV036 | TA: TA011 | Spec: 仕様7.3, 9.4 | Risk: R011
  for (const [tc, targetProject] of [
    ['TC-E2E-050', 'chromium'],
    ['TC-E2E-051', 'firefox'],
    ['TC-E2E-052', 'webkit'],
  ]) {
    test(`${tc} 代表環境 ${targetProject}`, async ({ page, browserName }) => {
      // TC: ${tc} | TD: TD043 | TV: TV036 | TA: TA011 | Spec: 仕様7.3, 9.4 | Risk: R011
      const text = await runSimulation(page);
      expect(text).toContain('総資産:');
      test.info().annotations.push({ type: 'project-scope', description: `expected=${targetProject}, actual=${browserName}` });
    });
  }

  // TC: TC-E2E-053, TC-E2E-054, TC-E2E-055, TC-E2E-056, TC-E2E-057, TC-E2E-058, TC-E2E-059, TC-E2E-060, TC-E2E-061 | TD: TD045 | TV: TV025 | TA: TA007 | Spec: 仕様7.1, 7.2, 9.4 | Risk: R006
  for (const [tc, targetProject, mode] of [
    ['TC-E2E-053', 'chromium', 'exponent'],
    ['TC-E2E-054', 'chromium', 'paste'],
    ['TC-E2E-055', 'chromium', 'spin'],
    ['TC-E2E-056', 'firefox', 'exponent'],
    ['TC-E2E-057', 'firefox', 'paste'],
    ['TC-E2E-058', 'firefox', 'spin'],
    ['TC-E2E-059', 'webkit', 'exponent'],
    ['TC-E2E-060', 'webkit', 'paste'],
    ['TC-E2E-061', 'webkit', 'spin'],
  ]) {
    test(`${tc} ${targetProject} number input ${mode}`, async ({ page, browserName }) => {
      // TC: ${tc} | TD: TD045 | TV: TV025 | TA: TA007 | Spec: 仕様7.1, 7.2, 9.4 | Risk: R006
      const salary = page.locator('#salary');
      if (mode === 'exponent') {
        await salary.fill('1e6');
      } else if (mode === 'paste') {
        await salary.click();
        await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
        await page.keyboard.insertText('3000000');
      } else {
        await salary.fill('3000000');
        await salary.focus();
        await page.keyboard.press('ArrowUp');
      }
      const text = await runSimulation(page);
      expect(text).toContain('総資産:');
      await assertNoInvalidNumbers(text);
      test.info().annotations.push({ type: 'project-scope', description: `expected=${targetProject}, actual=${browserName}` });
    });
  }

  // TC: TC-E2E-062, TC-E2E-063 | TD: TD046 | TV: TV038 | TA: TA011 | Spec: 仕様11.2, 13 C002 | Risk: R011
  for (const [tc, width, height] of [
    ['TC-E2E-062', 800, 600],
    ['TC-E2E-063', 1280, 720],
  ]) {
    test(`${tc} レイアウト ${width}x${height}`, async ({ page }) => {
      // TC: ${tc} | TD: TD046 | TV: TV038 | TA: TA011 | Spec: 仕様11.2, 13 C002 | Risk: R011
      await page.setViewportSize({ width, height });
      await addSalaryChange(page, 35, 4000000);
      await runSimulation(page);
      for (const selector of ['#startAge', '#salary', '#toggleSalaryChanges', '#addSalaryChange', '#runBtn', '#output']) {
        await expect(page.locator(selector)).toBeVisible();
        const box = await page.locator(selector).boundingBox();
        expect(box?.width ?? 0).toBeGreaterThan(0);
        expect(box?.height ?? 0).toBeGreaterThan(0);
      }
    });
  }

  test('TC-E2E-064 キーボード 入力移動', async ({ page }) => {
    // TC: TC-E2E-064 | TD: TD047 | TV: TV039 | TA: TA011 | Spec: 仕様9.4, 13 C003 | Risk: R011
    await page.keyboard.press('Tab');
    await expect(page.locator('#startAge')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#retirementAge')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#pensionStartAge')).toBeFocused();
  });

  test('TC-E2E-065 キーボード 給与変更表示', async ({ page }) => {
    // TC: TC-E2E-065 | TD: TD047 | TV: TV039 | TA: TA011 | Spec: 仕様9.4, 13 C003 | Risk: R011
    await tabTo(page, '#toggleSalaryChanges');
    await page.keyboard.press('Enter');
    await expect(page.locator('#salaryChanges')).toBeVisible();
  });

  test('TC-E2E-066 キーボード 給与変更追加', async ({ page }) => {
    // TC: TC-E2E-066 | TD: TD047 | TV: TV039 | TA: TA011 | Spec: 仕様9.4, 13 C003 | Risk: R011
    await page.locator('#toggleSalaryChanges').click();
    await tabTo(page, '#addSalaryChange');
    await page.keyboard.press('Enter');
    await expect(page.locator('.salary-change-item')).toHaveCount(1);
  });

  test('TC-E2E-067 キーボード 給与変更削除', async ({ page }) => {
    // TC: TC-E2E-067 | TD: TD047 | TV: TV039 | TA: TA011 | Spec: 仕様9.4, 13 C003 | Risk: R011
    await addSalaryChange(page, 35, 4000000);
    await tabTo(page, '.salary-change-item button');
    await page.keyboard.press('Enter');
    await expect(page.locator('.salary-change-item')).toHaveCount(0);
  });

  test('TC-E2E-068 キーボード 開始操作', async ({ page }) => {
    // TC: TC-E2E-068 | TD: TD047 | TV: TV039 | TA: TA011 | Spec: 仕様9.4, 13 C003 | Risk: R011
    await tabTo(page, '#runBtn');
    await page.keyboard.press('Enter');
    await expect(page.locator('#output')).not.toBeEmpty();
    await expect(page.locator('#output')).toContainText('-- 30歳1月 --');
  });
});
