const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const TARGET_HTML = path.join(__dirname, 'retirement_simulator.html');

const DEFAULT_EVENTS = [
  { name: '入院', cost: 200000 },
  { name: '歯科治療', cost: 50000 },
  { name: '薬の購入', cost: 20000 },
  { name: '家電故障', cost: 100000 },
  { name: '車検', cost: 80000 },
  { name: '冠婚葬祭', cost: 120000 },
  { name: '健康診断', cost: 30000 },
  { name: '引越し', cost: 200000 },
];

const IMPLEMENTED_TEST_CASE_IDS = [
  'TC-CB-001', 'TC-CB-002', 'TC-CB-003',
  'TC-CB-007', 'TC-CB-008', 'TC-CB-009',
  'TC-CB-010', 'TC-CB-011', 'TC-CB-012', 'TC-CB-013', 'TC-CB-014',
  'TC-CB-015', 'TC-CB-016', 'TC-CB-017',
  'TC-CB-018', 'TC-CB-019', 'TC-CB-020',
  'TC-CB-024', 'TC-CB-025', 'TC-CB-026', 'TC-CB-027',
  'TC-CB-030', 'TC-CB-031', 'TC-CB-032', 'TC-CB-033',
  'TC-CB-034', 'TC-CB-035', 'TC-CB-036', 'TC-CB-038',
  'TC-CB-039', 'TC-CB-040', 'TC-CB-041', 'TC-CB-042',
];

function createFakeElement() {
  const element = {
    value: '0',
    textContent: '',
    innerHTML: '',
    className: '',
    style: { display: 'none', cssText: '' },
    children: [],
    parentElement: null,
    appendChild(child) {
      child.parentElement = this;
      this.children.push(child);
    },
    addEventListener() {},
    querySelector() {
      return createFakeElement();
    },
    querySelectorAll() {
      return [];
    },
    remove() {},
  };
  return element;
}

function createMathObject() {
  const math = Object.create(Math);
  math.random = Math.random.bind(Math);
  return math;
}

function loadSimulatorFromTarget() {
  const html = fs.readFileSync(TARGET_HTML, 'utf8');
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  assert.ok(scripts.length > 0, 'target HTML must contain executable script');

  const context = {
    console: {
      assert() {},
      error() {},
      log() {},
      warn() {},
    },
    document: {
      addEventListener() {},
      createElement: createFakeElement,
      getElementById: createFakeElement,
      querySelectorAll() {
        return [];
      },
    },
    Math: createMathObject(),
  };
  context.window = context;

  vm.createContext(context);
  for (const script of scripts) {
    vm.runInContext(script, context, { filename: TARGET_HTML });
  }

  assert.equal(typeof context.calculateNetMonthly, 'function');
  assert.equal(typeof context.simulateRetirement, 'function');
  return context;
}

const app = loadSimulatorFromTarget();

function baseOptions(overrides = {}) {
  return {
    startAge: 30,
    retirementAge: 65,
    pensionStartAge: 67,
    gapIncome: 50000,
    salary: 3000000,
    salaryChanges: [],
    monthlyPension: 150000,
    initialCash: 0,
    initialInv: 0,
    expenseCurrent: 0,
    expenseGap: 0,
    expenseRetired: 0,
    investRate: 0,
    annualInterest: 0,
    eventProb: 0,
    eventTypes: DEFAULT_EVENTS,
    ...overrides,
  };
}

function withRandomSequence(values, callback) {
  const originalRandom = app.Math.random;
  let index = 0;
  app.Math.random = () => {
    const value = values[Math.min(index, values.length - 1)];
    index += 1;
    return value;
  };
  try {
    return callback();
  } finally {
    app.Math.random = originalRandom;
  }
}

function simulate(overrides = {}, randomValues = null) {
  const run = () => app.simulateRetirement(baseOptions(overrides));
  return randomValues ? withRandomSequence(randomValues, run) : run();
}

