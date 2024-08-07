let currQuestionPosMarks = null
let currQuestionNegMarks = null

// Created in collaboration with ChatGPT
document.addEventListener('DOMContentLoaded', () => {
    const addMCQButton = document.getElementById('add-mcq');
    const addResponseQuestionButton = document.getElementById('add-response-question');

    document.getElementById('cancel_btn').addEventListener('click', () => {
        window.location.href = "/"
    })

    addMCQButton.addEventListener('click', () => addQuestion('mcq'));
    addResponseQuestionButton.addEventListener('click', () => addQuestion('response'));

    const editorContainer = document.getElementById('test-editor-container');
    if (updateTestId) {
        const fetchingDataMsgDiv = document.getElementById('is-fetching');
        fetchingDataMsgDiv.classList.remove('d-none');

        fetch(`/tests/${updateTestId}`)
            .then(response => response.json().then(data => ({
                status: response.status,
                body: data
            })))
            .then(({
                status,
                body
            }) => {
                fetchingDataMsgDiv.classList.add('d-none');
                editorContainer.classList.remove('d-none');
                setUpTestEditorForUpdation(body)
                
            })
    } else {
        editorContainer.classList.remove('d-none');
    }

    // Autocomplete subjects suggestion (took help from ChatGPT)
    const subjectInput = document.getElementById('test-subject');
    const subjectDropdown = document.getElementById('subject-dropdown');

    subjectInput.addEventListener('input', function() {
        const query = subjectInput.value;
        if (query.length > 0) {
            fetch(`/subjects?query=${query}`)
                .then(response => response.json())
                .then(data => {
                    subjectDropdown.innerHTML = '';
                    if (data.length > 0) {
                        subjectDropdown.classList.add('show');
                        data.forEach(subject => {
                            const dropdownItem = document.createElement('a');
                            dropdownItem.classList.add('dropdown-item');
                            dropdownItem.textContent = subject;
                            dropdownItem.href = '#';
                            dropdownItem.addEventListener('click', function(e) {
                                e.preventDefault();
                                subjectInput.value = subject;
                                subjectDropdown.classList.remove('show');
                            });
                            subjectDropdown.appendChild(dropdownItem);
                        });
                    } else {
                        subjectDropdown.classList.remove('show');
                    }
                });
        } else {
            subjectDropdown.classList.remove('show');
            subjectDropdown.innerHTML = '';
        }
    });

    // With ChatGPT
    subjectInput.addEventListener('blur', function() {
        // Delay hiding the dropdown to allow click event on dropdown items
        setTimeout(() => {
            subjectDropdown.classList.remove('show');
            subjectDropdown.innerHTML = '';
        }, 200);
    });
        

    document.getElementById('test-edit-form').addEventListener('submit', function(event) {
        event.preventDefault();

        var invalidElement = null;
        var isValid = true

        const [ isValidTitle, givenTitleInp ] = checkAndHandleEmptyInp(
            document.getElementById("test-title"),
            document.getElementById("invalid-test-title"),
            "Please enter title for the test"
        )
        isValid = isValid && isValidTitle
        invalidElement = invalidElement === null && !isValidTitle ? givenTitleInp : invalidElement

        const [ isValidSubject, givenSubjectInp ] = checkAndHandleEmptyInp(
            document.getElementById("test-subject"),
            document.getElementById("invalid-test-subject"),
            "Please enter topic for the test"
        )
        isValid = isValid && isValidSubject
        invalidElement = invalidElement === null && !isValidSubject ? givenSubjectInp : invalidElement

        var testDurationtHr = document.getElementById("test-duration-hr").value;
        var testDurationMin = document.getElementById("test-duration-min").value;
        var testDurationSec = document.getElementById("test-duration-sec").value;

        testDurationtHr = testDurationtHr === "" ? 0 : parseInt(testDurationtHr)
        testDurationMin = testDurationMin === "" ? 0 : parseInt(testDurationMin)
        testDurationSec = testDurationSec === "" ? 0 : parseInt(testDurationSec)

        const testDurationMsgBox = document.getElementById("invalid-test-duration");

        if (testDurationtHr == 0 && testDurationMin == 0 && testDurationSec == 0) {
            testDurationMsgBox.style.display = 'block'
            testDurationMsgBox.innerHTML = "Please enter test duration"
            isValid = false
            invalidElement = document.getElementById("test-duration-inp-grp")
        }
        else {
            testDurationMsgBox.style.display = 'none'
        }

        document.querySelectorAll('.question').forEach(questionElement => {
            var totOptions = 0;
            var totOptionsChecked = 0;
            var isMCQ = questionElement.querySelector("div.options-container") ? true : false;
            const questionId = questionElement.id

            const [ isValidQuestion, givenQuestionInp ] = checkAndHandleEmptyInp(
                questionElement.querySelector('textarea'),
                questionElement.querySelector(`div[id="invalid-question-${questionId}"]`),
                "Please enter a question"
            )
            isValid = isValid && isValidQuestion
            invalidElement = invalidElement === null && !isValidQuestion ? givenQuestionInp : invalidElement

            questionElement.querySelectorAll('.option').forEach(optionElement => {
                const optionId = optionElement.id;
                const [ isValidOption, givenOptionInp ] = checkAndHandleEmptyInp(
                    optionElement.querySelector('input[type="text"]'),
                    optionElement.querySelector(`div[id="invalid-option-${optionId}"]`),
                    "Please enter an option"
                )
                isValid = isValid && isValidOption
                invalidElement = invalidElement === null && !isValidOption ? givenOptionInp : invalidElement

                totOptions += 1;
                if (optionElement.querySelector('input[type="checkbox"]').checked) {
                    totOptionsChecked += 1;
                }

            });

            if (isMCQ) {
                const questionStructMsgBox = questionElement.querySelector(`div[id="invalid-question-struct-${questionId}"]`)
                if (totOptions < 2) {
                    questionStructMsgBox.style.display = 'block'
                    questionStructMsgBox.innerHTML = "Please add at least 2 options"
                    invalidElement = questionElement
                    isValid = false;
                } else if (totOptionsChecked < 1) {
                    questionStructMsgBox.style.display = 'block'
                    questionStructMsgBox.innerHTML = "Please mark at least 1 option as correct"
                    invalidElement = questionElement
                    isValid = false;
                } else {
                    questionStructMsgBox.style.display = 'none'
                }
            }
            else { 
                const [ isValidRespAns, givenRespAnsInp ] = checkAndHandleEmptyInp(
                    questionElement.querySelector(`input[name="resp-ans-${questionId}"]`),
                    questionElement.querySelector(`div[id="invalid-resp-ans-${questionId}"]`),
                    "Please enter an answer"
                )
                isValid = isValid && isValidRespAns
                invalidElement = invalidElement === null && !isValidRespAns ? givenRespAnsInp : invalidElement
            }

        });

        if (!isValid) {
            invalidElement.scrollIntoView({
                behavior: "smooth",
                block: "end",
                inline: "nearest"
            });
            return
        }
        const saveBtn = document.getElementById("save_btn");
        const testFormData = new FormData(document.getElementById('test-edit-form'))

        saveBtn.disabled = true
        saveBtn.innerHTML = `<i class="bi bi-bookmark-fill"></i> Saving... <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>`
        
        if (updateTestId) {
            fetch(`tests/${updateTestId}`, {
                method: "PUT",
                body: testFormData,
            })
            .then(response => response.json().then(data => ({
                status: response.status,
                body: data
            })))
            .then(({
                status,
                body
            }) => {
                saveBtn.disabled = false
                saveBtn.innerHTML = `<i class="bi bi-bookmark-fill"></i> Save`
                window.location.href = "/";
            })
            return
        }
        
        fetch('/create-test', {
                method: "POST",
                body: testFormData,
            })
            .then(response => response.json().then(data => ({
                status: response.status,
                body: data
            })))
            .then(({
                status,
                body
            }) => {
                saveBtn.disabled = false
                saveBtn.innerHTML = `<i class="bi bi-bookmark-fill"></i> Save`
                window.location.href = "/";
            })
    });


    // uploading various tests (for debugging)
    if (!updateTestId) {
        document.getElementById('test-data-json-upload').addEventListener('submit', function (event) {
            event.preventDefault();

            const fileInput = document.getElementById('test-data-json-file');
            const file = fileInput.files[0];

            if (file && file.type === "application/json") {
                const reader = new FileReader();

                reader.onload = function (event) {
                    const fileContent = event.target.result;
                    const jsonContent = JSON.parse(fileContent);

                    fetch('/add-sample-tests', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(jsonContent)
                    })
                        .then(response => response.json())
                        .then(data => {
                            console.log('Success uploading test data:', data);
                        })
                        .catch((error) => {
                            console.error('Error while uploading test data:', error);
                        });
                };

                reader.readAsText(file);
            }
        });
    }

});

