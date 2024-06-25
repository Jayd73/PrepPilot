// Generated using ChatGPT
function isValidEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
}

// Generated using ChatGPT
function isValidUsername(uname) {
    const re = /^[a-zA-Z0-9_]+$/;
    return re.test(uname);
}

// took help from ChatGPT
function managePasswdVisibilityToggle(toggleBtnId, passwdInpId) {
    const togglePassword = document.getElementById(toggleBtnId);
    const password = document.getElementById(passwdInpId);
    const icon = togglePassword.querySelector('i');

    togglePassword.addEventListener('click', () => {
        // Toggle the type attribute using getAttribute() method
        const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
        password.setAttribute('type', type);

        // Toggle the icon
        icon.classList.toggle('bi-eye-slash');
        icon.classList.toggle('bi-eye');
    });
}