// Created in collaboration with ChatGPT
document.addEventListener('DOMContentLoaded', () => {
    
    const addMCQButton = document.getElementById('add-mcq');
    const addResponseQuestionButton = document.getElementById('add-response-question');

    addMCQButton.addEventListener('click', () => addQuestion('mcq'));
    addResponseQuestionButton.addEventListener('click', () => addQuestion('response'));

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
        saveBtn.innerHTML = `<i class="bi bi-bookmark-fill"></i> Saving...`

        fetch('/test_editor/create', {
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

    // Autocomplete subjects suggestion (took help from ChatGPT)
    const subjectInput = document.getElementById('test-subject');
    const subjectDropdown = document.getElementById('subject-dropdown');

    subjectInput.addEventListener('input', function() {
        const query = subjectInput.value;
        if (query.length > 0) {
            fetch(`/search_subjects?query=${query}`)
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

});

function addQuestion(type) {
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
                <button type="button" class="btn btn-primary fixed-ht" onclick="document.getElementById('img-inp-${questionId}').click();">
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
        <div class="card-body">
        <textarea name="${questionId}" placeholder="Enter question" class = "form-control"></textarea>
        <div class="invalid-feedback" id="invalid-question-${questionId}"></div>
        <div class="position-relative mt-2 question-img-box" id="img-box-${questionId}" >
            <img class="question-img"  id="img-${questionId}" src="" alt="Question Image" />
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
            <input type="text" name="resp-ans-${questionId}" class="form-control mt-2 resp-ans" placeholder="Enter answer" />
            <div class="invalid-feedback" id="invalid-resp-ans-${questionId}"></div>
        `;
    }

    questionHTML += `
    </div>
        </div>
    `; //closing card body and main card

    questionElement.innerHTML = questionHTML;
    questionContainer.appendChild(questionElement);

    // At least need 2 options for MCQ question
    if (type === 'mcq') {
        addOption(questionId)
        addOption(questionId)
    }
}

function addOption(questionId) {
    const optionsContainer = document.querySelector(`#${questionId} .options-container`);
    const optionId = `option-${Math.random().toString(36).substr(2, 10)}-${questionId}`;
    const optionCount = optionsContainer.children.length + 1;
    const optionElement = document.createElement('div');
    optionElement.classList.add('input-group', 'mb-2', 'option');
    optionElement.setAttribute('id', optionId);

    optionElement.innerHTML = `
    <div class = "input-group">
        <input type="checkbox" name="cb-${optionId}" class="form-check-input" style = "height: 4vh; width: 4vh"/>
        <span class="input-group-text">${optionCount}.</span>
        <input type="text" name=${optionId} class="form-control" placeholder="Enter option" />
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




function checkValue(input) {
    if (input.id === 'test-duration-hr') {
        if (input.value < 0) input.value = 0;
    } else if (input.id === 'test-duration-min' || input.id === 'test-duration-sec') {
        if (input.value < 0) input.value = 0;
        if (input.value > 59) input.value = 59;
    }
}

function validateInput(event) {
    const key = event.key;
    if (['-', '.'].includes(key)) {
        event.preventDefault();
    }
}