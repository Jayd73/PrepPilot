var defPerPage = 2;
let selectedTests = [];
let currPageTests = [];

document.addEventListener('DOMContentLoaded', () => {

    const createTestBtns = document.querySelectorAll('.create-test-btn');
    createTestBtns.forEach(button => button.addEventListener('click', () => {
        window.location.href = "/test-editor"
    }));

    // With help from ChatGPT
    const defaultTab = "all"
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => button.addEventListener('click', handleTabBtnClick));

    activateTabBtn(defaultTab);
    fetchTests(defaultTab, 1, defPerPage);

    document.getElementById('select-all-checkbox').addEventListener('change', (event) => {
        const isChecked = event.target.checked;
        const testCheckboxes = document.querySelectorAll('input[id^="test-select"]');

        testCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
            handleCheckboxChange({
                target: checkbox
            });
        });
    })

});

function handleTabBtnClick(event) {
    document.querySelectorAll('.tab-btn').forEach(button => button.classList.remove('active-tab-btn'));
    const testType = event.target.dataset.type;
    const selectAllcheckBox = document.getElementById('select-all-checkbox');
    if (testType != "all") {
        selectAllcheckBox.style.visibility = 'visible'
        selectAllcheckBox.style.pointerEvents = 'auto'
    } else {
        selectAllcheckBox.style.visibility = 'hidden'
        selectAllcheckBox.style.pointerEvents = 'none'
    }
    activateTabBtn(testType)
    fetchTests(testType, 1, defPerPage)
}

function activateTabBtn(testType) {
    document.querySelectorAll(`button[data-type="${testType}"]`).forEach(button => {
        button.classList.add('active-tab-btn');
    });
}

