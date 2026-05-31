const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const repoRoot = path.resolve(__dirname, '..', '..');
const targetPath = path.join(repoRoot, 'sample_app', 'retirement_simulator.html');

function extractScript(html) {
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(match, 'target HTML contains an inline script');
  return match[1];
}

function loadTarget({ random = Math.random } = {}) {
  const html = fs.readFileSync(targetPath, 'utf8');
  const document = {
    addEventListener() {},
    getElementById() {
      throw new Error('DOM access is not expected in codebase function tests');
    },
    querySelectorAll() {
      return [];
    },
    createElement() {
      return {};
    },
  };
  const sandboxMath = Object.create(Math);
  sandboxMath.random = random;
  const context = {
    console,
    document,
    Math: sandboxMath,
  };
  vm.createContext(context);
  vm.runInContext(extractScript(html), context, { filename: targetPath });
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
  let incomeTax = 0;
  let prev = 0;
  for (const bracket of brackets) {
    if (taxable <= prev) break;
    const amount = Math.min(bracket.up, taxable) - prev;
    incomeTax += amount * bracket.rate;
    prev = bracket.up;
  }
  const resident = taxable * 0.10;
  return (salaryAnnual - social - incomeTax - resident) / 12;
}

function baseOptions(overrides = {}) {
  return {
    startAge: 65,
    retirementAge: 65,
    pensionStartAge: 65,
    gapIncome: 0,
    salary: 3000000,
    salaryChanges: [],
    monthlyPension: 0,
    initialCash: 0,
    initialInv: 0,
    expenseCurrent: 0,
    expenseGap: 0,
    expenseRetired: 0,
    investRate: 0,
    annualInterest: 0,
    eventProb: 0,
    eventTypes: [{ name: '入院', cost: 200000 }],
    ...overrides,
  };
}

function monthBlock(lines, age, month) {
  const start = lines.indexOf(`-- ${age}歳${month}月 --`);
  assert.notEqual(start, -1, `${age}歳${month}月 block exists`);
  const next = lines.findIndex((line, index) => index > start && line.startsWith('-- '));
  return lines.slice(start, next === -1 ? lines.length : next);
}

function countMonthHeaders(lines) {
  return lines.filter((line) => /^-- \d+歳\d+月 --$/.test(line)).length;
}

test('TC-CB-001 年収0円の月手取り', () => {
  // TC: TC-CB-001 | TD: TD001 | TV: TV001 | TA: TA001 | Risk: R001 | Spec: spec/仕様書.md 2.2 F001
  const { calculateNetMonthly } = loadTarget();
  assert.equal(calculateNetMonthly(0), 0);
});

test('TC-CB-002 年収3000000円の仕様式一致', () => {
  // TC: TC-CB-002 | TD: TD002 | TV: TV002 | TA: TA001 | Risk: R001 | Spec: spec/仕様書.md 2.2 F001
  const { calculateNetMonthly } = loadTarget();
  assert.ok(Math.abs(calculateNetMonthly(3000000) - expectedNetMonthly(3000000)) <= 0.01);
});

test('TC-CB-003 課税所得1950000円境界の仕様式一致', () => {
  // TC: TC-CB-003 | TD: TD003 | TV: TV003 | TA: TA001 | Risk: R001 | Spec: spec/仕様書.md 2.2 F001
  const { calculateNetMonthly } = loadTarget();
  const salaryAtBoundary = (1950000 + 480000) / 0.86;
  assert.ok(Math.abs(calculateNetMonthly(salaryAtBoundary) - expectedNetMonthly(salaryAtBoundary)) <= 0.01);
});

test('TC-CB-004 年初投資利息4%', () => {
  // TC: TC-CB-004 | TD: TD004 | TV: TV007 | TA: TA002 | Risk: R003 | Spec: spec/仕様書.md 5.1
  const { simulateRetirement } = loadTarget();
  const lines = simulateRetirement(baseOptions({
    startAge: 30,
    retirementAge: 30,
    pensionStartAge: 30,
    initialInv: 1000000,
    annualInterest: 0.04,
  }));
  assert.ok(lines.includes('== 31歳 1月: 投資利息 =='));
  assert.ok(lines.includes('  投資: ¥1,000,000 → ¥1,040,000'));
});

