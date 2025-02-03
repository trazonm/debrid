
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
        document.getElementById('navbar').style.display = 'block'; // Show the navbar
        document.getElementById('navbar').style.visibility = 'visible';
        document.getElementById('navbar').style.opacity = '1';


      } else {
        console.log('User is not logged in');
        document.getElementById('navbar').style.display = 'none'; // Hide the navbar
      }
    })
    .catch(error => {
      console.error('Error checking login status:', error);
    });
});

document.addEventListener("DOMContentLoaded", function () {
  const username = localStorage.getItem('username');
  document.getElementById('offcanvasNavbarLabel').innerHTML = 'Welcome, ' + username + '!';
});

document.getElementById('logout-button').addEventListener('click', function () {
  fetch('/account/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        window.location.href = '/';
      } else {
        toastBody.innerHTML = 'An error occurred. Please try again.';
        errorToast.show();
      }
    });
});
