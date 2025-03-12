export function generateLink(link, downloadCell) {
    const downloadButton = downloadCell.querySelector('button');
    if (downloadButton) downloadButton.style.display = 'none';
    const baseUrl = 'https://jackett-service.gleeze.com';
    link = link.replace(/http:\/\/192\.168\.0\.107:9117/g, baseUrl);
    let progressText = downloadCell.querySelector('.progress-text');

    if (!progressText) {
        progressText = document.createElement('span');
        progressText.className = 'progress-text';
        progressText.innerText = 'Adding';
        downloadCell.appendChild(progressText);
    }

    startLoadingAnimation(progressText, 'Adding');
    preventPageUnload(true); // Prevent page unload

    (async () => {
        let id;
        try {
            id = await handleLink(link);
        } catch (error) {
            console.error('Error:', error);
            // alert('An error occurred while generating the link.');
            // if (downloadButton) downloadButton.style.display = 'block';
            stopLoadingAnimation(progressText);
            finalizeDownload(id, 'Invalid Torrent', 'Invalid Torrent', downloadCell);
            preventPageUnload(false); // Allow page unload
            return;
        }

        checkProgress(id, progressText, downloadCell);
    })();
}

function startLoadingAnimation(progressText, baseText) {
    let dotCount = 0;
    const loadingInterval = setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        progressText.innerText = `${baseText}${'.'.repeat(dotCount)}`;
    }, 500);

    // Attach the interval to the element so it can be stopped later
    progressText.loadingInterval = loadingInterval;
}

function stopLoadingAnimation(progressText) {
    clearInterval(progressText.loadingInterval);
}

function preventPageUnload(prevent) {
    if (prevent) {
        window.addEventListener('beforeunload', handleBeforeUnload);
    } else {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    }
}

function handleBeforeUnload(event) {
    event.preventDefault();
    event.returnValue = '';
}

async function handleLink(link) {
    if (link.includes('magnet')) {
        return await addMagnet(link);
    } else {
        const redirectUrl = await getRedirectUrl(link);
        if (redirectUrl.includes('magnet')) {
            return await addMagnet(redirectUrl);
        } else {
            return await addTorrent(redirectUrl, link);
        }
    }
}

async function addMagnet(link) {
    const response = await fetch(`/torrents/addMagnet?link=${encodeURIComponent(link)}`);
    const data = await response.json();
    if (data.id === undefined) {
        alert("Error: Invalid torrent. The file may have no seeders or could be corrupted. If you’re attempting multiple downloads simultaneously, please slow down, barnacle.");
    }
    return data.id;
}

async function getRedirectUrl(link) {
    const response = await fetch(`/torrents/checkRedirect?link=${encodeURIComponent(link)}`);
    const data = await response.json();
    return data.finalUrl || link;
}

async function addTorrent(redirectUrl, link) {
    const file = await fetch(redirectUrl);
    const blob = await file.blob();
    const formData = new FormData();
    const params = new Proxy(new URLSearchParams(link), {
        get: (searchParams, prop) => searchParams.get(prop),
    });

    const filename = params.file || 'torrent';
    formData.append('file', blob, filename);

    const response = await fetch('/torrents/addTorrent', {
        method: 'PUT',
        body: formData
    });
    const data = await response.json();
    if (data.id === undefined && data.torrentId === undefined) {
        alert("Error: Invalid torrent. The file may have no seeders or could be corrupted. If you’re attempting multiple downloads simultaneously, please slow down, barnacle.");
    }
    return data.id || data.torrentId;
}

export function checkProgress(id, progressText, downloadCell) {
    stopLoadingAnimation(progressText);
    progressText.innerText = 'Almost there';
    startLoadingAnimation(progressText, 'Almost there');
    if (id != undefined) {
        const interval = setInterval(() => {
            fetch(`/torrents/checkProgress/${id}`)
                .then(response => response.json())
                .then(data => {
                    const progress = data.progress;
                    if (!isNaN(progress)) {
                        preventPageUnload(false); // Allow page unload as soon as progress is a number
                    }
                    updateDownloadProgress(id, data.filename, progress)
                        .then(() => {
                            stopLoadingAnimation(progressText);
                            progressText.innerText = `Progress: ${progress}%`;
                            if (progress >= 100) {
                                clearInterval(interval);
                                finalizeDownload(id, data.filename, data.links[0], downloadCell);
                            }
                        });
                })
                .catch(error => {
                    console.error('Error checking progress:', error);
                    clearInterval(interval);
                    //     alert('An error occurred while updating progress.');
                });
        }, 2000);
    } else {
        finalizeDownload(id, 'Invalid Torrent', 'Invalid Torrent', downloadCell);
        preventPageUnload(false); // Allow page unload for invalid torrent
    }
}

function updateDownloadProgress(id, filename, progress) {
    return fetch('/account/updateDownload', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: id,
            filename: filename,
            progress: progress,
            // link: "In Progress"
        })
    });
}

export function finalizeDownload(id, filename, downloadLink, downloadCell) {
    if (downloadLink !== 'Invalid Torrent') {
        fetch(`/torrents/unrestrict?link=${encodeURIComponent(downloadLink)}`)
            .then(response => response.json())
            .then(data => {
                const finalDownloadLink = data.download;
                const progress = 100;
                updateDownloadProgress(id, filename, progress);

                const downloadButton = document.createElement('button');
                downloadButton.className = 'btn btn-success';
                downloadButton.textContent = 'Download Link';
                downloadButton.onclick = () => {
                    window.location.href = finalDownloadLink;
                };

                downloadCell.innerHTML = '';
                downloadCell.appendChild(downloadButton);

                // Update download progress after finalDownloadLink is set
                fetch('/account/updateDownload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: id,
                        filename: filename,
                        progress: progress,
                        link: finalDownloadLink
                    })
                });
            })
            .catch(error => {
                console.error('Error generating download link:', error);
            });
    } else {
        const downloadButton = document.createElement('button');
        downloadButton.className = 'btn btn-danger';
        downloadButton.textContent = 'Invalid Torrent';
        downloadButton.onclick = () => { };
        downloadCell.innerHTML = '';
        downloadCell.appendChild(downloadButton);
    }
}
