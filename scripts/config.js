// config.js
let itemsPerPage = 10000; // Number of items per page
let currentPage = 1;
let paginatedData = [];

// Export getter functions to retrieve values
export function getItemsPerPage() {
    return itemsPerPage;
}

export function getCurrentPage() {
    return currentPage;
}

export function getPaginatedData() {
    return paginatedData;
}

// Export setter functions to modify values
export function setItemsPerPage(value) {
    itemsPerPage = value;
}

export function setCurrentPage(value) {
    currentPage = value;
}

export function setPaginatedData(data) {
    paginatedData = data;
}
