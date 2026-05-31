const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const targetPath = path.resolve(__dirname, "../../sample_app/retirement_simulator.html");
const targetHtml = fs.readFileSync(targetPath, "utf8");
const script = targetHtml.match(/<script>([\s\S]*?)<\/script>/)[1];

const defaultValues = {
  startAge: "30",
  retirementAge: "65",
  pensionStartAge: "65",
  gapIncome: "0",
  salary: "3000000",
  monthlyPension: "145000",
  initialCash: "1000000",
  initialInv: "0",
  expenseCurrent: "155600",
  expenseGap: "228000",
  expenseRetired: "228000",
  investRate: "20",
  interest: "4",
  eventProb: "1"
};

class FakeElement {
  constructor(tagName, id = "") {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.value = "";
    this.className = "";
    this.style = {};
    this.children = [];
    this.parentElement = null;
    this.eventListeners = {};
    this.onclick = null;
    this.textContent = "";
    this._innerHTML = "";
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  remove() {
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter(child => child !== this);
    this.parentElement = null;
  }

  addEventListener(type, handler) {
    this.eventListeners[type] = this.eventListeners[type] || [];
    this.eventListeners[type].push(handler);
  }

  click() {
    if (this.onclick) this.onclick.call(this);
    for (const handler of this.eventListeners.click || []) handler.call(this);
  }

  set innerHTML(value) {
    this._innerHTML = value;
    this.children = [];
    if (!value.includes("salary-change-age")) return;

    const row = new FakeElement("div");
    const age = new FakeElement("input");
    age.className = "salary-change-age";
    const salary = new FakeElement("input");
    salary.className = "salary-change-salary";
    const removeButton = new FakeElement("button");
    removeButton.onclick = function removeSalaryChangeItem() {
      this.parentElement.parentElement.remove();
    };

    row.appendChild(age);
    row.appendChild(salary);
    row.appendChild(removeButton);
    this.appendChild(row);
  }

  get innerHTML() {
    return this._innerHTML;
  }

  querySelector(selector) {
    return collectDescendants(this).find(element => matchesSelector(element, selector)) || null;
  }

  querySelectorAll(selector) {
    return collectDescendants(this).filter(element => matchesSelector(element, selector));
  }
}

class FakeDocument {
  constructor() {
    this.elements = new Map();
    this.eventListeners = {};
    for (const [id, value] of Object.entries(defaultValues)) {
      const input = new FakeElement("input", id);
      input.value = value;
      this.elements.set(id, input);
    }

    const salaryChanges = new FakeElement("div", "salaryChanges");
    salaryChanges.style.display = "none";
    this.elements.set("salaryChanges", salaryChanges);
    this.elements.set("salaryChangesList", new FakeElement("div", "salaryChangesList"));
    this.elements.set("toggleSalaryChanges", new FakeElement("button", "toggleSalaryChanges"));
    this.elements.set("addSalaryChange", new FakeElement("button", "addSalaryChange"));
    this.elements.set("runBtn", new FakeElement("button", "runBtn"));
    this.elements.set("output", new FakeElement("div", "output"));
  }

  createElement(tagName) {
    return new FakeElement(tagName);
  }

  getElementById(id) {
    return this.elements.get(id) || null;
  }

  addEventListener(type, handler) {
    this.eventListeners[type] = this.eventListeners[type] || [];
    this.eventListeners[type].push(handler);
  }

  dispatch(type) {
    for (const handler of this.eventListeners[type] || []) handler();
  }

  querySelectorAll(selector) {
    const roots = Array.from(this.elements.values());
    return roots.flatMap(root => [root, ...collectDescendants(root)])
      .filter((element, index, all) => all.indexOf(element) === index)
      .filter(element => matchesSelector(element, selector));
  }
}

function collectDescendants(root) {
  const descendants = [];
  for (const child of root.children) {
    descendants.push(child, ...collectDescendants(child));
  }
  return descendants;
}

function matchesSelector(element, selector) {
  if (selector.startsWith(".")) {
    return element.className.split(/\s+/).includes(selector.slice(1));
  }
  if (selector.startsWith("#")) {
    return element.id === selector.slice(1);
  }
  return element.tagName.toLowerCase() === selector.toLowerCase();
}

function createMath(random = Math.random) {
  const sandboxMath = {};
  for (const name of Object.getOwnPropertyNames(Math)) {
    Object.defineProperty(sandboxMath, name, Object.getOwnPropertyDescriptor(Math, name));
  }
  sandboxMath.random = random;
  return sandboxMath;
}

function loadTarget({ dom = false, random = () => 0 } = {}) {
  const document = new FakeDocument();
  const sandboxConsole = {
    ...console,
    assert() {}
  };
  const sandbox = {
    console: sandboxConsole,
    document,
    Math: createMath(random),
    Number,
    Infinity,
    parseFloat
  };
  vm.createContext(sandbox);
  vm.runInContext(script, sandbox, { filename: targetPath });
  if (dom) document.dispatch("DOMContentLoaded");
  return { document, sandbox };
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
    { up: Infinity, rate: 0.45 }
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
  return {
    social,
    taxable,
    tax,
    resident,
    monthly: (salaryAnnual - social - tax - resident) / 12
  };
}

function fmt(value) {
  return `¥${Math.round(value).toLocaleString()}`;
}

function baseOpts(overrides = {}) {
  return {
    startAge: 100,
    retirementAge: 100,
    pensionStartAge: 100,
    gapIncome: 0,
    salary: 0,
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
    eventTypes: [],
    ...overrides
  };
}

function simulate(overrides = {}, loadOptions = {}) {
  const { sandbox } = loadTarget(loadOptions);
  return sandbox.simulateRetirement(baseOpts(overrides));
}

function monthBlock(lines, age, month) {
  const header = `-- ${age}歳${month}月 --`;
  const start = lines.indexOf(header);
  assert.notEqual(start, -1, `${header} が出力される`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith("-- ") || lines[i].startsWith("== ")) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end);
}

