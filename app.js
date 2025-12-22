document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculate-btn');
    const resultsSection = document.getElementById('results');

    calculateBtn.addEventListener('click', () => {
        // UI Logic: Reveal results for visual confirmation
        resultsSection.classList.remove('hidden');
        
        // Visual feedback (scrolling to results)
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        console.log("Artisan Logic Ready.");
    });
});
