import { getCurrentPage } from './pageConfig.js';
import { showPage } from './searchResults.js';

// pagination.js
import { setSearchResults } from './pageConfig.js';


function showErrorToast(message) {
    const errorToast = new bootstrap.Toast(document.getElementById('errorToast'));
    const toastBody = document.getElementById('toast-body');
    toastBody.innerHTML = message;
    errorToast.show();
}

function loadResults(data) {
    setSearchResults(data); // Use setter to update paginatedData
}

export async function sendSearchRequest() {
    const query = document.getElementById('searchInput').value.trim();
    if (query === '') {
        showErrorToast("Search query can't be empty.");
        return;
    }

    const loadingSpinner = document.getElementById('loadingSpinner');
    loadingSpinner.style.visibility = 'visible';

    try {
        const response = await fetch(`/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();

        loadingSpinner.style.visibility = 'hidden';

        const filteredData = data.Results
            .filter(item => item.Seeders > 0)
            .sort((a, b) => b.Seeders - a.Seeders);

        loadResults(filteredData);
        showPage(getCurrentPage());

        const resultsModal = new bootstrap.Modal(document.getElementById('resultsModal'));
        resultsModal.show();
    } catch (error) {
        loadingSpinner.style.visibility = 'hidden';
        console.error('Error:', error);

        try {
            const sessionResponse = await fetch('/account/session', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const sessionData = await sessionResponse.json();

            if (!sessionData.isLoggedIn) {
                showErrorToast("You logged out in another window or tab. Log back in to continue.");
            } else {
                showErrorToast(error.message);
            }
        } catch (sessionError) {
            showErrorToast(sessionError.message);
        }
    }
}
