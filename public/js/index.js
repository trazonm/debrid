// main.js
import { sendSearchRequest } from './searchRequest.js';

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

document.addEventListener("DOMContentLoaded", function () {
  const username = localStorage.getItem('username');
  document.getElementById('offcanvasNavbarLabel').innerHTML = 'Welcome, ' + username + '!';
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

document.getElementById('toggle-signup-password').addEventListener('click', function () {
  togglePasswordVisibility('signup-password', 'toggle-signup-password');
});

document.getElementById('toggle-confirm-password').addEventListener('click', function () {
  togglePasswordVisibility('confirm-password', 'toggle-confirm-password');
});

document.getElementById('signup-button').addEventListener('click', function () {
  signup();
});