test('TC-CB-005 投資補填の残高十分ケース', () => {
  // TC: TC-CB-005 | TD: TD005 | TV: TV008 | TA: TA002 | Risk: R003 | Spec: spec/仕様書.md 5.2
  const { simulateRetirement } = loadTarget();
  const block = monthBlock(simulateRetirement(baseOptions({
    initialInv: 120000,
    expenseRetired: 100000,
  })), 65, 1);
  assert.ok(block.includes('  🔄 投資から補填: ¥100,000 (税金: ¥20,000)'));
  assert.ok(block.includes('  現金: ¥0 投資: ¥0 総資産: ¥0'));
});

test('TC-CB-006 投資補填の残高不足ケース', () => {
  // TC: TC-CB-006 | TD: TD006 | TV: TV008 | TA: TA002 | Risk: R003 | Spec: spec/仕様書.md 5.2
  const { simulateRetirement } = loadTarget();
  const block = monthBlock(simulateRetirement(baseOptions({
    initialInv: 120000,
    expenseRetired: 200000,
  })), 65, 1);
  assert.ok(block.includes('  🔄 投資から補填: ¥100,000 (税金: ¥20,000)'));
  assert.ok(block.includes('  現金: ¥-100,000 投資: ¥0 総資産: ¥-100,000'));
});

test('TC-CB-007 資産枯渇後も計算継続', () => {
  // TC: TC-CB-007 | TD: TD007 | TV: TV009 | TA: TA002 | Risk: R003 | Spec: spec/仕様書.md 5.2
  const { simulateRetirement } = loadTarget();
  const lines = simulateRetirement(baseOptions({
    startAge: 100,
    expenseRetired: 200000,
  }));
  assert.equal(countMonthHeaders(lines), 12);
  assert.ok(monthBlock(lines, 100, 1).includes('  現金: ¥-200,000 投資: ¥0 総資産: ¥-200,000'));
});

test('TC-CB-008 開始前給与変更の適用', () => {
  // TC: TC-CB-008 | TD: TD008 | TV: TV010 | TA: TA003 | Risk: R004 | Spec: spec/仕様書.md 2.2 F008
  const { simulateRetirement } = loadTarget();
  const block = monthBlock(simulateRetirement(baseOptions({
    startAge: 30,
    retirementAge: 31,
    pensionStartAge: 65,
    salaryChanges: [{ age: 25, salary: 4000000 }],
  })), 30, 1);
  assert.ok(block.some((line) => line.includes('[年収: ¥4,000,000]')));
});

test('TC-CB-009 同一年齢給与変更は最後を優先', () => {
  // TC: TC-CB-009 | TD: TD009 | TV: TV011 | TA: TA003 | Risk: R004 | Spec: spec/仕様書.md 2.2 F008
  const { simulateRetirement } = loadTarget();
  const lines = simulateRetirement(baseOptions({
    startAge: 35,
    retirementAge: 36,
    pensionStartAge: 65,
    salaryChanges: [
      { age: 35, salary: 4000000 },
      { age: 35, salary: 5000000 },
    ],
  }));
  assert.ok(monthBlock(lines, 35, 1).some((line) => line.includes('[年収: ¥5,000,000]')));
});

test('TC-CB-010 年齢0の給与変更は無効', () => {
  // TC: TC-CB-010 | TD: TD010 | TV: TV012 | TA: TA003 | Risk: R004,R006 | Spec: spec/仕様書.md 2.2 F008, 7.2
  const { simulateRetirement } = loadTarget();
  const lines = simulateRetirement(baseOptions({
    startAge: 30,
    retirementAge: 31,
    pensionStartAge: 65,
    salaryChanges: [{ age: 0, salary: 5000000 }],
  }));
  assert.ok(!monthBlock(lines, 30, 1).some((line) => line.includes('[年収: ¥5,000,000]')));
});

