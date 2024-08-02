var testData = null;
var currQuestionIdx = 0;
var currClickedPalatteBtn = null;
var currQuestionVisitedAtTime = null;
var testStartTime = null;
var submitConfirmModal = null;
var remainingSeconds = null;
var countdownTimer = null;
var userTestScore = 0
var totAttemptedQuestions = 0
var totCorrectAnswers = 0
var accuracyChart = null;

const Q_ANS_SAVED = "ans";
const Q_MARKED_FOR_REVIEW = "marked";
const Q_MARKED_FOR_REVIEW_ANS_SAVED = "marked ans saved";
const Q_ANS_NOT_SAVED = "not saved";
const Q_NOT_VISITED = "not visited";

const MCQ = "MCQ"
const MSQ = "MSQ"
const RESP = "RESP"

const SHOW_OFFCANVAS_THRESHOLD = 991

document.addEventListener('DOMContentLoaded', () => {
    //disable clicks on navbar. uncomment the following after work on this page is done
    // document.getElementById('nav-bar').style.pointerEvents = 'none';

    fetch(`/tests/${testId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('is-fetching').classList.add('d-none');
            document.getElementById('done-fetching').style.display = 'block';
            document.getElementById('test-details').style.display = 'block';
            testData = data;
            testData.questions.forEach(question => {
                question.status = Q_NOT_VISITED
                question.time_spent = 0
            });
            fillUpTestDetails()

        })
        .catch(error => {
            console.error('Error fetching test data:', error);
        });

    document.getElementById('start-test-btn').addEventListener('click', setUpforTest)
    document.getElementById('clear-response-btn').addEventListener('click', clearUserResponse)
    document.getElementById('submit-test-btn').addEventListener('click', handleTestSubmit)
    document.getElementById('submit-confirm-btn').addEventListener('click', submitTest)
    document.getElementById('submit-decline-btn').addEventListener('click', closeSubmitConfirmModel)
    document.getElementById('mark-and-next-btn').addEventListener('click', () => {
        saveUserResponse()
        testData.questions[currQuestionIdx].status = Q_MARKED_FOR_REVIEW
        formatBtnForQuestionAt(currQuestionIdx)
        loadNextQuestion()
    })

    document.getElementById('save-and-next-btn').addEventListener('click', () => {
        saveUserResponse()
        changeQuestionStatusAfterSave()
        formatBtnForQuestionAt(currQuestionIdx)
        loadNextQuestion()
    })

    document.getElementById('question-palette-legend').addEventListener('click', (event) => {
        event.stopPropagation()
    })

    // Shifting question palette
    const mediaQuery = window.matchMedia(`(max-width: ${SHOW_OFFCANVAS_THRESHOLD}px)`);
    shiftContentBasedOnScreenWidth(mediaQuery, 'question-palette-container', 'question-palette-long-width-container', 'question-palette-short-width-container');
    mediaQuery.addEventListener('change', (e) => { 
        shiftContentBasedOnScreenWidth(e, 'question-palette-container', 'question-palette-long-width-container', 'question-palette-short-width-container')
    });

    function changePaletteLegendAnchorPt() {
        const questionPaletteContainer = document.getElementById('question-palette-container')
        if (window.innerWidth <= SHOW_OFFCANVAS_THRESHOLD) { 
            questionPaletteContainer.classList.remove('dropstart')
        } else {
            questionPaletteContainer.classList.add('dropstart')
        }
    }

    function hideSideBarIfScreenWidthIsBig() { 
        if (window.innerWidth > SHOW_OFFCANVAS_THRESHOLD) { 
            hideSideBarIfOpen()
        }
    }

    changePaletteLegendAnchorPt()
    hideSideBarIfScreenWidthIsBig()

    window.addEventListener('resize', () => { 
        changePaletteLegendAnchorPt()
        hideSideBarIfScreenWidthIsBig()
    });

    document.getElementById('goto-dashboard-btn').addEventListener('click', () => {
        window.location.href = "/"
    })

})

function setUpforTest() {
    testStartTime = new Date()
    document.getElementById('test-details-container').classList.add('d-none');
    document.getElementById('test-screen').classList.remove('d-none');
    setTestDetailsOnTestScreen()
    startTestTimer()
    generateQuestionPalette()
    moveToQuestionAt(currQuestionIdx)
}

function fillUpTestDetails() {
    document.getElementById('test-title').innerHTML = testData.title;
    document.getElementById('test-subject').innerHTML = testData.subject;
    document.getElementById('test-marks').innerHTML = formatMarks(testData.total_marks);
    document.getElementById('test-duration').innerHTML = formatDuration(testData.duration_seconds);
    document.getElementById('test-description').innerHTML = testData.description;
    document.getElementById('test-last-updated-time').innerHTML = convertAndFormatToLocalTime(testData.last_updated);
    document.getElementById('test-author').innerHTML = testData.author_details.username;
    if (testData.author_details.avatar_url)
        document.getElementById('author-avatar').src = testData.author_details.avatar_url;
}

function setTestDetailsOnTestScreen() {
    document.getElementById('test-title-on-screen').innerHTML = testData.title;
    document.getElementById('test-subject-on-screen').innerHTML = testData.subject;
    document.getElementById('test-marks-on-screen').innerHTML = formatMarks(testData.total_marks);
}

function startTestTimer() {
    const threshold_1_perc = 60;
    const threshold_2_perc = 30;
    const threshold_3_perc = 10;

    const abv_threshold_1_col = "#02a30a"
    const abv_threshold_2_col = "#d9c704"
    const abv_threshold_3_col = "#db8f02"
    const below_threshold_3_col = "#db2c00"

    const timer = document.getElementById('test-time-left')
    const timeLeftIcon = document.getElementById('test-time-left-icon')

    remainingSeconds = testData.duration_seconds;

    timer.innerHTML = formatTimeLeft(remainingSeconds)
    timer.style.color = abv_threshold_1_col

    countdownTimer = setInterval(function() {
        remainingSeconds--;
        timer.innerHTML = formatTimeLeft(remainingSeconds);
        if (remainingSeconds <= 0) {
            clearInterval(countdownTimer);
            timeLeftIcon.classList.remove('bi-hourglass-split')
            timeLeftIcon.classList.add('bi-hourglass-bottom')
            return;
        }
        const remaining_time_perc = (remainingSeconds / testData.duration_seconds) * 100;
        if (remaining_time_perc > threshold_1_perc)
            timer.style.color = abv_threshold_1_col
        else if (remaining_time_perc > threshold_2_perc)
            timer.style.color = abv_threshold_2_col
        else if (remaining_time_perc > threshold_3_perc)
            timer.style.color = abv_threshold_3_col
        else
            timer.style.color = below_threshold_3_col
    }, 1000);
}

function formatTimeLeft(seconds) {
    let {
        hours,
        minutes,
        remainingSeconds
    } = convertDuration(seconds);
    
    hours = toTwoDigitFormat(hours)
    minutes = toTwoDigitFormat(minutes)
    remainingSeconds = toTwoDigitFormat(remainingSeconds)

    hours = hours === "" ? '00' : hours
    minutes = minutes === "" ? '00' : minutes
    remainingSeconds = remainingSeconds === "" ? '00' : remainingSeconds

    return `${hours}:${minutes}:${remainingSeconds}`;
}

// With help from ChatGPT
function generateQuestionPalette() {
    const totQuestions = testData.questions.length;
    const palette = document.getElementById('question-palette');
    const maxColms = 4;
    const btnNotVisitedBgColClass = "btn-light"
    const currPalatteBtnBgColClass = "secondary-col-2"

    palette.innerHTML = '';

    const parentWidth = palette.clientWidth;
    const buttonWidth = Math.floor(parentWidth / maxColms);

    let row;
    for (let i = 1; i <= totQuestions; i++) {
        if ((i - 1) % maxColms === 0) {
            row = document.createElement('div');
            row.className = 'row w-100 m-0 justify-content-start align-items-center';
            row.style.overflowX = "hidden"
            row.style.overflowY = "hidden"
            palette.appendChild(row);
        }
        const colm = document.createElement('div');
        colm.className = `col-${Math.floor(12 / maxColms)} p-0 pe-2 pb-2`;
        const button = document.createElement('button');
        button.setAttribute('data-question-id', i - 1);
        button.setAttribute('data-bg-col-class-not-curr', btnNotVisitedBgColClass)
        button.setAttribute('data-bg-col-class-curr', currPalatteBtnBgColClass)
        button.className = `btn ${btnNotVisitedBgColClass} w-100 position-relative shadow-sm`
        button.style.width = `${buttonWidth}px`;
        button.style.textAlign = 'center';
        button.innerHTML = i
        button.addEventListener('click', handlePalatteBtnClick)
        colm.appendChild(button);
        row.appendChild(colm);
    }
}

function formatBtnForQuestionAt(questionIdx) {
    const questionStatus = testData.questions[questionIdx].status
    const questionBtn = getPaletteBtnFromQuestionIdx(questionIdx)
    const borderWidthClass = "border-2"
    const ansSavedBorderCol = "border-success"
    const markedForReviewBorderCol = "secondary-col-1-border"
    const markedForReviewAnsSavedBorderCol = "secondary-col-1-border"
    const ansNotSavedBorderCol = "border-danger"

    let statusIconName = ""
    let statusIconColClass = ""
    questionBtn.classList.remove(questionBtn.getAttribute('data-border-col-class'))
    questionBtn.classList.add("border")
    questionBtn.classList.add(borderWidthClass)

    switch (questionStatus) {
        case Q_ANS_SAVED:
            statusIconName = "bi-bookmark-fill"
            statusIconColClass = "text-success"
            questionBtn.classList.add(ansSavedBorderCol)
            questionBtn.setAttribute("data-border-col-class", ansSavedBorderCol)
            break;
        case Q_MARKED_FOR_REVIEW:
            statusIconName = "bi-search"
            statusIconColClass = "secondary-col-1-content"
            questionBtn.classList.add(markedForReviewBorderCol)
            questionBtn.setAttribute("data-border-col-class", markedForReviewBorderCol)
            break;
        case Q_MARKED_FOR_REVIEW_ANS_SAVED:
            statusIconName = "bi-bookmark-star-fill"
            statusIconColClass = "text-success"
            questionBtn.classList.add(markedForReviewAnsSavedBorderCol)
            questionBtn.setAttribute("data-border-col-class", markedForReviewAnsSavedBorderCol)
            break;
        case Q_ANS_NOT_SAVED:
            statusIconName = "bi-exclamation-circle-fill"
            statusIconColClass = "text-danger"
            questionBtn.classList.add(ansNotSavedBorderCol)
            questionBtn.setAttribute("data-border-col-class", ansNotSavedBorderCol)
            break;
        default:
            questionBtn.classList.remove("border")
            questionBtn.classList.remove(borderWidthClass)
            break;
    }

    questionBtn.innerHTML = `${questionIdx + 1}
        <span class="position-absolute top-100 start-100 translate-middle p-2" style="font-size: 2vh;">
            <i class="bi ${statusIconName} ${statusIconColClass} rounded-circle" style="background-color:white; padding-inline: 0.3vh"></i>
        </span>`
}

function handlePalatteBtnClick(event) {
    const questionIdx = Number(event.target.closest('button').getAttribute('data-question-id'))
    hideSideBarIfOpen()
    moveToQuestionAt(questionIdx)
}

function moveToQuestionAt(nextQuestionIdx) {
    const now = new Date()
    const currQuestion = testData.questions[currQuestionIdx]
    const nextQuestionBtn = getPaletteBtnFromQuestionIdx(nextQuestionIdx)

    if (!(currQuestionIdx == nextQuestionIdx) && currQuestion.status === Q_NOT_VISITED) {
        currQuestion.status = Q_ANS_NOT_SAVED
        formatBtnForQuestionAt(currQuestionIdx)
    }
    if (currClickedPalatteBtn) { 
        currClickedPalatteBtn.classList.remove(currClickedPalatteBtn.getAttribute('data-bg-col-class-curr'))
        currClickedPalatteBtn.classList.add(currClickedPalatteBtn.getAttribute('data-bg-col-class-not-curr'))
    }
    
    if (!currQuestionVisitedAtTime) {
        currQuestionVisitedAtTime = now
    }
    currQuestion.time_spent += now - currQuestionVisitedAtTime
    currQuestionIdx = nextQuestionIdx
    currQuestionVisitedAtTime = now
    nextQuestionBtn.classList.remove(nextQuestionBtn.getAttribute('data-bg-col-class-not-curr'))
    nextQuestionBtn.classList.add(nextQuestionBtn.getAttribute('data-bg-col-class-curr'))
    currClickedPalatteBtn = nextQuestionBtn
    setQuestionOnScreen(currQuestionIdx)
}

function setQuestionOnScreen(questionIdx) {
    const question = testData.questions[questionIdx]
    const questionText = document.getElementById('question-text');
    const questionMksNegIcon = document.getElementById('question-mks-neg-icon');
    const questionMksNeg = document.getElementById('question-mks-neg');
    const questionMksPos = document.getElementById('question-mks-pos');
    const questionImgContainer = document.getElementById('question-image-container');
    const optionFormTitle = document.getElementById('user-response-title')
    const optionForm = document.getElementById('user-response-form');
    const questionTitle = document.getElementById('question-number');

    questionText.innerText = question.question_text;
    questionTitle.innerText = `Question ${toTwoDigitFormat(questionIdx + 1)}.`;

    questionMksPos.innerText = `+${question.marks_pos}`
    questionMksPos.style.borderRadius = "0px 6px 6px 0px";
    optionForm.innerHTML = '';

    questionMksNegIcon.style.display = 'none'
    questionMksNeg.style.display = 'none'
    questionImgContainer.style.display = 'none'

    if (question.marks_neg > 0) {
        questionMksNegIcon.style.display = 'block'
        questionMksNeg.style.display = 'block'
        questionMksNeg.innerText = `-${question.marks_neg}`
        questionMksPos.style.borderRadius = "0px 0px 0px 0px";
    }

    if (question.image_path) {
        questionImgContainer.style.display = 'block'
        document.getElementById('question-image').src = question.image_path;
    }
    
    if (question.question_type === MCQ || question.question_type === MSQ) {
        optionFormTitle.innerHTML = "Options"
        question.options.forEach((option, optionIdx) => {
            const optionDiv = document.createElement('div')
            const optionType = question.question_type === MCQ ? "radio" : "checkbox"
            
            let optChecked = ""
            if (question.user_response && question.user_response.selections.includes(optionIdx)) {
                optChecked = "checked"
            }
            optionDiv.className = 'form-check mb-3'
            optionDiv.innerHTML = `
            <input class="form-check-input" type="${optionType}" name="response" id="opt-${option.id}" value="${optionIdx}" ${optChecked} style="cursor: pointer">
            <label class="form-check-label" for="opt-${option.id}" style="cursor: pointer">
            ${option.option_text}
            </label>
            `
            optionForm.appendChild(optionDiv)
        });  
    }
    else if (question.question_type === RESP) {
        optionFormTitle.innerHTML = "Your Answer"
        const ansInpDiv = document.createElement('div')
        let response_text = (question.user_response) ? question.user_response.response_text : ""
        ansInpDiv.innerHTML = `
        <div class="input-group mb-3">
            <span class="input-group-text">Answer</span>
            <input class="form-control" id="response-text-inp" type="text" value="${response_text}" placeholder="Type here...">
        </div>
        `
        optionForm.appendChild(ansInpDiv)
    }

    function modifyQuestionTitleForSmallWidth() {        
        if (window.innerWidth < 576) { 
            questionTitle.innerHTML = `Q${questionIdx + 1}.`
        } else {
            questionTitle.innerHTML = `Question ${toTwoDigitFormat(questionIdx + 1)}.`
        }
    }
    modifyQuestionTitleForSmallWidth()
    window.addEventListener('resize', modifyQuestionTitleForSmallWidth);
}

function saveUserResponse() {
    const question = testData.questions[currQuestionIdx]
    const selectedOptionIndices = []
    let response_text = ""
    if (question.question_type === MCQ || question.question_type === MSQ) {
        const inputs = document.querySelectorAll('input[name="response"]:checked')
        inputs.forEach(input => {
            selectedOptionIndices.push(Number(input.value))
        })
    }
    else if (question.question_type === RESP) {
        response_text = document.getElementById('response-text-inp').value
    }
    if (!question.user_response)
        question.user_response = {}

    question.user_response.selections = selectedOptionIndices
    question.user_response.response_text = response_text
    question.user_response.save_time = new Date()
}

function changeQuestionStatusAfterSave() {
    const question = testData.questions[currQuestionIdx]
    if (question.status === Q_MARKED_FOR_REVIEW)
        question.status = Q_MARKED_FOR_REVIEW_ANS_SAVED
    else if (question.status !== Q_MARKED_FOR_REVIEW_ANS_SAVED)
        question.status = Q_ANS_SAVED
}

function loadNextQuestion() {
    if (currQuestionIdx == testData.questions.length - 1)
        return
    moveToQuestionAt(currQuestionIdx + 1)
}

function clearUserResponse() {
    const userResponseForm = document.getElementById('user-response-form');
    const selectInputs = userResponseForm.querySelectorAll('input[type="checkbox"], input[type="radio"]')
    selectInputs.forEach(selectInput => {
        selectInput.checked = false
    });

    // Clear all text inputs
    const textInputs = userResponseForm.querySelectorAll('input[type="text"]');
    textInputs.forEach(textInput => {
        textInput.value = ''
    });
}

function getPaletteBtnFromQuestionIdx(questionIdx) {
    return document.getElementById('question-palette').querySelector(`button[data-question-id="${questionIdx}"]`)
}

function handleTestSubmit() {
    let totMarkedForReviewQuestions = 0
    let totVistedUnsavedQuestions = 0
    let totUnvisitedQuestions = 0
    let totUnsavedQuestions = 0
    const unsavedQuestionMessages = []
    const currQuestion = testData.questions[currQuestionIdx]

    if (currQuestion.status === Q_NOT_VISITED) {
        currQuestion.status = Q_ANS_NOT_SAVED
        formatBtnForQuestionAt(currQuestionIdx)
        currQuestion.time_spent = new Date() - currQuestionVisitedAtTime
    }
    
    testData.questions.forEach(question => {
        if (question.status === Q_MARKED_FOR_REVIEW)
            totMarkedForReviewQuestions += 1
        else if (question.status === Q_ANS_NOT_SAVED)
            totVistedUnsavedQuestions += 1
        else if (question.status === Q_NOT_VISITED)
            totUnvisitedQuestions += 1
    })

    if (totMarkedForReviewQuestions > 0)
        unsavedQuestionMessages.push(`<i class="bi bi-search"></i> &nbsp;<b>${totMarkedForReviewQuestions} ${appendSIfPlural(totMarkedForReviewQuestions, "question")}</b> ${hasOrHave(totMarkedForReviewQuestions)} been marked for review but not saved`)
    if (totVistedUnsavedQuestions > 0)
        unsavedQuestionMessages.push(`<i class="bi bi-exclamation-circle-fill"></i> &nbsp;<b>${totVistedUnsavedQuestions} ${appendSIfPlural(totVistedUnsavedQuestions, "question")}</b> ${hasOrHave(totVistedUnsavedQuestions)} been visited but not saved`)
    if (totUnvisitedQuestions > 0)
        unsavedQuestionMessages.push(`<i class="bi bi-x-circle"></i> &nbsp;<b>${totUnvisitedQuestions} ${appendSIfPlural(totUnvisitedQuestions, "question")}</b> ${hasOrHave(totUnvisitedQuestions)} not been visited`)

    totUnsavedQuestions = totMarkedForReviewQuestions + totVistedUnsavedQuestions + totUnvisitedQuestions
    if (totUnsavedQuestions > 0) {
        submitConfirmModal = new bootstrap.Modal(document.getElementById('submit-confirmation-modal'));
        const submitConfirmModalBody = document.getElementById('unsaved-questions-message')
        submitConfirmModalBody.innerHTML = `<div class="mb-2">You have <b>${totUnsavedQuestions} unsaved</b> ${appendSIfPlural(totUnsavedQuestions, "question")}<span>`
        unsavedQuestionMessages.forEach(message => {
            submitConfirmModalBody.innerHTML += `<div class="mb-2">${message}</span>`
        })
        submitConfirmModal.show()
    }
    else { 
        submitTest()
    }
        
}

function submitTest() {
    clearInterval(countdownTimer);
    calculateTestResults()
    if (submitConfirmModal) {
        closeSubmitConfirmModel()
    }

    const attemptDetails = {
        test_attempt_start_time: testStartTime,
        test_duration_seconds: testData.duration_seconds - remainingSeconds,
        test_score: userTestScore
    }

    const isSubmittingIndicator = document.getElementById('is-submitting')
    document.getElementById('test-screen').classList.add('d-none')
    document.getElementById('test-analysis').classList.remove('d-none')
    isSubmittingIndicator.classList.remove('d-none')

    fetch(`/tests/attempt/${testData.id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(attemptDetails)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        isSubmittingIndicator.classList.add('d-none');
        document.getElementById('analysis-container').classList.remove('d-none')
        setUpAnalysis()
    })
    .catch(error => {
        console.error('Error submitting attempt details:', error);
    });
}

function hasOrHave(num) {
    return num > 1 ? "have" : "has"
}

function appendSIfPlural(num, singularFormWord) {
    return num == 1 ? singularFormWord : singularFormWord + "s"
}

function closeSubmitConfirmModel() {
    submitConfirmModal.hide()
    submitConfirmModal = null
}

function calculateTestResults() {
    testData.questions.forEach(question => {
        if (question.status === Q_ANS_SAVED || question.status === Q_MARKED_FOR_REVIEW_ANS_SAVED) {
            totAttemptedQuestions += 1;
            if (isAnswerCorrect(question)) {
                totCorrectAnswers += 1;
                userTestScore += question.marks_pos;
                question.user_response.is_correct = true
            } else {
                userTestScore -= question.marks_neg;
                question.user_response.is_correct = false
            }
        }
    });
}

function isAnswerCorrect(question) {
    if (question.question_type === MSQ || question.question_type === MCQ) {
        return areContentsSame(question.user_response.selections, getCorrectOptionIndices(question.options));
    } else if (question.question_type === RESP) {
        return question.user_response.response_text.trim() === question.options[0].option_text.trim();
    }
    return false;
}


function getCorrectOptionIndices(options) {
    const correctIndices = [];
    options.forEach((option, index) => {
        if (option.is_correct) {
            correctIndices.push(index);
        }
    });
    return correctIndices;
}

function areContentsSame(arr1, arr2) {
    return arr1.length === arr2.length && arr1.every(val => arr2.includes(val))
}

function hideSideBarIfOpen() {
    const sideBarInstance = bootstrap.Offcanvas.getInstance(document.getElementById('sidebarOffcanvas'))
    if (sideBarInstance) {
        sideBarInstance.hide()
    }
}

function setUpAnalysis() {
    let avgTimePerQuestion = 0
    let totVisitedQuestions = 0

    document.getElementById('user-test-score').innerHTML = userTestScore
    document.getElementById('user-score-marks-label').innerHTML = appendSIfPlural(userTestScore, "mark")
    document.getElementById('analysis-report-tot-test-marks').innerHTML = `${testData.total_marks} ${appendSIfPlural(testData.total_marks, "mark")}`
    document.getElementById('analysis-report-user-perc').innerHTML = calcAndFormatPerc(userTestScore, testData.total_marks)
    document.getElementById('analysis-report-accuracy').innerHTML = calcAndFormatPerc(totCorrectAnswers, totAttemptedQuestions)

    testData.questions.forEach(question => {
        if (question.status !== Q_NOT_VISITED) {
            totVisitedQuestions += 1
            avgTimePerQuestion += question.time_spent
        }
    })
    avgTimePerQuestion /= totVisitedQuestions

    document.getElementById('analysis-report-avg-time-per-question').innerHTML = formatDuration((avgTimePerQuestion / 1000).toFixed(2))
    drawAttemptedQuestionsChart()
    drawTimeSpentPerQuestionChart()
}

// With help from ChatGPT
function drawAttemptedQuestionsChart() {
    const data = {
        labels: ['Correct', 'Incorrect', 'Unattempted'],
        datasets: [{
            data: [totCorrectAnswers, totAttemptedQuestions - totCorrectAnswers, testData.questions.length - totAttemptedQuestions], // Replace with your actual data
            backgroundColor: [
                '#198754', // for Correct
                '#d93444', // for Incorrect
                '#a7acb1'  // for Unattempted
            ],
            hoverBackgroundColor: [
                '#198754', // for hover on Correct
                '#d93444', // for hover on Incorrect
                '#a7acb1'  // for hover on Unattempted
            ]
        }]
    };

    // Configuration options for the chart
    const config = {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${value}`;
                        }
                    }
                }
            }
        }
    };

    const ctx = document.getElementById('attempted-questions-chart').getContext('2d');
    new Chart(ctx, config);
}

// With help from ChatGPT
function drawTimeSpentPerQuestionChart() {
    const timeSpentInMinutes = testData.questions.filter(question => question.status !== Q_NOT_VISITED).map(question => question.time_spent / 60000);

    // Create labels for the chart (e.g., Question 1, Question 2, ...)
    const labels = timeSpentInMinutes.map((_, index) => `Q${index + 1}`);

    // Data for the chart
    const data = {
        labels: labels,
        datasets: [{
            label: 'Time per Question (minutes)',
            data: timeSpentInMinutes,
            backgroundColor: '#3367e0',
            borderRadius: 4,
            maxBarThickness: 50
        }]
    };

    // Configuration options for the chart
    const config = {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Time (minutes)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Questions'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Time: ${context.raw} minutes`;
                        }
                    }
                }
            }
        }
    };

    const ctx = document.getElementById('time-per-questions-chart').getContext('2d');
    new Chart(ctx, config);
}

