document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const urlParams = new URLSearchParams(window.location.search);
    const nextPage = urlParams.get('next'); // e.g., 'bookslot'

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, next: nextPage })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                window.location.href = data.redirect || '/home.html';
            } else {
                showPopup('Invalid email or password. Please try again.');
                clearInputs();
            }
        })
        .catch(err => {
            console.error('Error during login:', err);
            showPopup('Server error. Please try again later.');
            clearInputs();
        });
    });

    function clearInputs() {
        emailInput.value = '';
        passwordInput.value = '';
    }

    function showPopup(message) {
        const popup = document.getElementById('errorPopup');
        const messageBox = document.getElementById('errorMessage');
        if (popup && messageBox) {
            messageBox.textContent = message;
            popup.style.display = 'flex';
        }
    }

    // Optional: hook for the "OK" button to hide the popup
    window.closePopup = function () {
        const popup = document.getElementById('errorPopup');
        popup.style.display = 'none';
    };
    
});
