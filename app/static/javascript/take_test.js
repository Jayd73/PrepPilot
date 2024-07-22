var testData = null;

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
            fillUpTestDetails()

        })
        .catch(error => {
            console.error('Error fetching test data:', error);
        });

    document.getElementById('start-test-btn').addEventListener('click', setUpforTest)


})

function setUpforTest() {
    document.getElementById('test-details-container').classList.add('d-none');
    document.getElementById('test-screen').classList.remove('d-none');
    setTestDetailsOnTestScreen()
    manageTestTimer()
    generateQuestionPalette()
    setQuestionOnScreen(0)
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

function manageTestTimer() {
    const threshold_1_perc = 60;
    const threshold_2_perc = 30;
    const threshold_3_perc = 10;

    const abv_threshold_1_col = "#02a30a"
    const abv_threshold_2_col = "#d9c704"
    const abv_threshold_3_col = "#db8f02"
    const below_threshold_3_col = "#db2c00"

    const timer = document.getElementById('test-time-left')
    const timeLeftIcon = document.getElementById('test-time-left-icon')

    let duration = testData.duration_seconds;

    timer.innerHTML = formatTimeLeft(duration)
    timer.style.color = abv_threshold_1_col

    const countdown = setInterval(function() {
        duration--;
        timer.innerHTML = formatTimeLeft(duration);
        if (duration <= 0) {
            clearInterval(countdown);
            timeLeftIcon.classList.remove('bi-hourglass-split')
            timeLeftIcon.classList.add('bi-hourglass-bottom')
            return;
        }
        const remaining_time_perc = (duration / testData.duration_seconds) * 100;
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

// with help from ChatGPT
function generateQuestionPalette() {
    const totQuestions = testData.questions.length;
    const palette = document.getElementById('question-palette');
    const maxCols = 4;

    palette.innerHTML = ''; // Clear any existing content

    const parentWidth = palette.clientWidth;
    const buttonWidth = Math.floor(parentWidth / maxCols); // Subtracting 10 for margin

    let row;
    for (let i = 1; i <= totQuestions; i++) {
        if ((i - 1) % maxCols === 0) {
            row = document.createElement('div');
            row.className = 'row w-100 m-0 justify-content-start align-items-center';
            palette.appendChild(row);
        }
        const col = document.createElement('div');
        col.className = `col-${Math.floor(12 / maxCols)} p-0 pe-2 pb-2`;
        const button = document.createElement('button');
        button.className = 'btn btn-light w-100 position-relative';
        button.style.width = `${buttonWidth}px`;
        button.style.textAlign = 'center';
        button.innerHTML = `${i}`;
        col.appendChild(button);
        row.appendChild(col);
    }
}


// button.innerHTML = `${i}
//         <span class="position-absolute top-100 start-100 translate-middle p-2" style="font-size: 1.7vh">
//             <i class="bi bi-exclamation-diamond-fill text-danger"></i>
//         </span>`;


function setQuestionOnScreen(questionIdx) {
    const question = testData.questions[questionIdx]
    const questionMksNegIcon = document.getElementById('question-mks-neg-icon');
    const questionMksNeg = document.getElementById('question-mks-neg');
    const questionMksPos = document.getElementById('question-mks-pos');
    const questionImgContainer = document.getElementById('question-image-container');
    const optionFormTitle = document.getElementById('user-response-title')
    const optionForm = document.getElementById('user-response-inp');
    const questionTitle = document.getElementById('question-number');

    const MCQ = "MCQ"
    const MSQ = "MSQ"
    const RESP = "RESP"

    questionTitle.innerText = `Question ${toTwoDigitFormat(questionIdx + 1)}.`;
    document.getElementById('question-text').innerText = question.question_text;
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
        question.options.forEach(option => {
            const optionDiv = document.createElement('div')
            const optionType = question.question_type === MCQ ? "radio" : "checkbox"
            optionDiv.className = 'form-check mb-3'
            optionDiv.innerHTML = `
            <input class="form-check-input" type="${optionType}" name="response" id="${option.id}" value="${option.option_text}" style="cursor: pointer">
            <label class="form-check-label" for="${option.id}" style="cursor: pointer">
            ${option.option_text}
            </label>
            `
            optionForm.appendChild(optionDiv)
        });  
    }
    else if (question.question_type === RESP) {
        optionFormTitle.innerHTML = "Your Answer"
        const ansInpDiv = document.createElement('div')
        ansInpDiv.innerHTML = `
        <div class="input-group mb-3">
            <span class="input-group-text">Answer</span>
            <input type="text" class="form-control" placeholder="Type here...">
        </div>
        `
        optionForm.appendChild(ansInpDiv)
    }

    function updateQuestionTitle() {        
        if (window.innerWidth < 576) { 
            questionTitle.innerHTML = `Q${questionIdx + 1}.`
        } else {
            questionTitle.innerHTML = `Question ${toTwoDigitFormat(questionIdx + 1)}.`
        }
    }
    updateQuestionTitle()
    window.addEventListener('resize', updateQuestionTitle);

}