// With help from ChatGPT
function drawAccuracyChart(phases, accuracies, customTicks) {
    const ctx = document.getElementById('accuracy-chart').getContext('2d');

    // Destroy the previous chart instance if it exists
    if (accuracyChart) {
        accuracyChart.destroy();
    }

    // Create annotations for each phase with alternating background colors
    const annotations = phases.map((phase, index) => {
        return {
            type: 'box',
            xScaleID: 'x',
            yScaleID: 'y',
            xMin: phase[0],
            xMax: phase[1],
            yMin: 0,
            yMax: 100,
            backgroundColor: index % 2 === 0 ? 'rgba(61, 103, 227, 0.3)' : 'rgba(173, 193, 237, 0.3)'
        };
    });

    // Create data points in the middle of each phase
    const dataPoints = phases.map((phase, index) => {
        return {
            x: (phase[0] + phase[1]) / 2,
            y: accuracies[index]
        };
    });

    // Create the chart
    accuracyChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Accuracy %',
                data: dataPoints,
                fill: false,
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.3
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Time (%)'
                    },
                    min: 0,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return customTicks.includes(value) ? value + '%' : '';
                        },
                        stepSize: 1,
                        autoSkip: false,
                        minRotation: 45, // Slanted ticks
                        maxRotation: 45 // Slanted ticks
                    },
                    grid: {
                        display: false // Hide vertical grid lines
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Accuracy (%)'
                    },
                    min: 0,
                    max: 100,
                    grid: {
                        display: true // Ensure horizontal grid lines are visible
                    }
                }
            },
            plugins: {
                annotation: {
                    annotations: annotations
                }
            }
        }
    });
}

// timePhasePerc: contains list of % of time in incr. order. Last element must be 100
function getAccuracyForTimePhases(timePhasePerc) {
    const userTotTestTimeSec = testData.duration_seconds - remainingSeconds
    let timePhasePercLower = 0
    let accuracyPerc = []
    timePhasePerc.forEach(timePhasePercUpper => {
        let currPhaseAttemptedQuestions = 0
        let currPhaseTotCorrectAnswers = 0
        testData.questions.forEach(question => {
            let userResponse = question.user_response
            let userSaveTimeSecPerc = ((userResponse.save_time - testStartTime) / 1000) / userTotTestTimeSec * 100
            if (userResponse && (userSaveTimeSecPerc > timePhasePercLower && userSaveTimeSecPerc <= timePhasePercUpper)) {
                currPhaseAttemptedQuestions += 1
                if (userResponse.is_correct)
                    currPhaseTotCorrectAnswers += 1
            }
        })
        accuracyPerc.push(currPhaseTotCorrectAnswers / currPhaseAttemptedQuestions * 100)
        timePhasePercLower = timePhasePercUpper
    })
    return accuracyPerc
}