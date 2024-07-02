document.addEventListener('DOMContentLoaded', () => { 
    const maxUnameLen = 20
    fetch('/users/current-user')
    .then(response => response.json())
    .then(data => {
        document.getElementById("profile-username").innerHTML = data.username;
        document.getElementById("profile-email").textContent = data.email;
        document.getElementById('nav-username').textContent = data.username
        if (data.username.length > maxUnameLen) { 
            document.getElementById('nav-username').textContent = data.username.slice(0, maxUnameLen) + "..."
        }
        
        if (data.avatar_path) { 
            document.getElementById('avatar').src = data.avatar_path;
            document.getElementById('navbarAvatar').src = data.avatar_path;
        }
        
    })
    .catch(error => {
        console.error('Error fetching user details:', error);
    });

    const toastMessageContainers = document.querySelectorAll('.toast')
    toastMessageContainers.forEach((toastMessageContainer) => {
        const toast = bootstrap.Toast.getOrCreateInstance(toastMessageContainer)
        toast.show()
    })

    const navbarAvatar = document.getElementById('navbarAvatar');
    const userBox = document.getElementById('userBox');
    const avatarInput = document.getElementById('avatarInput');
    const avatar = document.getElementById('avatar');
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const logoutBtn = document.getElementById('logoutBtn')

    navbarAvatar.addEventListener('click', (e) => {
        const rect = navbarAvatar.getBoundingClientRect();
        userBox.style.top = `${rect.bottom + window.scrollY}px`;
        userBox.style.right = `${window.innerWidth - rect.right}px`;
        userBox.style.display = userBox.style.display === 'block' ? 'none' : 'block';
    });

    changeAvatarBtn.addEventListener('click', () => avatarInput.click());
    logoutBtn.addEventListener('click', () => window.location.href = "/logout");

    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];

        if (file) {
            const formData = new FormData();
            const reader = new FileReader();
            reader.onload = function(event) {
                avatar.src = event.target.result;
            };
            reader.readAsDataURL(file);
            formData.append('avatar', file);
            fetch('/users/current-user/avatar', {
                    method: 'POST',
                    body: formData,
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        navbarAvatar.src = URL.createObjectURL(file);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        }
    });

    document.addEventListener('click', (e) => {
        if (!userBox.contains(e.target) && e.target !== navbarAvatar) {
            userBox.style.display = 'none';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            userBox.style.display = 'none';
        }
    });
});

function checkAndHandleEmptyInp(inp, invalidMsgBox, invalidMsg) { 
    isValid = true
    if (inp.value.trim() === "") {
        inp.classList.add("is-invalid")
        invalidMsgBox.style.display = 'block'
        invalidMsgBox.innerHTML = invalidMsg
        isValid = false
    } else {
        inp.classList.remove("is-invalid")
        invalidMsgBox.style.display = 'none'
    }
    return [ isValid, inp ]
}

function validateInput(event) {
    const key = event.key;
    if (['-', '.','e'].includes(key)) {
        event.preventDefault();
    }
}

function capInpVal(input, lowerLim, upperLim) {
    if (input.value < lowerLim) input.value = lowerLim;
    if (input.value > upperLim) input.value = upperLim;
}
 