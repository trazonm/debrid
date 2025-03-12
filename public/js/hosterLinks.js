function showErrorToast(message) {
    const errorToast = new bootstrap.Toast(document.getElementById('errorToast'));
    const toastBody = document.getElementById('toast-body');
    toastBody.innerHTML = message;
    errorToast.show();
}

function showSuccessToast(message) {
    const successToast = new bootstrap.Toast(document.getElementById('successToast'));
    const toastBody = document.getElementById('toast-body-success');
    toastBody.innerHTML = message;
    successToast.show();
}

// Get Username
document.addEventListener("DOMContentLoaded", function () {
    const username = localStorage.getItem('username');
    document.getElementById('offcanvasNavbarLabel').innerHTML = 'Welcome, ' + username + '!';
});

// Check Available Hosts and Load Downloads
document.addEventListener("DOMContentLoaded", async function () {
    try {
        // Load hosters
        const response = await fetch('/premiumizer/hosters');
        const data = await response.json();

        // Populate hosters modal
        populateHostersModal(data);

        // Load existing downloads
        loadHosterDownloads();
    } catch (error) {
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
});

// Load existing hoster downloads from database
async function loadHosterDownloads() {
    try {
        const downloadsContainer = document.getElementById('downloadsContainer');
        const loadingElement = downloadsContainer.querySelector('#loadingDownloads');

        // Show loading spinner
        if (loadingElement) {
            loadingElement.style.display = 'block';
        }

        const response = await fetch('/premiumizer/hoster-downloads');
        
        if (!response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
            } else {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
        }
        
        const downloads = await response.json();

        // Hide loading spinner
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }

        // Clear container except for loading element
        while (downloadsContainer.firstChild) {
            downloadsContainer.removeChild(downloadsContainer.firstChild);
        }

        if (downloads.length === 0) {
            const noDownloads = document.createElement('div');
            noDownloads.className = 'col-12 text-center';
            noDownloads.innerHTML = '<p>No downloads available.</p>';
            downloadsContainer.appendChild(noDownloads);
            return;
        }

        // Display downloads
        downloads.reverse().forEach(download => {
            displayDownloadItem(download, downloadsContainer);
        });
    } catch (error) {
        console.error('Error loading downloads:', error);
        showErrorToast('Failed to load downloads');
    }
}

