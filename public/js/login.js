const errorToast = new bootstrap.Toast(document.getElementById('errorToastLogin'));
const toastBody = document.getElementById('toast-body-login');
const successToastModal = new bootstrap.Toast(document.getElementById('successToastModal'));
const successToastModalBody = document.getElementById('success-toast-modal');
const successToast = new bootstrap.Toast(document.getElementById('successToast'));
const successToastBody = document.getElementById('toast-body-success');

function login(token) {
    const username = document.getElementById('login-username').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value.trim();

    if (!username || !password) {
        toastBody.innerHTML = 'Both username and password are required.';
        errorToast.show();
        return;
    }
    
    fetch('/account/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username,
            password,
            token
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                successToastBody.innerHTML = 'Login successful!';
                successToast.show();
                localStorage.setItem('username', username); 

                document.getElementById('auth-link').style.visibility = 'hidden';
                document.getElementById('search-section').style.visibility = 'visible';
                document.getElementById('navbar').style.display = 'block';

                // Add fade-in effect
                document.getElementById('search-section').classList.add('fade-in');
                document.getElementById('navbar').classList.add('fade-in');

                const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
                authModal.hide();
                document.getElementById('offcanvasNavbarLabel').innerHTML = 'Welcome, ' + username + '!';

                const elements = document.querySelectorAll('.fade-in');
                elements.forEach(el => {
                    el.style.opacity = 1; // Trigger the fade-in
                });
            } else {
                toastBody.innerHTML = 'Usewrname or password is incorrect.';
                errorToast.show();
                return;
            }


        })
        .catch(error => console.error('Error:', error));
}

function togglePasswordVisibility(inputId, toggleButtonId) {
    const passwordInput = document.getElementById(inputId);
    const toggleButton = document.getElementById(toggleButtonId);
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.innerHTML = 'Hide';
    } else {
        passwordInput.type = 'password';
        toggleButton.innerHTML = 'Show';
    }
}

function checkPasswordsMatch() {
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    if (password !== confirmPassword) {
        toastBody.innerHTML = 'Passwords do not match.';
        errorToast.show();
        return false;
    }
    return true;
}

function signup() {
    const username = document.getElementById('signup-username').value.trim().toLowerCase();
    const password = document.getElementById('signup-password').value.trim();

    if (!username || !password) {
        toastBody.innerHTML = 'Both username and password are required.';
        errorToast.show();
        return;
    }

    if (password.length < 8) {
        toastBody.innerHTML = 'Password must be at least 8 characters long.';
        errorToast.show();
        return;
    }

    if (!checkPasswordsMatch()) {
        return;
    }

    fetch('/account/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username,
            password
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'User registered successfully') {
                successToastModalBody.innerHTML = 'User registered successfully. Please log in.';
                successToastModal.show();
                return;
            }

            if (data.error === 'User already exists') {
                toastBody.innerHTML = 'User already exists.';
                errorToast.show();
            } else {
                toastBody.innerHTML = 'An error occurred. Please try again.';
                errorToast.show();
            }
        });

}

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

function getUser() {
    const username = localStorage.getItem('username');
    document.getElementById('offcanvasNavbarLabel').innerHTML = 'Welcome, ' + username + '!';
}