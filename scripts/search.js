// api.js
import { setupPagination } from './pagination.js';
import { getCurrentPage } from './config.js'; // Import getter functions
import { showPage } from './ui.js';

export function sendSearchRequest() {
    const query = document.getElementById('searchInput').value;
    const url = `/search?query=${encodeURIComponent(query)}`;

    // Show loading spinner
    const loadingSpinner = document.getElementById('loadingSpinner');
    loadingSpinner.style.display = 'inline-block';

    fetch(url)
        .then(response => response.json())
        .then(data => {
            loadingSpinner.style.display = 'none';
            const filteredData = data.Results
                .filter(item => item.Seeders > 0)
                .sort((a, b) => b.Seeders - a.Seeders);

            setupPagination(filteredData);
            showPage(getCurrentPage()); // Use the getter function to get the current page

            const resultsModal = new bootstrap.Modal(document.getElementById('resultsModal'));
            resultsModal.show();
        })
        .catch(error => {
            console.error('Error:', error);
            loadingSpinner.style.display = 'none';
            alert('An error occurred. Please try again. Wagga');
        });
}
