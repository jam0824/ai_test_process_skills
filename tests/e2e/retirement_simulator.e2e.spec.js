const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const targetFromEnv = process.env.E2E_TARGET;
const defaultTargetPath = path.resolve(__dirname, '../../sample_app/retirement_simulator.html');
const targetUrl = targetFromEnv && /^(https?:|file:)/i.test(targetFromEnv)
  ? targetFromEnv
  : pathToFileURL(path.resolve(targetFromEnv || defaultTargetPath)).href;

function isInternalRequest(url) {
  const parsed = new URL(url);
  if (['file:', 'data:', 'about:'].includes(parsed.protocol)) {
    return true;
  }

  const target = new URL(targetUrl);
  return parsed.origin === target.origin;
}

async function openApp(page) {
  const runtime = {
    errors: [],
    externalRequests: [],
    networkRequests: [],
  };

  page.on('pageerror', (error) => {
    runtime.errors.push(`pageerror: ${error.message}`);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      runtime.errors.push(`console: ${message.text()}`);
    }
  });
  page.on('request', (request) => {
    const url = request.url();
    const protocol = new URL(url).protocol;
    if (!['about:', 'data:', 'file:'].includes(protocol)) {
      runtime.networkRequests.push(url);
    }
    if (!isInternalRequest(url)) {
      runtime.externalRequests.push(url);
    }
  });

  await page.goto(targetUrl);
  await expect(page.locator('#runBtn')).toBeVisible();
  runtime.externalRequests.length = 0;
  runtime.networkRequests.length = 0;
  return runtime;
}

async function setInput(page, id, value) {
  await page.locator(`#${id}`).fill(value === null || value === undefined ? '' : String(value));
}

