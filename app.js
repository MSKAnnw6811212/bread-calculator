document.addEventListener('DOMContentLoaded', () => {
    
    // --- DATA: Recipes & Presets ---
    const recipes = {
        sourdough:  { h: 75, s: 2, st: 20, tip: "Classic rustic loaf. Good for beginners." },
        focaccia:   { h: 85, s: 2.5, st: 15, tip: "Very sticky dough. Use olive oil on hands!" },
        pizza:      { h: 62, s: 3, st: 15, tip: "Stiffer dough for high heat ovens." },
        bagel:      { h: 58, s: 2, st: 1, tip: "Extremely stiff. Requires kneader or muscle." },
        ciabatta:   { h: 80, s: 2.2, st: 40, tip: "High starter amount for flavor and structure." },
        wholewheat: { h: 80, s: 2, st: 20, tip: "Whole wheat is thirsty. We increased hydration to 80%." }
    };

    // --- DOM ELEMENTS ---
    const els = {
        modeRadios: document.querySelectorAll('input[name="calc-mode"]'),
        inputArea: document.getElementById('input-area'),
        preset: document.getElementById('recipe-preset'),
        tipBox: document.getElementById('recipe-tip'),
        
        // Inputs
        inputWeight: document.getElementById('primary-weight'), // Will change ID dynamically
        hydration: document.getElementById('hydration'),
        salt: document.getElementById('salt'),
        starter: document.getElementById('starter'),

        // Badges & Results
        calcBtn: document.getElementById('calculate-btn'),
        results: document.getElementById('results'),
        trueBadge: document.getElementById('true-hydration-badge'),
        trueVal: document.getElementById('true-val'),
        trueDesc: document.getElementById('hydration-desc'),

        // Result Rows
        rFlour: document.getElementById('res-flour'),
        rWater: document.getElementById('res-water'),
        rSalt: document.getElementById('res-salt'),
        rStarter: document.getElementById('res-starter'),
        rTotal: document.getElementById('res-total'),

        // Levain Builder
        levainSec: document.getElementById('levain-section'),
        levainNeeded: document.getElementById('levain-needed'),
        levainRatio: document.getElementById('levain-ratio'),
        lvSeed: document.getElementById('lv-seed'),
        lvFlour: document.getElementById('lv-flour'),
        lvWater: document.getElementById('lv-water'),

        // Temp Calc
        tempHeader: document.getElementById('temp-header'),
        tempContent: document.getElementById('temp-content'),
        calcTempBtn: document.getElementById('calc-temp-btn')
    };

    let currentMode = 'flour';

    // --- 1. CORE: UI State Management ---
    
    function updateInputMode() {
        currentMode = document.querySelector('input[name="calc-mode"]:checked').value;
        let html = '';

        if (currentMode === 'flour') {
            html = `<label>Total Flour (g)</label><input type="number" id="primary-weight" value="1000">`;
        } else if (currentMode === 'dough') {
            html = `<label>Target Total Dough Weight (g)</label><input type="number" id="primary-weight" value="1000">`;
        } else if (currentMode === 'batch') {
            html = `
                <div class="split-inputs">
                    <div class="input-group"><label>Unit Count</label><input type="number" id="batch-count" value="4"></div>
                    <div class="input-group"><label>Weight/Unit (g)</label><input type="number" id="batch-unit" value="280"></div>
                </div>`;
        }
        els.inputArea.innerHTML = html;
    }

    function loadPreset() {
        const key = els.preset.value;
        const data = recipes[key];
        if (!data) {
            els.tipBox.classList.add('hidden');
            return;
        }

        // Set values
        els.hydration.value = data.h;
        els.salt.value = data.s;
        els.starter.value = data.st;

        // Show tip
        els.tipBox.textContent = data.tip;
        els.tipBox.classList.remove('hidden');

        // Visual flash
        els.hydration.style.backgroundColor = '#f0f7f4';
        setTimeout(() => els.hydration.style.backgroundColor = '#fdfdfc', 300);
    }

    // --- 2. CORE: The Math Engine ---

    function getHydrationDescription(pct) {
        if (pct < 65) return "Stiff / Easy";
        if (pct < 73) return "Standard / Moderate";
        if (pct < 80) return "Wet / Advanced";
        return "Very Wet / Expert";
    }

    function calculate() {
        // 1. Get Ratios
        const hPct = parseFloat(els.hydration.value) || 0;
        const sPct = parseFloat(els.salt.value) || 0;
        const stPct = parseFloat(els.starter.value) || 0;

        let flour = 0;

        // 2. Determine Flour Weight based on Mode
        if (currentMode === 'flour') {
            flour = parseFloat(document.getElementById('primary-weight').value) || 0;
        } 
        else if (currentMode === 'dough') {
            const totalTarget = parseFloat(document.getElementById('primary-weight').value) || 0;
            const totalPct = 100 + hPct + sPct + stPct;
            flour = (totalTarget / totalPct) * 100;
        } 
        else if (currentMode === 'batch') {
            const count = parseFloat(document.getElementById('batch-count').value) || 0;
            const unit = parseFloat(document.getElementById('batch-unit').value) || 0;
            const totalTarget = count * unit;
            const totalPct = 100 + hPct + sPct + stPct;
            flour = (totalTarget / totalPct) * 100;
        }

        // 3. Calculate Ingredients
        const water = flour * (hPct / 100);
        const salt = flour * (sPct / 100);
        const starter = flour * (stPct / 100);
        const total = flour + water + salt + starter;

        // 4. "True Hydration" Logic (Assume Starter is 100% hydration: half flour, half water)
        const totalWater = water + (starter / 2);
        const totalFlour = flour + (starter / 2);
        const trueHydration = (totalWater / totalFlour) * 100;

        // 5. Update UI Results
        els.rFlour.textContent = Math.round(flour) + 'g';
        els.rWater.textContent = Math.round(water) + 'g';
        els.rSalt.textContent = Math.round(salt) + 'g';
        els.rStarter.textContent = Math.round(starter) + 'g';
        els.rTotal.textContent = Math.round(total) + 'g';

        // 6. Update True Hydration Badge
        els.trueVal.textContent = trueHydration.toFixed(1) + '%';
        els.trueDesc.textContent = `(${getHydrationDescription(trueHydration)})`;
        els.trueBadge.classList.remove('hidden');

        // 7. Update Levain Builder
        updateLevainBuilder(starter);
        
        els.results.classList.remove('hidden');
        els.results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function updateLevainBuilder(targetStarterWeight) {
        if (targetStarterWeight <= 0) {
            els.levainSec.classList.add('hidden');
            return;
        }
        els.levainSec.classList.remove('hidden');
        els.levainNeeded.textContent = Math.round(targetStarterWeight) + 'g';

        // Parse Ratio (e.g. 5 from "1:5:5")
        // Formula: Total Parts = 1 + ratio + ratio. 
        // Example 1:5:5 = 11 parts.
        // Seed = Total / 11. Flour = Seed * 5. Water = Seed * 5.
        const ratio = parseFloat(els.levainRatio.value);
        const totalParts = 1 + ratio + ratio;
        const seed = targetStarterWeight / totalParts;

        els.lvSeed.textContent = Math.round(seed) + 'g';
        els.lvFlour.textContent = Math.round(seed * ratio) + 'g';
        els.lvWater.textContent = Math.round(seed * ratio) + 'g';
    }

    // --- 3. Temp Calculator Logic ---
    function calculateTemp() {
        const room = parseFloat(document.getElementById('temp-room').value) || 0;
        const flour = parseFloat(document.getElementById('temp-flour').value) || 0;
        const friction = parseFloat(document.getElementById('temp-friction').value) || 0;
        const target = parseFloat(document.getElementById('temp-target').value) || 26;

        // Formula: (Target * 3) - (Room + Flour + Friction)
        const waterTemp = (target * 3) - (room + flour + friction);
        
        const resEl = document.getElementById('res-temp-water');
        resEl.textContent = Math.round(waterTemp) + "°C";
        
        if(waterTemp > 45) { resEl.style.color = 'var(--accent-alert)'; } // Warning if too hot
        else { resEl.style.color = 'var(--text-primary)'; }
    }

    // --- 4. Event Listeners ---
    els.modeRadios.forEach(r => r.addEventListener('change', updateInputMode));
    els.preset.addEventListener('change', loadPreset);
    els.calcBtn.addEventListener('click', calculate);
    els.levainRatio.addEventListener('change', () => calculate()); // Recalc levain if ratio changes
    els.calcTempBtn.addEventListener('click', calculateTemp);
    
    // Toggle Temp Card
    els.tempHeader.addEventListener('click', () => {
        els.tempContent.classList.toggle('open');
        const arrow = els.tempHeader.querySelector('span');
        arrow.textContent = els.tempContent.classList.contains('open') ? '▲' : '▼';
    });
});
