document.addEventListener('DOMContentLoaded', () => {
    
    // --- Configuration: Preset Recipes ---
    const recipes = {
        sourdough: { hydration: 75, salt: 2, starter: 20 },
        focaccia:  { hydration: 85, salt: 2.5, starter: 15 },
        pizza:     { hydration: 62, salt: 3, starter: 15 }, // Salty & Stiff
        bagel:     { hydration: 58, salt: 2, starter: 1 }   // Very stiff, low yeast
    };

    // --- 1. Select DOM Elements ---
    const inputs = {
        recipeSelect: document.getElementById('recipe-preset'),
        modeRadios: document.querySelectorAll('input[name="calc-mode"]'),
        primaryLabel: document.getElementById('primary-label'),
        primaryWeight: document.getElementById('primary-weight'), // Was 'total-flour'
        hydration: document.getElementById('hydration'),
        salt: document.getElementById('salt'),
        starter: document.getElementById('starter')
    };

    const results = {
        container: document.getElementById('results'),
        flour: document.getElementById('res-flour'),
        water: document.getElementById('res-water'),
        salt: document.getElementById('res-salt'),
        starter: document.getElementById('res-starter'),
        total: document.getElementById('res-total')
    };

    const calculateBtn = document.getElementById('calculate-btn');

    // --- 2. Logic: Handle Mode Switching ---
    function updateInputMode() {
        const mode = document.querySelector('input[name="calc-mode"]:checked').value;
        
        if (mode === 'flour') {
            inputs.primaryLabel.textContent = "Total Flour (g)";
        } else {
            inputs.primaryLabel.textContent = "Target Dough Weight (g)";
        }
    }

    // --- 3. Logic: Handle Recipe Selection ---
    function loadRecipe() {
        const selectedKey = inputs.recipeSelect.value;
        const recipe = recipes[selectedKey];

        if (recipe) {
            inputs.hydration.value = recipe.hydration;
            inputs.salt.value = recipe.salt;
            inputs.starter.value = recipe.starter;
            
            // Visual feedback: Flash the background slightly to show data loaded
            inputs.hydration.style.backgroundColor = '#f0f7f4'; // subtle green tint
            setTimeout(() => inputs.hydration.style.backgroundColor = '#fdfdfc', 300);
        }
    }

    // --- 4. Logic: The Math ---
    function calculateRecipe() {
        // Get raw values
        let primaryVal = parseFloat(inputs.primaryWeight.value) || 0;
        const hPct = parseFloat(inputs.hydration.value) || 0;
        const sPct = parseFloat(inputs.salt.value) || 0;
        const stPct = parseFloat(inputs.starter.value) || 0;

        let flourWeight = 0;

        // CHECK MODE
        const mode = document.querySelector('input[name="calc-mode"]:checked').value;

        if (mode === 'flour') {
            // Standard Mode: Input IS the flour
            flourWeight = primaryVal;
        } else {
            // Reverse Mode: Input is Total Dough
            // Formula: Total% = 100% (Flour) + H% + S% + St%
            const totalPercentage = 100 + hPct + sPct + stPct;
            
            // Derive Flour: (Target / Total%) * 100
            // Example: 1000g / 197% = 507g Flour
            flourWeight = (primaryVal / totalPercentage) * 100;
        }

        // Calculate other ingredients based on the derived Flour Weight
        const waterWeight = flourWeight * (hPct / 100);
        const saltWeight = flourWeight * (sPct / 100);
        const starterWeight = flourWeight * (stPct / 100);
        const totalWeight = flourWeight + waterWeight + saltWeight + starterWeight;

        // Update UI (Round to nearest gram)
        results.flour.textContent = `${Math.round(flourWeight)}g`;
        results.water.textContent = `${Math.round(waterWeight)}g`;
        results.salt.textContent = `${Math.round(saltWeight)}g`;
        results.starter.textContent = `${Math.round(starterWeight)}g`;
        results.total.textContent = `${Math.round(totalWeight)}g`;

        // Reveal Results
        results.container.classList.remove('hidden');
        results.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // --- 5. Event Listeners ---
    calculateBtn.addEventListener('click', calculateRecipe);
    inputs.recipeSelect.addEventListener('change', loadRecipe);
    
    // Listen for radio button changes
    inputs.modeRadios.forEach(radio => {
        radio.addEventListener('change', updateInputMode);
    });

    // Enter key support
    inputs.starter.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculateRecipe();
    });
});
