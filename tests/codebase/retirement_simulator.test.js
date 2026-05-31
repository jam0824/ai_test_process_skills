const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..', '..');
const TARGET_HTML = path.join(ROOT, 'sample_app', 'retirement_simulator.html');

function loadApp() {
  const html = fs.readFileSync(TARGET_HTML, 'utf8');
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(match, 'target HTML should contain an inline script');
  const context = {
    console,
    Math: Object.create(Math),
    document: {
      addEventListener() {},
      getElementById() {
        return { addEventListener() {}, value: '', textContent: '' };
      },
      querySelectorAll() {
        return [];
      },
    },
  };
  vm.createContext(context);
  vm.runInContext(match[1], context, { filename: TARGET_HTML });
  return context;
}

function expectedNetMonthly(salaryAnnual) {
  const social = salaryAnnual * 0.14;
  const taxable = Math.max(0, salaryAnnual - social - 480000);
  const brackets = [
    { up: 1950000, rate: 0.05 },
    { up: 3300000, rate: 0.10 },
    { up: 6950000, rate: 0.20 },
    { up: 9000000, rate: 0.23 },
    { up: 18000000, rate: 0.33 },
    { up: 40000000, rate: 0.40 },
    { up: Infinity, rate: 0.45 },
  ];
  let tax = 0;
  let prev = 0;
  for (const bracket of brackets) {
    if (taxable <= prev) break;
    const amount = Math.min(bracket.up, taxable) - prev;
    tax += amount * bracket.rate;
    prev = bracket.up;
  }
  const resident = taxable * 0.10;
  return (salaryAnnual - social - tax - resident) / 12;
}

function salaryForTaxable(taxable) {
  return (taxable + 480000) / 0.86;
}

function makeOptions(overrides = {}) {
  return {
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
    eventTypes: [
      { name: '入院', cost: 200000 },
      { name: '歯科治療', cost: 50000 },
      { name: '薬の購入', cost: 20000 },
      { name: '家電故障', cost: 100000 },
    ],
    ...overrides,
  };
}

function blockFor(lines, age, month) {
  const header = `-- ${age}歳${month}月 --`;
  const start = lines.findIndex((line) => line === header);
  assert.notEqual(start, -1, `missing block: ${header}`);
  const next = lines.findIndex((line, index) => index > start && line.startsWith('-- '));
  return lines.slice(start, next === -1 ? lines.length : next);
}

function monthBlockCount(lines) {
  return lines.filter((line) => line.startsWith('-- ')).length;
}

function runSimulationWithDomValues(ctx, values) {
  const defaults = {
    startAge: '30',
    retirementAge: '31',
    pensionStartAge: '31',
    gapIncome: '0',
    salary: '3000000',
    monthlyPension: '0',
    initialCash: '0',
    initialInv: '0',
    expenseCurrent: '0',
    expenseGap: '0',
    expenseRetired: '0',
    investRate: '0',
    interest: '0',
    eventProb: '0',
  };
  const output = { textContent: '' };
  const elements = Object.fromEntries(
    Object.entries({ ...defaults, ...values }).map(([id, value]) => [id, { value: String(value) }]),
  );
  elements.output = output;
  ctx.document = {
    getElementById(id) {
      return elements[id] ?? { value: '', textContent: '', addEventListener() {} };
    },
    querySelectorAll() {
      return [];
    },
    addEventListener() {},
  };
  ctx.runSimulation();
  return output.textContent;
}

function withRandomSequence(ctx, values, callback) {
  const originalMath = ctx.Math;
  let index = 0;
  const controlledMath = Object.create(Math);
  controlledMath.random = () => {
    const value = values[Math.min(index, values.length - 1)];
    index += 1;
    return value;
  };
  ctx.Math = controlledMath;
  try {
    return callback();
  } finally {
    ctx.Math = originalMath;
  }
}

test('TC-CB-001 手取り計算代表値', () => {
  // TC: TC-CB-001 / TD: TD001 / TV: TV001 / TA: TA001 / Risk: R001 / Spec: F001
  const { calculateNetMonthly } = loadApp();
  for (const salary of [3000000, 4000000, 10000000]) {
    assert.ok(
      Math.abs(calculateNetMonthly(salary) - expectedNetMonthly(salary)) <= 0.01,
      `salary=${salary}`,
    );
  }
});

