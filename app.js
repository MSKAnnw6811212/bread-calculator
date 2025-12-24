document.addEventListener('DOMContentLoaded', () => {
    
    // --- DATA ---
    const recipes = {
        sourdough:  { h: 75, s: 2, st: 20, tip: "Classic rustic loaf. Good for beginners." },
        focaccia:   { h: 85, s: 2.5, st: 15, tip: "Very sticky dough. Use olive oil on hands!" },
        pizza:      { h: 62, s: 3, st: 15, tip: "Stiffer dough for high heat ovens." },
        bagel:      { h: 58, s: 2, st: 1, tip: "Extremely stiff. Requires kneader or muscle." },
        ciabatta:   { h: 80, s: 2.2, st: 40, tip: "High starter amount for flavor and structure." },
        wholewheat: { h: 80, s: 2, st: 20, tip: "Whole wheat is thirsty. Hydration increased." }
    };

    // --- DOM ELEMENTS ---
    const els = {
        modeRadios: document.querySelectorAll('input[name="calc-mode"]'),
        
        // Containers
        containerFlour: document.getElementById('input-mode-flour'),
        containerDough: document.getElementById('input-mode-dough'),
        containerBatch: document.getElementById('input-mode-batch'),

        // Inputs
        inputFlour: document.getElementById('weight-flour'),
        inputDough: document.getElementById('weight-dough'),
        inputBatchCount: document.getElementById('batch-count'),
        inputBatchUnit: document.getElementById('batch-unit'),
        
        hydration: document.getElementById('hydration'),
        salt: document.getElementById('salt'),
        starter: document.getElementById('starter'),
        starterHydration: document.getElementById('starter-hydration'), // New Input
        preset: document.getElementById('recipe-preset'),

        // UI Feedback
        tipBox: document.getElementById('recipe-tip'),
        errorBox: document.getElementById('validation-msg'),
        calcBtn: document.getElementById('calculate-btn'),
        results: document.getElementById('results'),
        
        // Outputs
        rFlour: document.getElementById('res-flour'),
        rWater: document.getElementById('res-water'),
        rSalt: document.getElementById('res-salt'),
        rStarter: document.getElementById('res-starter'),
        rTotal: document.getElementById('res-total'),

        // Badges
        trueBadge: document.getElementById('true-hydration-badge'),
        trueVal: document.getElementById('true-val'),
        trueDesc: document.getElementById('hydration-desc'),

        // Levain
        levainSec: document.getElementById('levain-section'),
        levainNeeded: document.getElementById('levain-needed'),
        levainRatio: document.getElementById('levain-ratio'),
        lvSeed: document.getElementById('lv-seed'),
        lvFlour: document.getElementById('lv-flour'),
        lvWater: document.getElementById('lv-water'),

        // Temp Calc
        tempHeader: document.getElementById('temp-header'),
        tempContent: document.getElementById('temp-content'),
        calcTempBtn: document.getElementById('calc-temp-btn'),
        tempRoom: document.getElementById('temp-room'),
        tempFlour: document.getElementById('temp-flour'),
        tempFriction: document.getElementById('temp-friction'),
        tempTarget: document.getElementById('temp-target')
    };

    // --- 1. PERSISTENCE (Local Storage) ---
    function saveState() {
        const state = {
            mode: document.querySelector('input[name="calc-mode"]:checked').value,
            flour: els.inputFlour.value,
            dough: els.inputDough.value,
            batchCount: els.inputBatchCount.value,
            batchUnit: els.inputBatchUnit.value,
            hydration: els.hydration.value,
            salt: els.salt.value,
            starter: els.starter.value,
            starterHyd: els.starterHydration.value
        };
        localStorage.setItem('breadCalcState', JSON.stringify(state));
    }

    function loadState() {
        const saved = JSON.parse(localStorage.getItem('breadCalcState'));
        if (saved) {
            // Restore Radio
            const radio = document.querySelector(`input[name="calc-mode"][value="${saved.mode}"]`);
            if (radio) radio.checked = true;

            // Restore Values
            if(saved.flour) els.inputFlour.value = saved.flour;
            if(saved.dough) els.inputDough.value = saved.dough;
            if(saved.batchCount) els.inputBatchCount.value = saved.batchCount;
            if(saved.batchUnit) els.inputBatchUnit.value = saved.batchUnit;
            if(saved.hydration) els.hydration.value = saved.hydration;
            if(saved.salt) els.salt.value = saved.salt;
            if(saved.starter) els.starter.value = saved.starter;
            if(saved.starterHyd) els.starterHydration.value = saved.starterHyd;
            
            updateInputMode();
        }
    }

    // --- 2. UI LOGIC ---

    function updateInputMode() {
        const mode = document.querySelector('input[name="calc-mode"]:checked').value;
        
        els.containerFlour.classList.add('hidden');
        els.containerDough.classList.add('hidden');
        els.containerBatch.classList.add('hidden');

        if (mode === 'flour') els.containerFlour.classList.remove('hidden');
        if (mode === 'dough') els.containerDough.classList.remove('hidden');
        if (mode === 'batch') els.containerBatch.classList.remove('hidden');
        
        showError(null);
    }

    function loadPreset() {
        const key = els.preset.value;
        const data = recipes[key];
        
        if (!data) {
            els.tipBox.classList.add('hidden');
            return;
        }

        els.hydration.value = data.h;
        els.salt.value = data.s;
        els.starter.value = data.st;
        // Presets assume 100% hydration starter
        els.starterHydration.value = 100; 

        els.tipBox.textContent = data.tip;
        els.tipBox.classList.remove('hidden');
        saveState();
    }

    function showError(msg) {
        if (msg) {
            els.errorBox.textContent = msg;
            els.errorBox.classList.remove('hidden');
            els.results.classList.add('hidden');
            
            // Highlight empty fields if generic error
            document.querySelectorAll('input').forEach(i => i.classList.add('error-border'));
        } else {
            els.errorBox.classList.add('hidden');
            document.querySelectorAll('input').forEach(i => i.classList.remove('error-border'));
        }
    }

    // --- 3. MATH & VALIDATION ---

    function validateInputs() {
        const getVal = (el) => {
            if(el.value.trim() === '') return NaN; // Catch empty strings
            return parseFloat(el.value);
        };

        const h = getVal(els.hydration);
        const s = getVal(els.salt);
        const st = getVal(els.starter);
        const stHyd = getVal(els.starterHydration);

        // 1. Basic Number Check
        if (isNaN(h) || isNaN(s) || isNaN(st) || isNaN(stHyd)) {
            return "Please ensure all Percentage fields have valid numbers.";
        }

        // 2. Logic Checks
        if (h < 0 || s < 0 || st < 0 || stHyd < 0) return "Percentages cannot be negative.";
        if (h > 150) return "Hydration is extremely high (>150%). Please check your input.";

        // 3. Mode Specific Check
        const mode = document.querySelector('input[name="calc-mode"]:checked').value;
        let mainWeight = 0;

        if (mode === 'flour') mainWeight = getVal(els.inputFlour);
        else if (mode === 'dough') mainWeight = getVal(els.inputDough);
        else if (mode === 'batch') {
             const c = getVal(els.inputBatchCount);
             const u = getVal(els.inputBatchUnit);
             if (isNaN(c) || isNaN(u) || c <= 0 || u <= 0) return "Please enter valid Batch Count and Unit Weight.";
             mainWeight = c * u;
        }

        if (isNaN(mainWeight) || mainWeight <= 0) return "Please enter a valid weight.";
        if (mainWeight > 50000) return "Weight is too high (Max 50kg).";

        return null; // Valid
    }

    function calculate() {
        const error = validateInputs();
        if (error) {
            showError(error);
            return;
        }
        showError(null);
        saveState(); // Save valid input

        // Parse Inputs
        const hPct = parseFloat(els.hydration.value);
        const sPct = parseFloat(els.salt.value);
        const stPct = parseFloat(els.starter.value);
        
        // NEW: Dynamic Starter Hydration logic
        // If Starter Hyd is 100%, Factor is 1. If 50% (stiff), factor is 0.5.
        // Actually we need to determine the FLOUR contribution of the starter.
        // Formula: StarterFlour = StarterWeight * (100 / (100 + StarterHydration))
        const stHydVal = parseFloat(els.starterHydration.value) || 100;

        let flour = 0;
        let targetTotal = 0;
        const mode = document.querySelector('input[name="calc-mode"]:checked').value;

        // --- MATH ENGINE ---
        if (mode === 'flour') {
            flour = parseFloat(els.inputFlour.value);
        } else {
            if (mode === 'dough') targetTotal = parseFloat(els.inputDough.value);
            if (mode === 'batch') targetTotal = parseFloat(els.inputBatchCount.value) * parseFloat(els.inputBatchUnit.value);
            
            // Reverse Math with Variable Starter Hydration
            // Total % = 100 (Flour) + hPct (Water) + sPct (Salt) + stPct (Starter)
            const totalPct = 100 + hPct + sPct + stPct;
            flour = (targetTotal / totalPct) * 100;
        }

        const water = flour * (hPct / 100);
        const salt = flour * (sPct / 100);
        const starter = flour * (stPct / 100);

        // Rounding Correction (The "Penny Gap")
        let rFlour = Math.round(flour);
        let rSalt = Math.round(salt);
        let rStarter = Math.round(starter);
        let rWater = Math.round(water);

        if (mode !== 'flour') {
            const currentSum = rFlour + rSalt + rStarter + rWater;
            const diff = Math.round(targetTotal) - currentSum;
            if (diff !== 0) rWater += diff;
        }

        const rTotal = rFlour + rWater + rSalt + rStarter;

        // --- TRUE HYDRATION CALC ---
        // How much flour/water is inside the starter?
        // Example: 100g starter at 100% hyd = 50g flour / 50g water.
        // Example: 100g starter at 60% hyd = ?
        // FlourPart = 100g * (100 / 160) = 62.5g
        // WaterPart = 100g * (60 / 160) = 37.5g
        
        const starterFlour = starter * (100 / (100 + stHydVal));
        const starterWater = starter * (stHydVal / (100 + stHydVal));

        const totalWaterVal = water + starterWater;
        const totalFlourVal = flour + starterFlour;
        const trueHydration = (totalWaterVal / totalFlourVal) * 100;

        // --- RENDER ---
        els.rFlour.textContent = rFlour + 'g';
        els.rWater.textContent = rWater + 'g';
        els.rSalt.textContent = rSalt + 'g';
        els.rStarter.textContent = rStarter + 'g';
        els.rTotal.textContent = rTotal + 'g';

        els.trueVal.textContent = trueHydration.toFixed(1) + '%';
        els.trueDesc.textContent = getHydrationDescription(trueHydration);
        els.trueBadge.classList.remove('hidden');

        updateLevainBuilder(rStarter, stHydVal);
        els.results.classList.remove('hidden');
        els.results.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function getHydrationDescription(pct) {
        if (pct < 60) return "(Very Stiff)";
        if (pct < 68) return "(Stiff / Bagel)";
        if (pct < 74) return "(Standard)";
        if (pct < 82) return "(Wet / Rustic)";
        return "(High Hydration)";
    }

    function updateLevainBuilder(targetStarterWeight, currentHydration) {
        if (targetStarterWeight <= 0) {
            els.levainSec.classList.add('hidden');
            return;
        }
        els.levainSec.classList.remove('hidden');
        els.levainNeeded.textContent = targetStarterWeight + 'g';

        // NOTE: The Levain Builder currently assumes 100% hydration build (1:1:1, 1:2:2).
        // Scaling this for non-100% starters is complex UX. 
        // For V3, we will keep the build ratio simple (equal parts flour/water feed) 
        // but note the limitation if user has custom hydration.
        
        const ratio = parseFloat(els.levainRatio.value); 
        // 1:5:5 = 1 part seed, 5 parts flour, 5 parts water. Total 11.
        const totalParts = 1 + ratio + ratio;
        const seed = targetStarterWeight / totalParts;

        els.lvSeed.textContent = Math.round(seed) + 'g';
        els.lvFlour.textContent = Math.round(seed * ratio) + 'g';
        els.lvWater.textContent = Math.round(seed * ratio) + 'g';
    }

    // --- 4. TEMP CALCULATOR FIX ---
    function calculateTemp() {
        // Fix: Use .value and check for empty strings to prevent '0' assumptions
        const getTemp = (el) => {
            if (el.value.trim() === '') return NaN;
            return parseFloat(el.value);
        };

        const room = getTemp(els.tempRoom);
        const flour = getTemp(els.tempFlour);
        const friction = getTemp(els.tempFriction);
        const target = getTemp(els.tempTarget);

        const resEl = document.getElementById('res-temp-water');

        if (isNaN(room) || isNaN(flour) || isNaN(friction) || isNaN(target)) {
            resEl.textContent = "Enter all values";
            resEl.style.color = 'var(--accent-alert)';
            return;
        }

        // Formula: Water Temp = (Target * 3) - (Room + Flour + Friction)
        const waterTemp = (target * 3) - (room + flour + friction);
        
        resEl.textContent = Math.round(waterTemp) + "°C";
        
        // Safety Color Coding
        if(waterTemp > 50) resEl.style.color = '#b91c1c'; // Dangerously hot
        else if (waterTemp < 0) resEl.style.color = '#0284c7'; // Ice needed
        else resEl.style.color = 'var(--text-primary)';
    }

    // --- INIT ---
    loadState(); // Load from Local Storage

    // Listeners
    els.modeRadios.forEach(r => r.addEventListener('change', () => { updateInputMode(); saveState(); }));
    els.preset.addEventListener('change', loadPreset);
    els.calcBtn.addEventListener('click', calculate);
    els.levainRatio.addEventListener('change', () => calculate());
    els.calcTempBtn.addEventListener('click', calculateTemp);
    
    // Auto-save on input blur (UX improvement)
    document.querySelectorAll('input').forEach(i => {
        i.addEventListener('blur', saveState);
    });

    // Toggle Temp
    els.tempHeader.addEventListener('click', () => {
        els.tempContent.classList.toggle('open');
        const arrow = els.tempHeader.querySelector('span');
        const isOpen = els.tempContent.classList.contains('open');
        arrow.textContent = isOpen ? '▲' : '▼';
        els.tempHeader.setAttribute('aria-expanded', isOpen);
    });
});
