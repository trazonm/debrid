function updateProgressCell(progressCell, progress) {
    progressCell.innerText = `${progress}%`;
}

function updateLinkCell(linkCell, downloadLink) {
    linkCell.innerHTML = `<a href="${downloadLink}" target="_blank">Download</a>`;
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
    alert.className = 'alert alert-success alert-dismissible fade show';
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
                const progressCell = document.getElementById(`progress-${id}`);
                if (progressCell) {
                    updateProgressCell(progressCell, data.progress);
                    const linkCell = progressCell.nextElementSibling;
                    if (data.progress >= 100 && data.links.length > 0) {
                        clearInterval(interval);
                        fetch(`/torrents/unrestrict?link=${encodeURIComponent(data.links[0])}`)
                            .then(response => response.json())
                            .then(unrestrictedData => {
                                updateLinkCell(linkCell, unrestrictedData.download);
                                sendProgressUpdate(id, data.filename, data.progress, unrestrictedData.download);
                            });
                    }
                }
            });
    }, 1000);
}

fetch('/account/downloads')
    .then(response => response.json())
    .then(data => {
        const tableBody = document.getElementById('downloadsTableBody');
        tableBody.innerHTML = ''; // Clear previous entries
        data.forEach(download => {
            const row = document.createElement('tr');
            row.className = "downloads-table"; 
            row.innerHTML = `
                <td>${download.id}</td>
                <td>${download.filename}</td>
                <td id="progress-${download.id}">${download.progress}%</td>
                <td id="download-link">${download.progress === 100 && download.link ? `<a href="${download.link}" target="_blank"> <img class="download-page-img" src="../assets/icons/download.png" alt="Download"></a><img class="download-page-img" src="../assets/icons/copy.png" alt="Copy" onclick="copyToClipboard('${download.link}')">` : 'In Progress'}</td>`;
            tableBody.appendChild(row);
            if (download.progress < 100) {
                checkProgress(download.id); // Check progress immediately
            }
        });
    })
    .catch(error => {
        console.error('Error fetching downloads:', error);
    });