function assertApprox(actual, expected, tolerance, message) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${message}: expected ${expected} +/- ${tolerance}, actual ${actual}`,
  );
}

function specTaxBreakdown(salaryAnnual) {
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
  let incomeTax = 0;
  let previous = 0;
  for (const bracket of brackets) {
    if (taxable <= previous) break;
    const amount = Math.min(bracket.up, taxable) - previous;
    incomeTax += amount * bracket.rate;
    previous = bracket.up;
  }
  const residentTax = taxable * 0.10;
  const netMonthly = (salaryAnnual - social - incomeTax - residentTax) / 12;
  return { social, taxable, incomeTax, residentTax, netMonthly };
}

function monthBlock(lines, age, month) {
  const header = `-- ${age}歳${month}月 --`;
  const start = lines.findIndex((line) => line === header);
  assert.notEqual(start, -1, `${header} must exist`);
  const end = lines.findIndex((line, index) => (
    index > start && (/^-- \d+歳\d+月 --$/.test(line) || /^== /.test(line))
  ));
  return lines.slice(start, end === -1 ? lines.length : end);
}

function findLine(lines, predicate, message) {
  const line = lines.find(predicate);
  assert.ok(line, message);
  return line;
}

function parseYenNumber(value) {
  return Number(value.replace(/,/g, ''));
}

function assetValues(block) {
  const line = findLine(block, (item) => item.includes('現金:'), 'asset line must exist');
  const match = line.match(/現金: ¥(-?[\d,]+) 投資: ¥(-?[\d,]+) 総資産: ¥(-?[\d,]+)/);
  assert.ok(match, `asset line must be parseable: ${line}`);
  return {
    cash: parseYenNumber(match[1]),
    investment: parseYenNumber(match[2]),
    total: parseYenNumber(match[3]),
    line,
  };
}

function assertIncomeContains(lines, age, month, expectedText) {
  const block = monthBlock(lines, age, month);
  const incomeLine = findLine(block, (line) => line.includes(expectedText), `${expectedText} must exist`);
  return { block, incomeLine };
}

function assertTotalsAreConsistent(lines) {
  const assetLines = lines.filter((line) => line.includes('現金:'));
  assert.ok(assetLines.length > 0, 'asset lines must exist');
  for (const line of assetLines) {
    const values = assetValues([line]);
    assert.ok(
      Math.abs((values.cash + values.investment) - values.total) <= 1,
      `cash + investment must equal total within rounding: ${line}`,
    );
  }
}

test('TC-CB-001 年収300万円の月手取りを計算できる', () => {
  // TC: TC-CB-001 | TD: TD001 | TV: TV001 | TA: TA001 | Risk: R001 | Spec: spec/仕様書.md 2.2 F001, 9.1
  assert.equal(app.calculateNetMonthly(3000000), 188125);
});

test('TC-CB-002 年収600万円の月手取りを計算できる', () => {
  // TC: TC-CB-002 | TD: TD001 | TV: TV001 | TA: TA001 | Risk: R001 | Spec: spec/仕様書.md 2.2 F001, 9.1
  assert.equal(app.calculateNetMonthly(6000000), 348625);
});

test('TC-CB-003 年収1000万円の月手取りを計算できる', () => {
  // TC: TC-CB-003 | TD: TD001 | TV: TV001 | TA: TA001 | Risk: R001 | Spec: spec/仕様書.md 2.2 F001, 9.1
  assertApprox(app.calculateNetMonthly(10000000), 546367, 1, 'monthly net income for 10,000,000 JPY');
});

test('TC-CB-007 年収600万円の控除と税率適用順を確認できる', () => {
  // TC: TC-CB-007 | TD: TD004 | TV: TV004 | TA: TA001 | Risk: R001 | Spec: spec/仕様書.md 2.2 F001
  const breakdown = specTaxBreakdown(6000000);
  assertApprox(breakdown.social, 840000, 0.001, 'social insurance for 6,000,000 JPY');
  assert.equal(breakdown.taxable, 4680000);
  assert.equal(breakdown.incomeTax, 508500);
  assert.equal(breakdown.residentTax, 468000);
  assert.equal(app.calculateNetMonthly(6000000), breakdown.netMonthly);
});

test('TC-CB-008 基礎控除480000円を差し引いて課税所得を計算できる', () => {
  // TC: TC-CB-008 | TD: TD004 | TV: TV004 | TA: TA001 | Risk: R001 | Spec: spec/仕様書.md 2.2 F001
  const breakdown = specTaxBreakdown(6000000);
  assert.equal(breakdown.taxable, 6000000 - 840000 - 480000);
});

test('TC-CB-009 課税所得に住民税10%を反映できる', () => {
  // TC: TC-CB-009 | TD: TD004 | TV: TV004 | TA: TA001 | Risk: R001 | Spec: spec/仕様書.md 2.2 F001
  const breakdown = specTaxBreakdown(6000000);
  assert.equal(breakdown.residentTax, 468000);
  assert.equal(app.calculateNetMonthly(6000000), 348625);
});

test('TC-CB-010 開始年齢の月は給与収入になる', () => {
  // TC: TC-CB-010 | TD: TD005 | TV: TV005 | TA: TA002 | Risk: R002 | Spec: spec/仕様書.md 2.2 F002
  const lines = simulate({ startAge: 30, retirementAge: 65, pensionStartAge: 67, salary: 3000000 });
  assertIncomeContains(lines, 30, 1, '給与:');
});

test('TC-CB-011 退職年齢直前の月は給与収入になる', () => {
  // TC: TC-CB-011 | TD: TD005 | TV: TV005 | TA: TA002 | Risk: R002 | Spec: spec/仕様書.md 2.2 F002
  const lines = simulate({ startAge: 30, retirementAge: 65, pensionStartAge: 67, salary: 3000000 });
  assertIncomeContains(lines, 64, 12, '給与:');
});

test('TC-CB-012 退職年齢の月は退職後収入になる', () => {
  // TC: TC-CB-012 | TD: TD005 | TV: TV005 | TA: TA002 | Risk: R002 | Spec: spec/仕様書.md 2.2 F002
  const lines = simulate({ startAge: 30, retirementAge: 65, pensionStartAge: 67, gapIncome: 50000 });
  assertIncomeContains(lines, 65, 1, '退職後収入: ¥50,000');
});

test('TC-CB-013 年金開始年齢直前の月は退職後収入になる', () => {
  // TC: TC-CB-013 | TD: TD005 | TV: TV005 | TA: TA002 | Risk: R002 | Spec: spec/仕様書.md 2.2 F002
  const lines = simulate({ startAge: 30, retirementAge: 65, pensionStartAge: 67, gapIncome: 50000 });
  assertIncomeContains(lines, 66, 12, '退職後収入: ¥50,000');
});

test('TC-CB-014 年金開始年齢の月は年金収入になる', () => {
  // TC: TC-CB-014 | TD: TD005 | TV: TV005 | TA: TA002 | Risk: R002 | Spec: spec/仕様書.md 2.2 F002
  const lines = simulate({ startAge: 30, retirementAge: 65, pensionStartAge: 67, monthlyPension: 150000 });
  assertIncomeContains(lines, 67, 1, '年金: ¥150,000');
});

test('TC-CB-015 投資率20%で月手取りの20%を投資へ積み立てる', () => {
  // TC: TC-CB-015 | TD: TD009 | TV: TV009 | TA: TA003 | Risk: R003 | Spec: spec/仕様書.md 2.1 F003, 2.2 F002
  const lines = simulate({ salary: 3000000, investRate: 0.2, retirementAge: 31, pensionStartAge: 31 });
  const { block, incomeLine } = assertIncomeContains(lines, 30, 1, '(投資: ¥37,625)');
  assert.ok(incomeLine.includes('給与: ¥188,125'));
  assert.equal(assetValues(block).investment, 37625);
});

test('TC-CB-016 年収600万円でも投資率分を投資へ積み立てる', () => {
  // TC: TC-CB-016 | TD: TD009 | TV: TV009 | TA: TA003 | Risk: R003 | Spec: spec/仕様書.md 2.1 F003, 2.2 F002
  const lines = simulate({ salary: 6000000, investRate: 0.2, retirementAge: 31, pensionStartAge: 31 });
  const { block } = assertIncomeContains(lines, 30, 1, '(投資: ¥69,725)');
  assert.equal(assetValues(block).investment, 69725);
});

test('TC-CB-017 標準生活費差引前の現金加算と投資額を確認できる', () => {
  // TC: TC-CB-017 | TD: TD009 | TV: TV009 | TA: TA003 | Risk: R003 | Spec: spec/仕様書.md 2.1 F003, 2.2 F002
  const lines = simulate({
    salary: 3000000,
    investRate: 0.2,
    initialCash: 1000000,
    expenseCurrent: 155600,
    retirementAge: 31,
    pensionStartAge: 31,
  });
  const block = monthBlock(lines, 30, 1);
  assert.ok(block.some((line) => line.includes('給与: ¥188,125 (投資: ¥37,625)')));
  const values = assetValues(block);
  assert.equal(values.investment, 37625);
  assert.equal(values.cash, 994900);
});

test('TC-CB-018 開始年齢の1月には年初利息を適用しない', () => {
  // TC: TC-CB-018 | TD: TD011 | TV: TV011 | TA: TA003 | Risk: R003 | Spec: spec/仕様書.md 5.1
  const lines = simulate({
    startAge: 30,
    retirementAge: 31,
    pensionStartAge: 31,
    initialInv: 1000000,
    annualInterest: 0.1,
  });
  const firstInterestIndex = lines.findIndex((line) => line.includes('投資利息'));
  const firstMonthIndex = lines.findIndex((line) => line === '-- 30歳1月 --');
  assert.ok(firstMonthIndex >= 0);
  assert.ok(firstInterestIndex > firstMonthIndex, 'first interest appears after the first month starts');
  assert.ok(monthBlock(lines, 30, 1).every((line) => !line.includes('投資利息')));
});

test('TC-CB-019 開始翌年の1月に年利10%を適用する', () => {
  // TC: TC-CB-019 | TD: TD011 | TV: TV011 | TA: TA003 | Risk: R003 | Spec: spec/仕様書.md 5.1
  const lines = simulate({
    startAge: 30,
    retirementAge: 31,
    pensionStartAge: 31,
    initialInv: 1000000,
    annualInterest: 0.1,
  });
  const detailLine = findLine(lines, (line) => line.includes('¥1,000,000 → ¥1,100,000'), '10% interest line must exist');
  assert.ok(detailLine.includes('¥1,100,000'));
});

test('TC-CB-020 開始翌年の1月に年利5%を適用する', () => {
  // TC: TC-CB-020 | TD: TD011 | TV: TV011 | TA: TA003 | Risk: R003 | Spec: spec/仕様書.md 5.1
  const lines = simulate({
    startAge: 30,
    retirementAge: 31,
    pensionStartAge: 31,
    initialInv: 1000000,
    annualInterest: 0.05,
  });
  const detailLine = findLine(lines, (line) => line.includes('¥1,000,000 → ¥1,050,000'), '5% interest line must exist');
  assert.ok(detailLine.includes('¥1,050,000'));
});

test('TC-CB-024 投資補填時に20%税金を投資残高から差し引く', () => {
  // TC: TC-CB-024 | TD: TD014 | TV: TV014 | TA: TA004 | Risk: R003 | Spec: spec/仕様書.md 5.2
  const lines = simulate({
    startAge: 30,
    retirementAge: 30,
    pensionStartAge: 30,
    initialCash: 50000,
    initialInv: 100000,
    monthlyPension: 0,
    expenseRetired: 80000,
  });
  const block = monthBlock(lines, 30, 1);
  assert.ok(block.some((line) => line.includes('投資から補填: ¥30,000 (税金: ¥6,000)')));
  assert.deepEqual(assetValues(block), {
    cash: 0,
    investment: 64000,
    total: 64000,
    line: '  現金: ¥0 投資: ¥64,000 総資産: ¥64,000',
  });
});

test('TC-CB-025 35歳で変更後年収400万円を適用する', () => {
  // TC: TC-CB-025 | TD: TD021 | TV: TV021 | TA: TA005 | Risk: R004 | Spec: spec/仕様書.md 2.2 F008
  const lines = simulate({
    startAge: 35,
    retirementAge: 56,
    pensionStartAge: 56,
    salary: 3000000,
    salaryChanges: [
      { age: 55, salary: 8000000 },
      { age: 45, salary: 6000000 },
      { age: 35, salary: 4000000 },
    ],
  });
  assertIncomeContains(lines, 35, 1, '[年収: ¥4,000,000]');
});

test('TC-CB-026 45歳で35歳設定より45歳設定を優先する', () => {
  // TC: TC-CB-026 | TD: TD021 | TV: TV021 | TA: TA005 | Risk: R004 | Spec: spec/仕様書.md 2.2 F008
  const lines = simulate({
    startAge: 35,
    retirementAge: 56,
    pensionStartAge: 56,
    salary: 3000000,
    salaryChanges: [
      { age: 55, salary: 8000000 },
      { age: 45, salary: 6000000 },
      { age: 35, salary: 4000000 },
    ],
  });
  const { incomeLine } = assertIncomeContains(lines, 45, 1, '[年収: ¥6,000,000]');
  assert.ok(!incomeLine.includes('[年収: ¥4,000,000]'));
});

test('TC-CB-027 55歳で最新の該当給与変更を選択する', () => {
  // TC: TC-CB-027 | TD: TD021 | TV: TV021 | TA: TA005 | Risk: R004 | Spec: spec/仕様書.md 2.2 F008
  const lines = simulate({
    startAge: 35,
    retirementAge: 56,
    pensionStartAge: 56,
    salary: 3000000,
    salaryChanges: [
      { age: 55, salary: 8000000 },
      { age: 45, salary: 6000000 },
      { age: 35, salary: 4000000 },
    ],
  });
  const { incomeLine } = assertIncomeContains(lines, 55, 1, '[年収: ¥8,000,000]');
  assert.ok(!incomeLine.includes('[年収: ¥6,000,000]'));
});

test('TC-CB-030 年またぎでは年初利息行を月次処理より前に出力する', () => {
  // TC: TC-CB-030 | TD: TD028 | TV: TV028 | TA: TA007 | Risk: R002, R003 | Spec: spec/仕様書.md 2.2 F002, 5.1
  const lines = simulate({
    startAge: 30,
    retirementAge: 33,
    pensionStartAge: 33,
    initialInv: 1000000,
    annualInterest: 0.05,
  });
  const interestIndex = lines.findIndex((line) => line === '== 31歳 1月: 投資利息 ==');
  const monthIndex = lines.findIndex((line) => line === '-- 31歳1月 --');
  assert.ok(interestIndex >= 0);
  assert.ok(monthIndex > interestIndex);
});

test('TC-CB-031 年利5%の利息適用後に31歳1月の月次処理が続く', () => {
  // TC: TC-CB-031 | TD: TD028 | TV: TV028 | TA: TA007 | Risk: R002, R003 | Spec: spec/仕様書.md 2.2 F002, 5.1
  const lines = simulate({
    startAge: 30,
    retirementAge: 33,
    pensionStartAge: 33,
    initialInv: 1000000,
    annualInterest: 0.05,
  });
  const detailIndex = lines.findIndex((line) => line.includes('¥1,000,000 → ¥1,050,000'));
  const monthIndex = lines.findIndex((line) => line === '-- 31歳1月 --');
  assert.ok(detailIndex >= 0);
  assert.ok(monthIndex > detailIndex);
});

test('TC-CB-032 イベントなし条件ではイベント行を出力しない', () => {
  // TC: TC-CB-032 | TD: TD028 | TV: TV028 | TA: TA007 | Risk: R002, R003 | Spec: spec/仕様書.md 2.2 F002, 5.1
  const lines = simulate({
    startAge: 30,
    retirementAge: 33,
    pensionStartAge: 33,
    initialInv: 1000000,
    annualInterest: 0.05,
    eventProb: 0,
  });
  assert.equal(lines.some((line) => line.includes('▶')), false);
});

test('TC-CB-033 期間をまたいでも資産状態を引き継ぐ', () => {
  // TC: TC-CB-033 | TD: TD008 | TV: TV008 | TA: TA002 | Risk: R002 | Spec: spec/仕様書.md 2.2 F002
  const lines = simulate({
    startAge: 64,
    retirementAge: 65,
    pensionStartAge: 67,
    salary: 3000000,
    gapIncome: 50000,
    monthlyPension: 150000,
    initialCash: 1000000,
    initialInv: 100000,
    investRate: 0.2,
  });
  const beforeRetirement = assetValues(monthBlock(lines, 64, 12));
  const afterRetirement = assetValues(monthBlock(lines, 65, 1));
  const pensionStart = assetValues(monthBlock(lines, 67, 1));
  assert.notEqual(afterRetirement.cash, 1000000);
  assert.notEqual(afterRetirement.investment, 100000);
  assert.ok(afterRetirement.total >= beforeRetirement.total);
  assert.notEqual(pensionStart.cash, 1000000);
});

test('TC-CB-034 現金不足時に不足額を投資から補填して現金を0円に戻す', () => {
  // TC: TC-CB-034 | TD: TD013 | TV: TV013 | TA: TA004 | Risk: R003 | Spec: spec/仕様書.md 5.2
  const lines = simulate({
    startAge: 30,
    retirementAge: 30,
    pensionStartAge: 30,
    initialCash: 50000,
    initialInv: 100000,
    monthlyPension: 0,
    expenseRetired: 80000,
  });
  const block = monthBlock(lines, 30, 1);
  assert.ok(block.some((line) => line.includes('投資から補填: ¥30,000')));
  assert.equal(assetValues(block).cash, 0);
});

test('TC-CB-035 補填税差引後も投資残高が残り結果生成が継続する', () => {
  // TC: TC-CB-035 | TD: TD013 | TV: TV013 | TA: TA004 | Risk: R003 | Spec: spec/仕様書.md 5.2
  const lines = simulate({
    startAge: 30,
    retirementAge: 30,
    pensionStartAge: 30,
    initialCash: 50000,
    initialInv: 100000,
    monthlyPension: 0,
    expenseRetired: 80000,
  });
  assert.equal(assetValues(monthBlock(lines, 30, 1)).investment, 64000);
  assert.ok(monthBlock(lines, 30, 2).length > 0);
});

test('TC-CB-036 投資残高不足時も現金・投資・総資産を一貫表示する', () => {
  // TC: TC-CB-036 | TD: TD015 | TV: TV015 | TA: TA004 | Risk: R003 | Spec: spec/仕様書.md 5.2
  const lines = simulate({
    startAge: 30,
    retirementAge: 30,
    pensionStartAge: 30,
    initialCash: 0,
    initialInv: 20000,
    monthlyPension: 0,
    expenseRetired: 80000,
  });
  const block = monthBlock(lines, 30, 1);
  assert.ok(block.some((line) => line.includes('投資から補填: ¥20,000 (税金: ¥4,000)')));
  assert.deepEqual(assetValues(block), {
    cash: -60000,
    investment: -4000,
    total: -64000,
    line: '  現金: ¥-60,000 投資: ¥-4,000 総資産: ¥-64,000',
  });
});

test('TC-CB-038 イベント費用から現金不足と投資補填へ連携する', () => {
  // TC: TC-CB-038 | TD: TD023 | TV: TV023 | TA: TA006 | Risk: R005, R003 | Spec: spec/仕様書.md 4.1, 5.3
  const lines = simulate({
    startAge: 30,
    retirementAge: 30,
    pensionStartAge: 30,
    initialCash: 50000,
    initialInv: 300000,
    monthlyPension: 0,
    expenseRetired: 0,
    eventProb: 1,
    eventTypes: [{ name: '入院', cost: 200000 }],
  }, [0, 0]);
  const block = monthBlock(lines, 30, 1);
  assert.ok(block.some((line) => line.includes('入院: ¥200,000')));
  assert.ok(block.some((line) => line.includes('投資から補填: ¥150,000 (税金: ¥30,000)')));
  assert.equal(assetValues(block).investment, 120000);
});

test('TC-CB-039 月次結果の現金・投資・総資産は整合する', () => {
  // TC: TC-CB-039 | TD: TD027 | TV: TV027 | TA: TA007 | Risk: R002, R003 | Spec: spec/仕様書.md 2.2 F002
  const standardLines = simulate({
    startAge: 30,
    salary: 3000000,
    investRate: 0.2,
    eventProb: 0,
  });
  const eventLines = simulate({
    startAge: 30,
    retirementAge: 30,
    pensionStartAge: 30,
    initialCash: 50000,
    initialInv: 300000,
    monthlyPension: 0,
    expenseRetired: 0,
    eventProb: 1,
    eventTypes: [{ name: '入院', cost: 200000 }],
  }, [0, 0]);
  assertTotalsAreConsistent(standardLines);
  assertTotalsAreConsistent(eventLines);
});

test('TC-CB-040 イベント発生月の同月内で投資補填を処理する', () => {
  // TC: TC-CB-040 | TD: TD029 | TV: TV029 | TA: TA008 | Risk: R003, R005 | Spec: spec/仕様書.md 5.2, 5.3
  const lines = simulate({
    startAge: 30,
    retirementAge: 30,
    pensionStartAge: 30,
    initialCash: 50000,
    initialInv: 300000,
    monthlyPension: 0,
    expenseRetired: 0,
    eventProb: 1,
    eventTypes: [{ name: '入院', cost: 200000 }],
  }, [0, 0]);
  const block = monthBlock(lines, 30, 1);
  const eventIndex = block.findIndex((line) => line.includes('入院: ¥200,000'));
  const supplementIndex = block.findIndex((line) => line.includes('投資から補填: ¥150,000'));
  assert.ok(eventIndex >= 0);
  assert.ok(supplementIndex > eventIndex);
});

test('TC-CB-041 車検イベントで不足70000円と税金14000円を処理する', () => {
  // TC: TC-CB-041 | TD: TD029 | TV: TV029 | TA: TA008 | Risk: R003, R005 | Spec: spec/仕様書.md 5.2, 5.3
  const lines = simulate({
    startAge: 30,
    retirementAge: 30,
    pensionStartAge: 30,
    initialCash: 10000,
    initialInv: 300000,
    monthlyPension: 0,
    expenseRetired: 0,
    eventProb: 1,
    eventTypes: [{ name: '車検', cost: 80000 }],
  }, [0, 0]);
  const block = monthBlock(lines, 30, 1);
  assert.ok(block.some((line) => line.includes('車検: ¥80,000')));
  assert.ok(block.some((line) => line.includes('投資から補填: ¥70,000 (税金: ¥14,000)')));
  assert.equal(assetValues(block).investment, 216000);
});

test('TC-CB-042 給与変更・イベント・投資補填の複合条件を同月に反映する', () => {
  // TC: TC-CB-042 | TD: TD060 | TV: TV060 | TA: TA017 | Risk: R002, R003, R004, R005 | Spec: spec/仕様書.md F002, F004, F005, F008
  const lines = simulate({
    startAge: 35,
    retirementAge: 36,
    pensionStartAge: 36,
    salary: 3000000,
    salaryChanges: [{ age: 35, salary: 4000000 }],
    initialCash: 10000,
    initialInv: 300000,
    expenseCurrent: 200000,
    investRate: 0.2,
    eventProb: 1,
    eventTypes: [{ name: '車検', cost: 80000 }],
  }, [0, 0]);
  const block = monthBlock(lines, 35, 1);
  assert.ok(block.some((line) => line.includes('[年収: ¥4,000,000]')));
  assert.ok(block.some((line) => line.includes('車検: ¥80,000')));
  assert.ok(block.some((line) => line.includes('投資から補填:')));
  assertTotalsAreConsistent(block);
});
