import {
    setupPagination
} from './pagination.js';
import {
    getCurrentPage
} from './config.js'; // Import getter functions
import {
    showPage
} from './ui.js';

export function sendSearchRequest() {
    const query = document.getElementById('searchInput').value;
    const url = `/search?query=${encodeURIComponent(query)}`;

    // Show loading spinner
    if (query !== '') {
        const loadingSpinner = document.getElementById('loadingSpinner');
        document.getElementById('loadingSpinner').style.visibility = 'visible';
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            document.getElementById('loadingSpinner').style.visibility = 'hidden';
            const filteredData = data.Results
                .filter(item => item.Seeders > 0)
                .sort((a, b) => b.Seeders - a.Seeders);

            setupPagination(filteredData);
            showPage(getCurrentPage()); // Use the getter function to get the current page

            const resultsModal = new bootstrap.Modal(document.getElementById('resultsModal'));
            resultsModal.show();
        })
        .catch(error => {
            document.getElementById('loadingSpinner').style.visibility = 'hidden';
            console.error('Error:', error);

            if (query === '') {
                // Display the error toast
                const errorToast = new bootstrap.Toast(document.getElementById('errorToast'));
                const toastBody = document.getElementById('toast-body');
                toastBody.innerHTML = 'Search query can\'t be empty.';
                errorToast.show();
            } else {
                // Display the error toast
                const errorToast = new bootstrap.Toast(document.getElementById('errorToast'));
                const toastBody = document.getElementById('toast-body');
                toastBody.innerHTML = error.message;
                errorToast.show();
            }
        });
}