// Clean the filename by removing control characters and normalizing spaces
function cleanFilename(filename) {
    return filename
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
        .replace(/\s+/g, ' ')                 // Normalize spaces
        .trim();                              // Remove leading/trailing spaces
}
// Display a download item in the container
function displayDownloadItem(download, container) {
    const downloadItem = document.createElement('div');
    downloadItem.className = 'col download-item mb-2';

    // Determine if this is a YouTube download
    const isYouTube = download.host === 'YouTube';
    
    // Check if YouTube link might be expired
    const isExpired = isYouTube && download.videoExpiry && Date.now() > download.videoExpiry;
    
    // Create refresh button for YouTube downloads
    let refreshButtonHtml = '';
    if (isYouTube) {
        refreshButtonHtml = `
            <button class="btn btn-sm btn-outline-warning me-1 refresh-btn" 
                   data-id="${download.id}" data-video-id="${download.videoId}" 
                   data-format-itag="${download.formatItag}"
                   ${isExpired ? 'data-bs-toggle="tooltip" title="Link expired, please refresh"' : ''}>
                <i class="bi bi-arrow-clockwise"></i>
            </button>
        `;
    }

    let alternativesHtml = '';
    if (download.alternative && download.alternative.length > 0) {
        alternativesHtml = '<div class="alternatives mt-2"><p class="mb-1 text-light">Alternatives:</p>';
        download.alternative.forEach(alt => {
            // Add refresh button for YouTube alternatives
            let altRefreshBtn = '';
            if (isYouTube && alt.formatItag) {
                altRefreshBtn = `
                    <button class="btn btn-sm btn-outline-warning me-1 alt-refresh-btn" 
                        data-id="${download.id}" data-alt-id="${alt.id}" 
                        data-video-id="${download.videoId}" data-format-itag="${alt.formatItag}">
                        <i class="bi bi-arrow-clockwise"></i>
                    </button>
                `;
            }
            
            // Add type badge for YouTube alternatives
            const typeBadge = alt.type ? 
                `<small class="badge ${alt.type === 'audio' ? 'bg-primary' : (alt.type === 'video-only' ? 'bg-warning' : 'bg-info')} ms-1">${alt.type}</small>` : '';

            // Add note if available
            const noteHtml = alt.note ? 
                `<small class="text-muted d-block mt-1"><i class="bi bi-info-circle"></i> ${alt.note}</small>` : '';

            alternativesHtml += `
                <div class="alt-item d-flex justify-content-between align-items-center border-top pt-2">
                    <div class="me-2 text-truncate">
                        <p class="mb-0 mr-1 text-truncate">
                            <small class="badge bg-secondary">${alt.quality || 'Unknown type'}</small>
                            ${typeBadge}
                            ${cleanFilename(alt.filename) || 'Unknown file'}
                            ${noteHtml}
                        </p>
                    </div>
                    <div class="d-flex">
                        ${altRefreshBtn}
                        <a href="${alt.download}" target="_blank" class="btn btn-sm btn-outline-success download-btn" 
                           data-filename="${cleanFilename(alt.filename) || 'download'}">
                            <i class="bi bi-cloud-download"></i>
                        </a>
                    </div>
                </div>
            `;
        });
        alternativesHtml += '</div>';
    }

    // Add type badge for main item if it's YouTube without changing layout
    const typeBadge = isYouTube ?
        `<span class="badge ${download.type === 'audio' ? 'bg-primary' : (download.type === 'video-only' ? 'bg-warning' : 'bg-info')} me-1">${download.type || 'video'}</span>` : '';

    // Add expired badge if needed
    const expiredBadge = isExpired ? 
        `<span class="badge bg-danger me-1">Expired</span>` : '';

    // Add instructions or expiry info for YouTube
    // let instructionsHtml = '';
    // if (isYouTube) {
    //     const expiryTime = download.videoExpiry ? new Date(download.videoExpiry).toLocaleString() : 'unknown';
    //     instructionsHtml = `
    //         <div class="mt-2 text-light">
    //             <small>
    //                 <i class="bi bi-info-circle"></i> 
    //                 YouTube links expire. Current expiry: ${expiryTime}
    //                 ${isExpired ? ' <strong>(Expired)</strong>' : ''}
    //             </small>
    //         </div>
    //     `;
    // }
    
    downloadItem.innerHTML = `
        <div class="card bg-transparent border-success ${isExpired ? 'border-danger' : ''}">
            <div class="card-body p-3 bg-transparent">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="me-2 text-truncate">
                        <p class="card-title text-truncate mb-1 filename">${cleanFilename(download.filename)}</p>
                        <div class="card-text mb-1">
                            <span class="badge bg-secondary">${download.host || 'Unknown host'}</span>
                            ${expiredBadge}
                            ${typeBadge}
                            ${download.quality ? `<span class="badge bg-info">${download.quality}</span>` : ''}
                            ${download.streamable ? '<span class="badge bg-success">Streamable</span>' : ''}
                        </div>
                        ${isYouTube && download.alternative && download.alternative.some(alt => alt.type === 'video-only') ? 
                            '<small class="text-light"><i class="bi bi-info-circle"></i> Download both video and audio for best quality</small>' : ''}
                    </div>
                    <div class="d-flex">
                        ${refreshButtonHtml}
                        <a href="${download.download}" target="_blank" class="btn btn-sm btn-success me-1 download-btn" 
                           data-filename="${cleanFilename(download.filename)}">
                            <i class="bi bi-cloud-download"></i>
                        </a>
                        <button class="btn btn-sm btn-outline-secondary delete-btn" data-id="${download.id}">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </div>
                ${alternativesHtml}
            </div>
        </div>
    `;

    // Add event listener for delete button
    const deleteBtn = downloadItem.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            try {
                await deleteDownload(download.id);
                downloadItem.remove();
                showSuccessToast('Download removed');

                // Check if there are no more downloads
                if (container.children.length === 0) {
                    const noDownloads = document.createElement('div');
                    noDownloads.className = 'col-12 text-center';
                    noDownloads.innerHTML = '<p>No downloads available.</p>';
                    container.appendChild(noDownloads);
                }
            } catch (error) {
                showErrorToast('Failed to remove download');
            }
        });
    }

    // Add event listener for refresh button
    const refreshBtn = downloadItem.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            try {
                const videoId = refreshBtn.dataset.videoId;
                const formatItag = refreshBtn.dataset.formatItag;
                const downloadId = refreshBtn.dataset.id;
                
                // Show loading spinner
                refreshBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
                refreshBtn.disabled = true;
                
                // Call the check endpoint
                const response = await fetch(`/premiumizer/youtube/check/${videoId}/${formatItag}`);
                const data = await response.json();
                
                if (data.valid) {
                    // Update the download link and expiry in our database
                    await updateDownload(downloadId, {
                        download: data.download,
                        videoExpiry: data.videoExpiry
                    });
                    
                    showSuccessToast('YouTube link refreshed successfully');
                    
                    // Reload downloads to show updated link
                    loadHosterDownloads();
                } else {
                    showErrorToast(data.error || 'Link could not be refreshed');
                    
                    // Reset refresh button
                    refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i>';
                    refreshBtn.disabled = false;
                }
            } catch (error) {
                console.error('Error refreshing link:', error);
                showErrorToast('Failed to refresh link');
                
                // Reset refresh button
                refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i>';
                refreshBtn.disabled = false;
            }
        });
    }
    
    // Add event listeners for alternative refresh buttons
    downloadItem.querySelectorAll('.alt-refresh-btn').forEach(altRefreshBtn => {
        altRefreshBtn.addEventListener('click', async () => {
            try {
                const videoId = altRefreshBtn.dataset.videoId;
                const formatItag = altRefreshBtn.dataset.formatItag;
                const downloadId = altRefreshBtn.dataset.id;
                const altId = altRefreshBtn.dataset.altId;
                
                // Show loading spinner
                altRefreshBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
                altRefreshBtn.disabled = true;
                
                // Call the check endpoint
                const response = await fetch(`/premiumizer/youtube/check/${videoId}/${formatItag}`);
                const data = await response.json();
                
                if (data.valid) {
                    // Update the alternative download link in our database
                    await updateAlternativeDownload(downloadId, altId, {
                        download: data.download
                    });
                    
                    showSuccessToast('YouTube alternative link refreshed successfully');
                    
                    // Reload downloads to show updated link
                    loadHosterDownloads();
                } else {
                    showErrorToast(data.error || 'Alternative link could not be refreshed');
                    
                    // Reset refresh button
                    altRefreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i>';
                    altRefreshBtn.disabled = false;
                }
            } catch (error) {
                console.error('Error refreshing alternative link:', error);
                showErrorToast('Failed to refresh alternative link');
                
                // Reset refresh button
                altRefreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i>';
                altRefreshBtn.disabled = false;
            }
        });
    });

    container.appendChild(downloadItem);
    
    // Initialize tooltips if needed
    if (isExpired) {
        new bootstrap.Tooltip(downloadItem.querySelector('[data-bs-toggle="tooltip"]'));
    }
}

