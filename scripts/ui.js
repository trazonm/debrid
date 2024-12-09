// ui.js
import { getItemsPerPage, getPaginatedData } from './config.js'; // Import the functions
import { generateLink } from './download.js';

export function showPage(page) {
    const tableBody = document.getElementById('resultsTableBody');
    tableBody.innerHTML = ''; // Clear previous results

    const itemsPerPage = getItemsPerPage(); // Get items per page using the function
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = getPaginatedData().slice(start, end); // Use the getter to access paginated data

    pageData.forEach(item => {
        const row = document.createElement('tr');

        const titleCell = document.createElement('td');
        titleCell.textContent = item.Title || 'N/A';
        titleCell.setAttribute("id", "torrent-title");

        const sizeCell = document.createElement('td');
        sizeCell.textContent = formatSize(item.Size);

        const seedersCell = document.createElement('td');
        seedersCell.textContent = item.Seeders || '0';

        // const linkCell = document.createElement('td');
        // linkCell.textContent = item.Link || item.MagnetUri;
        // linkCell.setAttribute("id", "link");

        const downloadCell = document.createElement('td');

        const downloadButton = document.createElement('button');
        downloadButton.className = 'btn btn-outline-danger';
        downloadButton.textContent = 'Generate?';
        downloadButton.onclick = () => generateLink(item.Link || item.MagnetUri, downloadCell);
        downloadCell.appendChild(downloadButton);

        row.appendChild(titleCell);
        row.appendChild(sizeCell);
        row.appendChild(seedersCell);
        // row.appendChild(linkCell);
        row.appendChild(downloadCell);

        tableBody.appendChild(row);
    });
}

export function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} Bytes`;
    else if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(2)} KB`;
    else if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
    else return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}