function addQuestion(type, questionText = "", answerText = "", imageUrl="", posMarks="", negMarks="") {
    const questionContainer = document.getElementById('question-container');
    const randomNum = Math.random().toString(36).substr(2, 10);
    const questionCount = questionContainer.children.length + 1;
    const questionId = `question-${randomNum}`;
    const questionElement = document.createElement('div');
    questionElement.classList.add('question', 'mb-3');
    questionElement.setAttribute('id', questionId);

    let questionHTML = `
        <div class="card shadow mb-2">
            <div class="card-header primary-col-2 px-1">
                <div class = "container-fluid d-flex justify-content-between align-items-center">
                    <span class="question-num">Q${questionCount}.</span>
                    <div class="input-group" style="width: max-content">
                        <button type="button" class="btn secondary-col-2 fixed-ht" onclick="document.getElementById('img-inp-${questionId}').click();">
                        <input type="file" name="img-inp-${questionId}" id="img-inp-${questionId}" onchange="showImage('${questionId}', this)" class="form-control" accept="image/*" style="display: none;">
                        <i class="bi bi-image"></i>
                        </button>
                        <button type="button" class="btn secondary-col-1 fixed-ht" onclick="moveQuestionUp('${questionId}')">
                        <i class="bi bi-arrow-up"></i>
                        </button>
                        <button type="button" class="btn secondary-col-1 fixed-ht" onclick="moveQuestionDown('${questionId}')">
                        <i class="bi bi-arrow-down"></i>
                        </button>
                        <button type="button" class="btn btn-danger fixed-ht" onclick="removeQuestion('${questionId}')">
                        <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="card-header primary-col-2 px-1 d-flex justify-content-center align-items-center">
                <div class="input-group" style="width: 50vh">
                    <span class="input-group-text">Marks</span>
                    <span class="input-group-text">Pos.</span>
                    <input type="number" name="marks-pos-${questionId}" id="marks-pos-${questionId}" value="${posMarks}" min="0" step="1" class="form-control" placeholder="00"
                        onkeydown="removeNonDigit(event)" oninput="handleMarksPosInp(this)"/>
                    <span class="input-group-text">Neg.</span>
                    <input type="number" name="marks-neg-${questionId}" id="marks-neg-${questionId}" value="${negMarks}" min="0" step="1" class="form-control" placeholder="00"
                        onkeydown="removeNonDigit(event)" oninput="this.value = toTwoDigitFormat(this.value);"/>
                </div>
            </div>
            <div class="card-body">
            <textarea name="${questionId}" placeholder="Enter question" class = "form-control">${questionText}</textarea>
            <div class="invalid-feedback" id="invalid-question-${questionId}"></div>
            <div class="position-relative mt-2 question-img-box" id="img-box-${questionId}" >
            <img class="question-img" id="img-${questionId}" src="${imageUrl}" alt="Question Image" />
            <div class="input-group-append">
                <button type="button" class="position-absolute shadow btn btn-danger fixed-ht" onclick="removeQuestionImage('${questionId}')"
                    style = "right: 0;top: 0; border-radius: 0 6px 0 6px;">
                <i class="bi bi-trash-fill"></i>
                </button>
            </div>
            </div>
    `;

    if (type === 'mcq') {
        questionHTML += `
            <div class="options-container mt-2"></div>
            <div class="invalid-feedback" id="invalid-question-struct-${questionId}"></div>
            <button type="button" class="btn secondary-col-1 mt-2" onclick="addOption('${questionId}')">
            <i class="bi bi-plus-lg"></i>
            Option
            </button>
        `;
    } else {
        questionHTML += `
            <input type="text" name="resp-ans-${questionId}" value = "${answerText}" class="form-control mt-2 resp-ans" placeholder="Enter answer" />
            <div class="invalid-feedback" id="invalid-resp-ans-${questionId}"></div>
        `;
    }

    questionHTML += `
    </div>
        </div>
    `; //closing card body and main card

    questionElement.innerHTML = questionHTML;
    questionContainer.appendChild(questionElement);

    if (currQuestionPosMarks) {
        const posMarks = toTwoDigitFormat(currQuestionPosMarks)
        questionElement.querySelector(`input[id="marks-pos-${questionId}"]`).value = posMarks;
        updateTotalTestMarks()
    }
    if (currQuestionNegMarks) { 
        questionElement.querySelector(`input[id="marks-neg-${questionId}"]`).value = toTwoDigitFormat(currQuestionNegMarks);
    }

    // At least need 2 options for MCQ question
    if (questionText === "" && type === 'mcq') {
        addOption(questionId)
        addOption(questionId)
    }

    return questionId
}

