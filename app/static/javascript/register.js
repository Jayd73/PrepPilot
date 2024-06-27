document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('registerForm').addEventListener('submit', function (event) {
        event.preventDefault();

        const submit_btn = document.getElementById('submit');

        const uname_inp = document.getElementById('username');
        const email_inp = document.getElementById('email');
        const passwd_inp = document.getElementById('password');
        const confirm_passwd_inp = document.getElementById('confirm_password');

        const uname = uname_inp.value.trim();
        const email = email_inp.value.trim();
        const passwd = passwd_inp.value.trim();
        const confirm_passwd = confirm_passwd_inp.value.trim();

        const min_passwd_len = 6;
        const min_uname_len = 3;
        const max_uname_len = 30;

        is_valid = true;


        if (uname.length < min_uname_len || uname.length > max_uname_len) {
            uname_inp.classList.add("is-invalid")
            document.getElementById('invalid-username-feedback').innerHTML = "Must be " + min_uname_len + " to " + max_uname_len + " characters long";
            is_valid = false;
        } else if (!isValidUsername(uname)) {
            uname_inp.classList.add("is-invalid")
            document.getElementById('invalid-username-feedback').innerHTML = "Can only contain alphanumeric characters and underscore (_)";
            is_valid = false;
        } else {
            uname_inp.classList.remove("is-invalid")
            document.getElementById('invalid-username-feedback').innerHTML = "";
        }

        if (!isValidEmail(email)) {
            email_inp.classList.add("is-invalid")
            document.getElementById('invalid-email-feedback').innerHTML = "Please enter a valid email address"
            is_valid = false;
        } else {
            email_inp.classList.remove("is-invalid")
            document.getElementById('invalid-email-feedback').innerHTML = "";
        }

        if (passwd === '') {
            passwd_inp.classList.add("is-invalid")
            document.getElementById('invalid-password-feedback').innerHTML = "Please enter a password";
            is_valid = false;
        } else if (passwd.length < min_passwd_len) {
            passwd_inp.classList.add("is-invalid")
            document.getElementById('invalid-password-feedback').innerHTML = "Must be at least " + min_passwd_len + " characters long";
            is_valid = false;
        } else {
            passwd_inp.classList.remove("is-invalid")
            document.getElementById('invalid-password-feedback').innerHTML = "";
        }

        if (confirm_passwd === '') {
            confirm_passwd_inp.classList.add("is-invalid")
            document.getElementById('invalid-confirm-password-feedback').innerHTML = "Please enter password for confirmation";
            is_valid = false;
        } else if (confirm_passwd.length < min_passwd_len) {
            confirm_passwd_inp.classList.add("is-invalid")
            document.getElementById('invalid-confirm-password-feedback').innerHTML = "Must be at least " + min_passwd_len + " characters long";
            is_valid = false;
        } else if (passwd !== confirm_passwd) {
            confirm_passwd_inp.classList.add("is-invalid")
            document.getElementById('invalid-confirm-password-feedback').innerHTML = "Passwords don't match. Please try again";
            is_valid = false;
        } else {
            confirm_passwd_inp.classList.remove("is-invalid")
            document.getElementById('invalid-confirm-password-feedback').innerHTML = "";
        }

        if (!is_valid) {
            return;
        }

        submit_btn.disabled = true;
        submit_btn.innerHTML = `Authenticating...<span class="spinner-border spinner-border-sm" aria-hidden="true"></span>`

        const registerFormData = new FormData(document.getElementById('registerForm'))

        fetch('/register', {
            method: "POST",
            body: registerFormData,
        })
        .then(response => response.json().then(data => ({
            status: response.status,
            body: data
        })))
        .then(({
            status,
            body
        }) => {
            if (status === 409) {
                if (body.error === 'Username already exists') {
                    uname_inp.classList.add("is-invalid")
                    document.getElementById('invalid-username-feedback').innerHTML = "Username already exists"
                } else if (body.error === 'Email already exists') {
                    email_inp.classList.add("is-invalid")
                    document.getElementById('invalid-email-feedback').innerHTML = "Email address already exists"
                }
            } else if (status === 201) {
                uname_inp.classList.remove("is-invalid")
                uname_inp.classList.add("is-valid")
                document.getElementById('invalid-username-feedback').innerHTML = ""

                email_inp.classList.remove("is-invalid")
                email_inp.classList.add("is-valid")
                document.getElementById('invalid-email-feedback').innerHTML = ""

                window.location.href = '/';
            } else {
                alert("Unexpected Error occured");
                console.error('Unexpected error:', body);
            }

            submit_btn.disabled = false;
            submit_btn.textContent = "Submit";

        })
    });

    managePasswdVisibilityToggle("togglePassword", "password")
    managePasswdVisibilityToggle("toggleConfirmPassword", "confirm_password")
});
