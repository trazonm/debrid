// main.js
import { sendSearchRequest } from './search.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
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
  if (isLoggedIn === true || isLoggedIn === 'true') {
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
document.addEventListener("DOMContentLoaded", function() {
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
