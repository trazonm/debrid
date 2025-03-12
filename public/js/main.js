

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      fetch('/version.json')
        .then(response => response.json())
        .then(data => {
          const version = data.version;
          const swFile = version ? `/sw-${version}.js` : '/sw.js'; // Default fallback if no version is specified

          navigator.serviceWorker.register(swFile)
            .then(registration => {
              console.log('Service Worker registered with scope:', registration.scope);

              // Check if a new service worker is waiting to activate
              if (registration.waiting) {
                notifyUpdateReady(registration.waiting);
              }

              // Listen for an update being found
              registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('A new service worker is being installed.');

                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                      console.log('New service worker installed and waiting.');
                      notifyUpdateReady(newWorker);
                    } else {
                      console.log('Service Worker installed for the first time.');
                    }
                  }
                });
              });
            })
            .catch(error => {
              console.error('Service Worker registration failed:', error);
            });

          // Listen for changes to the active service worker
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service Worker controller changed.');
            // Optionally reload or notify the user here
            // window.location.reload();
          });
        })
        .catch(error => {
          console.error('Failed to fetch version info');
        });
    });
  }
}

// Helper function to notify and activate the new service worker
function notifyUpdateReady(worker) {
  console.log('A new version is available.');

  // Create a Bootstrap alert for the update notification
  const updateNotification = document.createElement('div');
  updateNotification.classList.add('alert', 'alert-info', 'fixed-bottom', 'm-3', 'd-flex', 'justify-content-between', 'align-items-center');
  updateNotification.style.position = 'fixed';
  updateNotification.style.left = '10px';
  updateNotification.style.bottom = '10px';
  updateNotification.style.zIndex = '1050';  // Ensure it is on top of other content

  updateNotification.innerHTML = `
    <span>New version available.</span>
    <button id="update-btn" class="btn btn-sm btn-primary ml-3">Reload</button>
  `;

  document.body.appendChild(updateNotification);

  // Add click listener to the "Reload" button
  document.getElementById('update-btn').addEventListener('click', () => {
    worker.postMessage({ action: 'skipWaiting' }); // Tell the worker to activate immediately
  });

  // Listen for the service worker activation
  worker.addEventListener('statechange', () => {
    if (worker.state === 'activated') {
      window.location.reload(); // Reload the page once the new service worker is activated
    }
  });
}


document.addEventListener('DOMContentLoaded', registerServiceWorker);