function lineContaining(lines, text) {
  const line = lines.find(item => item.includes(text));
  assert.ok(line, `${text} を含む行が出力される`);
  return line;
}

function countMonths(lines) {
  return lines.filter(line => line.startsWith("-- ")).length;
}

function setDomValues(document, values) {
  for (const [id, value] of Object.entries(values)) {
    const element = document.getElementById(id);
    assert.ok(element, `${id} が存在する`);
    element.value = value == null ? "" : String(value);
  }
}

function addSalaryChangeViaUi(document, age, salary) {
  document.getElementById("addSalaryChange").click();
  const item = document.querySelectorAll(".salary-change-item").at(-1);
  assert.ok(item, "給与変更行が追加される");
  item.querySelector(".salary-change-age").value = String(age);
  item.querySelector(".salary-change-salary").value = String(salary);
  return item;
}

function runDomSimulation(values = {}) {
  const { document } = loadTarget({ dom: true });
  setDomValues(document, { eventProb: 0, startAge: 100, ...values });
  document.getElementById("runBtn").click();
  return { document, output: document.getElementById("output").textContent };
}

function assertNoInvalidNumbers(text) {
  assert.doesNotMatch(text, /\bNaN\b/, "出力にNaNが混入しない");
  assert.doesNotMatch(text, /\bInfinity\b/, "出力にInfinityが混入しない");
}

function assertApprox(actual, expected, tolerance = 0.01) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `actual=${actual}, expected=${expected}, tolerance=${tolerance}`
  );
}

function assertFirstAssetLine(overrides, expected) {
  const lines = simulate(overrides);
  const line = lineContaining(monthBlock(lines, 100, 1), "現金:");
  assert.equal(line.trim(), `現金: ${fmt(expected.cash)} 投資: ${fmt(expected.inv)} 総資産: ${fmt(expected.cash + expected.inv)}`);
}

function assertFirstFill(overrides, expectedDraw, expectedTax, expectedCash, expectedInv) {
  const lines = simulate(overrides);
  const block = monthBlock(lines, 100, 1);
  lineContaining(block, `投資から補填: ${fmt(expectedDraw)} (税金: ${fmt(expectedTax)})`);
  const assetLine = lineContaining(block, "現金:");
  assert.equal(assetLine.trim(), `現金: ${fmt(expectedCash)} 投資: ${fmt(expectedInv)} 総資産: ${fmt(expectedCash + expectedInv)}`);
}

function firstWorkingIncome(overrides) {
  const lines = simulate({
    startAge: 35,
    retirementAge: 36,
    pensionStartAge: 70,
    salary: 3000000,
    expenseCurrent: 0,
    ...overrides
  });
  return lineContaining(monthBlock(lines, overrides.startAge ?? 35, 1), "給与:");
}

const netCases = [
  ["TC-CB-001", "TD001", "TV001", "TA001", "年収0円の月手取り", 0, "仕様2.2 F001, 5.1", "R001, R013"],
  ["TC-CB-002", "TD001", "TV001", "TA001", "年収1,200,000円の月手取り", 1200000, "仕様2.2 F001, 5.1", "R001, R013"],
  ["TC-CB-003", "TD001", "TV001", "TA001", "年収3,000,000円の月手取り", 3000000, "仕様2.2 F001, 5.1", "R001, R013"],
  ["TC-CB-004", "TD001", "TV001", "TA001", "年収10,000,000円の月手取り", 10000000, "仕様2.2 F001, 5.1", "R001, R013"],
  ["TC-CB-005", "TD002", "TV002", "TA001", "課税所得1,950,000円直前", 2825580.23, "仕様2.2 F001", "R001, R013"],
  ["TC-CB-006", "TD002", "TV002", "TA001", "課税所得1,950,000円境界", 2825581.40, "仕様2.2 F001", "R001, R013"],
  ["TC-CB-007", "TD002", "TV002", "TA001", "課税所得1,950,000円直後", 2825582.56, "仕様2.2 F001", "R001, R013"],
  ["TC-CB-008", "TD002", "TV002", "TA001", "課税所得3,300,000円直前", 4395347.67, "仕様2.2 F001", "R001, R013"],
  ["TC-CB-009", "TD002", "TV002", "TA001", "課税所得3,300,000円境界", 4395348.84, "仕様2.2 F001", "R001, R013"],
  ["TC-CB-010", "TD002", "TV002", "TA001", "課税所得3,300,000円直後", 4395350.00, "仕様2.2 F001", "R001, R013"],
  ["TC-CB-011", "TD002", "TV002", "TA001", "課税所得6,950,000円直前", 8639533.72, "仕様2.2 F001", "R001, R013"],
  ["TC-CB-012", "TD002", "TV002", "TA001", "課税所得6,950,000円境界", 8639534.88, "仕様2.2 F001", "R001, R013"],
  ["TC-CB-013", "TD002", "TV002", "TA001", "課税所得6,950,000円直後", 8639536.05, "仕様2.2 F001", "R001, R013"],
  ["TC-CB-014", "TD002", "TV002", "TA001", "課税所得9,000,000円直前", 11023254.65, "仕様2.2 F001", "R001, R013"],
  ["TC-CB-015", "TD002", "TV002", "TA001", "課税所得9,000,000円境界", 11023255.81, "仕様2.2 F001", "R001, R013"],
  ["TC-CB-016", "TD002", "TV002", "TA001", "課税所得9,000,000円直後", 11023256.98, "仕様2.2 F001", "R001, R013"],
  ["TC-CB-017", "TD002", "TV002", "TA001", "課税所得18,000,000円直前", 21488370.93, "仕様2.2 F001", "R001, R013"],
  ["TC-CB-018", "TD002", "TV002", "TA001", "課税所得18,000,000円境界", 21488372.09, "仕様2.2 F001", "R001, R013"],
  ["TC-CB-019", "TD002", "TV002", "TA001", "課税所得18,000,000円直後", 21488373.26, "仕様2.2 F001", "R001, R013"],
  ["TC-CB-020", "TD002", "TV002", "TA001", "課税所得40,000,000円直前", 47069766.28, "仕様2.2 F001", "R001, R013"],
  ["TC-CB-021", "TD002", "TV002", "TA001", "課税所得40,000,000円境界", 47069767.44, "仕様2.2 F001", "R001, R013"],
  ["TC-CB-022", "TD002", "TV002", "TA001", "課税所得40,000,000円直後", 47069768.60, "仕様2.2 F001", "R001, R013"],
  ["TC-CB-026", "TD004", "TV004", "TA001", "内部小数値を保持する年収", 1200001, "仕様2.2 F001, 3.1.3, 5.1", "R001, R013"]
];

