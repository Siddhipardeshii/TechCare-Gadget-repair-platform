document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission

        const formData = {
            name: form.name.value,
            address: form.address.value,
            phone: form.phone.value,
            email: form.email.value,
            password: form.password.value,
            confirm_password: form["confirm-password"].value
        };

        if (formData.password !== formData.confirm_password) {
            alert("Passwords do not match!");
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                alert(result.message || "Registration successful!");
                // Optionally redirect
                window.location.href = '../html/login.html';
            } else {
                alert(result.message || "Registration failed.");
            }

        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred. Please try again later.");
        }
    });
});
