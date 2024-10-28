// download.js
export function generateLink(link, downloadCell) {
    const downloadButton = downloadCell.querySelector('button');
    if (downloadButton) downloadButton.style.display = 'none';
    const baseUrl = 'https://jackett-service.gleeze.com';
    link = link.replace(/http:\/\/192\.168\.0\.107:9117/g, baseUrl);
    let progressText = downloadCell.querySelector('.progress-text');

    if (!progressText) {
        progressText = document.createElement('span');
        progressText.className = 'progress-text';
        progressText.innerText = 'Progress: 0%';

        downloadCell.appendChild(progressText);
    }

    (async () => {
        let id;
        try {
            if (link.includes('magnet')) {
                const response = await fetch(`/addMagnet?link=${encodeURIComponent(link)}`);
                const data = await response.json();
                id = data.id;
            } else {
                const response = await fetch(`/checkRedirect?link=${encodeURIComponent(link)}`);
                const data = await response.json();
                const redirectUrl = data.finalUrl || link; // Use finalUrl or handle accordingly

                if (redirectUrl.includes('magnet')) {
                    const response = await fetch(`/addMagnet?link=${encodeURIComponent(redirectUrl)}`);
                    const data = await response.json();
                    id = data.id;
                } else {
                    const file = await fetch(redirectUrl);
                    const blob = await file.blob();
                    const formData = new FormData();
                    formData.append('file', blob, 'torrent');

                    const response = await fetch('/addTorrent', {
                        method: 'PUT',
                        body: formData
                    });
                    const data = await response.json();
                    id = data.id || data.torrentId;
                }
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while generating the link.');
            if (downloadButton) downloadButton.style.display = 'block';
            return;
        }

        checkProgress(id, progressText, downloadCell);
    })();

}

export function checkProgress(id, progressText, downloadCell) {
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
}

export function finalizeDownload(downloadLink, downloadCell) {
    fetch(`/unrestrict?link=${encodeURIComponent(downloadLink)}`)
        .then(response => response.json())
        .then(data => {
            const finalDownloadLink = data.download;

            const downloadButton = document.createElement('button');
            downloadButton.className = 'btn btn-success';
            downloadButton.textContent = 'Download Link';
            downloadButton.onclick = () => window.open(finalDownloadLink, '_blank');
            downloadCell.innerHTML = '';
            downloadCell.appendChild(downloadButton);
        })
        .catch(error => {
            console.error('Error generating download link:', error);
            alert('An error occurred while generating the download link.');
        });
}