for (const [id, td, tv, ta, name, salaryAnnual, specRef, risk] of netCases) {
  test(`${id} ${name}`, () => {
    // TC: ${id} / TD: ${td} / TV: ${tv} / TA: ${ta} / Spec: ${specRef} / Risk: ${risk}
    const { sandbox } = loadTarget();
    assertApprox(sandbox.calculateNetMonthly(salaryAnnual), expectedNetMonthly(salaryAnnual).monthly);
  });
}

test("TC-CB-023 年収0円", () => {
  // TC-CB-023 / TD003 / TV003 / TA001 / Spec: 仕様2.2 F001 / Risk: R001, R013
  const expected = expectedNetMonthly(0);
  const { sandbox } = loadTarget();
  assert.equal(expected.taxable, 0);
  assert.equal(expected.tax, 0);
  assert.equal(expected.resident, 0);
  assert.equal(sandbox.calculateNetMonthly(0), 0);
});

test("TC-CB-024 課税所得0円の低所得", () => {
  // TC-CB-024 / TD003 / TV003 / TA001 / Spec: 仕様2.2 F001 / Risk: R001, R013
  const expected = expectedNetMonthly(558139.53);
  const { sandbox } = loadTarget();
  assert.equal(expected.taxable, 0);
  assert.equal(expected.tax, 0);
  assert.equal(expected.resident, 0);
  assertApprox(sandbox.calculateNetMonthly(558139.53), expected.monthly);
});

test("TC-CB-025 課税所得1円相当", () => {
  // TC-CB-025 / TD003 / TV003 / TA001 / Spec: 仕様2.2 F001 / Risk: R001, R013
  const expected = expectedNetMonthly(558140.70);
  const { sandbox } = loadTarget();
  assert.ok(expected.taxable > 0 && expected.taxable < 2);
  assertApprox(sandbox.calculateNetMonthly(558140.70), expected.monthly);
});

test("TC-CB-027 整数表示になる年収", () => {
  // TC-CB-027 / TD004 / TV004 / TA001 / Spec: 仕様2.2 F001, 3.1.3, 5.1 / Risk: R001, R013
  const { sandbox } = loadTarget();
  const rounded = fmt(sandbox.calculateNetMonthly(3000000));
  assert.equal(rounded, fmt(expectedNetMonthly(3000000).monthly));
});

test("TC-CB-028 開始翌年1月の利息適用", () => {
  // TC-CB-028 / TD005 / TV010 / TA003 / Spec: 仕様5.1 / Risk: R003, R013
  const lines = simulate({ startAge: 30, initialInv: 1000000, annualInterest: 0.04 });
  lineContaining(lines, "== 31歳 1月: 投資利息 ==");
  lineContaining(lines, "投資: ¥1,000,000 → ¥1,040,000");
});

test("TC-CB-029 2月の利息非適用", () => {
  // TC-CB-029 / TD005 / TV010 / TA003 / Spec: 仕様5.1 / Risk: R003, R013
  const lines = simulate({ startAge: 30, initialInv: 1000000, annualInterest: 0.04 });
  assert.equal(lines.filter(line => line.includes("31歳 1月: 投資利息")).length, 1);
  assert.equal(lines.filter(line => line.includes("31歳 2月: 投資利息")).length, 0);
});

test("TC-CB-030 利回り0%", () => {
  // TC-CB-030 / TD005 / TV010 / TA003 / Spec: 仕様5.1 / Risk: R003, R013
  const lines = simulate({ startAge: 30, initialInv: 1000000, annualInterest: 0 });
  lineContaining(lines, "投資: ¥1,000,000 → ¥1,000,000");
});

test("TC-CB-031 利回り4%", () => {
  // TC-CB-031 / TD005 / TV010 / TA003 / Spec: 仕様5.1 / Risk: R003, R013
  const lines = simulate({ startAge: 30, initialInv: 1000000, annualInterest: 0.04 });
  lineContaining(lines, "投資: ¥1,000,000 → ¥1,040,000");
});

test("TC-CB-032 利回り-1%", () => {
  // TC-CB-032 / TD005 / TV010 / TA003 / Spec: 仕様5.1 / Risk: R003, R013
  const lines = simulate({ startAge: 30, initialInv: 1000000, annualInterest: -0.01 });
  lineContaining(lines, "投資: ¥1,000,000 → ¥990,000");
});

