// main.js
import { sendSearchRequest } from './search.js';

registerServiceWorker();


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
          console.error('Failed to fetch version info:', error);
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



document.addEventListener("DOMContentLoaded", function () {
  fetch('/account/session', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => response.json())
    .then(data => {
      if (data.isLoggedIn === true) {
        console.log('User is logged in');
        document.getElementById('auth-link').style.visibility = 'hidden';
        document.getElementById('search-section').style.visibility = 'visible'; // Show the search section = 'inline-block';
        document.getElementById('navbar').style.display = 'block'; // Show the navbar

      } else {
        console.log('User is not logged in');
        document.getElementById('auth-link').style.visibility = 'visible';
        document.getElementById('search-section').style.visibility = 'hidden';
        document.getElementById('navbar').style.display = 'none'; // Hide the navbar
      }
    })
    .catch(error => {
      console.error('Error checking login status:', error);
    });
});

// CSS class to trigger the fade-in
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(() => {
    const elements = document.querySelectorAll('.fade-in');
    elements.forEach(el => {
      el.style.opacity = 1; // Trigger the fade-in
    });
  }, 0); // Delay to allow display changes to take effect
});

document.getElementById('search-button').addEventListener('click', sendSearchRequest);
document.getElementById('searchInput').addEventListener('keypress', function (event) {
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevents the default form submission if inside a form
    document.getElementById('search-button').click(); // Triggers the search button click
  }
});

document.getElementById('login-form').addEventListener('keypress', function (event) {
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevents the default form submission if inside a form
    document.getElementById('login-button').click(); // Triggers the search button click
  }
});

document.getElementById('signup-form').addEventListener('keypress', function (event) {
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevents the default form submission if inside a form
    document.getElementById('signup-button').click(); // Triggers the search button click
  }
});


