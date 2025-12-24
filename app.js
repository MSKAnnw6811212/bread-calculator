document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONSTANTS & CONFIG ---
    // Assumption: Starter is 100% hydration (Equal parts flour/water)
    const STARTER_HYDRATION = 100; 

    // Refactored Data Structure (Clear variable names)
    const recipes = {
        sourdough:  { hydration: 75, salt: 2, starter: 20, tip: "Classic rustic loaf. Good for beginners." },
        focaccia:   { hydration: 85, salt: 2.5, starter: 15, tip: "Very sticky dough. Use olive oil on hands!" },
        pizza:      { hydration: 62, salt: 3, starter: 15, tip: "Stiffer dough for high heat ovens." },
        bagel:      { hydration: 58, salt: 2, starter: 1, tip: "Extremely stiff. Requires kneader or muscle." },
        ciabatta:   { hydration: 80, salt: 2.2, starter: 40, tip: "High starter amount for flavor and structure." },
        wholewheat: { hydration: 80, salt: 2, starter: 20, tip: "Whole wheat is thirsty. Hydration increased." }
    };

    // --- DOM ELEMENTS ---
    const els = {
        modeRadios: document.querySelectorAll('input[name="calc-mode"]'),
        
        // Mode Containers (We toggle these instead of overwriting innerHTML)
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
        preset: document.getElementById('recipe-preset'),

        // Feedback
        tipBox: document.getElementById('recipe-tip'),
        errorBox: document.getElementById('validation-msg'),
        calcBtn: document.getElementById('calculate-btn'),
        results: document.getElementById('results'),
        
        // Badges
        trueBadge: document.getElementById('true-hydration-badge'),
        trueVal: document.getElementById('true-val'),
        trueDesc: document.getElementById('hydration-desc'),

        // Outputs
        rFlour: document.getElementById('res-flour'),
        rWater: document.getElementById('res-water'),
        rSalt: document.getElementById('res-salt'),
        rStarter: document.getElementById('res-starter'),
        rTotal: document.getElementById('res-total'),

        // Levain
        levainSec: document.getElementById('levain-section'),
        levainNeeded: document.getElementById('levain-needed'),
        levainRatio: document.getElementById('levain-ratio'),
        lvSeed: document.getElementById('lv-seed'),
        lvFlour: document.getElementById('lv-flour'),
        lvWater: document.getElementById('lv-water'),

        // Temp
        tempHeader: document.getElementById('temp-header'),
        tempContent: document.getElementById('temp-content'),
        calcTempBtn: document.getElementById('calc-temp-btn')
    };

    // --- 1. UI LOGIC ---

    function updateInputMode() {
        const mode = document.querySelector('input[name="calc-mode"]:checked').value;
        
        // Hide all, then show selected
        els.containerFlour.classList.add('hidden');
        els.containerDough.classList.add('hidden');
        els.containerBatch.classList.add('hidden');

        if (mode === 'flour') els.containerFlour.classList.remove('hidden');
        if (mode === 'dough') els.containerDough.classList.remove('hidden');
        if (mode === 'batch') els.containerBatch.classList.remove('hidden');
        
        // Clear errors when switching
        showError(null);
    }

    function loadPreset() {
        const key = els.preset.value;
        const data = recipes[key];
        
        if (!data) {
            els.tipBox.classList.add('hidden');
            return;
        }

        els.hydration.value = data.hydration;
        els.salt.value = data.salt;
        els.starter.value = data.starter;

        els.tipBox.textContent = data.tip;
        els.tipBox.classList.remove('hidden');
        
        // Visual flash feedback
        els.hydration.style.backgroundColor = '#f0f7f4';
        setTimeout(() => els.hydration.style.backgroundColor = '#fdfdfc', 300);
    }

    function showError(msg) {
        if (msg) {
            els.errorBox.textContent = msg;
            els.errorBox.classList.remove('hidden');
            els.results.classList.add('hidden'); // Hide results on error
        } else {
            els.errorBox.classList.add('hidden');
        }
    }

    // --- 2. VALIDATION & MATH ---

    function validateInputs() {
        // Helper to check single value
        const check = (val, name) => {
            if (isNaN(val)) return `${name} must be a number.`;
            if (val < 0) return `${name} cannot be negative.`;
            return null;
        };

        const h = parseFloat(els.hydration.value);
        const s = parseFloat(els.salt.value);
        const st = parseFloat(els.starter.value);

        // Check Ratios
        let err = check(h, 'Hydration') || check(s, 'Salt') || check(st, 'Starter');
        if (err) return err;

        // Check High Hydration Warning (Logic Check)
        if (h > 120) return "Hydration is over 120%. This is likely a soup, not dough. Please check your input.";

        // Check Main Weight based on mode
        const mode = document.querySelector('input[name="calc-mode"]:checked').value;
        if (mode === 'flour') {
            if (parseFloat(els.inputFlour.value) <= 0) return "Please enter a valid Flour weight.";
        } else if (mode === 'dough') {
            if (parseFloat(els.inputDough.value) <= 0) return "Please enter a valid Total Dough weight.";
        } else if (mode === 'batch') {
            if (parseFloat(els.inputBatchCount.value) <= 0 || parseFloat(els.inputBatchUnit.value) <= 0) 
                return "Please enter valid Batch details.";
        }

        return null; // No errors
    }

    function calculate() {
        // 1. Validate
        const error = validateInputs();
        if (error) {
            showError(error);
            return;
        }
        showError(null); // Clear errors

        // 2. Get Ratios
        const hPct = parseFloat(els.hydration.value);
        const sPct = parseFloat(els.salt.value);
        const stPct = parseFloat(els.starter.value);
        
        let flour = 0;
        let targetTotal = 0; // Used for reverse mode check
        const mode = document.querySelector('input[name="calc-mode"]:checked').value;

        // 3. Determine Base Flour Weight
        if (mode === 'flour') {
            flour = parseFloat(els.inputFlour.value);
        } else {
            // Calculate Total Target
            if (mode === 'dough') targetTotal = parseFloat(els.inputDough.value);
            if (mode === 'batch') targetTotal = parseFloat(els.inputBatchCount.value) * parseFloat(els.inputBatchUnit.value);
            
            // Reverse Math: Flour = Total / (1 + sum of decimals)
            const totalPct = 100 + hPct + sPct + stPct;
            flour = (targetTotal / totalPct) * 100;
        }

        // 4. Calculate Ingredients
        let water = flour * (hPct / 100);
        let salt = flour * (sPct / 100);
        let starter = flour * (stPct / 100);

        // 5. Rounding & Check
        // If we are in "Total" mode, we want the sum to exactly match the input.
        // Rounding errors usually result in +/- 1g. We dump the difference into Water.
        
        let rFlour = Math.round(flour);
        let rSalt = Math.round(salt);
        let rStarter = Math.round(starter);
        let rWater = Math.round(water);

        if (mode !== 'flour') {
            const currentSum = rFlour + rSalt + rStarter + rWater;
            const diff = Math.round(targetTotal) - currentSum;
            
            if (diff !== 0) {
                // Adjust water to make the math perfect
                rWater += diff;
            }
        }

        const rTotal = rFlour + rWater + rSalt + rStarter;

        // 6. True Hydration Logic
        // Assumption: Starter is 50% flour, 50% water (100% hydration)
        const starterFlour = starter * 0.5;
        const starterWater = starter * 0.5;
        
        const totalWaterVal = water + starterWater;
        const totalFlourVal = flour + starterFlour;
        const trueHydration = (totalWaterVal / totalFlourVal) * 100;

        // 7. Update UI
        els.rFlour.textContent = rFlour + 'g';
        els.rWater.textContent = rWater + 'g';
        els.rSalt.textContent = rSalt + 'g';
        els.rStarter.textContent = rStarter + 'g';
        els.rTotal.textContent = rTotal + 'g';

        // Update Badge
        els.trueVal.textContent = trueHydration.toFixed(1) + '%';
        els.trueDesc.textContent = getHydrationDescription(trueHydration);
        els.trueBadge.classList.remove('hidden');

        // Update Levain
        updateLevainBuilder(rStarter);
        
        // Show Results
        els.results.classList.remove('hidden');
        els.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function getHydrationDescription(pct) {
        if (pct < 65) return "(Stiff)";
        if (pct < 73) return "(Standard)";
        if (pct < 80) return "(Wet)";
        return "(Very Wet)";
    }

    function updateLevainBuilder(targetStarterWeight) {
        if (targetStarterWeight <= 0) {
            els.levainSec.classList.add('hidden');
            return;
        }
        els.levainSec.classList.remove('hidden');
        els.levainNeeded.textContent = targetStarterWeight + 'g';

        const ratio = parseFloat(els.levainRatio.value);
        // Formula: 1:5:5 = 11 parts total
        const totalParts = 1 + ratio + ratio;
        const seed = targetStarterWeight / totalParts;

        els.lvSeed.textContent = Math.round(seed) + 'g';
        els.lvFlour.textContent = Math.round(seed * ratio) + 'g';
        els.lvWater.textContent = Math.round(seed * ratio) + 'g';
    }

    // --- 3. TEMP CALCULATOR ---
    function calculateTemp() {
        const room = parseFloat(document.getElementById('temp-room').value) || 0;
        const flour = parseFloat(document.getElementById('temp-flour').value) || 0;
        const friction = parseFloat(document.getElementById('temp-friction').value) || 0;
        const target = parseFloat(document.getElementById('temp-target').value) || 26;

        const waterTemp = (target * 3) - (room + flour + friction);
        const resEl = document.getElementById('res-temp-water');
        
        resEl.textContent = Math.round(waterTemp) + "°C";
        resEl.style.color = waterTemp > 45 ? '#d9534f' : 'inherit';
    }

    // --- 4. LISTENERS ---
    els.modeRadios.forEach(r => r.addEventListener('change', updateInputMode));
    els.preset.addEventListener('change', loadPreset);
    els.calcBtn.addEventListener('click', calculate);
    els.levainRatio.addEventListener('change', () => calculate());
    els.calcTempBtn.addEventListener('click', calculateTemp);
    
    // Toggle Temp Card
    els.tempHeader.addEventListener('click', () => {
        els.tempContent.classList.toggle('open');
        const arrow = els.tempHeader.querySelector('span');
        arrow.textContent = els.tempContent.classList.contains('open') ? '▲' : '▼';
    });
});
