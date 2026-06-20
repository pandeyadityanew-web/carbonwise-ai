/**
 * CarbonWise AI - Core JavaScript Engine (Portfolio Upgraded)
 * Features: Secure calculations, state management, onboarding demo streams, animated counters, action cards, and canvas graphics.
 */

// ==========================================
// 1. Data Store & Configuration Constants
// ==========================================

const EMISSION_FACTORS = {
  car_co2_per_km: 0.18, 
  public_co2_per_hour: 1.5, 
  electricity_co2_per_kwh: 0.85, 
  ac_co2_per_hour: 1.2, 
  appliance_co2: {
    low: 500, 
    medium: 1000,
    high: 2000
  },
  diet_co2_per_day: {
    vegetarian: 1.5, 
    mixed: 2.5,
    meat_heavy: 4.5
  },
  shopping_co2_per_pkg: 0.5, 
  fashion_co2_per_item: 12.0, 
  waste_co2_offset: {
    recycle: -150, 
    average: 100, 
    poor: 350 
  }
};

const FINANCIAL_FACTORS = {
  fuel_cost_per_km: 8.0, 
  elec_cost_per_kwh: 8.5 
};

const ECO_LEVEL_THRESHOLDS = [
  { level: "Eco Beginner", minPoints: 0 },
  { level: "Eco Explorer", minPoints: 501 },
  { level: "Carbon Warrior", minPoints: 1501 },
  { level: "Planet Protector", minPoints: 3001 }
];

const BADGES_LIST = {
  first_footprint: { id: "first_footprint", name: "First Footprint", icon: "🐾", desc: "Completed your first carbon assessment." },
  low_carbon: { id: "low_carbon", name: "Low Carbon Legend", icon: "🍃", desc: "Achieved a footprint score below 3.0 t CO₂e." },
  optimizer: { id: "optimizer", name: "What-If Optimizer", icon: "⚡", desc: "Simulated a carbon reduction of 30% or more." },
  green_streak: { id: "green_streak", name: "Green Streak", icon: "🔥", desc: "Completed 3+ assessments with continuous reductions." },
  zero_waste: { id: "zero_waste", name: "Zero Waste Hero", icon: "♻️", desc: "Recycle everything and limit monthly shopping." }
};

// ==========================================
// 2. Pure Calculation & Helper Functions
// ==========================================

function escapeHTML(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function calculateCarbonEmissions(inputs) {
  const carKm = Math.max(0, inputs.car_km || 0);
  const bikeKm = Math.max(0, inputs.bike_km || 0);
  const publicHours = Math.max(0, inputs.public_hours || 0);
  const elecKwh = Math.max(0, inputs.elec_kwh || 0);
  const acHours = Math.max(0, inputs.ac_hours || 0);
  const shopping = Math.max(0, inputs.shopping || 0);
  const fashion = Math.max(0, inputs.fashion || 0);

  const car = (carKm * EMISSION_FACTORS.car_co2_per_km * 52) / 1000;
  const bike = 0; 
  const transportPublic = (publicHours * EMISSION_FACTORS.public_co2_per_hour * 52) / 1000;
  const transport = car + bike + transportPublic;

  const energyElec = (elecKwh * EMISSION_FACTORS.electricity_co2_per_kwh * 12) / 1000;
  const energyAC = (acHours * EMISSION_FACTORS.ac_co2_per_hour * 30 * 12) / 1000;
  const energyAppliances = (EMISSION_FACTORS.appliance_co2[inputs.appliances] || 1000) / 1000;
  const energy = energyElec + energyAC + energyAppliances;

  const food = ((EMISSION_FACTORS.diet_co2_per_day[inputs.diet] || 2.5) * 365) / 1000;

  const shop = (shopping * EMISSION_FACTORS.shopping_co2_per_pkg * 12) / 1000;
  const fashionCO2 = (fashion * EMISSION_FACTORS.fashion_co2_per_item) / 1000;
  const waste = (EMISSION_FACTORS.waste_co2_offset[inputs.waste] || 100) / 1000;
  const lifestyle = shop + fashionCO2 + waste;

  const total = transport + energy + food + lifestyle;

  return {
    categories: {
      transport: parseFloat(transport.toFixed(3)),
      energy: parseFloat(energy.toFixed(3)),
      food: parseFloat(food.toFixed(3)),
      lifestyle: parseFloat(lifestyle.toFixed(3))
    },
    total: parseFloat(total.toFixed(3))
  };
}

function getImpactLevel(score) {
  if (score < 3.0) return { name: "Low", class: "bg-green" };
  if (score >= 3.0 && score < 8.0) return { name: "Moderate", class: "bg-yellow" };
  if (score >= 8.0 && score < 15.0) return { name: "High", class: "bg-orange" };
  return { name: "Very High", class: "bg-red" };
}

function evaluateGamification(assessments, appliedSimulationsCount = 0) {
  let points = 0;
  const earnedBadges = [];

  if (assessments.length === 0) {
    return { points, badges: [], level: "Eco Beginner" };
  }

  points += assessments.length * 100;
  points += appliedSimulationsCount * 150;
  
  earnedBadges.push(BADGES_LIST.first_footprint);
  points += 50;

  const latest = assessments[assessments.length - 1];
  const score = latest.score;

  if (score < 3.0) {
    points += 200;
    earnedBadges.push(BADGES_LIST.low_carbon);
    points += 50;
  } else if (score < 8.0) {
    points += 100;
  }

  const inputs = latest.inputs || {};
  if (inputs.waste === 'recycle' && (inputs.shopping || 0) < 2) {
    earnedBadges.push(BADGES_LIST.zero_waste);
    points += 50;
  }

  if (latest.simulationReducedScorePct >= 30) {
    earnedBadges.push(BADGES_LIST.optimizer);
    points += 50;
  }

  if (assessments.length >= 3) {
    let continuousImprovement = true;
    for (let i = assessments.length - 1; i >= assessments.length - 2; i--) {
      if (assessments[i].score >= assessments[i - 1].score) {
        continuousImprovement = false;
        break;
      }
    }
    if (continuousImprovement) {
      earnedBadges.push(BADGES_LIST.green_streak);
      points += 50;
    }
  }

  let level = "Eco Beginner";
  for (let i = ECO_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= ECO_LEVEL_THRESHOLDS[i].minPoints) {
      level = ECO_LEVEL_THRESHOLDS[i].level;
      break;
    }
  }

  return { points, badges: earnedBadges, level };
}