function addOption(questionId, optionText = "", isChecked = false) {
    const optionsContainer = document.querySelector(`#${questionId} .options-container`);
    const optionId = `option-${Math.random().toString(36).substr(2, 10)}-${questionId}`;
    const optionCount = optionsContainer.children.length + 1;
    const optionElement = document.createElement('div');
    const optionChecked = isChecked ? 'checked' : ''

    optionElement.classList.add('input-group', 'mb-2', 'option');
    optionElement.setAttribute('id', optionId);

    optionElement.innerHTML = `
    <div class="input-group">
        <input type="checkbox" name="cb-${optionId}" class="form-check-input" ${optionChecked} style = "height: 4vh; width: 4vh"/>
        <span class="input-group-text">${optionCount}.</span>
        <input type="text" name=${optionId} value="${optionText}" class="form-control" placeholder="Enter option" />
        <button type="button" class="btn btn-danger" onclick="removeOption('${optionId}')">
            <i class="bi bi-trash-fill"></i>
        </button>
    </div>
    <div class="invalid-feedback mb-1" id="invalid-option-${optionId}"></div>
    `;

    optionsContainer.appendChild(optionElement);
}


function removeOption(optionId) {
    const optionElement = document.getElementById(optionId);
    optionElement.remove();
    updateOptionNumbers();
}

