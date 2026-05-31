const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const targetPath = path.resolve(__dirname, '../../sample_app/retirement_simulator.html');

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  if (start === -1) throw new Error(`Function not found: ${name}`);
  const braceStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`Function body not closed: ${name}`);
}

function loadTargetFunctions() {
  const html = fs.readFileSync(targetPath, 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  if (!script) throw new Error('Target script block not found');
  const code = [
    extractFunction(script, 'calculateNetMonthly'),
    extractFunction(script, 'simulateRetirement'),
    '({ calculateNetMonthly, simulateRetirement });',
  ].join('\n');
  const context = vm.createContext({ Math, Number, console });
  return vm.runInContext(code, context);
}

const { calculateNetMonthly, simulateRetirement } = loadTargetFunctions();

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

function baseOpts(overrides = {}) {
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
    ],
    ...overrides,
  };
}

function runSimulation(overrides = {}) {
  return simulateRetirement(baseOpts(overrides));
}

function monthIndex(lines, age, month) {
  return lines.findIndex((line) => line === `-- ${age}歳${month}月 --`);
}

function monthBlock(lines, age, month) {
  const start = monthIndex(lines, age, month);
  assert.notEqual(start, -1, `${age}歳${month}月の出力が存在すること`);
  const next = lines.findIndex((line, index) => index > start && line.startsWith('-- '));
  return lines.slice(start, next === -1 ? lines.length : next);
}

function headerCount(lines) {
  return lines.filter((line) => /^-- \d+歳\d+月 --$/.test(line)).length;
}

function parseYen(text, label) {
  const match = text.match(new RegExp(`${label}: ¥(-?[\\d,]+)`));
  assert.ok(match, `${label} の金額が見つかること: ${text}`);
  return Number(match[1].replaceAll(',', ''));
}

function balanceLine(block) {
  const line = block.find((entry) => entry.includes('現金:') && entry.includes('投資:') && entry.includes('総資産:'));
  assert.ok(line, '残高行が存在すること');
  return line;
}

function incomeLine(block) {
  const line = block.find((entry) => /給与:|退職後収入:|年金:/.test(entry));
  assert.ok(line, '収入行が存在すること');
  return line;
}

function assertApprox(actual, expected, tolerance = 0.01) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `actual=${actual}, expected=${expected}, tolerance=${tolerance}`,
  );
}

// Parameter traceability:
// TC-CB-001 / TD001 / TV001 / TA001 / Risk R001 / salaryAnnual=3000000
// TC-CB-002 / TD001 / TV001 / TA001 / Risk R001 / salaryAnnual=4000000
// TC-CB-003 / TD001 / TV001 / TA001 / Risk R001 / salaryAnnual=10000000
[
  ['TC-CB-001', 'TD001', 'TV001', 'TA001', 'R001', 3000000],
  ['TC-CB-002', 'TD001', 'TV001', 'TA001', 'R001', 4000000],
  ['TC-CB-003', 'TD001', 'TV001', 'TA001', 'R001', 10000000],
].forEach(([tc, td, tv, ta, risk, salary]) => {
  test(`${tc} 年収${salary.toLocaleString()}円の月手取りを仕様式で計算できる`, () => {
    // TC: ${tc} / TD: ${td} / TV: ${tv} / TA: ${ta} / Risk: ${risk}
    // Spec: spec/仕様書.md 2.2 F001
    assertApprox(calculateNetMonthly(salary), expectedNetMonthly(salary));
  });
});

test('TC-CB-004 年収0円の月手取りは0円になる', () => {
  // TC: TC-CB-004 / TD: TD002 / TV: TV002 / TA: TA001 / Risk: R001
  // Spec: spec/仕様書.md 2.2 F001
  assert.equal(calculateNetMonthly(0), 0);
});

test('TC-CB-005 課税所得0円境界の月手取りを仕様式で計算できる', () => {
  // TC: TC-CB-005 / TD: TD002 / TV: TV002 / TA: TA001 / Risk: R001
  // Spec: spec/仕様書.md 2.2 F001
  const salary = salaryForTaxable(0);
  assertApprox(calculateNetMonthly(salary), expectedNetMonthly(salary));
});

test('TC-CB-006 所得税ブラケット境界の月手取りを仕様式で計算できる', () => {
  // TC: TC-CB-006 / TD: TD002 / TV: TV002 / TA: TA001 / Risk: R001
  // Spec: spec/仕様書.md 2.2 F001
  [1950000, 3300000, 6950000].forEach((taxable) => {
    const salary = salaryForTaxable(taxable);
    assertApprox(calculateNetMonthly(salary), expectedNetMonthly(salary));
  });
});