// ==========================================
// 3. UI and State Controller Class
// ==========================================

class CarbonWiseApp {
  constructor() {
    this.assessments = [];
    this.appliedSimulationsCount = 0;
    this.currentStep = 1;
    this.deferredInstallPrompt = null;
    this.isDemoMode = false;
    this.lastScoreVal = 0.00;

    this.initElements();
    this.initEventListeners();
    this.loadStateFromStorage();
    this.registerServiceWorker();
    this.initResponsiveCanvas();
    this.renderAll();
  }

  initElements() {
    // Navigation
    this.tabButtons = document.querySelectorAll('.tab-btn');
    this.tabPanels = document.querySelectorAll('.tab-panel');
    this.tabList = document.querySelector('.tab-list');
    
    // Theme Toggle
    this.themeToggle = document.getElementById('theme-toggle');
    
    // Form Inputs
    this.form = document.getElementById('assessment-form');
    this.formSteps = document.querySelectorAll('.form-step');
    this.indicators = document.querySelectorAll('.step-indicator');
    
    // Form navigation buttons
    this.btnNext1 = document.getElementById('btn-next-1');
    this.btnNext2 = document.getElementById('btn-next-2');
    this.btnPrev2 = document.getElementById('btn-prev-2');
    this.btnPrev3 = document.getElementById('btn-prev-3');

    // Hero Section buttons
    this.heroAssessBtn = document.getElementById('hero-assess-btn');
    this.heroDemoBtn = document.getElementById('hero-demo-btn');
    this.heroStatusTag = document.getElementById('hero-status-tag');
    this.heroBubbleVal = document.getElementById('hero-bubble-val');

    // Dashboard values
    this.dashScoreVal = document.getElementById('dash-score-value');
    this.dashImpactLvl = document.getElementById('dash-impact-level');
    this.quickAssessBtn = document.getElementById('quick-assess-btn');
    this.goToCoachBtn = document.getElementById('go-to-coach-btn');
    this.scoreDemoBadge = document.getElementById('score-demo-badge');
    this.scoreTrendIndicator = document.getElementById('score-trend');
    
    // Gamification
    this.userEcoLevel = document.getElementById('user-eco-level');
    this.userPoints = document.getElementById('user-points');
    this.pointsProgress = document.getElementById('points-progress');
    this.badgesContainer = document.getElementById('badges-container');
    
    // Benchmarking
    this.benchUserVal = document.getElementById('bench-user-val');
    this.benchUserBar = document.getElementById('bench-user-bar');
    this.benchmarkFeedback = document.getElementById('benchmark-feedback');
    
    // Donut chart
    this.donutSlices = document.getElementById('donut-slices');
    this.donutCenterVal = document.getElementById('donut-center-val');
    this.legendValTransport = document.getElementById('legend-val-transport');
    this.legendValEnergy = document.getElementById('legend-val-energy');
    this.legendValFood = document.getElementById('legend-val-food');
    this.legendValLifestyle = document.getElementById('legend-val-lifestyle');
    this.highestContributorAlert = document.getElementById('highest-contributor-alert');
    this.highestCategoryName = document.getElementById('highest-category-name');
    this.highestCategoryPct = document.getElementById('highest-category-pct');

    // Simulator
    this.simCarReduce = document.getElementById('sim-car-reduce');
    this.simDietShift = document.getElementById('sim-diet-shift');
    this.simEnergyReduce = document.getElementById('sim-energy-reduce');
    this.simCarVal = document.getElementById('sim-car-val');
    this.simDietVal = document.getElementById('sim-diet-val');
    this.simEnergyVal = document.getElementById('sim-energy-val');
    this.simEmissionsCurrent = document.getElementById('sim-emissions-current');
    this.simEmissionsProjected = document.getElementById('sim-emissions-projected');
    this.simReductionPct = document.getElementById('sim-reduction-percentage');
    
    // Financial/Eco outputs
    this.impactCO2Saved = document.getElementById('impact-co2-saved');
    this.impactFuelSaved = document.getElementById('impact-fuel-saved');
    this.impactElecSaved = document.getElementById('impact-elec-saved');
    this.impactTrees = document.getElementById('impact-trees');
    this.impactWater = document.getElementById('impact-water');
    this.applySimulationBtn = document.getElementById('apply-simulation-btn');

    // Smart Coach
    this.coachContainer = document.getElementById('coach-content-container');
    this.coachHighlightsContent = document.getElementById('coach-highlights-content');

    // History elements
    this.trendCanvas = document.getElementById('trend-canvas');
    this.trendNoData = document.getElementById('trend-no-data');
    this.clearHistoryBtn = document.getElementById('clear-history-btn');
    this.historyTableBody = document.getElementById('history-table-body');
    
    // PWA install button
    this.installBtn = document.getElementById('install-btn');
  }