function removeQuestion(questionId) {
    const questionElement = document.getElementById(questionId);
    questionElement.remove();
    updateTotalTestMarks()
    updateQuestionNumbers();
}

function removeQuestionImage(questionId) {
    const imgBox = document.getElementById(`img-box-${questionId}`);
    const imgInpElement = document.getElementById(`img-inp-${questionId}`);
    imgInpElement.value = '';
    imgInpElement.src = '';
    imgBox.style.display = 'none';
}

function moveQuestionUp(questionId) {
    const questionContainer = document.getElementById('question-container');
    const questionElement = document.getElementById(questionId);
    const previousElement = questionElement.previousElementSibling;
    if (previousElement) {
        questionContainer.insertBefore(questionElement, previousElement);
        updateQuestionNumbers();
    }
}

function moveQuestionDown(questionId) {
    const questionContainer = document.getElementById('question-container');
    const questionElement = document.getElementById(questionId);
    const nextElement = questionElement.nextElementSibling;
    if (nextElement) {
        questionContainer.insertBefore(nextElement, questionElement);
        updateQuestionNumbers();
    }
}

function showImage(questionId, input) {
    const imgBox = document.getElementById(`img-box-${questionId}`);
    const imgElement = document.getElementById(`img-${questionId}`);
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imgElement.src = e.target.result;
            imgBox.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function updateQuestionNumbers() {
    document.querySelectorAll('.question').forEach((questionElement, index) => {
        questionElement.querySelector('.question-num').textContent = "Q" + (index + 1) + ".";
    });
}

function updateOptionNumbers() {
    document.querySelectorAll('.option').forEach((questionElement, index) => {
        questionElement.querySelector('.input-group-text').textContent = (index + 1) + ".";
    });
}


function setDefaultMarks() { 
    const posMarks = document.getElementById("def-marks-pos").value
    const negMarks = document.getElementById("def-marks-neg").value
    currQuestionPosMarks = null
    currQuestionNegMarks = null
    if (posMarks) {
        currQuestionPosMarks = parseInt(posMarks)
    }
    if (negMarks) { 
        currQuestionNegMarks = parseInt(negMarks)
    }
}

function handleDefMarks(inp) { 
    inp.value = toTwoDigitFormat(inp.value);
    setDefaultMarks()
}

function handleMarksPosInp(inp) { 
    inp.value = toTwoDigitFormat(inp.value)
    updateTotalTestMarks()
}

function updateTotalTestMarks() {
    let totTestMarks = 0;
    let testTotalMarksSpan = document.getElementById("tot-test-marks")
    const questionContainer = document.getElementById('question-container')
    questionContainer.querySelectorAll('input[id^="marks-pos"]').forEach(marksPosInp => {
        if (marksPosInp.value) { 
            totTestMarks += parseInt(marksPosInp.value)
        }
    })
    testTotalMarksSpan.innerHTML = totTestMarks == 0 ? "00" : toTwoDigitFormat(totTestMarks)
}

function setUpTestEditorForUpdation(testData) {
    document.getElementById('test-title').value = testData.title
    document.getElementById('test-description').value = testData.description
    document.getElementById('test-subject').value = testData.subject
    const { hours, minutes, remainingSeconds } = convertDuration(testData.duration_seconds);
    document.getElementById('test-duration-hr').value = toTwoDigitFormat(hours)
    document.getElementById('test-duration-min').value = toTwoDigitFormat(minutes)
    document.getElementById('test-duration-sec').value = toTwoDigitFormat(remainingSeconds)
    document.getElementById('def-marks-pos').value = toTwoDigitFormat(testData.questions[0].marks_pos)
    document.getElementById('def-marks-neg').value = toTwoDigitFormat(testData.questions[0].marks_neg)
    document.getElementById('tot-test-marks').innerHTML = toTwoDigitFormat(testData.total_marks)

    testData.questions.forEach(question => {
        const questionType = question.question_type === "RESP" ? 'response' : 'mcq'
        const imgUrl = question.image_path ? question.image_path : ""
        const answerText = questionType === 'response' ? question.options[0].option_text : ""
        
        const questionID = addQuestion(
            questionType,
            question.question_text,
            answerText,
            imgUrl,
            toTwoDigitFormat(question.marks_pos),
            toTwoDigitFormat(question.marks_neg)
        )

        if (imgUrl !== "") {
            setImageFileInputFromUrl(imgUrl, `img-inp-${questionID}`)
        }

        if (questionType === 'mcq') {
            question.options.forEach(option => {
                addOption(questionID, option.option_text, option.is_correct)
            })
        }
        if (imgUrl !== "") {
            document.getElementById(`img-box-${questionID}`).style.display = 'block';

        }
    })

    currQuestionPosMarks = testData.questions[0].marks_pos
    currQuestionNegMarks = testData.questions[0].marks_neg

}

// From ChatGPT
function imageUrlToBlob(imageUrl) {
    return fetch(imageUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.blob();
        })
        .then(blob => {
            return blob;
        })
        .catch(error => {
            console.error('Error fetching the image for question:', error);
            throw error;
        });
}

// From ChatGPT
function setImageFileInputFromUrl(imageUrl, inputElementId) {
    imageUrlToBlob(imageUrl)
        .then(blob => {
            const file = new File([blob], 'image.jpg', { type: blob.type });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            const fileInput = document.getElementById(inputElementId);
            fileInput.files = dataTransfer.files;
            console.log('File input set with image:', fileInput.files[0]);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}