test("TC-CB-033 補填不要", () => {
  // TC-CB-033 / TD006 / TV011 / TA003 / Spec: 仕様5.2 / Risk: R003, R013
  const lines = simulate({ initialCash: 100000, initialInv: 1000000, expenseRetired: 50000 });
  const block = monthBlock(lines, 100, 1);
  assert.equal(block.some(line => line.includes("投資から補填")), false);
  lineContaining(block, "現金: ¥50,000 投資: ¥1,000,000 総資産: ¥1,050,000");
});

test("TC-CB-034 全額補填", () => {
  // TC-CB-034 / TD006 / TV011 / TA003 / Spec: 仕様5.2 / Risk: R003, R013
  assertFirstFill({ initialCash: 0, initialInv: 120000, expenseRetired: 100000 }, 100000, 20000, 0, 0);
});

test("TC-CB-035 残高ちょうど", () => {
  // TC-CB-035 / TD006 / TV011 / TA003 / Spec: 仕様5.2 / Risk: R003, R013
  assertFirstFill({ initialCash: 0, initialInv: 60000, expenseRetired: 50000 }, 50000, 10000, 0, 0);
});

test("TC-CB-036 残高不足", () => {
  // TC-CB-036 / TD006 / TV011 / TA003 / Spec: 仕様5.2 / Risk: R003, R013
  assertFirstFill({ initialCash: 0, initialInv: 30000, expenseRetired: 50000 }, 25000, 5000, -25000, 0);
});

test("TC-CB-037 投資0円で現金不足", () => {
  // TC-CB-037 / TD007 / TV012 / TA003 / Spec: 仕様5.2 / Risk: R003, R013
  assertFirstAssetLine({ initialCash: 0, initialInv: 0, expenseRetired: 100000 }, { cash: -100000, inv: 0 });
});

test("TC-CB-038 投資残高不足で枯渇", () => {
  // TC-CB-038 / TD007 / TV012 / TA003 / Spec: 仕様5.2 / Risk: R003, R013
  assertFirstFill({ initialCash: 0, initialInv: 24000, expenseRetired: 50000 }, 20000, 4000, -30000, 0);
});

test("TC-CB-039 補填後も現金マイナス継続", () => {
  // TC-CB-039 / TD007 / TV012 / TA003 / Spec: 仕様5.2 / Risk: R003, R013
  assertFirstFill({ initialCash: -10000, initialInv: 12000, expenseRetired: 50000 }, 10000, 2000, -50000, 0);
});

test("TC-CB-040 イベント発生率0%", () => {
  // TC-CB-040 / TD008 / TV013 / TA004 / Spec: 仕様5.3 / Risk: R004
  const lines = simulate({ eventProb: 0, eventTypes: [{ name: "入院", cost: 200000 }], initialCash: 1000000 });
  assert.equal(lines.some(line => line.includes("▶")), false);
});

test("TC-CB-041 イベント発生率100%", () => {
  // TC-CB-041 / TD008 / TV013 / TA004 / Spec: 仕様5.3 / Risk: R004
  const lines = simulate({ eventProb: 1, eventTypes: [{ name: "入院", cost: 200000 }], initialCash: 1000000 }, { random: () => 0 });
  const block = monthBlock(lines, 100, 1);
  lineContaining(block, "▶ 入院: ¥200,000");
  lineContaining(block, "現金: ¥800,000");
});

const eventCases = [
  ["TC-CB-042", "入院", 200000],
  ["TC-CB-043", "歯科治療", 50000],
  ["TC-CB-044", "薬の購入", 20000],
  ["TC-CB-045", "家電故障", 100000],
  ["TC-CB-046", "車検", 80000],
  ["TC-CB-047", "冠婚葬祭", 120000],
  ["TC-CB-048", "健康診断", 30000],
  ["TC-CB-049", "引越し", 200000]
];

for (const [id, eventName, cost] of eventCases) {
  test(`${id} ${eventName}イベント`, () => {
    // TD009 / TV014 / TA004 / Spec: 仕様4.1, 5.3 / Risk: R004
    const lines = simulate({ eventProb: 1, eventTypes: [{ name: eventName, cost }], initialCash: 1000000 }, { random: () => 0 });
    const block = monthBlock(lines, 100, 1);
    lineContaining(block, `▶ ${eventName}: ${fmt(cost)}`);
    lineContaining(block, `現金: ${fmt(1000000 - cost)}`);
  });
}

test("TC-CB-050 Math.random差し替えでイベント有無を固定", () => {
  // TC-CB-050 / TD010 / TV015 / TA004 / Spec: 仕様5.3 / Risk: R004
  const lines = simulate({ eventProb: 0.5, eventTypes: [{ name: "入院", cost: 200000 }] }, { random: () => 0.99 });
  assert.equal(lines.some(line => line.includes("▶")), false);
});

test("TC-CB-051 イベント種別1件化で種別固定", () => {
  // TC-CB-051 / TD010 / TV015 / TA004 / Spec: 仕様5.3 / Risk: R004
  const lines = simulate({ eventProb: 1, eventTypes: [{ name: "車検", cost: 80000 }], initialCash: 1000000 }, { random: () => 0 });
  lineContaining(monthBlock(lines, 100, 1), "▶ 車検: ¥80,000");
});

