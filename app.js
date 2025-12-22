document.addEventListener('DOMContentLoaded', () => {
    // 1. Select DOM Elements
    const inputs = {
        flour: document.getElementById('total-flour'),
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

    // 2. The Baker's Math Logic
    function calculateRecipe() {
        // Get values from inputs (parse as numbers)
        const flourWeight = parseFloat(inputs.flour.value) || 0;
        const hydrationPct = parseFloat(inputs.hydration.value) || 0;
        const saltPct = parseFloat(inputs.salt.value) || 0;
        const starterPct = parseFloat(inputs.starter.value) || 0;

        // Calculate Weights (Flour is always 100%)
        // Formula: Flour * (Percentage / 100)
        const waterWeight = flourWeight * (hydrationPct / 100);
        const saltWeight = flourWeight * (saltPct / 100);
        const starterWeight = flourWeight * (starterPct / 100);
        
        // Sum total weight
        const totalWeight = flourWeight + waterWeight + saltWeight + starterWeight;

        // 3. Update the UI (Rounding to nearest gram)
        results.flour.textContent = `${Math.round(flourWeight)}g`;
        results.water.textContent = `${Math.round(waterWeight)}g`;
        results.salt.textContent = `${Math.round(saltWeight)}g`;
        results.starter.textContent = `${Math.round(starterWeight)}g`;
        results.total.textContent = `${Math.round(totalWeight)}g`;

        // Reveal the results card
        results.container.classList.remove('hidden');
        
        // Smooth scroll to results so user sees them on mobile
        results.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // 4. Listen for the Click
    calculateBtn.addEventListener('click', calculateRecipe);
    
    // Optional: Allow pressing "Enter" key in the last input field
    inputs.starter.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            calculateRecipe();
        }
    });
});