test('TC-CB-002 手取り計算のゼロ・課税所得境界', () => {
  // TC: TC-CB-002 / TD: TD002 / TV: TV002 / TA: TA001 / Risk: R001 / Spec: F001
  const { calculateNetMonthly } = loadApp();
  const salaries = [0, salaryForTaxable(0) - 1, salaryForTaxable(0), salaryForTaxable(0) + 1];
  for (const salary of salaries) {
    assert.ok(
      Math.abs(calculateNetMonthly(salary) - expectedNetMonthly(salary)) <= 0.01,
      `salary=${salary}`,
    );
  }
});

test('TC-CB-003 所得税ブラケット境界', () => {
  // TC: TC-CB-003 / TD: TD002 / TV: TV002 / TA: TA001 / Risk: R001 / Spec: F001
  const { calculateNetMonthly } = loadApp();
  const taxableBoundaries = [1950000, 3300000, 6950000];
  for (const boundary of taxableBoundaries) {
    for (const taxable of [boundary - 1, boundary, boundary + 1]) {
      const salary = salaryForTaxable(taxable);
      assert.ok(
        Math.abs(calculateNetMonthly(salary) - expectedNetMonthly(salary)) <= 0.01,
        `taxable=${taxable}`,
      );
    }
  }
});

test('TC-CB-004 不正数値のフォールバック方針', () => {
  // TC: TC-CB-004 / TD: TD003 / TV: TV003 / TA: TA001 / Risk: R001 / Spec: 7.2
  const ctx = loadApp();
  assert.doesNotThrow(() => runSimulationWithDomValues(ctx, { salary: '-1000000' }));
  const output = runSimulationWithDomValues(ctx, { salary: 'Infinity' });
  assert.equal(/NaN|Infinity/.test(output), false, 'non-finite values should fall back to 0');
});

test('TC-CB-005 内部値と表示丸め', () => {
  // TC: TC-CB-005 / TD: TD004 / TV: TV004 / TA: TA001 / Risk: R001,R006 / Spec: F001,3.1.3
  const { calculateNetMonthly } = loadApp();
  const actual = calculateNetMonthly(3333333);
  assert.ok(Math.abs(actual - expectedNetMonthly(3333333)) <= 0.01);
  assert.equal(Math.round(actual).toLocaleString(), Math.round(expectedNetMonthly(3333333)).toLocaleString());
});

test('TC-CB-006 各期間の収入種別', () => {
  // TC: TC-CB-006 / TD: TD005 / TV: TV005 / TA: TA002 / Risk: R002 / Spec: F002
  const { simulateRetirement } = loadApp();
  const lines = simulateRetirement(makeOptions({
    startAge: 64,
    retirementAge: 65,
    pensionStartAge: 67,
    gapIncome: 5000,
    monthlyPension: 9000,
    expenseCurrent: 100,
    expenseGap: 200,
    expenseRetired: 300,
    initialCash: 0,
    investRate: 0,
  }));
  assert.ok(blockFor(lines, 64, 1).some((line) => line.includes('給与:')));
  assert.ok(blockFor(lines, 65, 1).some((line) => line.includes('退職後収入: ¥5,000')));
  assert.ok(blockFor(lines, 67, 1).some((line) => line.includes('年金: ¥9,000')));
});

test('TC-CB-007 退職・年金開始境界', () => {
  // TC: TC-CB-007 / TD: TD006 / TV: TV006 / TA: TA002 / Risk: R002 / Spec: F002
  const { simulateRetirement } = loadApp();
  const lines = simulateRetirement(makeOptions({
    startAge: 64,
    retirementAge: 65,
    pensionStartAge: 66,
    gapIncome: 5000,
    monthlyPension: 9000,
    initialCash: 0,
    investRate: 0,
    expenseCurrent: 0,
    expenseGap: 0,
    expenseRetired: 0,
  }));
  assert.ok(blockFor(lines, 64, 12).some((line) => line.includes('給与:')));
  assert.ok(blockFor(lines, 65, 1).some((line) => line.includes('退職後収入: ¥5,000')));
  assert.ok(blockFor(lines, 66, 1).some((line) => line.includes('年金: ¥9,000')));
});

test('TC-CB-008 年金開始が退職年齢以前', () => {
  // TC: TC-CB-008 / TD: TD007 / TV: TV007 / TA: TA002 / Risk: R002 / Spec: F002
  const { simulateRetirement } = loadApp();
  const lines = simulateRetirement(makeOptions({
    startAge: 64,
    retirementAge: 65,
    pensionStartAge: 60,
    monthlyPension: 9000,
    initialCash: 0,
    investRate: 0,
    expenseCurrent: 0,
    expenseRetired: 0,
  }));
  assert.ok(blockFor(lines, 64, 1).some((line) => line.includes('給与:')));
  assert.ok(blockFor(lines, 65, 1).some((line) => line.includes('年金: ¥9,000')));
});