test('TC-CB-007 負の年収でも例外なく有限数を返す', () => {
  // TC: TC-CB-007 / TD: TD003 / TV: TV003 / TA: TA001 / Risk: R001,R006
  // Spec: spec/仕様書.md 2.2 F001, 7.2
  const actual = calculateNetMonthly(-1000000);
  assert.equal(Number.isFinite(actual), true);
  assertApprox(actual, expectedNetMonthly(-1000000));
});

test('TC-CB-008 極大年収でも例外なく有限数を返す', () => {
  // TC: TC-CB-008 / TD: TD003 / TV: TV003 / TA: TA001 / Risk: R001,R006
  // Spec: spec/仕様書.md 2.2 F001, 7.2
  const actual = calculateNetMonthly(100000000);
  assert.equal(Number.isFinite(actual), true);
  assertApprox(actual, expectedNetMonthly(100000000));
});

test('TC-CB-009 現役・退職後・年金期間で収入種別が切り替わる', () => {
  // TC: TC-CB-009 / TD: TD004 / TV: TV005 / TA: TA002 / Risk: R002
  // Spec: spec/仕様書.md 2.2 F002
  const lines = runSimulation({
    startAge: 64,
    retirementAge: 65,
    pensionStartAge: 66,
    gapIncome: 5000,
    monthlyPension: 7000,
    initialCash: 0,
    expenseCurrent: 0,
    expenseGap: 0,
    expenseRetired: 0,
    investRate: 0,
  });
  assert.match(incomeLine(monthBlock(lines, 64, 1)), /給与:/);
  assert.match(incomeLine(monthBlock(lines, 65, 1)), /退職後収入: ¥5,000/);
  assert.match(incomeLine(monthBlock(lines, 66, 1)), /年金: ¥7,000/);
});

test('TC-CB-010 退職年齢境界で生活費が切り替わる', () => {
  // TC: TC-CB-010 / TD: TD005 / TV: TV006 / TA: TA002 / Risk: R002
  // Spec: spec/仕様書.md 2.2 F002
  const lines = runSimulation({
    startAge: 64,
    retirementAge: 65,
    pensionStartAge: 67,
    expenseCurrent: 100,
    expenseGap: 200,
    expenseRetired: 300,
    initialCash: 0,
    investRate: 0,
  });
  assert.ok(monthBlock(lines, 64, 1).some((line) => line.includes('生活費: ¥100')));
  assert.ok(monthBlock(lines, 65, 1).some((line) => line.includes('生活費: ¥200')));
});

test('TC-CB-011 年金開始が退職前でも給与期間を優先する', () => {
  // TC: TC-CB-011 / TD: TD006 / TV: TV007 / TA: TA002 / Risk: R002
  // Spec: spec/仕様書.md 2.2 F002
  const lines = runSimulation({
    startAge: 60,
    retirementAge: 65,
    pensionStartAge: 60,
    monthlyPension: 7000,
    gapIncome: 5000,
    initialCash: 0,
    expenseCurrent: 0,
    expenseRetired: 0,
    investRate: 0,
  });
  assert.match(incomeLine(monthBlock(lines, 64, 12)), /給与:/);
  assert.match(incomeLine(monthBlock(lines, 65, 1)), /年金: ¥7,000/);
  assert.equal(lines.some((line) => line.includes('退職後収入: ¥5,000')), false);
});

test('TC-CB-012 startAgeから100歳12月までの月次件数を生成する', () => {
  // TC: TC-CB-012 / TD: TD007 / TV: TV008 / TA: TA002 / Risk: R002
  // Spec: spec/仕様書.md 2.2 F002
  assert.equal(headerCount(runSimulation({ startAge: 30 })), 852);
  assert.equal(headerCount(runSimulation({ startAge: 100 })), 12);
});

test('TC-CB-013 投資率20%で月手取りを現金と投資へ配分する', () => {
  // TC: TC-CB-013 / TD: TD008 / TV: TV009 / TA: TA003 / Risk: R003
  // Spec: spec/仕様書.md 2.2 F003
  const lines = runSimulation({
    salary: 3000000,
    investRate: 0.2,
    initialCash: 0,
    initialInv: 0,
    expenseCurrent: 0,
    eventProb: 0,
  });
  const block = monthBlock(lines, 30, 1);
  const net = expectedNetMonthly(3000000);
  assert.match(incomeLine(block), new RegExp(`給与: ¥${Math.round(net).toLocaleString()}`));
  const balances = balanceLine(block);
  assert.equal(parseYen(balances, '現金'), Math.round(net * 0.8));
  assert.equal(parseYen(balances, '投資'), Math.round(net * 0.2));
});