function fetchTests(testType, page, perPage) {
    fetch(`/tests?type=${testType}&page=${page}&per-page=${perPage}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('select-all-cb').checked = false
            renderTests(data.tests, testType);
            renderPagination(data.total_pages, data.current_page, testType, perPage);
        })
        .catch(error => {
            console.error('Error fetching test data:', error);
        });
}

function renderTests(tests, testType) {
    const testListContainer = document.getElementById('test-row-container');
    testListContainer.innerHTML = '';

    if (tests.length == 0) {
        testListContainer.innerHTML = `
        <div class="d-flex justify-content-center align-items-center" style="width: 100%; justify-content: center">
            <h1 style="width:70%; padding-top: 10vh; text-align: center; color: #c9c9c9">
                No Tests Available ¯\\_(ツ)_/¯
            </h1>
        </div>
        `
        return
    }

    currPageTests = []
    tests.forEach(test => {
        currPageTests.push(test.id.toString())
        const testRow = document.createElement('div');
        let titleColClass = 'col-lg-6'
        let subjectColClass = 'col-lg-2'
        let marksColClass = 'col-lg-2'
        let durationColClass = 'col-lg-2'
        let checkBox = ''

        if (testType === 'attempted') {
            titleColClass = 'col-lg-4'
            marksColClass = 'col-lg-1'
            const checked = selectedTests.includes(test.id.toString()) ? 'checked' : ''
            checkBox = `<input class="form-check-input" type="checkbox" id="test-select-${test.id}" value="${test.id}" style = "transform: scale(1.2); margin-left: 4px" onchange="handleCheckboxChange(event)" ${checked}>`
        }

        testRow.className = 'row test-row light-bg fs-6 ms-1 mb-1';
        testRow.innerHTML = `
            <div class="${titleColClass} text-col-content test-title">
                <div style="overflow: hidden;">
                ${checkBox + "&nbsp;"}
                ${test.title}
                </div>
            </div>
            <div class="${subjectColClass} subject-container" style="overflow: hidden;">
                <div class="primary-col-2 text-col-content test-subject">
                    ${test.subject}
                </div>
            </div>
            
            <div class="${marksColClass} col-md-6 col-sm-6 text-col-content test-marks">
                <i class="bi bi-star"></i>
                ${formatMarks(test.total_marks)}
            </div>
            <div class="${durationColClass} col-md-6 col-sm-6 text-col-content test-duration">
                <i class="bi bi-hourglass-top"></i>
                ${formatDuration(test.duration_seconds)}
            </div>
        `;
        if (testType === 'attempted') {
            testRow.innerHTML += `
                <div class="col-lg-2 text-col-content test-duration">
                    <i class="bi bi-bar-chart-fill"></i>
                    Attempts: ${test.attempts}
                </div>
                `
            const btnContainer = document.createElement('div')
            const detailsButton = document.createElement('button');
            btnContainer.className = 'col-lg-1'
            detailsButton.className = 'btn secondary-col-1 attempt-details-btn';
            detailsButton.innerHTML = '<i class="bi bi-info-circle"></i> Details';
            detailsButton.addEventListener('click', () => showDetails(test));
            btnContainer.appendChild(detailsButton)
            testRow.appendChild(btnContainer);
        }
        testListContainer.appendChild(testRow);
    });
    manageAllTestsSelectedForAPage()
}

function renderPagination(totalPages, currentPage, testType, perPage) {
    const paginationNav = document.getElementById('pagination-nav');
    const paginationUl = paginationNav.querySelector('.pagination');
    const totVisiblePgNums = 5;

    paginationUl.innerHTML = ''; // Clear previous pagination

    // Previous button
    const prevItem = document.createElement('li');
    prevItem.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevItem.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">«</span></a>`;
    prevItem.addEventListener('click', (event) => {
        event.preventDefault();
        if (currentPage > 1) {
            fetchTests(testType, currentPage - 1, perPage);
        }
    });
    paginationUl.appendChild(prevItem);

    // Page number buttons
    if (totalPages <= totVisiblePgNums) {
        for (let i = 1; i <= totalPages; i++) {
            addPageItemForPageNum(i)
        }
    } else {
        const visPgNumsSingleSide = (totVisiblePgNums - (totVisiblePgNums % 2)) / 2 // must be even

        let startPgNum = (currentPage - visPgNumsSingleSide + 1)
        startPgNum = (startPgNum < 1) ? 1 : startPgNum

        if (currentPage >= (totalPages - visPgNumsSingleSide + 1)) {
            startPgNum = totalPages - visPgNumsSingleSide - 1
        }

        for (let i = startPgNum; i < (startPgNum + visPgNumsSingleSide); i++) {
            addPageItemForPageNum(i)
        }

        const ellipsisBtn = document.createElement('li');
        ellipsisBtn.className = "page-item";
        ellipsisBtn.innerHTML = `<a class="page-link" href="#" aria-label="..."><span aria-hidden="true">...</span></a>`;
        ellipsisBtn.addEventListener('click', (event) => {
            event.preventDefault();
            showGotoPageInputGroup(ellipsisBtn, testType, perPage, totalPages);
        });
        paginationUl.appendChild(ellipsisBtn);


        for (let i = (totalPages - visPgNumsSingleSide + 1); i <= totalPages; i++) {
            addPageItemForPageNum(i)
        }
    }

    // Next button
    const nextItem = document.createElement('li');
    nextItem.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextItem.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">»</span></a>`;
    nextItem.addEventListener('click', (event) => {
        event.preventDefault();
        if (currentPage < totalPages) {
            fetchTests(testType, currentPage + 1, perPage);
        }
    });
    paginationUl.appendChild(nextItem);

    function addPageItemForPageNum(pageNum) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${pageNum === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<a class="page-link" href="#">${pageNum}</a>`;
        pageItem.addEventListener('click', (event) => {
            event.preventDefault();
            fetchTests(testType, pageNum, perPage);
        });
        paginationUl.appendChild(pageItem);
    }
}

// With help from ChatGPT
function showGotoPageInputGroup(button, testType, perPage, totalPages) {
    const goToPageContainer = document.getElementById('goto-page-container');
    goToPageContainer.classList.remove('d-none');

    // Get the bounding rectangle of the button
    const rect = button.getBoundingClientRect();

    // Calculate the position to align the input group horizontally center with the button
    const inputGroupRect = goToPageContainer.getBoundingClientRect();

    const topPostition = rect.bottom + 10
    const leftPosition = rect.left - (inputGroupRect.width / 2) + (rect.width / 2)
    // alert(leftPosition)

    // Set the position of the input group
    goToPageContainer.style.position = 'absolute';
    goToPageContainer.style.top = `${topPostition}px`;
    goToPageContainer.style.left = `${leftPosition}px`;

    // Add click event to the Go button inside the input group
    document.getElementById('goto-page-btn').addEventListener('click', () => {
        let pageNum = parseInt(document.getElementById('goto-page-inp').value);
        if (pageNum > totalPages) pageNum = totalPages;
        fetchTests(testType, pageNum, perPage); // Update fetchTests parameters as needed
        goToPageContainer.classList.add('d-none'); // Hide the input group after clicking Go
    });

    function hideGoToPageContainer(event) {
        if (!goToPageContainer.contains(event.target) && !button.contains(event.target)) {
            goToPageContainer.classList.add('d-none');
            document.removeEventListener('click', hideGoToPageContainer); // Remove the event listener
        }
    }

    document.addEventListener('click', hideGoToPageContainer);

}

function handleCheckboxChange(event) {
    const checkBox = event.target;
    const testId = checkBox.value;
    if (checkBox.checked) {
        selectedTests.push(testId);
    } else {
        const index = selectedTests.indexOf(testId);
        if (index !== -1) {
            selectedTests.splice(index, 1);
        }
    }
    const selectAllLabel = document.getElementById('select-all-label')
    const totSelectedTests = selectedTests.length;
    selectAllLabel.textContent = "Select All"
    if (totSelectedTests != 0) {
        selectAllLabel.textContent = "Selected " + totSelectedTests
    }

    manageAllTestsSelectedForAPage();

}

function manageAllTestsSelectedForAPage() {
    const selectAllTestCB = document.getElementById('select-all-cb')
    if (currPageTests.every(value => selectedTests.includes(value))) {
        selectAllTestCB.checked = true;
    } else {
        selectAllTestCB.checked = false;
    }
}
function showDetails() {

}

// From ChatGPT
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let formatted = "";
    if (hours > 0) {
        formatted = `${hours}h`;
    }
    if (minutes > 0) {
        if (formatted !== "") {
            formatted += " "
        }
        formatted += `${minutes}m`;
    }
    if (remainingSeconds > 0) {
        if (formatted !== "") {
            formatted += " "
        }
        formatted += `${remainingSeconds}s`;
    }
    return formatted;
}

function formatMarks(marks) {
    var formatted = `${marks}`
    if (marks == 1) {
        return formatted + " mark"
    }
    return formatted + " marks"
}