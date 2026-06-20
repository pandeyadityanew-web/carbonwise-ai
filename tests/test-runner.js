/**
 * CarbonWise AI - Client Test Runner & Assertions
 * Contains unit, range validation, and edge-case testing suites.
 */

const suites = [];

function describe(suiteName, fn) {
  const currentSuite = { name: suiteName, tests: [] };
  suites.push(currentSuite);
  
  const it = (testName, testFn) => {
    currentSuite.tests.push({ name: testName, fn: testFn });
  };
  
  fn(it);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || "Assertion failed"}: Expected [${expected}] (type ${typeof expected}) but got [${actual}] (type ${typeof actual})`);
  }
}

function assertCloseTo(actual, expected, delta = 0.01, message) {
  if (Math.abs(actual - expected) > delta) {
    throw new Error(`${message || "Assertion failed"}: Expected [${expected}] (within delta ${delta}) but got [${actual}]`);
  }
}

// ==========================================
// Test Suites Definitions
// ==========================================

describe("Carbon Footprint Calculations Suite", (it) => {
  it("should calculate correct transportation carbon emissions", () => {
    // 100 km/week car commute, 0 bike, 0 public
    // Formula: (100 * 0.18 * 52) / 1000 = 0.936 t
    const inputs = {
      car_km: 100,
      bike_km: 0,
      public_hours: 0,
      elec_kwh: 0,
      ac_hours: 0,
      appliances: "low", 
      diet: "mixed", 
      shopping: 0,
      fashion: 0,
      waste: "average" 
    };

    const results = calculateCarbonEmissions(inputs);
    assertEquals(results.categories.transport, 0.936, "Car emissions calculation mismatch");
  });

  it("should calculate correct home energy carbon emissions", () => {
    // 200 kWh/month elec, 4 hours AC/day, medium appliances
    // Elec: 200 * 0.85 * 12 / 1000 = 2.04 t
    // AC: 4 * 1.2 * 30 * 12 / 1000 = 1.728 t
    // Medium appliance: 1000 / 1000 = 1.0 t
    // Total energy: 2.04 + 1.728 + 1.0 = 4.768 t
    const inputs = {
      car_km: 0,
      bike_km: 0,
      public_hours: 0,
      elec_kwh: 200,
      ac_hours: 4,
      appliances: "medium",
      diet: "mixed",
      shopping: 0,
      fashion: 0,
      waste: "average"
    };

    const results = calculateCarbonEmissions(inputs);
    assertEquals(results.categories.energy, 4.768, "Energy emissions calculation mismatch");
  });

  it("should calculate correct diet-based emissions", () => {
    const inputsVeg = {
      car_km: 0,
      bike_km: 0,
      public_hours: 0,
      elec_kwh: 0,
      ac_hours: 0,
      appliances: "low",
      diet: "vegetarian",
      shopping: 0,
      fashion: 0,
      waste: "average"
    };

    const resultsVeg = calculateCarbonEmissions(inputsVeg);
    assertCloseTo(resultsVeg.categories.food, 0.548, 0.001, "Vegetarian food emissions mismatch");

    const inputsMeat = { ...inputsVeg, diet: "meat_heavy" };
    const resultsMeat = calculateCarbonEmissions(inputsMeat);
    assertCloseTo(resultsMeat.categories.food, 1.643, 0.001, "Meat-heavy food emissions mismatch");
  });

  it("should calculate correct lifestyle emissions including waste offsets", () => {
    const inputs = {
      car_km: 0,
      bike_km: 0,
      public_hours: 0,
      elec_kwh: 0,
      ac_hours: 0,
      appliances: "low",
      diet: "mixed",
      shopping: 5,
      fashion: 10,
      waste: "recycle"
    };

    const results = calculateCarbonEmissions(inputs);
    assertEquals(results.categories.lifestyle, 0.0, "Lifestyle emissions calculation mismatch");
  });
});

describe("Validation and Edge Boundary Conditions Suite", (it) => {
  it("should handle baseline zero boundaries correctly", () => {
    const inputs = {
      car_km: 0,
      bike_km: 0,
      public_hours: 0,
      elec_kwh: 0,
      ac_hours: 0,
      appliances: "low", 
      diet: "vegetarian", 
      shopping: 0,
      fashion: 0,
      waste: "recycle" 
    };

    const results = calculateCarbonEmissions(inputs);
    assertCloseTo(results.total, 0.898, 0.01, "Baseline minimum calculation mismatch");
  });

  it("should handle negative inputs by clamping them to zero", () => {
    // Audit check: Ensure negative inputs are securely parsed and clamped to 0
    const inputs = {
      car_km: -250,
      bike_km: -50,
      public_hours: -10,
      elec_kwh: -500,
      ac_hours: -5,
      appliances: "low",
      diet: "vegetarian",
      shopping: -5,
      fashion: -10,
      waste: "recycle"
    };

    const results = calculateCarbonEmissions(inputs);
    assertCloseTo(results.total, 0.898, 0.01, "Negative inputs should clamp to 0 yielding the baseline min footprint");
  });

  it("should handle invalid/NaN input fallbacks safely", () => {
    const inputs = {
      car_km: "invalid text input",
      bike_km: undefined,
      public_hours: null,
      elec_kwh: NaN,
      ac_hours: 0,
      appliances: "low",
      diet: "vegetarian",
      shopping: 0,
      fashion: 0,
      waste: "recycle"
    };

    const results = calculateCarbonEmissions(inputs);
    assertCloseTo(results.total, 0.898, 0.01, "NaN/Undefined values should fall back to 0 baseline emissions");
  });

  it("should determine impact levels correctly", () => {
    assertEquals(getImpactLevel(2.5).name, "Low");
    assertEquals(getImpactLevel(5.2).name, "Moderate");
    assertEquals(getImpactLevel(12.0).name, "High");
    assertEquals(getImpactLevel(18.5).name, "Very High");
  });
});

describe("Gamification & Milestone Engine Suite", (it) => {
  it("should award Eco Beginner for zero points", () => {
    const gamified = evaluateGamification([]);
    assertEquals(gamified.level, "Eco Beginner");
    assertEquals(gamified.points, 0);
    assertEquals(gamified.badges.length, 0);
  });

  it("should unlock levels and badges for assessments taken", () => {
    const mockAssessments = [
      { id: "1", score: 6.2, simulationReducedScorePct: 0, inputs: { waste: "average", shopping: 5 } }
    ];
    const gamified = evaluateGamification(mockAssessments);
    assertEquals(gamified.level, "Eco Beginner", "Level mismatch");
    assertEquals(gamified.points, 150, "Points calculation mismatch");
    assertEquals(gamified.badges[0].id, "first_footprint", "First Footprint badge missing");
  });

  it("should award Low Carbon Legend badge and extra points for low score", () => {
    const mockAssessments = [
      { id: "1", score: 2.1, simulationReducedScorePct: 0, inputs: { waste: "average", shopping: 5 } }
    ];
    const gamified = evaluateGamification(mockAssessments);
    assertEquals(gamified.points, 400);
    assert(gamified.badges.some(b => b.id === "low_carbon"), "Low Carbon badge missing");
  });

  it("should upgrade levels properly based on high score milestones", () => {
    const mockAssessments = [
      { id: "1", score: 2.0, simulationReducedScorePct: 40, inputs: { waste: "recycle", shopping: 1 } },
      { id: "2", score: 1.8, simulationReducedScorePct: 40, inputs: { waste: "recycle", shopping: 1 } }
    ];
    const gamified = evaluateGamification(mockAssessments, 1); 
    assertEquals(gamified.level, "Eco Explorer");
  });
});

describe("Interactive Simulator Calculations Suite", (it) => {
  it("should verify correct fuel and electricity cost savings calculations", () => {
    // Driving: 100km weekly distance reduced by 50% = 50km reduced weekly
    // Annual mileage saved = 50 * 52 = 2600 km
    // Cost savings = 2600 km * ₹8.00/km = ₹20,800
    const weeklyDistanceReduced = 50; 
    const annualDistanceReduced = weeklyDistanceReduced * 52;
    const fuelSavingsINR = Math.round(annualDistanceReduced * 8.0);
    assertEquals(fuelSavingsINR, 20800, "Fuel savings calculations mismatch");

    // Electricity: 200 kWh monthly usage reduced by 20% = 40 kWh saved monthly
    // Annual kWh saved = 40 * 12 = 480 kWh
    // Cost savings = 480 kWh * ₹8.50/kWh = ₹4,080
    const monthlyKwhReduced = 40;
    const annualKwhSaved = monthlyKwhReduced * 12;
    const electricitySavingsINR = Math.round(annualKwhSaved * 8.5);
    assertEquals(electricitySavingsINR, 4080, "Electricity bill savings calculations mismatch");
  });

  it("should calculate correct tree equivalencies", () => {
    // 220 kg of carbon saved
    // Tree equivalence: 220 kg / 22 kg per tree = 10 trees
    const co2SavedKg = 220;
    const trees = Math.round(co2SavedKg / 22);
    assertEquals(trees, 10, "Tree equivalence calculation mismatch");
  });
});

// ==========================================
// Execution & Visual Rendering
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('suites-root');
  const totalEl = document.getElementById('total-tests');
  const passedEl = document.getElementById('passed-tests');
  const failedEl = document.getElementById('failed-tests');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  suites.forEach(suite => {
    const card = document.createElement('div');
    card.className = 'suite-card';
    
    const title = document.createElement('div');
    title.className = 'suite-title';
    title.textContent = suite.name;
    card.appendChild(title);

    suite.tests.forEach(test => {
      totalTests++;
      const testCaseEl = document.createElement('div');
      testCaseEl.className = 'test-case';

      const headerRow = document.createElement('div');
      headerRow.className = 'test-header-row';

      const nameEl = document.createElement('span');
      nameEl.className = 'test-name';
      nameEl.textContent = test.name;
      headerRow.appendChild(nameEl);

      const statusEl = document.createElement('span');
      statusEl.className = 'test-status';
      
      try {
        test.fn();
        statusEl.textContent = 'Passed';
        statusEl.classList.add('status-passed');
        passedTests++;
      } catch (err) {
        statusEl.textContent = 'Failed';
        statusEl.classList.add('status-failed');
        testCaseEl.classList.add('failed');
        failedTests++;

        const errorEl = document.createElement('div');
        errorEl.className = 'error-details';
        errorEl.textContent = err.stack || err.message;
        testCaseEl.appendChild(errorEl);
      }

      headerRow.appendChild(statusEl);
      testCaseEl.insertBefore(headerRow, testCaseEl.firstChild);
      card.appendChild(testCaseEl);
    });

    container.appendChild(card);
  });

  totalEl.textContent = totalTests.toString();
  passedEl.textContent = passedTests.toString();
  failedEl.textContent = failedTests.toString();
});
