export function generateLink(link, downloadCell) {
    const downloadButton = downloadCell.querySelector('button');
    if (downloadButton) downloadButton.style.display = 'none';
    const baseUrl = 'https://jackett-service.gleeze.com';
    link = link.replace(/http:\/\/192\.168\.0\.107:9117/g, baseUrl);
    let progressText = downloadCell.querySelector('.progress-text');

    if (!progressText) {
        progressText = document.createElement('span');
        progressText.className = 'progress-text';
        progressText.innerText = 'Please Wait';

        downloadCell.appendChild(progressText);
    }

    // Start the loading ellipsis animation
    let dotCount = 0; // Start with 0 dots
    const loadingInterval = setInterval(() => {
        dotCount = (dotCount + 1) % 4;  // Cycle through 0 to 3 dots (0, 1, 2, 3)
        progressText.innerText = `Please Wait${'.'.repeat(dotCount)}`;
    }, 500); // Update every 500ms

    (async () => {
        let id;
        try {
            if (link.includes('magnet')) {
                const response = await fetch(`/addMagnet?link=${encodeURIComponent(link)}`);
                const data = await response.json();
                id = data.id;
                if (id === undefined) {
                    alert("Error: Invalid torrent. The file may have no seeders or could be corrupted. If you’re attempting multiple downloads simultaneously, please slow down, barnacle.")
                }
            } else {
                const response = await fetch(`/checkRedirect?link=${encodeURIComponent(link)}`);
                const data = await response.json();
                const redirectUrl = data.finalUrl || link; // Use finalUrl or handle accordingly

                if (redirectUrl.includes('magnet')) {
                    const response = await fetch(`/addMagnet?link=${encodeURIComponent(redirectUrl)}`);
                    const data = await response.json();
                    id = data.id;
                    if (id === undefined) {
                        alert("Error: Invalid torrent. The file may have no seeders or could be corrupted. If you’re attempting multiple downloads simultaneously, please slow down, barnacle.")
                    }
                } else {
                    const file = await fetch(redirectUrl);
                    const blob = await file.blob();
                    const formData = new FormData();
                    const params = new Proxy(new URLSearchParams(link), {
                        get: (searchParams, prop) => searchParams.get(prop),
                    });

                    const filename = params.file || 'torrent'
                    console.log('Downloading File:', filename);
                    formData.append('file', blob, filename);

                    const response = await fetch('/addTorrent', {
                        method: 'PUT',
                        body: formData
                    });
                    const data = await response.json();
                    id = data.id || data.torrentId;
                    if (id === undefined) {
                        alert("Error: Invalid torrent. The file may have no seeders or could be corrupted. If you’re attempting multiple downloads simultaneously, please slow down, barnacle.")
                    }
                }
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while generating the link.');
            if (downloadButton) downloadButton.style.display = 'block';
            clearInterval(loadingInterval); // Stop the loading animation
            return;
        }

        checkProgress(id, progressText, downloadCell, loadingInterval);
    })();
}

export function checkProgress(id, progressText, downloadCell, loadingInterval) {
    clearInterval(loadingInterval); // Stop loading animation immediately when checking progress
    progressText.innerText= `Progress: 0%`;
    if (id != undefined) {
        const interval = setInterval(() => {
            fetch(`/checkProgress/${id}`)
                .then(response => response.json())
                .then(data => {
                    const progress = data.progress;

                    progressText.innerText = `Progress: ${progress}%`;

                    if (progress >= 100) {
                        clearInterval(interval);
                        finalizeDownload(data.links[0], downloadCell);
                    }
                })
                .catch(error => {
                    console.error('Error checking progress:', error);
                    clearInterval(interval);
                    alert('An error occurred while updating progress.');
                });
        }, 2000);
    } else {
        finalizeDownload('Invalid Torrent', downloadCell);
    }
}

export function finalizeDownload(downloadLink, downloadCell) {
    if (downloadLink !== 'Invalid Torrent') {
        fetch(`/unrestrict?link=${encodeURIComponent(downloadLink)}`)
            .then(response => response.json())
            .then(data => {
                const finalDownloadLink = data.download;

                const downloadButton = document.createElement('button');
                downloadButton.className = 'btn btn-success';
                downloadButton.textContent = 'Download Link';
                
                // Navigate to the link in the same tab
                downloadButton.onclick = () => {
                    window.location.href = finalDownloadLink;
                };
                
                downloadCell.innerHTML = '';
                downloadCell.appendChild(downloadButton);
            })
            .catch(error => {
                console.error('Error generating download link:', error);
                alert('An error occurred while generating the download link.');
            });
    } else {
        const downloadButton = document.createElement('button');
        downloadButton.className = 'btn btn-outline-danger';
        downloadButton.textContent = 'Invalid Torrent';
        downloadButton.onclick = () => {};
        downloadCell.innerHTML = '';
        downloadCell.appendChild(downloadButton);
    }
}