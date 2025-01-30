let currentPage = 1;
let paginatedData = [];

export function getCurrentPage() {
    return currentPage;
}

export function getPaginatedData() {
    return paginatedData;
}

export function setSearchResults(data) {
    paginatedData = data;
}