test('TC-CB-009 100歳までの生成範囲', () => {
  // TC: TC-CB-009 / TD: TD008 / TV: TV008 / TA: TA002 / Risk: R002,R003 / Spec: F002,5.2
  const { simulateRetirement } = loadApp();
  assert.equal(monthBlockCount(simulateRetirement(makeOptions({ startAge: 30, eventProb: 0 }))), 852);
  assert.equal(monthBlockCount(simulateRetirement(makeOptions({ startAge: 100, eventProb: 0 }))), 12);
  assert.doesNotThrow(() => assert.equal(monthBlockCount(simulateRetirement(makeOptions({ startAge: 101, eventProb: 0 }))), 0));
});

test('TC-CB-010 年初利息の適用', () => {
  // TC: TC-CB-010 / TD: TD009 / TV: TV009 / TA: TA002 / Risk: R002,R009 / Spec: 5.1
  const { simulateRetirement } = loadApp();
  const lines = simulateRetirement(makeOptions({
    startAge: 30,
    retirementAge: 30,
    pensionStartAge: 30,
    monthlyPension: 0,
    initialCash: 0,
    initialInv: 100000,
    expenseRetired: 0,
    annualInterest: 0.1,
    investRate: 0,
  }));
  assert.ok(lines.includes('== 31歳 1月: 投資利息 =='));
  assert.ok(lines.some((line) => line.includes('投資: ¥100,000 → ¥110,000')));
});

test('TC-CB-011 投資補填代表値', () => {
  // TC: TC-CB-011 / TD: TD010 / TV: TV010 / TA: TA003 / Risk: R003 / Spec: F005,5.2
  const { simulateRetirement } = loadApp();
  const lines = simulateRetirement(makeOptions({
    startAge: 65,
    retirementAge: 65,
    pensionStartAge: 65,
    monthlyPension: 145000,
    initialCash: 0,
    initialInv: 200000,
    expenseRetired: 228000,
    annualInterest: 0,
    eventProb: 0,
  }));
  const block = blockFor(lines, 65, 1).join('\n');
  assert.match(block, /投資から補填: ¥83,000 \(税金: ¥16,600\)/);
  assert.match(block, /現金: ¥0 投資: ¥100,400/);
});

test('TC-CB-012 投資補填の最大取り崩し', () => {
  // TC: TC-CB-012 / TD: TD011,TD013 / TV: TV011,TV013 / TA: TA003 / Risk: R003 / Spec: 5.2
  const { simulateRetirement } = loadApp();
  const lines = simulateRetirement(makeOptions({
    startAge: 65,
    retirementAge: 65,
    pensionStartAge: 65,
    monthlyPension: 0,
    initialCash: 0,
    initialInv: 120000,
    expenseRetired: 200000,
    annualInterest: 0,
    eventProb: 0,
  }));
  const block = blockFor(lines, 65, 1).join('\n');
  assert.match(block, /投資から補填: ¥100,000 \(税金: ¥20,000\)/);
  assert.match(block, /現金: ¥-100,000 投資: ¥0/);
});

test('TC-CB-013 資産枯渇時の継続', () => {
  // TC: TC-CB-013 / TD: TD012 / TV: TV012 / TA: TA003 / Risk: R003 / Spec: 5.2
  const { simulateRetirement } = loadApp();
  const lines = simulateRetirement(makeOptions({
    startAge: 100,
    retirementAge: 100,
    pensionStartAge: 100,
    monthlyPension: 0,
    initialCash: 0,
    initialInv: 0,
    expenseRetired: 1000,
    eventProb: 0,
  }));
  assert.equal(monthBlockCount(lines), 12);
  assert.match(blockFor(lines, 100, 1).join('\n'), /現金: ¥-1,000 投資: ¥0 総資産: ¥-1,000/);
});

test('TC-CB-014 給与変更の有効入力条件', () => {
  // TC: TC-CB-014 / TD: TD014 / TV: TV015 / TA: TA004 / Risk: R004 / Spec: F008,7.2
  const { simulateRetirement } = loadApp();
  const lines = simulateRetirement(makeOptions({
    startAge: 30,
    retirementAge: 31,
    salary: 3000000,
    salaryChanges: [
      { age: 1, salary: 0 },
      { age: 1, salary: 4000000 },
    ],
    initialCash: 0,
    investRate: 0,
    expenseCurrent: 0,
    eventProb: 0,
  }));
  assert.ok(blockFor(lines, 30, 1).some((line) => line.includes('[年収: ¥4,000,000]')));
});

