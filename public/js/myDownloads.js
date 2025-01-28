import { formatSize } from './ui.js';
const progressIntervals = {}; // Store intervals for each download ID

fetch('/account/downloads')
    .then(response => response.json())
    .then(data => {
        const tableBody = document.getElementById('downloadsTableBody');
        tableBody.innerHTML = ''; // Clear previous entries
        data.reverse();
        data.forEach(download => {
            const row = document.createElement('tr');
            row.className = "downloads-table";

            row.innerHTML = `
                <td>${download.id}</td>
                <td>${download.filename}</td>
                <td id="speed-${download.id}">Not Downloading</td>
                <td id="progress-${download.id}">${download.progress}%</td>
                <td id="seeders-${download.id}">Not Downloading</td>
                <td id="download-link">
                    ${download.progress === 100 && download.link ? `
                        <a href="${download.link}" target="_blank">
                            <img class="download-page-img" src="../public/assets/icons/download.png" alt="Download">
                        </a>
                        <img class="download-page-img copy-icon" src="../public/assets/icons/copy.png" alt="Copy">
                        <img class="download-page-delete delete-icon" src="../public/assets/icons/delete.png" alt="Delete">
                        ` : `<img class="download-page-delete delete-icon" src="../public/assets/icons/delete.png" alt="Delete">`
                }
                </td>`;
            tableBody.appendChild(row);

            if (!download.link || download.progress < 100) {
                checkProgress(download.id); // Check progress immediately
                console.log('Checking progress for download:', download.id);
            }
        });

        // Add event listeners to the dynamically created elements
        const copyIcons = document.querySelectorAll('.copy-icon');
        const deleteIcons = document.querySelectorAll('.delete-icon');
        const audio = new Audio('../public/assets/audio/hover.wav');

        // Preload audio to avoid delays
        audio.load();

        copyIcons.forEach(icon => {
            icon.addEventListener('click', (event) => {
                const link = event.target.closest('td').querySelector('a').href;
                copyToClipboard(link);
                audio.currentTime = 0;
                audio.play().catch(err => console.error("Playback failed:", err));
            });
        });

        deleteIcons.forEach(icon => {
            icon.addEventListener('click', (event) => {
                const id = event.target.closest('tr').querySelector('td:first-child').textContent.trim();
                deleteDownload(id);
                audio.currentTime = 0;
                audio.play().catch(err => console.error("Playback failed:", err));
            });
        });
    })
    .catch(error => {
        console.error('Error fetching downloads:', error);
    });

document.addEventListener("DOMContentLoaded", function () {
    const username = localStorage.getItem('username');
    document.getElementById('offcanvasNavbarLabel').innerHTML = 'Welcome, ' + username + '!';
});

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(() => {
      const elements = document.querySelectorAll('.fade-in');
      elements.forEach(el => {
        el.style.opacity = 1; // Trigger the fade-in
      });
    }, 0); // Delay to allow display changes to take effect
  });
  

function updateProgressCell(progressCell, progress) {
    progressCell.innerText = `${progress}`;
}

function updateSeedersCell(seedersCell, seeders) {
    seedersCell.innerText = `${seeders}`;
}

function updateSpeedCell(speedCell, speed) {
    speedCell.innerText = `${speed}/s`;
}


function updateLinkCell(downloadLinkCell, downloadLink) {
    downloadLinkCell.innerHTML = `
        <a href="${downloadLink}" id="updatedLink" target="_blank">
            <img class="download-page-img" src="../public/assets/icons/download.png" alt="Download">
        </a>
        <img class="download-page-img copy-icon" src="../public/assets/icons/copy.png" alt="Copy">
        <img class="download-page-delete delete-icon" src="../public/assets/icons/delete.png" alt="Delete">
    `;

    // Add event listeners to the newly created elements
    const copyIcons = downloadLinkCell.querySelectorAll('.copy-icon');
    const deleteIcons = downloadLinkCell.querySelectorAll('.delete-icon');
    const audio = new Audio('../public/assets/audio/hover.wav');

    // Preload audio to avoid delays
    audio.load();

    copyIcons.forEach(icon => {
        icon.addEventListener('click', (event) => {
            const link = event.target.closest('td').querySelector('a').href;
            copyToClipboard(link);
            audio.currentTime = 0;
            audio.play().catch(err => console.error("Playback failed:", err));
        });
    });

    deleteIcons.forEach(icon => {
        icon.addEventListener('click', (event) => {
            const id = event.target.closest('tr').querySelector('td:first-child').textContent.trim();
            deleteDownload(id);
            audio.currentTime = 0;
            audio.play().catch(err => console.error("Playback failed:", err));
        });
    });
}

function deleteDownload(id) {

    fetch(`/torrents/delete/${id}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.success === true) {
                console.log('Deleted download with ID:', id);

            }
        })

    fetch(`/account/delete/${id}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.success === true) {
                // Find the row based on the ID text in the first cell
                const rows = document.querySelectorAll('tr.downloads-table');
                rows.forEach(row => {
                    const firstCell = row.querySelector('td:first-child');
                    if (firstCell && firstCell.textContent.trim() === id) {
                        row.remove();
                    }
                });
                // Clear the interval for the specific download ID
                if (progressIntervals[id]) {
                    clearInterval(progressIntervals[id]);
                    delete progressIntervals[id];
                }
            }
        });
}


function sendProgressUpdate(id, filename, progress, downloadLink) {
    fetch('/account/updateDownload', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: id,
            filename: filename,
            progress: progress,
            link: downloadLink
        })
    });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showAlert('Link copied to clipboard!');
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
}

function showAlert(message) {
    const alertPlaceholder = document.getElementById('alertPlaceholder');
    const alert = document.createElement('div');
    alert.className = 'alert alert-light alert-dismissible fade show';
    alert.role = 'alert';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertPlaceholder.appendChild(alert);

    setTimeout(() => {
        alert.classList.remove('show');
        alert.classList.add('hide');
        setTimeout(() => alert.remove(), 500); // Remove the alert after fade out
    }, 2000); // Dismiss after 2 seconds
}

function checkProgress(id) {
    const interval = setInterval(() => {
        fetch(`/torrents/checkProgress/${id}`)
            .then(response => response.json())
            .then(data => {
                const seedersCell = document.getElementById(`seeders-${id}`);
                const progressCell = document.getElementById(`progress-${id}`);
                const speedCell = document.getElementById(`speed-${id}`);
                if (progressCell) {
                    updateProgressCell(progressCell, `${data.progress}%`);
                    updateSeedersCell(seedersCell, data.seeders || '0');
                    updateSpeedCell(speedCell, formatSize(data.speed) || '0 MB/s');
                    if (data.status !== 'downloading' && data.status !== 'downloaded') {
                        updateProgressCell(progressCell, data.status);
                    }
                    const linkCell = progressCell.nextElementSibling.nextElementSibling;
                    if (data.progress >= 100 && data.links.length > 0) {
                        clearInterval(interval);
                        fetch(`/torrents/unrestrict?link=${encodeURIComponent(data.links[0])}`)
                            .then(response => response.json())
                            .then(unrestrictedData => {
                                updateLinkCell(linkCell, unrestrictedData.download);
                                updateProgressCell(progressCell, data.progress);
                                sendProgressUpdate(id, data.filename, data.progress, unrestrictedData.download);
                            });
                    }
                }
            });
    }, 1000);
    progressIntervals[id] = interval; // Store the interval for the download ID
}
