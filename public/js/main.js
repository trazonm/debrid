// main.js
import { sendSearchRequest } from './search.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`/sw.js?v=${Date.now()}`) // Tip 1: Add versioning
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);

        // Check if a new service worker is waiting to activate
        if (registration.waiting) {
          console.log('New service worker is waiting to activate.');
          notifyUpdateReady(registration.waiting);
        }

        // Listen for updates to the service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('A new service worker is being installed.');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New service worker is waiting to activate
                console.log('New service worker installed and waiting to activate.');
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

    // Listen for controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Controller changed. Reloading the page...');
      window.location.reload();
    });
  });
}

// Helper function to notify and activate the new service worker
function notifyUpdateReady(worker) {
  // Optionally, show a UI to the user for updates (not mandatory for auto-reloading)
  console.log('A new version is available. Activating now...');
  worker.postMessage({ action: 'skipWaiting' });
}


function getCookie(name) {
  let cookieArr = document.cookie.split(";");
  for (let i = 0; i < cookieArr.length; i++) {
    let cookiePair = cookieArr[i].split("=");
    if (name == cookiePair[0].trim()) {
      return decodeURIComponent(cookiePair[1]);
    }
  }
  return null;
}

const isLoggedIn = getCookie('isLoggedIn') || 'false';

document.addEventListener("DOMContentLoaded", function () {
  if (isLoggedIn === 'true') {
    document.getElementById('auth-link').style.visibility = 'hidden';
    document.getElementById('search-section').style.visibility = 'visible'; // Show the search section = 'inline-block';
    document.getElementById('navbar').style.display = 'block'; // Show the navbar

    // Add fade-in effect
    document.getElementById('search-section').classList.add('fade-in');
    document.getElementById('navbar').classList.add('fade-in');

  } else {
    document.getElementById('auth-link').style.visibility = 'visible';
    document.getElementById('search-section').style.visibility = 'hidden';
    document.getElementById('navbar').style.display = 'none'; // Hide the navbar

    document.getElementById('auth-link').classList.add('fade-in');
  }
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