test('TC-CB-014 年初1月に投資利息を適用する', () => {
  // TC: TC-CB-014 / TD: TD009 / TV: TV010 / TA: TA003 / Risk: R003
  // Spec: spec/仕様書.md 5.1
  const lines = runSimulation({
    startAge: 99,
    retirementAge: 99,
    pensionStartAge: 99,
    initialCash: 1000000,
    initialInv: 100000,
    monthlyPension: 0,
    expenseRetired: 0,
    annualInterest: 0.1,
    investRate: 0,
  });
  assert.ok(lines.some((line) => line === '== 100歳 1月: 投資利息 =='));
  assert.ok(lines.some((line) => line.includes('投資: ¥100,000 → ¥110,000')));
});

test('TC-CB-015 投資残高が十分な場合は不足額と20%税を投資から補填する', () => {
  // TC: TC-CB-015 / TD: TD010 / TV: TV011 / TA: TA003 / Risk: R003
  // Spec: spec/仕様書.md 5.2
  const block = monthBlock(runSimulation({
    startAge: 100,
    retirementAge: 100,
    pensionStartAge: 100,
    initialCash: 0,
    initialInv: 200000,
    monthlyPension: 0,
    expenseRetired: 83000,
    investRate: 0,
  }), 100, 1);
  assert.ok(block.some((line) => line.includes('投資から補填: ¥83,000 (税金: ¥16,600)')));
  const balances = balanceLine(block);
  assert.equal(parseYen(balances, '現金'), 0);
  assert.equal(parseYen(balances, '投資'), 100400);
});

test('TC-CB-016 投資残高不足時はinvestBal/1.2まで補填し投資残高を0未満にしない', () => {
  // TC: TC-CB-016 / TD: TD011 / TV: TV012 / TA: TA003 / Risk: R003
  // Spec: spec/仕様書.md 5.2
  const block = monthBlock(runSimulation({
    startAge: 100,
    retirementAge: 100,
    pensionStartAge: 100,
    initialCash: 0,
    initialInv: 60000,
    monthlyPension: 0,
    expenseRetired: 100000,
    investRate: 0,
  }), 100, 1);
  assert.ok(block.some((line) => line.includes('投資から補填: ¥50,000 (税金: ¥10,000)')));
  const balances = balanceLine(block);
  assert.equal(parseYen(balances, '現金'), -50000);
  assert.equal(parseYen(balances, '投資'), 0);
});

test('TC-CB-017 イベント発生率0%ではイベント行が出ない', () => {
  // TC: TC-CB-017 / TD: TD012 / TV: TV013 / TA: TA004 / Risk: R005
  // Spec: spec/仕様書.md 5.3
  const lines = runSimulation({ eventProb: 0 });
  assert.equal(lines.some((line) => line.includes('▶')), false);
});

test('TC-CB-018 イベント発生率100%かつ単一イベントでは毎月費用が差し引かれる', () => {
  // TC: TC-CB-018 / TD: TD013 / TV: TV014 / TA: TA004 / Risk: R005
  // Spec: spec/仕様書.md 5.3
  const lines = runSimulation({
    startAge: 100,
    retirementAge: 100,
    pensionStartAge: 100,
    initialCash: 20000,
    initialInv: 0,
    monthlyPension: 0,
    expenseRetired: 0,
    eventProb: 1,
    eventTypes: [{ name: '検証イベント', cost: 12345 }],
  });
  assert.equal(lines.filter((line) => line.includes('▶ 検証イベント: ¥12,345')).length, 12);
  assert.equal(parseYen(balanceLine(monthBlock(lines, 100, 1)), '現金'), 7655);
});

