// pagination.js
import { setPaginatedData, setCurrentPage, getPaginatedData, getItemsPerPage } from './config.js'; // Use setter functions

export function setupPagination(data) {    
    setPaginatedData(data); // Use setter to update paginatedData
    setCurrentPage(1); // Use setter to reset to the first page
    renderPaginationButtons();
}

function renderPaginationButtons() {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = ''; // Clear previous pagination buttons

    const totalPages = Math.ceil(getPaginatedData().length / getItemsPerPage()); // Use getter to get the length

    // const prevButton = document.createElement('button');
    // prevButton.className = 'btn btn-outline-info';
    // prevButton.innerText = 'Previous';
    // prevButton.disabled = getCurrentPage() === 1; // Disable if on the first page
    // prevButton.addEventListener('click', () => {
    //     if (getCurrentPage() > 1) {
    //         setCurrentPage(getCurrentPage() - 1); // Use setter to decrement the page
    //         showPage(getCurrentPage());
    //         renderPaginationButtons();
    //     }
    // });
    // paginationContainer.appendChild(prevButton);

    // const nextButton = document.createElement('button');
    // nextButton.className = 'btn btn-outline-info';
    // nextButton.innerText = 'Next';
    // nextButton.disabled = getCurrentPage() === totalPages; // Disable if on the last page
    // nextButton.addEventListener('click', () => {
    //     if (getCurrentPage() < totalPages) {
    //         setCurrentPage(getCurrentPage() + 1); // Use setter to increment the page
    //         showPage(getCurrentPage());
    //         renderPaginationButtons();
    //     }
    // });
    // paginationContainer.appendChild(nextButton);
}