test('TC-CB-015 給与変更の適用年齢', () => {
  // TC: TC-CB-015 / TD: TD015 / TV: TV016 / TA: TA004 / Risk: R004 / Spec: F008
  const { simulateRetirement } = loadApp();
  const lines = simulateRetirement(makeOptions({
    startAge: 30,
    retirementAge: 35,
    salary: 3000000,
    salaryChanges: [
      { age: 20, salary: 4000000 },
      { age: 30, salary: 5000000 },
      { age: 35, salary: 9000000 },
    ],
    initialCash: 0,
    investRate: 0,
    expenseCurrent: 0,
    eventProb: 0,
  }));
  assert.ok(blockFor(lines, 30, 1).some((line) => line.includes('[年収: ¥5,000,000]')));
  assert.ok(blockFor(lines, 35, 1).every((line) => !line.includes('[年収: ¥9,000,000]')));
});

test('TC-CB-016 同一年齢給与変更の後勝ち', () => {
  // TC: TC-CB-016 / TD: TD016 / TV: TV017 / TA: TA004 / Risk: R004 / Spec: F008
  const { simulateRetirement } = loadApp();
  const lines = simulateRetirement(makeOptions({
    startAge: 35,
    retirementAge: 36,
    salary: 3000000,
    salaryChanges: [
      { age: 35, salary: 4000000 },
      { age: 35, salary: 5000000 },
    ],
    initialCash: 0,
    investRate: 0,
    expenseCurrent: 0,
    eventProb: 0,
  }));
  assert.ok(blockFor(lines, 35, 1).some((line) => line.includes('[年収: ¥5,000,000]')));
});

test('TC-CB-017 イベント確率0%/100%', () => {
  // TC: TC-CB-017 / TD: TD017 / TV: TV018 / TA: TA005 / Risk: R005 / Spec: F004,5.3
  const { simulateRetirement } = loadApp();
  const noEvent = simulateRetirement(makeOptions({
    startAge: 100,
    eventProb: 0,
    eventTypes: [{ name: '固定イベント', cost: 1000 }],
  }));
  assert.equal(noEvent.some((line) => line.includes('固定イベント')), false);

  const alwaysEvent = simulateRetirement(makeOptions({
    startAge: 100,
    eventProb: 1,
    eventTypes: [{ name: '固定イベント', cost: 1000 }],
  }));
  assert.equal(alwaysEvent.filter((line) => line.includes('固定イベント')).length, 12);
});

test('TC-CB-018 乱数固定イベント選択', () => {
  // TC: TC-CB-018 / TD: TD018 / TV: TV019 / TA: TA005 / Risk: R005 / Spec: 5.3
  const ctx = loadApp();
  const lines = withRandomSequence(ctx, [0, 0.75], () => ctx.simulateRetirement(makeOptions({
    startAge: 100,
    eventProb: 1,
    eventTypes: [
      { name: 'A', cost: 1000 },
      { name: 'B', cost: 2000 },
      { name: 'C', cost: 3000 },
      { name: 'D', cost: 4000 },
    ],
  })));
  assert.ok(blockFor(lines, 100, 1).some((line) => line.includes('D: ¥4,000')));
});

test('TC-CB-020 正式回帰資産の存在確認', () => {
  // TC: TC-CB-020 / TD: TD020 / TV: TV042 / TA: TA002 / Risk: R001,R002,R003,R004 / Spec: 9.4
  const regressionAsset = path.join(ROOT, 'sample_app', 'test_retirement_simulator.html');
  assert.ok(fs.existsSync(regressionAsset), 'sample_app/test_retirement_simulator.html should exist');
});

test('TC-CB-021 高リスク組み合わせ', () => {
  // TC: TC-CB-021 / TD: TD026 / TV: TV039 / TA: TA011 / Risk: R002,R003,R005 / Spec: F002,F004,F005
  const ctx = loadApp();
  const lines = withRandomSequence(ctx, [0, 0], () => ctx.simulateRetirement(makeOptions({
    startAge: 65,
    retirementAge: 65,
    pensionStartAge: 65,
    monthlyPension: 145000,
    initialCash: 0,
    initialInv: 300000,
    expenseRetired: 228000,
    annualInterest: 0,
    eventProb: 1,
    eventTypes: [{ name: '固定イベント', cost: 100000 }],
  })));
  const block = blockFor(lines, 65, 1).join('\n');
  assert.match(block, /年金: ¥145,000/);
  assert.match(block, /固定イベント: ¥100,000/);
  assert.match(block, /投資から補填: ¥183,000 \(税金: ¥36,600\)/);
  assert.match(block, /現金: ¥0 投資: ¥80,400/);
});