test("TC-CB-052 給与変更年齢0は無効", () => {
  // TC-CB-052 / TD011 / TV017 / TA005 / Spec: 仕様2.2 F008, 7.2 / Risk: R005, R006, R013
  assert.doesNotMatch(firstWorkingIncome({ salaryChanges: [{ age: 0, salary: 4000000 }] }), /\[年収:/);
});

test("TC-CB-053 給与変更年齢1は有効", () => {
  // TC-CB-053 / TD011 / TV017 / TA005 / Spec: 仕様2.2 F008, 7.2 / Risk: R005, R006, R013
  assert.match(firstWorkingIncome({ salaryChanges: [{ age: 1, salary: 4000000 }] }), /\[年収: ¥4,000,000\]/);
});

test("TC-CB-054 給与変更年齢100は有効", () => {
  // TC-CB-054 / TD011 / TV017 / TA005 / Spec: 仕様2.2 F008, 7.2 / Risk: R005, R006, R013
  assert.match(firstWorkingIncome({ startAge: 100, retirementAge: 101, salaryChanges: [{ age: 100, salary: 4000000 }] }), /\[年収: ¥4,000,000\]/);
});

test("TC-CB-055 給与変更年齢101は無効", () => {
  // TC-CB-055 / TD011 / TV017 / TA005 / Spec: 仕様2.2 F008, 7.2 / Risk: R005, R006, R013
  assert.doesNotMatch(firstWorkingIncome({ salaryChanges: [{ age: 101, salary: 4000000 }] }), /\[年収:/);
});

test("TC-CB-056 給与変更年収0は無効", () => {
  // TC-CB-056 / TD011 / TV017 / TA005 / Spec: 仕様2.2 F008, 7.2 / Risk: R005, R006, R013
  assert.doesNotMatch(firstWorkingIncome({ salaryChanges: [{ age: 35, salary: 0 }] }), /\[年収:/);
});

test("TC-CB-057 給与変更年収正値は有効", () => {
  // TC-CB-057 / TD011 / TV017 / TA005 / Spec: 仕様2.2 F008, 7.2 / Risk: R005, R006, R013
  assert.match(firstWorkingIncome({ salaryChanges: [{ age: 35, salary: 4000000 }] }), /\[年収: ¥4,000,000\]/);
});

test("TC-CB-058 給与変更年収未入力は無効", () => {
  // TC-CB-058 / TD011 / TV017 / TA005 / Spec: 仕様2.2 F008, 7.2 / Risk: R005, R006, R013
  assert.doesNotMatch(firstWorkingIncome({ salaryChanges: [{ age: 35, salary: Number.NaN }] }), /\[年収:/);
});

test("TC-CB-059 単一給与変更", () => {
  // TC-CB-059 / TD012 / TV019 / TA005 / Spec: 仕様2.2 F008 / Risk: R005, R013
  const lines = simulate({ startAge: 34, retirementAge: 36, salary: 3000000, salaryChanges: [{ age: 35, salary: 4000000 }] });
  assert.doesNotMatch(lineContaining(monthBlock(lines, 34, 1), "給与:"), /\[年収:/);
  assert.match(lineContaining(monthBlock(lines, 35, 1), "給与:"), /\[年収: ¥4,000,000\]/);
});

test("TC-CB-060 複数年齢給与変更", () => {
  // TC-CB-060 / TD012 / TV019 / TA005 / Spec: 仕様2.2 F008 / Risk: R005, R013
  const lines = simulate({ startAge: 35, retirementAge: 41, salary: 3000000, salaryChanges: [{ age: 35, salary: 4000000 }, { age: 40, salary: 7000000 }] });
  assert.match(lineContaining(monthBlock(lines, 35, 1), "給与:"), /\[年収: ¥4,000,000\]/);
  assert.match(lineContaining(monthBlock(lines, 40, 1), "給与:"), /\[年収: ¥7,000,000\]/);
});

test("TC-CB-061 同一年齢最後追加優先", () => {
  // TC-CB-061 / TD012 / TV019 / TA005 / Spec: 仕様2.2 F008 / Risk: R005, R013
  const line = firstWorkingIncome({ salaryChanges: [{ age: 35, salary: 4000000 }, { age: 35, salary: 5000000 }] });
  assert.match(line, /\[年収: ¥5,000,000\]/);
});

test("TC-CB-062 削除後の優先順位", () => {
  // TC-CB-062 / TD012 / TV019 / TA005 / Spec: 仕様2.2 F008 / Risk: R005, R013
  const line = firstWorkingIncome({ salaryChanges: [{ age: 35, salary: 4000000 }] });
  assert.match(line, /\[年収: ¥4,000,000\]/);
  assert.doesNotMatch(line, /¥5,000,000/);
});

test("TC-CB-063 空欄フォールバック", () => {
  // TC-CB-063 / TD013 / TV023 / TA007 / Spec: 仕様7.1, 7.2 / Risk: R006, R007
  const { output } = runDomSimulation({ retirementAge: 101, pensionStartAge: 101, salary: "" });
  assertNoInvalidNumbers(output);
});

test("TC-CB-064 NaN相当フォールバック", () => {
  // TC-CB-064 / TD013 / TV023 / TA007 / Spec: 仕様7.1, 7.2 / Risk: R006, R007
  const { output } = runDomSimulation({ retirementAge: 101, pensionStartAge: 101, salary: "NaN" });
  assertNoInvalidNumbers(output);
});

test("TC-CB-065 Infinity相当フォールバック", () => {
  // TC-CB-065 / TD013 / TV023 / TA007 / Spec: 仕様7.1, 7.2 / Risk: R006, R007
  const { output } = runDomSimulation({ retirementAge: 101, pensionStartAge: 101, salary: "Infinity" });
  assertNoInvalidNumbers(output);
});

test("TC-CB-066 開始時現金の負値", () => {
  // TC-CB-066 / TD014 / TV024 / TA007 / Spec: 仕様7.2, 5.2 / Risk: R006, R007
  const lines = simulate({ initialCash: -100000, salary: 3000000 });
  assert.ok(lines.length > 0);
});

test("TC-CB-067 開始時投資残高の負値", () => {
  // TC-CB-067 / TD014 / TV024 / TA007 / Spec: 仕様7.2, 5.2 / Risk: R006, R007
  const lines = simulate({ initialInv: -100000, salary: 3000000 });
  assert.ok(lines.length > 0);
});

test("TC-CB-068 生活費の負値", () => {
  // TC-CB-068 / TD014 / TV024 / TA007 / Spec: 仕様7.2, 5.2 / Risk: R006, R007
  const lines = simulate({ expenseCurrent: -100000, salary: 3000000, retirementAge: 101 });
  assert.ok(lines.length > 0);
});

test("TC-CB-069 収入系の負値", () => {
  // TC-CB-069 / TD014 / TV024 / TA007 / Spec: 仕様7.2, 5.2 / Risk: R006, R007
  const lines = simulate({ salary: -3000000, retirementAge: 101 });
  assert.ok(lines.length > 0);
});

test("TC-CB-070 startAge 30", () => {
  // TC-CB-070 / TD017 / TV005 / TA002 / Spec: 仕様2.2 F002, 6.1 / Risk: R002, R013
  assert.equal(countMonths(simulate({ startAge: 30 })), 852);
});

test("TC-CB-071 startAge 100", () => {
  // TC-CB-071 / TD017 / TV005 / TA002 / Spec: 仕様2.2 F002, 6.1 / Risk: R002, R013
  assert.equal(countMonths(simulate({ startAge: 100 })), 12);
});

test("TC-CB-072 startAge 101", () => {
  // TC-CB-072 / TD017 / TV005 / TA002 / Spec: 仕様2.2 F002, 6.1 / Risk: R002, R013
  assert.equal(simulate({ startAge: 101 }).length, 0);
});

test("TC-CB-073 退職直前", () => {
  // TC-CB-073 / TD018 / TV006 / TA002 / Spec: 仕様2.2 F002 / Risk: R002, R013
  lineContaining(monthBlock(simulate({ startAge: 64, retirementAge: 65, pensionStartAge: 67, salary: 3000000 }), 64, 12), "給与:");
});

test("TC-CB-074 退職年齢", () => {
  // TC-CB-074 / TD018 / TV006 / TA002 / Spec: 仕様2.2 F002 / Risk: R002, R013
  lineContaining(monthBlock(simulate({ startAge: 65, retirementAge: 65, pensionStartAge: 67, gapIncome: 5000 }), 65, 1), "退職後収入: ¥5,000");
});

test("TC-CB-075 年金開始直前", () => {
  // TC-CB-075 / TD018 / TV006 / TA002 / Spec: 仕様2.2 F002 / Risk: R002, R013
  lineContaining(monthBlock(simulate({ startAge: 66, retirementAge: 65, pensionStartAge: 67, gapIncome: 5000 }), 66, 12), "退職後収入: ¥5,000");
});

test("TC-CB-076 年金開始年齢", () => {
  // TC-CB-076 / TD018 / TV006 / TA002 / Spec: 仕様2.2 F002 / Risk: R002, R013
  lineContaining(monthBlock(simulate({ startAge: 67, retirementAge: 65, pensionStartAge: 67, monthlyPension: 145000 }), 67, 1), "年金: ¥145,000");
});

test("TC-CB-077 退職年齢と年金開始が同年齢", () => {
  // TC-CB-077 / TD019 / TV007 / TA002 / Spec: 仕様2.2 F002 / Risk: R002, R013
  const lines = simulate({ startAge: 64, retirementAge: 65, pensionStartAge: 65, salary: 3000000, monthlyPension: 145000 });
  lineContaining(monthBlock(lines, 64, 1), "給与:");
  lineContaining(monthBlock(lines, 65, 1), "年金: ¥145,000");
});

test("TC-CB-078 年金開始が退職前", () => {
  // TC-CB-078 / TD019 / TV007 / TA002 / Spec: 仕様2.2 F002 / Risk: R002, R013
  const lines = simulate({ startAge: 64, retirementAge: 67, pensionStartAge: 65, salary: 3000000, monthlyPension: 145000 });
  lineContaining(monthBlock(lines, 66, 1), "給与:");
  lineContaining(monthBlock(lines, 67, 1), "年金: ¥145,000");
});

test("TC-CB-079 現役生活費", () => {
  // TC-CB-079 / TD020 / TV008 / TA002 / Spec: 仕様2.2 F002, 3.1.2 / Risk: R002, R013
  lineContaining(monthBlock(simulate({ startAge: 30, retirementAge: 65, pensionStartAge: 67, expenseCurrent: 155600 }), 30, 1), "生活費: ¥155,600");
});

test("TC-CB-080 退職後生活費", () => {
  // TC-CB-080 / TD020 / TV008 / TA002 / Spec: 仕様2.2 F002, 3.1.2 / Risk: R002, R013
  lineContaining(monthBlock(simulate({ startAge: 65, retirementAge: 65, pensionStartAge: 67, expenseGap: 228000 }), 65, 1), "生活費: ¥228,000");
});

test("TC-CB-081 年金期間生活費", () => {
  // TC-CB-081 / TD020 / TV008 / TA002 / Spec: 仕様2.2 F002, 3.1.2 / Risk: R002, R013
  lineContaining(monthBlock(simulate({ startAge: 67, retirementAge: 65, pensionStartAge: 67, expenseRetired: 228000 }), 67, 1), "生活費: ¥228,000");
});

test("TC-CB-082 投資率0%", () => {
  // TC-CB-082 / TD021 / TV009 / TA003 / Spec: 仕様2.2 F002, 5.1 / Risk: R003, R013
  const line = lineContaining(monthBlock(simulate({ startAge: 30, retirementAge: 31, salary: 3000000, investRate: 0 }), 30, 1), "給与:");
  assert.match(line, /\(投資: ¥0\)/);
});

test("TC-CB-083 投資率20%", () => {
  // TC-CB-083 / TD021 / TV009 / TA003 / Spec: 仕様2.2 F002, 5.1 / Risk: R003, R013
  const net = expectedNetMonthly(3000000).monthly;
  const line = lineContaining(monthBlock(simulate({ startAge: 30, retirementAge: 31, salary: 3000000, investRate: 0.2 }), 30, 1), "給与:");
  assert.match(line, new RegExp(`\\(投資: ${fmt(net * 0.2)}\\)`));
});

test("TC-CB-084 投資率100%", () => {
  // TC-CB-084 / TD021 / TV009 / TA003 / Spec: 仕様2.2 F002, 5.1 / Risk: R003, R013
  const net = expectedNetMonthly(3000000).monthly;
  const block = monthBlock(simulate({ startAge: 30, retirementAge: 31, salary: 3000000, investRate: 1 }), 30, 1);
  lineContaining(block, `(投資: ${fmt(net)})`);
});

test("TC-CB-085 補填発生月の表示", () => {
  // TC-CB-085 / TD022 / TV011 / TA003 / Spec: 仕様5.2, 3.1.3 / Risk: R003, R013
  assertFirstFill({ initialCash: 0, initialInv: 120000, monthlyPension: 0, expenseRetired: 100000 }, 100000, 20000, 0, 0);
});

test("TC-CB-086 給与変更エリア表示", () => {
  // TC-CB-086 / TD023 / TV016 / TA005 / Spec: 仕様2.2 F008, 3.1.2 / Risk: R005, R013
  const { document } = loadTarget({ dom: true });
  document.getElementById("toggleSalaryChanges").click();
  assert.equal(document.getElementById("salaryChanges").style.display, "block");
});

test("TC-CB-087 給与変更エリア非表示", () => {
  // TC-CB-087 / TD023 / TV016 / TA005 / Spec: 仕様2.2 F008, 3.1.2 / Risk: R005, R013
  const { document } = loadTarget({ dom: true });
  const item = addSalaryChangeViaUi(document, 35, 4000000);
  document.getElementById("toggleSalaryChanges").click();
  document.getElementById("toggleSalaryChanges").click();
  assert.equal(document.getElementById("salaryChanges").style.display, "none");
  assert.equal(document.querySelectorAll(".salary-change-item").includes(item), true);
});

test("TC-CB-088 給与変更追加", () => {
  // TC-CB-088 / TD023 / TV016 / TA005 / Spec: 仕様2.2 F008, 3.1.2 / Risk: R005, R013
  const { document } = loadTarget({ dom: true });
  addSalaryChangeViaUi(document, 35, 4000000);
  document.getElementById("runBtn").click();
  assert.match(document.getElementById("output").textContent, /\[年収: ¥4,000,000\]/);
});

test("TC-CB-089 給与変更削除", () => {
  // TC-CB-089 / TD023 / TV016 / TA005 / Spec: 仕様2.2 F008, 3.1.2 / Risk: R005, R013
  const { document } = loadTarget({ dom: true });
  const item = addSalaryChangeViaUi(document, 35, 4000000);
  item.querySelector("button").click();
  document.getElementById("runBtn").click();
  assert.doesNotMatch(document.getElementById("output").textContent, /\[年収: ¥4,000,000\]/);
});

test("TC-CB-090 給与変更後の再実行", () => {
  // TC-CB-090 / TD023 / TV016 / TA005 / Spec: 仕様2.2 F008, 3.1.2 / Risk: R005, R013
  const { document } = loadTarget({ dom: true });
  const item = addSalaryChangeViaUi(document, 35, 4000000);
  document.getElementById("runBtn").click();
  assert.match(document.getElementById("output").textContent, /\[年収: ¥4,000,000\]/);
  item.querySelector("button").click();
  document.getElementById("runBtn").click();
  assert.doesNotMatch(document.getElementById("output").textContent, /\[年収: ¥4,000,000\]/);
});

test("TC-CB-091 開始前給与変更", () => {
  // TC-CB-091 / TD024 / TV018 / TA005 / Spec: 仕様2.2 F008 / Risk: R005, R013
  assert.match(firstWorkingIncome({ startAge: 30, retirementAge: 31, salaryChanges: [{ age: 25, salary: 4000000 }] }), /\[年収: ¥4,000,000\]/);
});

test("TC-CB-092 開始同年齢給与変更", () => {
  // TC-CB-092 / TD024 / TV018 / TA005 / Spec: 仕様2.2 F008 / Risk: R005, R013
  assert.match(firstWorkingIncome({ startAge: 30, retirementAge: 31, salaryChanges: [{ age: 30, salary: 4000000 }] }), /\[年収: ¥4,000,000\]/);
});

test("TC-CB-093 退職年齢以後給与変更", () => {
  // TC-CB-093 / TD024 / TV018 / TA005 / Spec: 仕様2.2 F008 / Risk: R005, R013
  const line = lineContaining(monthBlock(simulate({ startAge: 65, retirementAge: 65, pensionStartAge: 65, monthlyPension: 100000, salaryChanges: [{ age: 65, salary: 4000000 }] }), 65, 1), "年金:");
  assert.doesNotMatch(line, /年収:/);
});

test("TC-CB-094 複数年齢の月次反映", () => {
  // TC-CB-094 / TD025 / TV019 / TA005 / Spec: 仕様2.2 F008 / Risk: R005, R013
  const lines = simulate({ startAge: 35, retirementAge: 41, salary: 3000000, salaryChanges: [{ age: 35, salary: 4000000 }, { age: 40, salary: 7000000 }] });
  assert.match(lineContaining(monthBlock(lines, 35, 1), "給与:"), /\[年収: ¥4,000,000\]/);
  assert.match(lineContaining(monthBlock(lines, 40, 1), "給与:"), /\[年収: ¥7,000,000\]/);
});

test("TC-CB-095 同一年齢最後追加の月次反映", () => {
  // TC-CB-095 / TD025 / TV019 / TA005 / Spec: 仕様2.2 F008 / Risk: R005, R013
  assert.match(firstWorkingIncome({ salaryChanges: [{ age: 35, salary: 4000000 }, { age: 35, salary: 5000000 }] }), /\[年収: ¥5,000,000\]/);
});

test("TC-CB-096 削除後再実行の月次反映", () => {
  // TC-CB-096 / TD025 / TV019 / TA005 / Spec: 仕様2.2 F008 / Risk: R005, R013
  assert.match(firstWorkingIncome({ salaryChanges: [{ age: 35, salary: 4000000 }] }), /\[年収: ¥4,000,000\]/);
});

test("TC-CB-097 退職境界と給与変更とイベントと補填の複合", () => {
  // TC-CB-097 / TD026 / TV022 / TA006 / Spec: 仕様2.2, 5.1, 5.2, 5.3 / Risk: R002, R003, R005, R013
  const lines = simulate({
    startAge: 64,
    retirementAge: 65,
    pensionStartAge: 66,
    salary: 3000000,
    salaryChanges: [{ age: 64, salary: 4000000 }],
    initialCash: 0,
    initialInv: 240000,
    expenseCurrent: 155600,
    eventProb: 1,
    eventTypes: [{ name: "入院", cost: 200000 }]
  }, { random: () => 0 });
  const block = monthBlock(lines, 64, 1);
  lineContaining(block, "給与:");
  lineContaining(block, "[年収: ¥4,000,000]");
  lineContaining(block, "▶ 入院: ¥200,000");
  lineContaining(block, "投資から補填:");
});

test("TC-CB-098 全主要数値欄の空欄代表", () => {
  // TC-CB-098 / TD027 / TV023 / TA007 / Spec: 仕様7.1, 7.2 / Risk: R006, R007
  const blanks = Object.fromEntries(Object.keys(defaultValues).filter(id => id !== "startAge").map(id => [id, ""]));
  const { output } = runDomSimulation({ ...blanks, startAge: 100 });
  assert.ok(output.length > 0);
  assertNoInvalidNumbers(output);
});

test("TC-CB-099 全主要数値欄のInfinity相当代表", () => {
  // TC-CB-099 / TD027 / TV023 / TA007 / Spec: 仕様7.1, 7.2 / Risk: R006, R007
  const infinities = Object.fromEntries(Object.keys(defaultValues).filter(id => id !== "startAge").map(id => [id, "Infinity"]));
  const { output } = runDomSimulation({ ...infinities, startAge: 100 });
  assert.ok(output.length > 0);
  assertNoInvalidNumbers(output);
});

test("TC-CB-100 全主要数値欄のNaN相当代表", () => {
  // TC-CB-100 / TD027 / TV023 / TA007 / Spec: 仕様7.1, 7.2 / Risk: R006, R007
  const nans = Object.fromEntries(Object.keys(defaultValues).filter(id => id !== "startAge").map(id => [id, "NaN"]));
  const { output } = runDomSimulation({ ...nans, startAge: 100 });
  assert.ok(output.length > 0);
  assertNoInvalidNumbers(output);
});

test("TC-CB-101 指数表記", () => {
  // TC-CB-101 / TD028 / TV025 / TA007 / Spec: 仕様7.1, 7.2, 9.4 / Risk: R006
  const { output } = runDomSimulation({ retirementAge: 101, pensionStartAge: 101, salary: "1e6" });
  assert.ok(output.length > 0);
  assertNoInvalidNumbers(output);
});

test("TC-CB-102 貼り付け値", () => {
  // TC-CB-102 / TD028 / TV025 / TA007 / Spec: 仕様7.1, 7.2, 9.4 / Risk: R006
  const { output } = runDomSimulation({ retirementAge: 101, pensionStartAge: 101, salary: "3000000" });
  assert.ok(output.length > 0);
  assertNoInvalidNumbers(output);
});

test("TC-CB-103 DOM値直接設定", () => {
  // TC-CB-103 / TD028 / TV025 / TA007 / Spec: 仕様7.1, 7.2, 9.4 / Risk: R006
  const { output } = runDomSimulation({ retirementAge: 101, pensionStartAge: 101, salary: "4000000" });
  assert.ok(output.length > 0);
  assertNoInvalidNumbers(output);
});

test("TC-CB-104 HTML断片貼り付け", () => {
  // TC-CB-104 / TD029 / TV026 / TA007 / Spec: 仕様7.2, 8.2 / Risk: R007
  const value = "<img onerror=alert(1)>";
  const { output } = runDomSimulation({ retirementAge: 101, pensionStartAge: 101, salary: value });
  assert.ok(output.length > 0);
  assertNoInvalidNumbers(output);
  assert.doesNotMatch(output, /<img|onerror|alert/);
});

test("TC-CB-105 HTML断片DOM値設定", () => {
  // TC-CB-105 / TD029 / TV026 / TA007 / Spec: 仕様7.2, 8.2 / Risk: R007
  const value = "<script>alert(1)</script>";
  const { output } = runDomSimulation({ retirementAge: 101, pensionStartAge: 101, salary: value });
  assert.ok(output.length > 0);
  assertNoInvalidNumbers(output);
  assert.doesNotMatch(output, /<script|alert/);
});

test("TC-CB-106 特殊文字列DOM値設定", () => {
  // TC-CB-106 / TD029 / TV026 / TA007 / Spec: 仕様7.2, 8.2 / Risk: R007
  const value = "<>&\"test";
  const { output } = runDomSimulation({ retirementAge: 101, pensionStartAge: 101, salary: value });
  assert.ok(output.length > 0);
  assertNoInvalidNumbers(output);
  assert.doesNotMatch(output, /<>&"test/);
});
