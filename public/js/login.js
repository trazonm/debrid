const errorToast = new bootstrap.Toast(document.getElementById('errorToastLogin'));
const toastBody = document.getElementById('toast-body-login');
const successToast = new bootstrap.Toast(document.getElementById('successToast'));
const successToastBody = document.getElementById('success-toast-body');

function login(token) {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!username || !password) {
        toastBody.innerHTML = 'Both username and password are required.';
        errorToast.show();
        return;
    } else {
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

                    setCookie('isLoggedIn', true, 1);

                    document.getElementById('auth-link').style.visibility = 'hidden';
                    document.getElementById('search-section').style.visibility = 'visible';
                    document.getElementById('navbar').style.display = 'block';

                    // Add fade-in effect
                    document.getElementById('search-section').classList.add('fade-in');
                    document.getElementById('navbar').classList.add('fade-in');

                    const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
                    authModal.hide();

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
}

function signup() {
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value.trim();

    if (!username || !password) {
        toastBody.innerHTML = 'Both username and password are required.';
        errorToast.show();
        return;
    } else {
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
                    successToastBody.innerHTML = 'User registered successfully. Please log in.';
                    successToast.show();
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
}


function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
    console.log("Cookie set: " + document.cookie);
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
                setCookie('isLoggedIn', false, 1);
                window.location.href = '/';
            } else {
                toastBody.innerHTML = 'An error occurred. Please try again.';
                errorToast.show();            }
        });
});