
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