test('TC-CB-019 年齢101の給与変更は無効として扱う', () => {
  // TC: TC-CB-019 / TD: TD014 / TV: TV017 / TA: TA005 / Risk: R004
  // Spec: spec/仕様書.md 2.2 F008
  const block = monthBlock(runSimulation({
    startAge: 99,
    retirementAge: 101,
    salary: 3000000,
    salaryChanges: [{ age: 101, salary: 9000000 }],
    investRate: 0,
    expenseCurrent: 0,
    initialCash: 0,
  }), 100, 1);
  assert.doesNotMatch(incomeLine(block), /\[年収:/);
});

test('TC-CB-020 年収0の給与変更は無効として扱う', () => {
  // TC: TC-CB-020 / TD: TD014 / TV: TV017 / TA: TA005 / Risk: R004
  // Spec: spec/仕様書.md 2.2 F008
  const block = monthBlock(runSimulation({
    startAge: 30,
    retirementAge: 31,
    salary: 3000000,
    salaryChanges: [{ age: 30, salary: 0 }],
    investRate: 0,
    expenseCurrent: 0,
    initialCash: 0,
  }), 30, 1);
  assert.doesNotMatch(incomeLine(block), /\[年収: ¥0\]/);
  assert.match(incomeLine(block), new RegExp(`給与: ¥${Math.round(expectedNetMonthly(3000000)).toLocaleString()}`));
});

test('TC-CB-021 開始前の給与変更は開始月から適用済みとして扱う', () => {
  // TC: TC-CB-021 / TD: TD015 / TV: TV018 / TA: TA005 / Risk: R004
  // Spec: spec/仕様書.md 2.2 F008
  const block = monthBlock(runSimulation({
    startAge: 40,
    retirementAge: 41,
    salary: 3000000,
    salaryChanges: [{ age: 35, salary: 4000000 }],
    investRate: 0,
    expenseCurrent: 0,
    initialCash: 0,
  }), 40, 1);
  assert.match(incomeLine(block), /\[年収: ¥4,000,000\]/);
});

test('TC-CB-022 開始同年の給与変更は開始月から適用する', () => {
  // TC: TC-CB-022 / TD: TD015 / TV: TV018 / TA: TA005 / Risk: R004
  // Spec: spec/仕様書.md 2.2 F008
  const block = monthBlock(runSimulation({
    startAge: 40,
    retirementAge: 41,
    salary: 3000000,
    salaryChanges: [{ age: 40, salary: 5000000 }],
    investRate: 0,
    expenseCurrent: 0,
    initialCash: 0,
  }), 40, 1);
  assert.match(incomeLine(block), /\[年収: ¥5,000,000\]/);
});

test('TC-CB-023 退職後の給与変更は給与期間外のため影響しない', () => {
  // TC: TC-CB-023 / TD: TD016 / TV: TV019 / TA: TA005 / Risk: R004
  // Spec: spec/仕様書.md 2.2 F008
  const lines = runSimulation({
    startAge: 64,
    retirementAge: 65,
    pensionStartAge: 66,
    gapIncome: 5000,
    salaryChanges: [{ age: 65, salary: 9000000 }],
    investRate: 0,
    expenseCurrent: 0,
    expenseGap: 0,
    initialCash: 0,
  });
  assert.match(incomeLine(monthBlock(lines, 65, 1)), /退職後収入: ¥5,000/);
  assert.equal(lines.some((line) => line.includes('年収: ¥9,000,000')), false);
});

test('TC-CB-024 同一年齢の給与変更は最後に追加された設定を優先する', () => {
  // TC: TC-CB-024 / TD: TD017 / TV: TV020 / TA: TA005 / Risk: R004
  // Spec: spec/仕様書.md 2.2 F008
  const block = monthBlock(runSimulation({
    startAge: 35,
    retirementAge: 36,
    salary: 3000000,
    salaryChanges: [
      { age: 35, salary: 4000000 },
      { age: 35, salary: 5000000 },
    ],
    investRate: 0,
    expenseCurrent: 0,
    initialCash: 0,
  }), 35, 1);
  assert.match(incomeLine(block), /\[年収: ¥5,000,000\]/);
});

test('TC-CB-025 給与と投資額は整数円・桁区切りで表示する', () => {
  // TC: TC-CB-025 / TD: TD018 / TV: TV004 / TA: TA001 / Risk: R001
  // Spec: spec/仕様書.md 3.1.3
  const block = monthBlock(runSimulation({
    salary: 3000000,
    investRate: 0.2,
    expenseCurrent: 0,
    initialCash: 0,
  }), 30, 1);
  assert.match(incomeLine(block), /^  給与: ¥\d{1,3}(,\d{3})* \(投資: ¥\d{1,3}(,\d{3})*\)$/);
});

test('TC-CB-026 初期値相当で30歳1月から100歳12月まで出力する', () => {
  // TC: TC-CB-026 / TD: TD019 / TV: TV021 / TA: TA006 / Risk: R001,R002
  // Spec: spec/仕様書.md 3.1.2, 3.1.3
  const lines = runSimulation();
  assert.notEqual(monthIndex(lines, 30, 1), -1);
  assert.notEqual(monthIndex(lines, 100, 12), -1);
});

test('TC-CB-027 現金・投資・総資産を同一行に整数円・桁区切りで表示する', () => {
  // TC: TC-CB-027 / TD: TD020 / TV: TV023 / TA: TA006 / Risk: R001
  // Spec: spec/仕様書.md 3.1.3
  const line = balanceLine(monthBlock(runSimulation({
    salary: 3000000,
    investRate: 0.2,
    annualInterest: 0.04,
  }), 30, 1));
  assert.match(line, /^  現金: ¥-?\d{1,3}(,\d{3})* 投資: ¥-?\d{1,3}(,\d{3})* 総資産: ¥-?\d{1,3}(,\d{3})*$/);
});