  initEventListeners() {
    // Navigation
    this.tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('aria-controls');
        this.switchTab(targetId);
      });
    });

    if (this.tabList) {
      this.tabList.addEventListener('keydown', (e) => {
        const currentActive = document.activeElement;
        if (!currentActive.classList.contains('tab-btn')) return;

        const tabsArray = Array.from(this.tabButtons);
        let index = tabsArray.indexOf(currentActive);

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          index = (index + 1) % tabsArray.length;
          tabsArray[index].focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          index = (index - 1 + tabsArray.length) % tabsArray.length;
          tabsArray[index].focus();
        }
      });
    }

    // Theme Switcher
    this.themeToggle.addEventListener('click', () => this.toggleTheme());

    // Onboarding Hero Controls
    this.heroAssessBtn.addEventListener('click', () => this.switchTab('panel-assess'));
    this.heroDemoBtn.addEventListener('click', () => this.loadDemoProfile());

    // Navigation triggers
    this.quickAssessBtn.addEventListener('click', () => this.switchTab('panel-assess'));
    this.goToCoachBtn.addEventListener('click', () => this.switchTab('panel-coach'));

    // Form Navigation
    this.btnNext1.addEventListener('click', () => {
      if (this.validateStep(1)) this.goToStep(2);
    });
    this.btnNext2.addEventListener('click', () => {
      if (this.validateStep(2)) this.goToStep(3);
    });
    this.btnPrev2.addEventListener('click', () => {
      if (this.goToStep(1));
    });
    this.btnPrev3.addEventListener('click', () => {
      if (this.goToStep(2));
    });

    // Form Submission
    this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));

    // Simulator sliders
    const triggerSimUpdate = () => this.updateSimulationResult();
    this.simCarReduce.addEventListener('input', triggerSimUpdate);
    this.simDietShift.addEventListener('input', triggerSimUpdate);
    this.simEnergyReduce.addEventListener('input', triggerSimUpdate);

    // Apply Simulation
    this.applySimulationBtn.addEventListener('click', () => this.adoptSimulation());

    // Clear History
    this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
  }

  loadStateFromStorage() {
    try {
      this.assessments = JSON.parse(localStorage.getItem('carbonwise_assessments')) || [];
      this.appliedSimulationsCount = parseInt(localStorage.getItem('carbonwise_simulations_count')) || 0;
      
      const theme = localStorage.getItem('carbonwise_theme') || 'dark';
      if (theme === 'light') {
        document.body.classList.remove('dark-theme');
      } else {
        document.body.classList.add('dark-theme');
      }
      
      // Determine demo mode if no assessments exist
      this.isDemoMode = (this.assessments.length === 0);
    } catch (e) {
      console.error("Local storage read error:", e);
      this.assessments = [];
      this.appliedSimulationsCount = 0;
      this.isDemoMode = true;
    }
  }

  saveStateToStorage() {
    try {
      localStorage.setItem('carbonwise_assessments', JSON.stringify(this.assessments));
      localStorage.setItem('carbonwise_simulations_count', this.appliedSimulationsCount.toString());
    } catch (e) {
      console.error("Local storage write error:", e);
    }
  }

  // ==========================================
  // Demo Mode Generation Engine
  // ==========================================
  loadDemoProfile() {
    if (this.assessments.length > 0) {
      if (!confirm("Loading a Demo Profile will overwrite your existing history logs. Continue?")) {
        return;
      }
    }

    // Build a 3-step dynamic historical improvement path
    const baseTime = Date.now();
    const demoAssessments = [
      {
        id: (baseTime - 60*24*60*60*1000).toString(),
        date: new Date(baseTime - 60*24*60*60*1000).toLocaleDateString(),
        inputs: { car_km: 240, bike_km: 0, public_hours: 2, elec_kwh: 350, ac_hours: 6, appliances: "high", diet: "meat_heavy", shopping: 8, fashion: 12, waste: "poor" },
        categories: { transport: 2.402, energy: 6.472, food: 1.643, lifestyle: 1.242 },
        score: 11.76,
        simulationReducedScorePct: 0
      },
      {
        id: (baseTime - 30*24*60*60*1000).toString(),
        date: new Date(baseTime - 30*24*60*60*1000).toLocaleDateString(),
        inputs: { car_km: 150, bike_km: 10, public_hours: 4, elec_kwh: 260, ac_hours: 4, appliances: "medium", diet: "mixed", shopping: 4, fashion: 6, waste: "average" },
        categories: { transport: 1.716, energy: 4.38, food: 0.913, lifestyle: 0.296 },
        score: 7.31,
        simulationReducedScorePct: 15
      },
      {
        id: baseTime.toString(),
        date: new Date(baseTime).toLocaleDateString(),
        inputs: { car_km: 80, bike_km: 20, public_hours: 6, elec_kwh: 180, ac_hours: 2, appliances: "low", diet: "vegetarian", shopping: 2, fashion: 2, waste: "recycle" },
        categories: { transport: 1.217, energy: 2.528, food: 0.548, lifestyle: -0.114 },
        score: 4.18,
        simulationReducedScorePct: 35
      }
    ];

    this.assessments = demoAssessments;
    this.appliedSimulationsCount = 2;
    this.isDemoMode = false;
    this.saveStateToStorage();
    
    this.renderAll();
    
    // Highlight bubble
    this.heroBubbleVal.textContent = "4.2";
    this.heroStatusTag.textContent = "Demo Profile Active";
    this.heroStatusTag.className = "badge bg-yellow mb-2";

    this.switchTab('panel-dashboard');
    alert("Demo profile generated successfully! A 3-month improvement baseline has been loaded into your History.");
  }

  // ==========================================
  // Number Counter Animation Helper
  // ==========================================
  animateValue(element, start, end, duration) {
    if (!element) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const val = progress * (end - start) + start;
      element.textContent = val.toFixed(2);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  // ==========================================
  // PWA & Service Worker Support
  // ==========================================
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('Service Worker registered:', reg.scope))
          .catch(err => console.error('Service Worker registration failed:', err));
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      this.installBtn.classList.remove('hidden');
    });

    this.installBtn.addEventListener('click', () => {
      if (this.deferredInstallPrompt) {
        this.deferredInstallPrompt.prompt();
        this.deferredInstallPrompt.userChoice.then((choice) => {
          this.deferredInstallPrompt = null;
          this.installBtn.classList.add('hidden');
        });
      }
    });

    window.addEventListener('appinstalled', () => {
      this.installBtn.classList.add('hidden');
    });
  }

  // ==========================================
  // Responsive Canvas Setup
  // ==========================================
  initResponsiveCanvas() {
    if (this.trendCanvas) {
      const resizeObserver = new ResizeObserver(() => {
        const rect = this.trendCanvas.getBoundingClientRect();
        if (rect.width > 0) {
          this.drawTrendChart();
        }
      });
      if (this.trendCanvas.parentElement) {
        resizeObserver.observe(this.trendCanvas.parentElement);
      }
    }
  }

  // ==========================================
  // Tab Switching Controller
  // ==========================================
  switchTab(targetPanelId) {
    this.tabButtons.forEach(btn => {
      const isTarget = btn.getAttribute('aria-controls') === targetPanelId;
      btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      btn.setAttribute('tabindex', isTarget ? '0' : '-1');
      if (isTarget) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.tabPanels.forEach(panel => {
      if (panel.id === targetPanelId) {
        panel.classList.add('active');
        if (targetPanelId === 'panel-history') {
          requestAnimationFrame(() => this.drawTrendChart());
        }
      } else {
        panel.classList.remove('active');
      }
    });
  }

  toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('carbonwise_theme', isDark ? 'dark' : 'light');
    
    // Fix: Redraw the history trend canvas immediately on theme toggle to match contrasts
    if (document.getElementById('panel-history').classList.contains('active')) {
      this.drawTrendChart();
    }
  }

  // ==========================================
  // Form Steps & Validation Control
  // ==========================================
  goToStep(stepNumber) {
    this.currentStep = stepNumber;
    this.formSteps.forEach((step, idx) => {
      if (idx + 1 === stepNumber) {
        step.classList.remove('hidden');
        const heading = step.querySelector('h3');
        if (heading) {
          heading.setAttribute('tabindex', '-1');
          heading.focus();
        }
      } else {
        step.classList.add('hidden');
      }
    });

    this.indicators.forEach((indicator, idx) => {
      if (idx + 1 === stepNumber) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    });
  }

  validateStep(stepNumber) {
    let isValid = true;
    
    if (stepNumber === 1) {
      const carInput = document.getElementById('input-car-km');
      const bikeInput = document.getElementById('input-bike-km');
      const publicInput = document.getElementById('input-public-hours');
      
      isValid &= this.validateRange(carInput, 0, 5000, 'car-km-error', 'Please enter a valid driving mileage between 0 and 5000 km.');
      isValid &= this.validateRange(bikeInput, 0, 1000, 'bike-km-error', 'Please enter a valid cycling mileage between 0 and 1000 km.');
      isValid &= this.validateRange(publicInput, 0, 100, 'public-hours-error', 'Please enter public transit hours between 0 and 100.');
    } else if (stepNumber === 2) {
      const elecInput = document.getElementById('input-elec-kwh');
      const acInput = document.getElementById('input-ac-hours');
      
      isValid &= this.validateRange(elecInput, 0, 5000, 'elec-kwh-error', 'Please enter valid electricity usage between 0 and 5000 kWh.');
      isValid &= this.validateRange(acInput, 0, 24, 'ac-hours-error', 'Please enter AC run times between 0 and 24 hours.');
    } else if (stepNumber === 3) {
      const shoppingInput = document.getElementById('input-shopping');
      const fashionInput = document.getElementById('input-fashion');

      isValid &= this.validateRange(shoppingInput, 0, 100, 'shopping-error', 'Please enter monthly packages count between 0 and 100.');
      isValid &= this.validateRange(fashionInput, 0, 150, 'fashion-error', 'Please enter annual clothing purchases between 0 and 150.');
    }

    return isValid;
  }

  validateRange(inputEl, min, max, errorId, errorMsg) {
    const errorContainer = document.getElementById(errorId);
    const value = parseFloat(inputEl.value);
    
    if (isNaN(value) || value < min || value > max) {
      inputEl.classList.add('input-error');
      inputEl.setAttribute('aria-invalid', 'true');
      if (errorContainer) {
        errorContainer.textContent = errorMsg;
      }
      return false;
    } else {
      inputEl.classList.remove('input-error');
      inputEl.removeAttribute('aria-invalid');
      if (errorContainer) {
        errorContainer.textContent = '';
      }
      return true;
    }
  }

  // ==========================================
  // Assessment Handler
  // ==========================================
  handleFormSubmit(e) {
    e.preventDefault();
    
    const isStep1Valid = this.validateStep(1);
    const isStep2Valid = this.validateStep(2);
    const isStep3Valid = this.validateStep(3);

    if (!isStep1Valid || !isStep2Valid || !isStep3Valid) {
      if (!isStep1Valid) this.goToStep(1);
      else if (!isStep2Valid) this.goToStep(2);
      else this.goToStep(3);
      return;
    }

    // Collect and sanitize values to ensure safety
    const inputs = {
      car_km: Math.max(0, parseFloat(document.getElementById('input-car-km').value) || 0),
      bike_km: Math.max(0, parseFloat(document.getElementById('input-bike-km').value) || 0),
      public_hours: Math.max(0, parseFloat(document.getElementById('input-public-hours').value) || 0),
      elec_kwh: Math.max(0, parseFloat(document.getElementById('input-elec-kwh').value) || 0),
      ac_hours: Math.max(0, parseFloat(document.getElementById('input-ac-hours').value) || 0),
      appliances: document.getElementById('input-appliances').value,
      diet: document.getElementById('input-diet').value,
      shopping: Math.max(0, parseFloat(document.getElementById('input-shopping').value) || 0),
      fashion: Math.max(0, parseFloat(document.getElementById('input-fashion').value) || 0),
      waste: document.getElementById('input-waste').value
    };

    const result = calculateCarbonEmissions(inputs);

    const newAssessment = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      inputs: inputs,
      categories: result.categories,
      score: result.total,
      simulationReducedScorePct: 0
    };

    // Fix: Show a dynamic loading state (Calculating...) on button submit to improve UX feedback
    const submitBtn = document.getElementById('btn-submit-form');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Calculating footprint...";

    setTimeout(() => {
      this.isDemoMode = false;
      this.assessments.push(newAssessment);
      this.saveStateToStorage();
      
      this.renderAll();

      // Reset Form and buttons
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;

      this.goToStep(1);
      this.form.reset();
      document.querySelectorAll('.form-error-msg').forEach(el => el.textContent = '');
      document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
      this.switchTab('panel-dashboard');
    }, 400);
  }

  // ==========================================
  // What-If Simulation Engine
  // ==========================================
  updateSimulationResult() {
    let inputs, currentTotal;
    
    if (this.assessments.length > 0) {
      const latest = this.assessments[this.assessments.length - 1];
      inputs = latest.inputs;
      currentTotal = latest.score;
    } else {
      inputs = { car_km: 180, bike_km: 10, public_hours: 4, elec_kwh: 240, ac_hours: 4, appliances: "medium", diet: "mixed", shopping: 4, fashion: 6, waste: "average" };
      currentTotal = 8.36;
    }

    const carReductionPct = Math.max(0, Math.min(100, parseInt(this.simCarReduce.value) || 0));
    const dietVal = Math.max(1, Math.min(3, parseInt(this.simDietShift.value) || 2));
    const energyReductionPct = Math.max(0, Math.min(50, parseInt(this.simEnergyReduce.value) || 0));

    this.simCarVal.textContent = `${carReductionPct}%`;
    const dietMap = ["meat_heavy", "mixed", "vegetarian"];
    const dietLabelMap = ["Meat-Heavy", "Mixed", "Vegetarian"];
    this.simDietVal.textContent = dietLabelMap[dietVal - 1];
    this.simEnergyVal.textContent = `${energyReductionPct}%`;

    // Accessibility: Update ARIA attributes on input range sliders dynamically
    this.simCarReduce.setAttribute('aria-valuenow', carReductionPct);
    this.simDietShift.setAttribute('aria-valuenow', dietVal);
    this.simDietShift.setAttribute('aria-valuetext', dietLabelMap[dietVal - 1]);
    this.simEnergyReduce.setAttribute('aria-valuenow', energyReductionPct);

    const simulatedInputs = {
      ...inputs,
      car_km: inputs.car_km * (1 - carReductionPct / 100),
      elec_kwh: inputs.elec_kwh * (1 - energyReductionPct / 100),
      ac_hours: inputs.ac_hours * (1 - energyReductionPct / 100),
      diet: dietMap[dietVal - 1]
    };

    const simulatedResult = calculateCarbonEmissions(simulatedInputs);
    const projectedTotal = simulatedResult.total;
    const difference = Math.max(0, currentTotal - projectedTotal);
    const reductionPercent = currentTotal > 0 ? Math.round((difference / currentTotal) * 100) : 0;

    this.simEmissionsCurrent.textContent = `${currentTotal.toFixed(2)} t`;
    this.simEmissionsProjected.textContent = `${projectedTotal.toFixed(2)} t`;
    this.simReductionPct.textContent = `${reductionPercent}% Reduction`;

    const co2SavedKg = Math.round(difference * 1000);
    const weeklyDistanceReduced = inputs.car_km * (carReductionPct / 100);
    const annualDistanceReduced = weeklyDistanceReduced * 52;
    const fuelSavingsINR = Math.round(annualDistanceReduced * FINANCIAL_FACTORS.fuel_cost_per_km);

    const monthlyKwhReduced = inputs.elec_kwh * (energyReductionPct / 100);
    const annualKwhReduced = monthlyKwhReduced * 12;
    const elecSavingsINR = Math.round(annualKwhReduced * FINANCIAL_FACTORS.elec_cost_per_kwh);

    const treesEquivalent = Math.round(co2SavedKg / 22);

    let waterSavingsLiters = 0;
    const currentDiet = inputs.diet;
    const projectedDiet = dietMap[dietVal - 1];
    const dietWaterMap = { meat_heavy: 15000, mixed: 9000, vegetarian: 4000 };
    const currentWater = dietWaterMap[currentDiet] || 9000;
    const projectedWater = dietWaterMap[projectedDiet] || 9000;
    
    if (currentWater > projectedWater) {
      waterSavingsLiters = (currentWater - projectedWater) * 365;
    }

    this.impactCO2Saved.textContent = `${co2SavedKg.toLocaleString()} kg`;
    this.impactFuelSaved.textContent = `₹${fuelSavingsINR.toLocaleString()}`;
    this.impactElecSaved.textContent = `₹${elecSavingsINR.toLocaleString()}`;
    this.impactTrees.textContent = `${treesEquivalent} Trees`;
    this.impactWater.textContent = `${waterSavingsLiters.toLocaleString()} Liters`;
  }

  adoptSimulation() {
    if (this.isDemoMode && this.assessments.length === 0) {
      alert("Please take an assessment or activate the Demo Profile before adopting simulated changes.");
      return;
    }

    const currentTotal = parseFloat(this.simEmissionsCurrent.textContent);
    const projectedTotal = parseFloat(this.simEmissionsProjected.textContent);
    const percentage = currentTotal > 0 ? Math.round(((currentTotal - projectedTotal) / currentTotal) * 100) : 0;

    const latest = this.assessments[this.assessments.length - 1];
    latest.simulationReducedScorePct = percentage;

    this.appliedSimulationsCount++;
    this.saveStateToStorage();
    this.renderAll();

    alert(`Congratulations! You adopted these changes. Eco points added. You are moving closer to your target!`);
  }

  // ==========================================
  // Dynamic Views & Rendering Engine
  // ==========================================
  renderAll() {
    this.renderHeroSection();
    this.renderDashboardScore();
    this.renderGamification();
    this.renderBenchmarking();
    this.renderDonutChart();
    this.renderSmartCoach();
    this.renderHistoryTable();
    this.updateSimulationResult();
  }

  renderHeroSection() {
    if (this.isDemoMode) {
      this.heroStatusTag.textContent = "Interactive Demo";
      this.heroStatusTag.className = "badge bg-yellow mb-2";
      this.heroBubbleVal.textContent = "8.4";
      this.scoreDemoBadge.classList.remove('hidden');
    } else {
      this.heroStatusTag.textContent = "Eco Profile Live";
      this.heroStatusTag.className = "badge bg-green mb-2";
      const score = this.assessments.length > 0 ? this.assessments[this.assessments.length - 1].score : 0;
      this.heroBubbleVal.textContent = score.toFixed(1);
      this.scoreDemoBadge.classList.add('hidden');
    }
  }

  renderDashboardScore() {
    let score = 0.00;
    
    if (this.assessments.length > 0) {
      score = this.assessments[this.assessments.length - 1].score;
      this.quickAssessBtn.textContent = "Retake Assessment";
      
      if (this.assessments.length > 1) {
        const prevScore = this.assessments[this.assessments.length - 2].score;
        const diff = score - prevScore;
        const trendPct = Math.round((Math.abs(diff) / prevScore) * 100);
        if (diff < 0) {
          this.scoreTrendIndicator.innerHTML = `<span class="text-emerald">↓ ${trendPct}% improvement</span> since last test`;
        } else if (diff > 0) {
          this.scoreTrendIndicator.innerHTML = `<span class="text-orange">↑ ${trendPct}% increase</span> since last test`;
        } else {
          this.scoreTrendIndicator.textContent = "Stable score since last test";
        }
      } else {
        this.scoreTrendIndicator.textContent = "Take another assessment to establish trends.";
      }
    } else {
      score = 8.36;
      this.quickAssessBtn.textContent = "Take Assessment";
      this.scoreTrendIndicator.textContent = "Showing sample onboarding metrics.";
    }

    this.animateValue(this.dashScoreVal, this.lastScoreVal, score, 800);
    this.lastScoreVal = score;

    const impact = getImpactLevel(score);
    this.dashImpactLvl.textContent = impact.name;
    this.dashImpactLvl.className = `badge ${impact.class}`;
  }

  renderGamification() {
    let gamified;
    if (this.isDemoMode) {
      gamified = { level: "Eco Beginner", points: 150, badges: [BADGES_LIST.first_footprint] };
    } else {
      gamified = evaluateGamification(this.assessments, this.appliedSimulationsCount);
    }

    this.userEcoLevel.textContent = gamified.level;
    this.userPoints.textContent = gamified.points.toString();

    let currentMin = 0;
    let nextMax = 500;
    if (gamified.level === "Eco Explorer") { currentMin = 501; nextMax = 1500; }
    else if (gamified.level === "Carbon Warrior") { currentMin = 1501; nextMax = 3000; }
    else if (gamified.level === "Planet Protector") { currentMin = 3001; nextMax = 5000; }

    const progressPercent = Math.min(100, Math.max(0, ((gamified.points - currentMin) / (nextMax - currentMin)) * 100));
    this.pointsProgress.style.width = `${progressPercent}%`;

    this.badgesContainer.innerHTML = '';
    if (gamified.badges.length > 0) {
      gamified.badges.forEach(badge => {
        const item = document.createElement('div');
        item.className = 'badge-item';
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-label', `${badge.name} badge: ${badge.desc}`);
        item.innerHTML = `<span aria-hidden="true">${badge.icon}</span> <span>${escapeHTML(badge.name)}</span>`;
        this.badgesContainer.appendChild(item);
      });
    } else {
      const emptyDesc = document.createElement('p');
      emptyDesc.className = 'text-muted text-sm';
      emptyDesc.textContent = "No badges earned yet. Take your first assessment to start!";
      this.badgesContainer.appendChild(emptyDesc);
    }
  }

  renderBenchmarking() {
    let score = 8.36;
    if (this.assessments.length > 0) {
      score = this.assessments[this.assessments.length - 1].score;
    }

    this.benchUserVal.textContent = `${score.toFixed(1)} t`;
    
    const widthPercentage = Math.min(100, (score / 15) * 100);
    this.benchUserBar.style.width = `${widthPercentage}%`;

    let feedback = "";
    if (score < 1.9) {
      feedback = "🌍 Brilliant! Your carbon footprint is below the Indian citizen average. You are doing amazing!";
    } else if (score < 2.0) {
      feedback = "🍃 Great job! You are within the sustainable climate target bound to avoid global warming.";
    } else if (score < 4.7) {
      feedback = "⚠️ Your footprint is below the global average but still exceeds the 1.5°C climate target. Try Simulator shifts.";
    } else {
      feedback = "🚨 Warning: Your carbon footprint is higher than the global average. Let's make changes to lower it!";
    }
    this.benchmarkFeedback.textContent = feedback;
  }

  renderDonutChart() {
    let categories, total;

    if (this.assessments.length > 0) {
      const latest = this.assessments[this.assessments.length - 1];
      categories = latest.categories;
      total = latest.score;
    } else {
      categories = { transport: 2.08, energy: 5.17, food: 0.91, lifestyle: 0.20 };
      total = 8.36;
    }

    this.donutCenterVal.textContent = total.toFixed(1);

    const transportPct = total > 0 ? (categories.transport / total) * 100 : 0;
    const energyPct = total > 0 ? (categories.energy / total) * 100 : 0;
    const foodPct = total > 0 ? (categories.food / total) * 100 : 0;
    const lifestylePct = total > 0 ? (categories.lifestyle / total) * 100 : 0;

    this.legendValTransport.textContent = `${Math.round(transportPct)}%`;
    this.legendValEnergy.textContent = `${Math.round(energyPct)}%`;
    this.legendValFood.textContent = `${Math.round(foodPct)}%`;
    this.legendValLifestyle.textContent = `${Math.round(lifestylePct)}%`;

    const circumference = 251.32;
    let accumulatedAngle = 0;
    let svgContent = '';

    const colors = {
      transport: 'var(--color-transport)',
      energy: 'var(--color-energy)',
      food: 'var(--color-primary)',
      lifestyle: 'var(--color-accent)'
    };

    const segments = [
      { name: 'transport', value: categories.transport, pct: transportPct },
      { name: 'energy', value: categories.energy, pct: energyPct },
      { name: 'food', value: categories.food, pct: foodPct },
      { name: 'lifestyle', value: categories.lifestyle, pct: lifestylePct }
    ];

    segments.forEach(seg => {
      if (seg.value <= 0 || isNaN(seg.pct)) return;
      const strokeLength = (seg.pct / 100) * circumference;
      const strokeOffset = circumference - strokeLength + accumulatedAngle;
      
      svgContent += `<circle cx="50" cy="50" r="40" fill="transparent" 
                     stroke="${colors[seg.name]}" stroke-width="12" 
                     stroke-dasharray="${strokeLength} ${circumference - strokeLength}" 
                     stroke-dashoffset="${strokeOffset}" />`;
                     
      accumulatedAngle -= strokeLength;
    });

    this.donutSlices.innerHTML = svgContent;

    let highest = segments[0];
    segments.forEach(seg => {
      if (seg.value > highest.value) highest = seg;
    });

    if (total > 0 && highest.value > 0) {
      this.highestContributorAlert.classList.remove('hidden');
      const catNames = { transport: 'Transportation', energy: 'Home Energy', food: 'Food Habits', lifestyle: 'Lifestyle' };
      this.highestCategoryName.textContent = catNames[highest.name];
      this.highestCategoryPct.textContent = `${Math.round(highest.pct)}%`;
    } else {
      this.highestContributorAlert.classList.add('hidden');
    }
  }

  renderSmartCoach() {
    let topCategory, latest, score, inputs;

    if (this.assessments.length > 0) {
      latest = this.assessments[this.assessments.length - 1];
      const categories = latest.categories;
      inputs = latest.inputs;
      score = latest.score;

      topCategory = "transport";
      let maxScore = categories.transport;
      if (categories.energy > maxScore) { topCategory = "energy"; maxScore = categories.energy; }
      if (categories.food > maxScore) { topCategory = "food"; maxScore = categories.food; }
      if (categories.lifestyle > maxScore) { topCategory = "lifestyle"; maxScore = categories.lifestyle; }
    } else {
      topCategory = "energy";
      score = 8.36;
      inputs = { car_km: 180, bike_km: 10, public_hours: 4, elec_kwh: 240, ac_hours: 4, appliances: "medium", diet: "mixed", shopping: 4, fashion: 6, waste: "average" };
    }

    const coachHighlights = {
      transport: "🚗 Your transport choices contribute most. Focus on optimizing driving miles or shifting trips to bicycles.",
      energy: "⚡ Home electrical utility costs and AC usage represent your highest carbon share. Unplugging and solarization options are recommended.",
      food: "🍔 Animal agriculture foods constitute your main emissions share. Shifting diets or incorporating meat-free days yields quick results.",
      lifestyle: "📦 Shipping deliveries and fast fashion apparel purchases dominate your footprints. Consider zero-waste reuse challenges."
    };

    this.coachHighlightsContent.innerHTML = `<p class="font-medium">${escapeHTML(coachHighlights[topCategory])}</p>
      <p class="text-sm mt-2 text-muted">A full weekly blueprint and calendar are available under the Smart Coach tab.</p>`;

    const recommendations = this.generatePersonalizedRecommendations(topCategory, inputs);
    const weeklyCalendar = this.generateWeeklyCalendar(topCategory);
    const challenge = this.generateMonthlyChallenge(topCategory);
    const totalPotentialSavings = (recommendations.co2Saved * 12).toFixed(1);

    const priorityLabels = { transport: "High Priority", energy: "High Priority", food: "Medium Priority", lifestyle: "Medium Priority" };
    const priorityClasses = { transport: "bg-orange", energy: "bg-orange", food: "bg-yellow", lifestyle: "bg-accent" };
    const categoryIcons = { transport: "🚗", energy: "⚡", food: "🍔", lifestyle: "📦" };

    const actionCardsHtml = recommendations.tips.map((tip, index) => {
      let estSavingsText = "30-50 kg CO₂/yr";
      if (tip.includes("Saves ~")) {
        const parts = tip.split("Saves ~");
        estSavingsText = parts[1].replace(')', '');
      }
      return `
        <div class="coach-action-card bg-glass" tabindex="0">
          <div class="action-card-header">
            <span class="action-icon" aria-hidden="true">${categoryIcons[topCategory]}</span>
            <span class="badge ${priorityClasses[topCategory]}">${priorityLabels[topCategory]}</span>
          </div>
          <h4>Recommendation #${index + 1}</h4>
          <p class="action-desc">${escapeHTML(tip)}</p>
          <div class="action-footer">
            <span>Est. Savings: <strong class="text-emerald">${escapeHTML(estSavingsText)}</strong></span>
          </div>
        </div>
      `;
    }).join('');

    this.coachContainer.innerHTML = `
      <div class="coach-section">
        <h3>Habit Analysis Summary</h3>
        <p>Your current carbon output stands at <strong>${score.toFixed(2)} t CO₂e/year</strong>. Based on habits, the primary category for emission mitigation is <strong>${topCategory.toUpperCase()}</strong>.</p>
        <div class="alert-box mt-3">
          <strong>💡 Yearly Potential:</strong> Implementing these coach tips can reduce your emissions by up to <strong>${escapeHTML(totalPotentialSavings)} kg CO₂</strong> annually and save you money!
        </div>
      </div>

      <div class="coach-section">
        <h3>Priority Recommendations</h3>
        <div class="coach-cards-grid mt-3">
          ${actionCardsHtml}
        </div>
      </div>

      <div class="coach-section">
        <h3>Your Personalized Weekly Reduction Plan</h3>
        <p class="text-sm text-muted">Follow this daily micro-routine to cultivate eco-friendly sustainability habits.</p>
        <div class="coach-weekly-calendar mt-3">
          ${weeklyCalendar.map(day => `
            <div class="calendar-day-box">
              <span class="calendar-day-name">${escapeHTML(day.name)}</span>
              <span class="calendar-day-task">${escapeHTML(day.task)}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="coach-section">
        <h3>Monthly Challenge: ${escapeHTML(challenge.title)}</h3>
        <p class="mt-1">${escapeHTML(challenge.desc)}</p>
        <p class="text-sm text-emerald mt-2 font-medium">🎯 Completion rewards: +200 Green Points & "Eco-Hero Badge".</p>
      </div>
    `;
  }

  generatePersonalizedRecommendations(category, inputs) {
    const result = { tips: [], co2Saved: 0 };

    if (category === "transport") {
      result.tips = [
        `Reduce car driving by replacing 20% of your weekly commute with cycling or walking (Saves ~${Math.round(inputs.car_km * 0.2 * 0.18 * 52)} kg CO₂/year).`,
        "Plan route sharing or use carpooling groups for regular office/school travel.",
        "Ensure tires are fully inflated and clear cargo weights; proper service increases fuel economy by up to 4%.",
        "Utilize public transit lines (bus, metro) at least twice a week for city center travel.",
        "Consider an electric or hybrid vehicle for your next automotive investment."
      ];
      result.co2Saved = 45;
    } else if (category === "energy") {
      result.tips = [
        `Limit air conditioning runtime by 1 hour per day (Saves ~${Math.round(1.2 * 30 * 12)} kg CO₂/year).`,
        "Set AC thermostat to a energy-efficient 24°C-26°C range rather than high cooling.",
        "Clean lint filters in dryers/AC filters regularly to improve heat exchange efficiency.",
        "Unplug desktop computers, microwave units, and television electronics when not in use.",
        "Transition incandescent and halogen light bulbs to high-efficiency LED lights."
      ];
      result.co2Saved = 50;
    } else if (category === "food") {
      result.tips = [
        "Commit to one 'Meatless Monday' or plant-based protein meal choice per week.",
        "Plan your groceries list ahead of time to eliminate domestic food spoilage and wastage.",
        "Compost kitchen vegetable peels, eggshells, and organic materials to reduce landfill decay gases.",
        "Purchase locally grown fruits and produce to eliminate food-mile shipping emissions.",
        "Switch dairy milk purchases to low-carbon oat, almond, or soy alternative milks."
      ];
      result.co2Saved = 35;
    } else {
      result.tips = [
        "Unsubscribe from promotional mailing lists to avoid impulse online parcel deliveries.",
        "Invest in durable, high-quality garments rather than buying budget fast-fashion lines.",
        "Implement a strict rule: 'Buy one garment, donate one garment' to control consumption.",
        "Establish sorting containers at home for packaging boxes, glass, and electronic batteries.",
        "Opt for digital receipts instead of paper records, and buy household liquids in bulk refill pouches."
      ];
      result.co2Saved = 30;
    }

    return result;
  }

  generateWeeklyCalendar(category) {
    const baseCalendar = [
      { name: "Mon", task: "Turn off standby power" },
      { name: "Tue", task: "Zero plastic packaging day" },
      { name: "Wed", task: "Meat-free lunch choice" },
      { name: "Thu", task: "Walk/Bike short distances" },
      { name: "Fri", task: "Dry laundry on hanger" },
      { name: "Sat", task: "Audit home waste recycling" },
      { name: "Sun", task: "Plan low-carbon meals" }
    ];

    if (category === "transport") {
      baseCalendar[0].task = "Carpool or use transit";
      baseCalendar[3].task = "Walk/Bike errands (< 3km)";
      baseCalendar[6].task = "Maintain tire pressure checks";
    } else if (category === "energy") {
      baseCalendar[0].task = "Unplug unused chargers";
      baseCalendar[4].task = "Wash clothes in cold water";
      baseCalendar[5].task = "Run AC on timer sleep mode";
    } else if (category === "food") {
      baseCalendar[2].task = "Fully vegan menu day";
      baseCalendar[5].task = "Compost organic leftovers";
      baseCalendar[6].task = "Buy from local farmers market";
    }

    return baseCalendar;
  }

  generateMonthlyChallenge(category) {
    const challenges = {
      transport: { title: "Pedal Power October", desc: "Walk or ride your bicycle for all commutes under 3 kilometers during the month instead of using vehicles." },
      energy: { title: "Unplugged Living", desc: "Turn off high-power cooling units and ACs during overnight hours and switch off standby power outlets completely." },
      food: { title: "Green Plate Challenge", desc: "Adopt vegetarian habits or replace all red meats with organic poultry or plant proteins for 21 consecutive days." },
      lifestyle: { title: "Zero Package Deliveries", desc: "Avoid ordering online delivery packages. Rely on physical stores for critical shopping to save courier footprints." }
    };

    return challenges[category] || challenges.energy;
  }

  // ==========================================
  // Assessment History & Visual Chart
  // ==========================================
  renderHistoryTable() {
    this.historyTableBody.innerHTML = '';
    
    if (this.assessments.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.setAttribute('colspan', '4');
      td.className = 'text-center text-muted';
      td.textContent = "Complete an assessment to unlock personalized sustainability insights.";
      tr.appendChild(td);
      this.historyTableBody.appendChild(tr);

      this.trendNoData.classList.remove('hidden');
      this.trendCanvas.style.display = 'none';
      return;
    }

    this.trendNoData.classList.add('hidden');
    this.trendCanvas.style.display = 'block';

    const reversedHistory = [...this.assessments].reverse();
    
    reversedHistory.forEach((item, index) => {
      let trendIcon = "―";
      let trendClass = "text-muted";
      
      const prevItemInReversed = reversedHistory[index + 1];
      if (prevItemInReversed) {
        if (item.score < prevItemInReversed.score) {
          trendIcon = "↓";
          trendClass = "text-emerald";
        } else if (item.score > prevItemInReversed.score) {
          trendIcon = "↑";
          trendClass = "text-orange";
        }
      }

      const assessmentHistoryBefore = this.assessments.slice(0, this.assessments.length - index);
      const pointsMock = evaluateGamification(assessmentHistoryBefore, this.appliedSimulationsCount).points;

      const row = document.createElement('tr');
      
      const tdDate = document.createElement('td');
      tdDate.textContent = item.date;
      
      const tdScore = document.createElement('td');
      tdScore.innerHTML = `<strong>${item.score.toFixed(2)}</strong>`;
      
      const tdPoints = document.createElement('td');
      tdPoints.textContent = pointsMock.toString();
      
      const tdTrend = document.createElement('td');
      tdTrend.className = trendClass;
      tdTrend.textContent = trendIcon;

      row.appendChild(tdDate);
      row.appendChild(tdScore);
      row.appendChild(tdPoints);
      row.appendChild(tdTrend);
      
      this.historyTableBody.appendChild(row);
    });
  }

  drawTrendChart() {
    if (this.assessments.length === 0) return;

    const ctx = this.trendCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = this.trendCanvas.getBoundingClientRect();
    
    if (rect.width === 0) return;

    this.trendCanvas.width = rect.width * dpr;
    this.trendCanvas.height = Math.max(180, rect.height) * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = Math.max(180, rect.height);

    ctx.clearRect(0, 0, width, height);

    const scores = this.assessments.map(a => a.score);
    const dates = this.assessments.map(a => a.date);

    const padding = 45;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxScore = Math.max(...scores, 10);
    const minScore = 0;

    // Fix: Softer and more professional color parameters for light theme grid axes
    const isDark = document.body.classList.contains('dark-theme');
    ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Outfit';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 4; i++) {
      const val = minScore + ((maxScore - minScore) / 4) * i;
      const y = padding + chartHeight - (i / 4) * chartHeight;
      
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      
      ctx.fillText(`${val.toFixed(1)} t`, padding - 10, y + 4);
    }

    const getXCoord = (index) => {
      if (scores.length <= 1) return padding + chartWidth / 2;
      return padding + (index / (scores.length - 1)) * chartWidth;
    };
    const getYCoord = (score) => {
      return padding + chartHeight - ((score - minScore) / (maxScore - minScore)) * chartHeight;
    };

    if (scores.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      
      scores.forEach((score, index) => {
        const x = getXCoord(index);
        const y = getYCoord(score);
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      const grad = ctx.createLinearGradient(0, padding, 0, padding + chartHeight);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
      
      ctx.beginPath();
      ctx.moveTo(getXCoord(0), padding + chartHeight);
      scores.forEach((score, index) => {
        ctx.lineTo(getXCoord(index), getYCoord(score));
      });
      ctx.lineTo(getXCoord(scores.length - 1), padding + chartHeight);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }

    scores.forEach((score, index) => {
      const x = getXCoord(index);
      const y = getYCoord(score);

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#059669';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.font = 'bold 10px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText(score.toFixed(1), x, y - 10);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Outfit';
      ctx.fillText(dates[index], x, padding + chartHeight + 18);
    });
  }

  clearHistory() {
    if (confirm("Are you sure you want to permanently clear all assessment records and reset your milestones?")) {
      this.assessments = [];
      this.appliedSimulationsCount = 0;
      this.isDemoMode = true;
      this.saveStateToStorage();
      this.renderAll();
      this.switchTab('panel-dashboard');
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.appInstance = new CarbonWiseApp();
});