async function setRawInput(page, id, value) {
  await page.locator(`#${id}`).evaluate((element, nextValue) => {
    element.value = String(nextValue);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function ensureSalaryChangesOpen(page) {
  const panel = page.locator('#salaryChanges');
  if (!(await panel.isVisible())) {
    await page.locator('#toggleSalaryChanges').click();
  }
  await expect(panel).toBeVisible();
}

async function addSalaryChange(page, age, salary) {
  await ensureSalaryChangesOpen(page);
  await page.locator('#addSalaryChange').click();
  const item = page.locator('.salary-change-item').last();
  await item.locator('.salary-change-age').fill(age === null || age === undefined ? '' : String(age));
  await item.locator('.salary-change-salary').fill(salary === null || salary === undefined ? '' : String(salary));
  return item;
}

async function runSimulation(page, values = {}, options = {}) {
  const rawIds = new Set(options.rawIds || []);
  for (const [id, value] of Object.entries(values)) {
    if (rawIds.has(id)) {
      await setRawInput(page, id, value);
    } else {
      await setInput(page, id, value);
    }
  }

  for (const change of options.salaryChanges || []) {
    await addSalaryChange(page, change.age, change.salary);
  }

  await page.locator('#runBtn').click();
  const output = page.locator('#output');
  if (!options.allowEmptyOutput) {
    await expect(output).not.toHaveText('');
  }
  return (await output.textContent()) || '';
}

function expectNoRuntimeErrors(runtime) {
  expect(runtime.errors, `Runtime errors:\n${runtime.errors.join('\n')}`).toEqual([]);
}

function expectNoExternalRequests(runtime) {
  expect(runtime.externalRequests, `External requests:\n${runtime.externalRequests.join('\n')}`).toEqual([]);
}

function expectNoNetworkRequests(runtime) {
  expect(runtime.networkRequests, `Network requests:\n${runtime.networkRequests.join('\n')}`).toEqual([]);
  expectNoExternalRequests(runtime);
}

async function readClientStorage(page) {
  return page.evaluate(() => ({
    localStorage: Object.fromEntries(Object.entries(localStorage)),
    sessionStorage: Object.fromEntries(Object.entries(sessionStorage)),
    cookie: document.cookie,
  }));
}

function expectNoClientStorageChange(before, after) {
  expect(after).toEqual(before);
}

function expectNoInvalidNumbers(text) {
  expect(text).not.toMatch(/\bNaN\b|(?:^|[^A-Za-z])-?Infinity\b/);
}

function expectHealthyOutput(text) {
  expect(text).toContain('--');
  expect(text).toContain('総資産');
  expectNoInvalidNumbers(text);
}

test.describe('retirement_simulator.html E2E', () => {
  test('TC-E2E-001 負の年収でも結果表示が破綻しない', async ({ page }) => {
    // TC: TC-E2E-001 | TD: TD003 | TV: TV003 | TA: TA001 | Risk: R001, R006 | Spec: spec/仕様書.md 7.2、11.1
    const runtime = await openApp(page);
    const text = await runSimulation(page, { salary: -3000000, eventProb: 0 });

    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-002 年収未入力は0円相当として扱われる', async ({ page }) => {
    // TC: TC-E2E-002 | TD: TD003 | TV: TV003 | TA: TA001 | Risk: R001, R006 | Spec: spec/仕様書.md 7.2、11.1
    const runtime = await openApp(page);
    const text = await runSimulation(page, { salary: '', eventProb: 0 });

    expect(text).toContain('給与: ¥0');
    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-003 非常に大きい年収でもNaNやInfinityにならない', async ({ page }) => {
    // TC: TC-E2E-003 | TD: TD003 | TV: TV003 | TA: TA001 | Risk: R001, R006 | Spec: spec/仕様書.md 7.2、11.1
    const runtime = await openApp(page);
    const text = await runSimulation(page, { salary: 100000000, eventProb: 0 });

    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-008 開始年齢0歳でも100歳まで表示される', async ({ page }) => {
    // TC: TC-E2E-008 | TD: TD007 | TV: TV007 | TA: TA002 | Risk: R002, R006 | Spec: spec/仕様書.md 2.2 F002、11.2
    const runtime = await openApp(page);
    const text = await runSimulation(page, { startAge: 0, eventProb: 0 });

    expect(text).toContain('-- 0歳1月 --');
    expect(text).toContain('-- 100歳12月 --');
    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-009 開始年齢100歳では100歳分のみ表示される', async ({ page }) => {
    // TC: TC-E2E-009 | TD: TD007 | TV: TV007 | TA: TA002 | Risk: R002, R006 | Spec: spec/仕様書.md 2.2 F002、11.2
    const runtime = await openApp(page);
    const text = await runSimulation(page, { startAge: 100, eventProb: 0 });

    expect(text).toContain('-- 100歳1月 --');
    expect(text).toContain('-- 100歳12月 --');
    expectNoInvalidNumbers(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-010 開始年齢101歳は操作不能にならず結果表示される', async ({ page }) => {
    // TC: TC-E2E-010 | TD: TD007 | TV: TV007 | TA: TA002 | Risk: R002, R006 | Spec: spec/仕様書.md 2.2 F002、11.2
    const runtime = await openApp(page);
    const text = await runSimulation(page, { startAge: 101, eventProb: 0 });

    expect(text).not.toBe('');
    expectNoInvalidNumbers(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-011 負の開始年齢でも処理が停止しない', async ({ page }) => {
    // TC: TC-E2E-011 | TD: TD007 | TV: TV007 | TA: TA002 | Risk: R002, R006 | Spec: spec/仕様書.md 2.2 F002、11.2
    const runtime = await openApp(page);
    const text = await runSimulation(page, { startAge: -1, eventProb: 0 });

    expect(text).toContain('-- -1歳1月 --');
    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-012 投資割合0%では給与から投資に回さない', async ({ page }) => {
    // TC: TC-E2E-012 | TD: TD010 | TV: TV010 | TA: TA003 | Risk: R003, R006 | Spec: spec/仕様書.md 3.1.2、7.2
    const runtime = await openApp(page);
    const text = await runSimulation(page, { salary: 3000000, investRate: 0, eventProb: 0 });

    expect(text).toContain('(投資: ¥0)');
    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-013 投資割合100%では手取り給与全額が投資に回る', async ({ page }) => {
    // TC: TC-E2E-013 | TD: TD010 | TV: TV010 | TA: TA003 | Risk: R003, R006 | Spec: spec/仕様書.md 3.1.2、7.2
    const runtime = await openApp(page);
    const text = await runSimulation(page, { salary: 3000000, investRate: 100, eventProb: 0 });

    expect(text).toContain('(投資: ¥188,125)');
    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-014 投資割合33.3%でも小数を含む割合で計算が破綻しない', async ({ page }) => {
    // TC: TC-E2E-014 | TD: TD010 | TV: TV010 | TA: TA003 | Risk: R003, R006 | Spec: spec/仕様書.md 3.1.2、7.2
    const runtime = await openApp(page);
    const text = await runSimulation(page, { salary: 3000000, investRate: 33.3, eventProb: 0 });

    expect(text).toContain('給与:');
    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-015 投資割合150%の直接入力でもNaNやInfinityにならない', async ({ page }) => {
    // TC: TC-E2E-015 | TD: TD010 | TV: TV010 | TA: TA003 | Risk: R003, R006 | Spec: spec/仕様書.md 3.1.2、7.2
    const runtime = await openApp(page);
    const text = await runSimulation(page, { investRate: 150, eventProb: 0 }, { rawIds: ['investRate'] });

    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-016 給与変更年齢に到達した月から年収が変更される', async ({ page }) => {
    // TC: TC-E2E-016 | TD: TD017 | TV: TV017 | TA: TA005 | Risk: R004 | Spec: spec/仕様書.md 2.2 F008
    const runtime = await openApp(page);
    const text = await runSimulation(page, {
      startAge: 39,
      retirementAge: 41,
      pensionStartAge: 41,
      eventProb: 0,
    }, { salaryChanges: [{ age: 40, salary: 8000000 }] });

    expect(text).toContain('[年収: ¥8,000,000]');
    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-017 給与変更年齢ちょうどの開始でも変更後年収が使われる', async ({ page }) => {
    // TC: TC-E2E-017 | TD: TD017 | TV: TV017 | TA: TA005 | Risk: R004 | Spec: spec/仕様書.md 2.2 F008
    const runtime = await openApp(page);
    const text = await runSimulation(page, {
      startAge: 40,
      retirementAge: 41,
      pensionStartAge: 41,
      eventProb: 0,
    }, { salaryChanges: [{ age: 40, salary: 8000000 }] });

    expect(text).toContain('[年収: ¥8,000,000]');
    expectNoInvalidNumbers(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-018 給与変更トグルで入力欄を表示できる', async ({ page }) => {
    // TC: TC-E2E-018 | TD: TD018 | TV: TV018 | TA: TA005 | Risk: R004, R006 | Spec: spec/仕様書.md 2.2 F008、3.1.2
    const runtime = await openApp(page);

    await page.locator('#toggleSalaryChanges').click();

    await expect(page.locator('#salaryChanges')).toBeVisible();
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-019 給与変更トグルで入力欄を非表示に戻せる', async ({ page }) => {
    // TC: TC-E2E-019 | TD: TD018 | TV: TV018 | TA: TA005 | Risk: R004, R006 | Spec: spec/仕様書.md 2.2 F008、3.1.2
    const runtime = await openApp(page);

    await page.locator('#toggleSalaryChanges').click();
    await page.locator('#toggleSalaryChanges').click();

    await expect(page.locator('#salaryChanges')).toBeHidden();
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-020 給与変更を追加してシミュレーションに使える', async ({ page }) => {
    // TC: TC-E2E-020 | TD: TD018 | TV: TV018 | TA: TA005 | Risk: R004, R006 | Spec: spec/仕様書.md 2.2 F008、3.1.2
    const runtime = await openApp(page);
    await addSalaryChange(page, 40, 8000000);

    await expect(page.locator('.salary-change-item')).toHaveCount(1);
    const text = await runSimulation(page, { startAge: 39, retirementAge: 41, pensionStartAge: 41, eventProb: 0 });

    expect(text).toContain('[年収: ¥8,000,000]');
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-021 複数の給与変更を削除して0件に戻せる', async ({ page }) => {
    // TC: TC-E2E-021 | TD: TD018 | TV: TV018 | TA: TA005 | Risk: R004, R006 | Spec: spec/仕様書.md 2.2 F008、3.1.2
    const runtime = await openApp(page);
    await addSalaryChange(page, 40, 8000000);
    await addSalaryChange(page, 50, 9000000);

    while (await page.locator('.salary-change-item').count() > 0) {
      await page.locator('.salary-change-item').first().getByRole('button', { name: '削除' }).click();
    }
    const text = await runSimulation(page, { eventProb: 0 });

    await expect(page.locator('.salary-change-item')).toHaveCount(0);
    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-027 年齢未入力の給与変更は反映されない', async ({ page }) => {
    // TC: TC-E2E-027 | TD: TD020 | TV: TV020 | TA: TA005 | Risk: R004, R006 | Spec: spec/仕様書.md 2.2 F008、7.2
    const runtime = await openApp(page);
    const text = await runSimulation(page, { startAge: 39, retirementAge: 41, pensionStartAge: 41, eventProb: 0 }, {
      salaryChanges: [{ age: '', salary: 8000000 }],
    });

    expect(text).not.toContain('[年収: ¥8,000,000]');
    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-028 年収未入力の給与変更は反映されない', async ({ page }) => {
    // TC: TC-E2E-028 | TD: TD020 | TV: TV020 | TA: TA005 | Risk: R004, R006 | Spec: spec/仕様書.md 2.2 F008、7.2
    const runtime = await openApp(page);
    const text = await runSimulation(page, { startAge: 39, retirementAge: 41, pensionStartAge: 41, eventProb: 0 }, {
      salaryChanges: [{ age: 40, salary: '' }],
    });

    expect(text).not.toContain('[年収: ¥0]');
    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-029 年収0円の給与変更は反映されない', async ({ page }) => {
    // TC: TC-E2E-029 | TD: TD020 | TV: TV020 | TA: TA005 | Risk: R004, R006 | Spec: spec/仕様書.md 2.2 F008、7.2
    const runtime = await openApp(page);
    const text = await runSimulation(page, { startAge: 39, retirementAge: 41, pensionStartAge: 41, eventProb: 0 }, {
      salaryChanges: [{ age: 40, salary: 0 }],
    });

    expect(text).not.toContain('[年収: ¥0]');
    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-030 負の年齢の給与変更は反映されない', async ({ page }) => {
    // TC: TC-E2E-030 | TD: TD020 | TV: TV020 | TA: TA005 | Risk: R004, R006 | Spec: spec/仕様書.md 2.2 F008、7.2
    const runtime = await openApp(page);
    const text = await runSimulation(page, { startAge: 0, retirementAge: 2, pensionStartAge: 2, eventProb: 0 }, {
      salaryChanges: [{ age: -1, salary: 8000000 }],
    });

    expect(text).not.toContain('[年収: ¥8,000,000]');
    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-031 イベント確率0%ではランダムイベントが出ない', async ({ page }) => {
    // TC: TC-E2E-031 | TD: TD022 | TV: TV022 | TA: TA006 | Risk: R005 | Spec: spec/仕様書.md 5.3
    const runtime = await openApp(page);
    const text = await runSimulation(page, { eventProb: 0 });

    expect(text).not.toContain('▶');
    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-032 イベント確率100%ではイベントが出る', async ({ page }) => {
    // TC: TC-E2E-032 | TD: TD022 | TV: TV022 | TA: TA006 | Risk: R005 | Spec: spec/仕様書.md 5.3
    const runtime = await openApp(page);
    const text = await runSimulation(page, { eventProb: 100 });

    expect(text).toContain('▶');
    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-033 デフォルト入力で30歳から100歳まで流れが表示される', async ({ page }) => {
    // TC: TC-E2E-033 | TD: TD026 | TV: TV026 | TA: TA007 | Risk: R002 | Spec: spec/仕様書.md 9.2
    const runtime = await openApp(page);
    const text = await runSimulation(page);

    expect(text).toContain('-- 30歳1月 --');
    expect(text).toContain('-- 100歳12月 --');
    expect(text).toContain('給与:');
    expect(text).toContain('年金:');
    expectNoInvalidNumbers(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-036 開始クリックでシミュレーション結果が初回表示される', async ({ page }) => {
    // TC: TC-E2E-036 | TD: TD032 | TV: TV032 | TA: TA009 | Risk: R006, R008 | Spec: spec/仕様書.md 3.1.1、3.1.3
    const runtime = await openApp(page);
    const text = await runSimulation(page, { eventProb: 0 });

    expect(text).toContain('-- 30歳1月 --');
    expect(text).toContain('-- 100歳12月 --');
    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-037 条件変更後の再実行で結果が更新される', async ({ page }) => {
    // TC: TC-E2E-037 | TD: TD034 | TV: TV034 | TA: TA009 | Risk: R006, R008 | Spec: spec/仕様書.md 3.1.1、F006
    const runtime = await openApp(page);
    const before = await runSimulation(page, { salary: 3000000, eventProb: 0 });
    const after = await runSimulation(page, { salary: 4000000, eventProb: 0 });

    expect(after).not.toBe(before);
    expectHealthyOutput(after);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-038 年収変更で結果が変わる', async ({ page }) => {
    // TC: TC-E2E-038 | TD: TD035 | TV: TV035 | TA: TA010 | Risk: R006 | Spec: spec/仕様書.md 3.1.2、F007
    const runtime = await openApp(page);
    const before = await runSimulation(page, { salary: 3000000, eventProb: 0 });
    const after = await runSimulation(page, { salary: 4000000, eventProb: 0 });

    expect(after).not.toBe(before);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-039 現在生活費変更で結果が変わる', async ({ page }) => {
    // TC: TC-E2E-039 | TD: TD035 | TV: TV035 | TA: TA010 | Risk: R006 | Spec: spec/仕様書.md 3.1.2、F007
    const runtime = await openApp(page);
    const before = await runSimulation(page, { expenseCurrent: 155600, eventProb: 0 });
    const after = await runSimulation(page, { expenseCurrent: 200000, eventProb: 0 });

    expect(after).not.toBe(before);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-040 投資割合変更で結果が変わる', async ({ page }) => {
    // TC: TC-E2E-040 | TD: TD035 | TV: TV035 | TA: TA010 | Risk: R006 | Spec: spec/仕様書.md 3.1.2、F007
    const runtime = await openApp(page);
    const before = await runSimulation(page, { investRate: 0, eventProb: 0 });
    const after = await runSimulation(page, { investRate: 50, eventProb: 0 });

    expect(after).not.toBe(before);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-041 利回り変更で結果が変わる', async ({ page }) => {
    // TC: TC-E2E-041 | TD: TD035 | TV: TV035 | TA: TA010 | Risk: R006 | Spec: spec/仕様書.md 3.1.2、F007
    const runtime = await openApp(page);
    const common = { startAge: 30, retirementAge: 33, pensionStartAge: 33, initialInv: 1000000, eventProb: 0 };
    const before = await runSimulation(page, { ...common, interest: 0 });
    const after = await runSimulation(page, { ...common, interest: 10 });

    expect(after).not.toBe(before);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-042 イベント確率変更で結果が変わる', async ({ page }) => {
    // TC: TC-E2E-042 | TD: TD035 | TV: TV035 | TA: TA010 | Risk: R006 | Spec: spec/仕様書.md 3.1.2、F007
    const runtime = await openApp(page);
    const before = await runSimulation(page, { eventProb: 0 });
    const after = await runSimulation(page, { eventProb: 100 });

    expect(after).not.toBe(before);
    expect(after).toContain('▶');
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-043 空文字入力が混在しても結果が破綻しない', async ({ page }) => {
    // TC: TC-E2E-043 | TD: TD036 | TV: TV036 | TA: TA010 | Risk: R006 | Spec: spec/仕様書.md 7.2
    const runtime = await openApp(page);
    const text = await runSimulation(page, {
      salary: '',
      monthlyPension: '',
      initialCash: '',
      initialInv: '',
      eventProb: 0,
    });

    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-044 数値欄に非数値が入ってもNaNやInfinityを表示しない', async ({ page }) => {
    // TC: TC-E2E-044 | TD: TD036 | TV: TV036 | TA: TA010 | Risk: R006 | Spec: spec/仕様書.md 7.2
    const runtime = await openApp(page);
    const text = await runSimulation(page, { salary: 'abc', eventProb: 0 }, { rawIds: ['salary'] });

    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-045 主要入力が未設定でもシミュレーションが停止しない', async ({ page }) => {
    // TC: TC-E2E-045 | TD: TD036 | TV: TV036 | TA: TA010 | Risk: R006 | Spec: spec/仕様書.md 7.2
    const runtime = await openApp(page);
    const text = await runSimulation(page, {
      startAge: '',
      retirementAge: '',
      pensionStartAge: '',
      salary: '',
      monthlyPension: '',
      eventProb: 0,
    });

    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-046 給与変更追加後の結果に変更後年収が出る', async ({ page }) => {
    // TC: TC-E2E-046 | TD: TD038 | TV: TV038 | TA: TA010 | Risk: R004, R006 | Spec: spec/仕様書.md 2.2 F008
    const runtime = await openApp(page);
    const text = await runSimulation(page, { startAge: 39, retirementAge: 41, pensionStartAge: 41, eventProb: 0 }, {
      salaryChanges: [{ age: 40, salary: 8000000 }],
    });

    expect(text).toContain('[年収: ¥8,000,000]');
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-047 給与変更削除後は変更後年収が出ない', async ({ page }) => {
    // TC: TC-E2E-047 | TD: TD038 | TV: TV038 | TA: TA010 | Risk: R004, R006 | Spec: spec/仕様書.md 2.2 F008
    const runtime = await openApp(page);
    const item = await addSalaryChange(page, 40, 8000000);
    await item.getByRole('button', { name: '削除' }).click();
    const text = await runSimulation(page, { startAge: 39, retirementAge: 41, pensionStartAge: 41, eventProb: 0 });

    expect(text).not.toContain('[年収: ¥8,000,000]');
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-048 給与変更削除後の再実行で結果が更新される', async ({ page }) => {
    // TC: TC-E2E-048 | TD: TD038 | TV: TV038 | TA: TA010 | Risk: R004, R006 | Spec: spec/仕様書.md 2.2 F008
    const runtime = await openApp(page);
    const item = await addSalaryChange(page, 40, 8000000);
    const before = await runSimulation(page, { startAge: 39, retirementAge: 41, pensionStartAge: 41, eventProb: 0 });
    await item.getByRole('button', { name: '削除' }).click();
    const after = await runSimulation(page, { eventProb: 0 });

    expect(before).toContain('[年収: ¥8,000,000]');
    expect(after).not.toContain('[年収: ¥8,000,000]');
    expect(after).not.toBe(before);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-049 READMEの基本シナリオを画面操作で確認できる', async ({ page }) => {
    // TC: TC-E2E-049 | TD: TD039 | TV: TV039 | TA: TA011 | Risk: R001, R002, R003, R004 | Spec: sample_app/README.md 使用例
    const runtime = await openApp(page);
    const text = await runSimulation(page, {
      salary: 4000000,
      retirementAge: 65,
      pensionStartAge: 65,
      monthlyPension: 150000,
      investRate: 20,
      interest: 4,
      eventProb: 0,
    });

    expect(text).toContain('-- 30歳1月 --');
    expect(text).toContain('給与:');
    expect(text).toContain('年金: ¥150,000');
    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-050 READMEの給与変動シナリオを画面操作で確認できる', async ({ page }) => {
    // TC: TC-E2E-050 | TD: TD039 | TV: TV039 | TA: TA011 | Risk: R001, R002, R003, R004 | Spec: sample_app/README.md 使用例
    const runtime = await openApp(page);
    const text = await runSimulation(page, {
      salary: 4000000,
      retirementAge: 65,
      pensionStartAge: 65,
      monthlyPension: 180000,
      investRate: 25,
      interest: 4,
      eventProb: 0,
    }, {
      salaryChanges: [
        { age: 30, salary: 5000000 },
        { age: 40, salary: 7000000 },
      ],
    });

    expect(text).toContain('[年収: ¥5,000,000]');
    expect(text).toContain('[年収: ¥7,000,000]');
    expect(text).toContain('年金: ¥180,000');
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-051 READMEの早期退職シナリオを画面操作で確認できる', async ({ page }) => {
    // TC: TC-E2E-051 | TD: TD039 | TV: TV039 | TA: TA011 | Risk: R001, R002, R003, R004 | Spec: sample_app/README.md 使用例
    const runtime = await openApp(page);
    const text = await runSimulation(page, {
      salary: 6000000,
      retirementAge: 55,
      pensionStartAge: 65,
      gapIncome: 50000,
      investRate: 30,
      interest: 5,
      eventProb: 0,
    });

    expect(text).toContain('-- 55歳1月 --');
    expect(text).toContain('退職後収入: ¥50,000');
    expect(text).toContain('-- 65歳1月 --');
    expect(text).toContain('年金:');
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-052 READMEの高収入・遅め退職シナリオを画面操作で確認できる', async ({ page }) => {
    // TC: TC-E2E-052 | TD: TD039 | TV: TV039 | TA: TA011 | Risk: R001, R002, R003, R004 | Spec: sample_app/README.md 使用例
    const runtime = await openApp(page);
    const text = await runSimulation(page, {
      salary: 10000000,
      retirementAge: 70,
      pensionStartAge: 65,
      monthlyPension: 200000,
      investRate: 40,
      interest: 3,
      eventProb: 0,
    });

    expect(text).toContain('-- 69歳12月 --');
    expect(text).toContain('-- 70歳1月 --');
    expect(text).toContain('年金: ¥200,000');
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-053 通常実行で外部通信が発生しない', async ({ page }) => {
    // TC: TC-E2E-053 | TD: TD043 | TV: TV043 | TA: TA012 | Risk: R007 | Spec: spec/仕様書.md 8.1、4.2
    const runtime = await openApp(page);
    const storageBefore = await readClientStorage(page);
    const text = await runSimulation(page, { eventProb: 0 });
    const storageAfter = await readClientStorage(page);

    expectHealthyOutput(text);
    expectNoNetworkRequests(runtime);
    expectNoClientStorageChange(storageBefore, storageAfter);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-054 入力変更後の実行でも外部通信が発生しない', async ({ page }) => {
    // TC: TC-E2E-054 | TD: TD043 | TV: TV043 | TA: TA012 | Risk: R007 | Spec: spec/仕様書.md 8.1、4.2
    const runtime = await openApp(page);
    const storageBefore = await readClientStorage(page);
    const text = await runSimulation(page, { salary: 5000000, initialCash: 3000000, eventProb: 0 });
    const storageAfter = await readClientStorage(page);

    expectHealthyOutput(text);
    expectNoNetworkRequests(runtime);
    expectNoClientStorageChange(storageBefore, storageAfter);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-055 初期表示から実行まで外部通信が発生しない', async ({ page }) => {
    // TC: TC-E2E-055 | TD: TD043 | TV: TV043 | TA: TA012 | Risk: R007 | Spec: spec/仕様書.md 8.1、4.2
    const runtime = await openApp(page);
    const storageBefore = await readClientStorage(page);
    const text = await runSimulation(page);
    const storageAfter = await readClientStorage(page);

    expectHealthyOutput(text);
    expectNoNetworkRequests(runtime);
    expectNoClientStorageChange(storageBefore, storageAfter);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-061 0歳開始の長期シミュレーションが操作不能にならない', async ({ page }, testInfo) => {
    // TC: TC-E2E-061 | TD: TD049 | TV: TV049 | TA: TA014 | Risk: R008 | Spec: spec/仕様書.md 6.1、6.2
    const runtime = await openApp(page);
    const startedAt = Date.now();
    const text = await runSimulation(page, { startAge: 0, eventProb: 0 });
    const elapsedMs = Date.now() - startedAt;

    await testInfo.attach('TC-E2E-061-performance', {
      body: `elapsedMs=${elapsedMs}`,
      contentType: 'text/plain',
    });
    expect(text).toContain('-- 100歳12月 --');
    await expect(page.locator('#runBtn')).toBeEnabled();
    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-062 イベント100%でも長期シミュレーションが操作不能にならない', async ({ page }, testInfo) => {
    // TC: TC-E2E-062 | TD: TD049 | TV: TV049 | TA: TA014 | Risk: R008 | Spec: spec/仕様書.md 6.1、6.2
    const runtime = await openApp(page);
    const startedAt = Date.now();
    const text = await runSimulation(page, { startAge: 0, eventProb: 100 });
    const elapsedMs = Date.now() - startedAt;

    await testInfo.attach('TC-E2E-062-performance', {
      body: `elapsedMs=${elapsedMs}`,
      contentType: 'text/plain',
    });
    expect(text).toContain('▶');
    await expect(page.locator('#runBtn')).toBeEnabled();
    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-063 長期出力が生成されても画面が操作不能にならない', async ({ page }, testInfo) => {
    // TC: TC-E2E-063 | TD: TD049 | TV: TV049 | TA: TA014 | Risk: R008 | Spec: spec/仕様書.md 6.1、6.2
    const runtime = await openApp(page);
    const text = await runSimulation(page, { startAge: 0, eventProb: 100 });

    await testInfo.attach('TC-E2E-063-output-size', {
      body: `characters=${text.length}`,
      contentType: 'text/plain',
    });
    expect(text).toContain('-- 0歳1月 --');
    expect(text).toContain('-- 100歳12月 --');
    await expect(page.locator('#runBtn')).toBeEnabled();
    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-065 投資割合のHTML属性制約を確認できる', async ({ page }) => {
    // TC: TC-E2E-065 | TD: TD037 | TV: TV037 | TA: TA010 | Risk: R006 | Spec: spec/仕様書.md 3.1.2、7.1
    const runtime = await openApp(page);

    await expect(page.locator('#investRate')).toHaveAttribute('min', '0');
    await expect(page.locator('#investRate')).toHaveAttribute('max', '100');
    const text = await runSimulation(page, { investRate: 100, eventProb: 0 });

    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-066 給与変更年齢のHTML属性制約を確認できる', async ({ page }) => {
    // TC: TC-E2E-066 | TD: TD037 | TV: TV037 | TA: TA010 | Risk: R006 | Spec: spec/仕様書.md 3.1.2、7.1
    const runtime = await openApp(page);
    await addSalaryChange(page, 100, 8000000);

    await expect(page.locator('.salary-change-age').last()).toHaveAttribute('min', '1');
    await expect(page.locator('.salary-change-age').last()).toHaveAttribute('max', '100');
    const text = await runSimulation(page, { startAge: 99, retirementAge: 100, pensionStartAge: 100, eventProb: 0 });

    expectNoInvalidNumbers(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-067 属性範囲外の直接入力でも処理が破綻しない', async ({ page }) => {
    // TC: TC-E2E-067 | TD: TD037 | TV: TV037 | TA: TA010 | Risk: R006 | Spec: spec/仕様書.md 3.1.2、7.1
    const runtime = await openApp(page);
    const text = await runSimulation(page, { investRate: 150, eventProb: 0 }, { rawIds: ['investRate'] });

    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-068 ローカルHTMLを直接開いて初期表示できる', async ({ page }) => {
    // TC: TC-E2E-068 | TD: TD044 | TV: TV044 | TA: TA012 | Risk: R007, R009 | Spec: spec/仕様書.md 10.1
    const runtime = await openApp(page);

    await expect(page.locator('h1')).toContainText('老後資金シミュレーター');
    await expect(page.locator('#runBtn')).toBeVisible();
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-069 ローカルHTMLを直接開いてシミュレーションできる', async ({ page }) => {
    // TC: TC-E2E-069 | TD: TD044 | TV: TV044 | TA: TA012 | Risk: R007, R009 | Spec: spec/仕様書.md 10.1
    const runtime = await openApp(page);
    const text = await runSimulation(page, { eventProb: 0 });

    expectHealthyOutput(text);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-080 画面と結果に日本語ラベルが表示される', async ({ page }) => {
    // TC: TC-E2E-080 | TD: TD053 | TV: TV053 | TA: TA015 | Risk: R009 | Spec: spec/仕様書.md 3.1.3、7.3
    const runtime = await openApp(page);
    const text = await runSimulation(page, { eventProb: 0 });

    await expect(page.locator('body')).toContainText('現在の年齢');
    await expect(page.locator('body')).toContainText('年収');
    expect(text).toContain('給与:');
    expect(text).toContain('総資産:');
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-081 結果に円記号つきの金額が表示される', async ({ page }) => {
    // TC: TC-E2E-081 | TD: TD053 | TV: TV053 | TA: TA015 | Risk: R009 | Spec: spec/仕様書.md 3.1.3、7.3
    const runtime = await openApp(page);
    const text = await runSimulation(page, { eventProb: 0 });

    expect(text).toContain('¥');
    expect(text).toMatch(/¥\d{1,3}(,\d{3})*/);
    expectNoRuntimeErrors(runtime);
  });

  test('TC-E2E-082 結果の金額が桁区切りで表示される', async ({ page }) => {
    // TC: TC-E2E-082 | TD: TD053 | TV: TV053 | TA: TA015 | Risk: R009 | Spec: spec/仕様書.md 3.1.3、7.3
    const runtime = await openApp(page);
    const text = await runSimulation(page, { salary: 10000000, initialCash: 10000000, eventProb: 0 });

    expect(text).toMatch(/¥\d{1,3},\d{3}/);
    expectNoRuntimeErrors(runtime);
  });
});