test('TC-CB-011 年齢101の給与変更は無効', () => {
  // TC: TC-CB-011 | TD: TD011 | TV: TV012 | TA: TA003 | Risk: R004,R006 | Spec: spec/仕様書.md 2.2 F008, 7.2
  const { simulateRetirement } = loadTarget();
  const lines = simulateRetirement(baseOptions({
    startAge: 99,
    retirementAge: 101,
    pensionStartAge: 101,
    salaryChanges: [{ age: 101, salary: 5000000 }],
  }));
  assert.ok(!lines.some((line) => line.includes('[年収: ¥5,000,000]')));
});

test('TC-CB-012 イベント発生率0%', () => {
  // TC: TC-CB-012 | TD: TD012 | TV: TV013 | TA: TA003 | Risk: R005 | Spec: spec/仕様書.md 5.3
  const { simulateRetirement } = loadTarget({ random: () => 0 });
  const lines = simulateRetirement(baseOptions({
    startAge: 100,
    eventProb: 0,
    eventTypes: [{ name: '入院', cost: 200000 }],
  }));
  assert.ok(!lines.some((line) => line.includes('入院')));
});

test('TC-CB-013 イベント発生率100%', () => {
  // TC: TC-CB-013 | TD: TD013 | TV: TV014 | TA: TA003 | Risk: R005 | Spec: spec/仕様書.md 5.3
  const { simulateRetirement } = loadTarget({ random: () => 0 });
  const lines = simulateRetirement(baseOptions({
    startAge: 100,
    eventProb: 1,
    eventTypes: [{ name: '入院', cost: 200000 }],
  }));
  assert.ok(monthBlock(lines, 100, 1).includes('  ▶ 入院: ¥200,000'));
});

test('TC-CB-014 正式回帰テスト資産の存在', () => {
  // TC: TC-CB-014 | TD: TD014 | TV: TV024 | TA: TA008 | Risk: R010 | Spec: spec/仕様書.md 9.4
  const regressionAsset = path.join(repoRoot, 'sample_app', 'test_retirement_simulator.html');
  assert.ok(fs.existsSync(regressionAsset), 'sample_app/test_retirement_simulator.html exists');
});

test('TC-CB-015 外部参照なしの静的確認', () => {
  // TC: TC-CB-015 | TD: TD015 | TV: TV018 | TA: TA005 | Risk: R007 | Spec: spec/仕様書.md 8.1
  const html = fs.readFileSync(targetPath, 'utf8');
  assert.equal(/https?:\/\//i.test(html), false);
  assert.equal(/<script[^>]+src=/i.test(html), false);
  assert.equal(/<link[^>]+href=["']https?:/i.test(html), false);
});

test('TC-CB-016 100歳開始は12か月分', () => {
  // TC: TC-CB-016 | TD: TD016 | TV: TV005 | TA: TA002 | Risk: R002 | Spec: spec/仕様書.md 2.2 F002
  const { simulateRetirement } = loadTarget();
  const lines = simulateRetirement(baseOptions({ startAge: 100 }));
  assert.equal(countMonthHeaders(lines), 12);
  assert.ok(lines.includes('-- 100歳12月 --'));
});

test('TC-CB-017 年金開始が退職以前でも給与が優先', () => {
  // TC: TC-CB-017 | TD: TD017 | TV: TV006 | TA: TA002 | Risk: R002 | Spec: spec/仕様書.md 2.2 F002
  const { simulateRetirement } = loadTarget();
  const lines = simulateRetirement(baseOptions({
    startAge: 64,
    retirementAge: 65,
    pensionStartAge: 60,
    gapIncome: 5000,
    monthlyPension: 145000,
  }));
  assert.ok(monthBlock(lines, 64, 1).some((line) => line.includes('給与:')));
  assert.ok(monthBlock(lines, 65, 1).includes('  年金: ¥145,000'));
  assert.ok(!monthBlock(lines, 65, 1).some((line) => line.includes('退職後収入')));
});