// Delete a download from the database
async function deleteDownload(id) {
    const response = await fetch(`/premiumizer/hoster-downloads/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to delete download');
    }

    return await response.json();
}

// Update a download in the database
async function updateDownload(id, updateData) {
    try {
        const response = await fetch(`/premiumizer/hoster-downloads/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });

        if (!response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
            } else {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating download:', error);
        throw error;
    }
}

// Update an alternative download in the database
async function updateAlternativeDownload(downloadId, altId, updateData) {
    try {
        const response = await fetch(`/premiumizer/hoster-downloads/${downloadId}/alternative/${altId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });

        if (!response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
            } else {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating alternative download:', error);
        throw error;
    }
}

// Populate the hosters container with data
function populateHostersModal(hostersData) {
    const hostersContainer = document.getElementById('hostersContainer');
    const loadingElement = hostersContainer.querySelector('#loadingHosters');

    if (loadingElement && loadingElement.parentNode === hostersContainer) {
        hostersContainer.removeChild(loadingElement);
    }
    
    console.log('Hosters:', hostersData);
    
    // Add YouTube to the hostersData
    hostersData['youtube.com'] = {
        name: 'YouTube',
        status: 'up',
        supported: true,
        image: 'https://fcdn.real-debrid.com/0830/images/hosters/youtube.png'
    };
    
    // Sort hosters by name
    const sortedHosts = Object.entries(hostersData)
        .sort((a, b) => a[1].name.localeCompare(b[1].name));

    for (const [domain, hosterInfo] of sortedHosts) {
        // Skip if not supported
        if (!hosterInfo.supported) continue;

        const col = document.createElement('div');
        col.className = 'col';

        col.innerHTML = `
            <div class="d-flex align-items-center p-2 border-bottom">
                ${hosterInfo.image ?
                `<img src="${hosterInfo.image}" class="me-2 hoster-image" alt="${hosterInfo.name}">` :
                '<div class="me-2 hoster-image"></div>'}
                <span class="text-truncate flex-grow-1 me-2">${hosterInfo.name}</span>
                <span class="badge ${hosterInfo.status === 'up' ? 'bg-success' : 'bg-danger'}">${hosterInfo.status}</span>
            </div>
        `;

        hostersContainer.appendChild(col);
    }

    // If no hosters found
    if (hostersContainer.children.length === 0) {
        const noHosters = document.createElement('div');
        noHosters.className = 'col-12 text-center';
        noHosters.innerHTML = '<p>No supported hosters found.</p>';
        hostersContainer.appendChild(noHosters);
    }
}

document.getElementById('searchInput').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevents the default form submission if inside a form
        document.getElementById('search-button').click(); // Triggers the search button click
    }
});

document.getElementById('search-button').addEventListener('click', async () => {
    try {
        const query = document.getElementById('searchInput').value.trim();
        if (query === '') {
            showErrorToast("Link input can't be empty.");
            return;
        }
        const isValidLink = (url) => {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        };
        
        if (!isValidLink(query)) {
            showErrorToast("Input is an invalid link");
            return;
        }
        
        // Show loading spinner
        document.getElementById('loadingSpinner').style.visibility = 'visible';

        // Check if it's a YouTube URL
        const isYouTubeURL = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(query);

        let response;
        if (isYouTubeURL) {
            // Use YouTube endpoint for YouTube links
            response = await fetch(`/premiumizer/youtube?link=${encodeURIComponent(query)}`);
        } else {
            // Use regular unrestrict endpoint for other links
            response = await fetch(`/torrents/unrestrict?link=${encodeURIComponent(query)}`);
        }

        // Hide loading spinner
        document.getElementById('loadingSpinner').style.visibility = 'hidden';

        if (!response.ok) {
            // Check the content type before trying to parse as JSON
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                // Only try to parse JSON if the content type is JSON
                const errorData = await response.json();
                throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
            } else {
                // For HTML responses or other non-JSON responses
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
        }

        const data = await response.json();
        console.log('Unrestricted data:', data);

        // Save to database
        await saveDownload(data);

        // Clear input field
        document.getElementById('searchInput').value = '';

        // Show success message
        showSuccessToast(isYouTubeURL ? 'YouTube video processed successfully' : 'Link unrestricted successfully');

        // Refresh downloads list
        loadHosterDownloads();
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('loadingSpinner').style.visibility = 'hidden';

        try {
            const sessionResponse = await fetch('/account/session', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            // Check if the session response is JSON before parsing
            const contentType = sessionResponse.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const sessionData = await sessionResponse.json();
                
                if (!sessionData.isLoggedIn) {
                    showErrorToast("You logged out in another window or tab. Log back in to continue.");
                } else {
                    // Show a more user-friendly error for YouTube extraction issues
                    if (error.message.includes('YouTube') || error.message.includes('extract')) {
                        showErrorToast("YouTube extraction failed. YouTube may have updated their site. Please try again later.");
                    } else {
                        showErrorToast(error.message);
                    }
                }
            } else {
                // Default message for non-JSON responses
                showErrorToast("Server error: Unable to process your request. Please try again later.");
            }
        } catch (sessionError) {
            showErrorToast("Error checking session: " + error.message);
        }
    }
});

// Save download to database
async function saveDownload(downloadData) {
    try {
        const response = await fetch('/premiumizer/hoster-downloads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(downloadData),
        });

        if (!response.ok) {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
            } else {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
        }

        return await response.json();
    } catch (error) {
        console.error('Error saving download:', error);
        throw error;
    }
}
