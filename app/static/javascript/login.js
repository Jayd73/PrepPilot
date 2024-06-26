document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginForm').addEventListener('submit', function (event) {
        event.preventDefault();

        const submit_btn = document.getElementById('submit');

        const identifier_inp = document.getElementById('identifier');
        const passwd_inp = document.getElementById('password');

        const identifier = identifier_inp.value.trim();
        const passwd = passwd_inp.value.trim();

        const loginFormData = new FormData();


        is_valid = true;

        submit_btn.disabled = true;
        submit_btn.textContent = "Submitting..."

        if (isValidUsername(identifier)) {
            loginFormData.append('username', identifier)
            identifier_inp.classList.remove("is-invalid")
            document.getElementById('invalid-identifier-feedback').innerHTML = "";

        } else if (isValidEmail(identifier)) {
            loginFormData.append('email', identifier)
            identifier_inp.classList.remove("is-invalid")
            document.getElementById('invalid-identifier-feedback').innerHTML = "";

        } else {
            identifier_inp.classList.add("is-invalid")
            document.getElementById('invalid-identifier-feedback').innerHTML = "Please enter a valid username or email address";
            is_valid = false;
        }

        if (passwd !== '') {
            loginFormData.append('password', passwd)
            passwd_inp.classList.remove("is-invalid")
            document.getElementById('invalid-password-feedback').innerHTML = "";
        } else {
            passwd_inp.classList.add("is-invalid")
            document.getElementById('invalid-password-feedback').innerHTML = "Please enter a password";
            is_valid = false;
        }

        if (!is_valid) {
            submit_btn.disabled = false;
            submit_btn.textContent = "Submit"
            return;
        }

        fetch('/login', {
            method: "POST",
            body: loginFormData,
        })
            .then(response => response.json().then(data => ({
                status: response.status,
                body: data
            })))
            .then(({
                status,
                body
            }) => {
                if (status === 401) {
                    identifier_inp.classList.add("is-invalid")
                    document.getElementById('invalid-identifier-feedback').innerHTML = "Userame or Email address might be incorrect"
                    passwd_inp.classList.add("is-invalid")
                    document.getElementById('invalid-password-feedback').innerHTML = "Password might be incorrect"
                } else if (status === 200) {
                    identifier_inp.classList.remove("is-invalid")
                    identifier_inp.classList.add("is-valid")
                    document.getElementById('invalid-identifier-feedback').innerHTML = ""

                    passwd_inp.classList.remove("is-invalid")
                    passwd_inp.classList.add("is-valid")
                    document.getElementById('invalid-password-feedback').innerHTML = ""

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
});

