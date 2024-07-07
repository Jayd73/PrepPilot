var currToastBgColorClass = "text-bg-primary" 

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

    // Show any toast messages when page loads
    const toastMessageContainers = document.querySelectorAll('.page-load-toast-message-container')
    toastMessageContainers.forEach((toastMessageContainer) => {
        const toast = bootstrap.Toast.getOrCreateInstance(toastMessageContainer)
        toast.show()
    })
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

// With help of ChatGPT
function toTwoDigitFormat(num) {
    // if string only contains 0's
    let numStr = num.toString()
    if (/^0*$/.test(numStr)) { 
        return ""
    }
    if (numStr.length < 2) {
        return numStr.padStart(2, '0');
    }
    if (numStr.length > 2 && numStr[0] == 0) { 
        return numStr.substring(1)
    }
    return numStr
}

function convertDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return { hours, minutes, remainingSeconds };
}

// From ChatGPT
function formatDuration(seconds) {
    let { hours, minutes, remainingSeconds } = convertDuration(seconds);

    const hourText = hours === 1 ? 'Hour' : 'Hours';
    const minuteText = minutes === 1 ? 'Minute' : 'Minutes';
    const secondText = remainingSeconds === 1 ? 'Second' : 'Seconds';
    
    hours = toTwoDigitFormat(hours)
    minutes = toTwoDigitFormat(minutes)
    remainingSeconds = toTwoDigitFormat(remainingSeconds)

    if (hours && minutes && remainingSeconds) {
        return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (hours && minutes) {
        return `${hours} Hr. ${minutes} Min.`;
    } else if (hours && remainingSeconds) {
        return `${hours} Hr. ${remainingSeconds} Sec.`;
    } else if (minutes && remainingSeconds) {
        return `${minutes} Min. ${remainingSeconds} Sec.`;
    } else if (hours) {
        return `${hours} ${hourText}`;
    } else if (minutes) {
        return `${minutes} ${minuteText}`;
    } else if (remainingSeconds) {
        return `${remainingSeconds} ${secondText}`;
    }
    
    return '';
}

function showToastMessage(message, messageType = "normal") {
    const dynamicToastMsgContainer = document.getElementById('dynamic-toast-message')
    dynamicToastMsgContainer.classList.remove('d-none')
    document.getElementById('dynamic-toast-message-body').textContent = message
    dynamicToastMsgContainer.classList.remove(currToastBgColorClass)
    if (messageType === "normal")
        currToastBgColorClass = "secondary-col-1"
    else if (messageType === "success")
        currToastBgColorClass = "text-bg-success"
    else if (messageType === "warning")
        currToastBgColorClass = "text-bg-warning"
    else if (messageType === "danger")
        currToastBgColorClass = "text-bg-danger"
    else
        currToastBgColorClass = "text-bg-primary"
    dynamicToastMsgContainer.classList.add(currToastBgColorClass)
    bootstrap.Toast.getOrCreateInstance(dynamicToastMsgContainer).show()
}