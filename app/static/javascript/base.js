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
    const avatarInput = document.getElementById('avatarInput');
    const avatar = document.getElementById('avatar');
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const logoutBtn = document.getElementById('logoutBtn')

   
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

    document.getElementById('user-profile').addEventListener('click', (event) => {
        event.stopPropagation()
    })


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

function removeNonDigit(event, allowDecimal = false) {
    const key = event.key;
    const blacklist = ['-', 'e']
    if (!allowDecimal)
        blacklist.push('.')
    if (blacklist.includes(key)) {
        event.preventDefault();
    }
}

function checkAndLimitTimeVal(input) {
    if (input.id === 'test-duration-hr') {
        if (input.value > 999) input.value = 999;
    }
    if (input.id === 'test-duration-min' || input.id === 'test-duration-sec') {
        if (input.value < 0) input.value = 0;
        if (input.value > 59) input.value = 59;
    }
    input.value = toTwoDigitFormat(input.value)
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

function timeToDuration(hrs, mins, seconds) {
    if (hrs == "" && mins == "" && seconds == "")
        return null
    hrs = Number(hrs)
    mins = Number(mins)
    seconds = Number(seconds)
    return hrs * 60 * 60 + mins * 60 + seconds
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