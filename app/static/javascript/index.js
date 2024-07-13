var perPageRecords = 2;
var selectedTestIds = new Set();
var currPageTestIds = [];
var currTestType;
var currPageNum;
var currClickedTestId;
var lastSelectedSortOptBtn;
var sort_by = null;
var sort_order = null;


document.addEventListener('DOMContentLoaded', () => {
    const createTestBtns = document.querySelectorAll('.create-test-btn');
    createTestBtns.forEach(button => button.addEventListener('click', () => {
        window.location.href = "/test-editor"
    }));

    currTestType = "all"
    currPageNum = 1
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => button.addEventListener('click', handleTabBtnClick));

    activateTabBtn(currTestType);
    fetchTests(currTestType, currPageNum, perPageRecords);

    document.getElementById('select-all-cb').addEventListener('change', (event) => {
        
        const isChecked = event.target.checked;
        const testCheckboxes = document.querySelectorAll('input[id^="test-select"]');

        testCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
            handleCheckboxChange({
                target: checkbox
            });
        });
    })

    // Search bar set up
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    handleScreenWidthChange(mediaQuery);
    mediaQuery.addEventListener('change', handleScreenWidthChange);

    document.getElementById('sort-btn').addEventListener('click', () => {
        hideDropdownOnBtnClick('sort-options-btn')
    })

    document.getElementById('filter-search-btn').addEventListener('click', () => {
        hideDropdownOnBtnClick('filter-btn')
    })

    document.getElementById('sort-opt-btns-list').addEventListener('click', (event) => {
        event.stopPropagation()
    })

    document.getElementById('search-and-filter-options').addEventListener('click', (event) => {
        event.stopPropagation()
    })
    
    document.getElementById('delete-confirm-btn').addEventListener('click', deleteRecord)
    document.getElementById('bulk-delete-confirm-btn').addEventListener('click', bulkDeleteRecords)
    document.getElementById('update-test-btn-modal').addEventListener('click', () => {
        window.location.href = `/test-editor?test_id=${currClickedTestId}`
    })

    const searchInp = document.getElementById('search-inp')
    searchInp.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            if (document.activeElement === searchInp) {
                refetchData();
            }
        }
    });

});

// Help from ChatGPT
function handleScreenWidthChange(e) {
    const sbContainerLongWidth = document.getElementById('search-bar-container-long-width');
    const sbContainerShortWidth = document.getElementById('search-bar-container-short-width');
    const sbMainContainer = document.getElementById('main-search-bar-container');

    if (e.matches) {
      // Screen width is below the threshold, move child to div2
      if (sbMainContainer.parentNode === sbContainerLongWidth) {
        sbContainerShortWidth.appendChild(sbMainContainer);
      }
    } else {
      // Screen width is above the threshold, move child back to div1
      if (sbMainContainer.parentNode === sbContainerShortWidth) {
        sbContainerLongWidth.appendChild(sbMainContainer);
      }
    }
}

function hideDropdownOnBtnClick(dropdownToggleBtnId) {
    const dropdownToggleButton = document.getElementById(dropdownToggleBtnId);
    const dropdown = bootstrap.Dropdown.getInstance(dropdownToggleButton);
    dropdown.hide();
}

// help from ChatGPT
function toggleSortOptBtn(selectedSortOptBtn) {
    const currState = selectedSortOptBtn.getAttribute('data-state')

    const neutralIconClass = 'bi-chevron-expand'
    const incrIconClass = 'bi-caret-up-fill'
    const decrIconClass = 'bi-caret-down-fill'

    const neutralState = "neutral"
    const incrState = "increasing"
    const decrState = "decreasing"

    if (lastSelectedSortOptBtn && lastSelectedSortOptBtn !== selectedSortOptBtn) {
        const iconElement = lastSelectedSortOptBtn.querySelector('i')
        lastSelectedSortOptBtn.setAttribute('data-state', neutralState);
        iconElement.classList.remove(incrIconClass, decrIconClass);
        iconElement.classList.add(neutralIconClass);
    }

    const iconElement = selectedSortOptBtn.querySelector('i')
    sort_by = selectedSortOptBtn.getAttribute('data-sort-by')
    if (currState === neutralState) {
        selectedSortOptBtn.setAttribute('data-state', incrState);
        iconElement.classList.remove(neutralIconClass);
        iconElement.classList.add(incrIconClass);
        sort_order = "asc"
    } else if (currState === incrState) {
        selectedSortOptBtn.setAttribute('data-state', decrState);
        iconElement.classList.remove(incrIconClass);
        iconElement.classList.add(decrIconClass);
        sort_order = "desc"
    } else {
        selectedSortOptBtn.setAttribute('data-state', neutralState);
        iconElement.classList.remove(decrIconClass);
        iconElement.classList.add(neutralIconClass);
        sort_by = null;
        sort_order = null;
    }

    lastSelectedSortOptBtn = selectedSortOptBtn;
}

function handleTabBtnClick(event) {
    document.querySelectorAll('.tab-btn').forEach(button => button.classList.remove('active-tab-btn'));
    const sideBarInstance = bootstrap.Offcanvas.getInstance(document.getElementById('sidebarOffcanvas')) 
    const testType = event.target.dataset.type;
    const hiddenComps = document.querySelectorAll('.hidden-component');

    if (sideBarInstance) {
        sideBarInstance.hide()
    }

    currTestType = testType
    currPageNum = 1
    selectedTestIds = new Set()
    document.getElementById('select-all-label').textContent = "Select All"


    hiddenComps.forEach(hiddenComp => {
        if (testType === "attempted" || testType === "created") {
            hiddenComp.style.visibility = 'visible'
            hiddenComp.style.pointerEvents = 'auto'
        } else {
            hiddenComp.style.visibility = 'hidden'
            hiddenComp.style.pointerEvents = 'none'
        }
    });

    const deleteBtn = document.getElementById('delete-btn-modal')
    const updateBtn = document.getElementById('update-test-btn-modal')
    const extraSortOptContainer = document.getElementById('attempted-tab-sort-opt-container')
    const extraFilterOptContainer = document.getElementById('attempts-filter-options')

    updateBtn.style.display = 'none'
    if (testType === "attempted") {
        deleteBtn.innerHTML = `<i class="bi bi-trash-fill"></i> Delete Record`
        extraSortOptContainer.style.display = 'block'
        extraFilterOptContainer.style.display = 'block'
    }
    else if (testType === "created") {
        deleteBtn.innerHTML = `<i class="bi bi-trash-fill"></i> Delete Test`
        updateBtn.style.display = 'block'
        extraSortOptContainer.style.display = 'none'
        extraFilterOptContainer.style.display = 'none'
    }
    else if (testType === "all") {
        extraSortOptContainer.style.display = 'none'
        extraFilterOptContainer.style.display = 'none'
    }
    
    activateTabBtn(testType)
    fetchTests(currTestType, currPageNum, perPageRecords)
}

function activateTabBtn(testType) {
    document.querySelectorAll(`button[data-type="${testType}"]`).forEach(button => {
        button.classList.add('active-tab-btn');
    });
}

function fetchTests(testType, page, perPage) {
    const cbSearchTitle = document.getElementById('cb-search-in-title');
    const cbSearchSubject = document.getElementById('cb-search-in-subject');
    const cbSearchDescription = document.getElementById('cb-search-in-description');
    const search_text = getValueOrNull('search-inp')

    let searchInTitle = cbSearchTitle.checked;
    let searchInSubject = cbSearchSubject.checked;
    let searchInDescription = cbSearchDescription.checked;

    if (search_text && !searchInTitle && !searchInSubject && !searchInDescription) {
        searchInTitle = true; 
    }
    
    const filterData = {
        search_text: search_text,
        search_in_title: searchInTitle,
        search_in_subject: searchInSubject,
        search_in_description: searchInDescription,
        marks_lower: getValueOrNull('lower-lim-marks'),
        marks_upper: getValueOrNull('upper-lim-marks'),
        creation_start: convertToGlobalTime('lower-lim-created-on'),
        creation_end: convertToGlobalTime('upper-lim-created-on'),
        updated_start: convertToGlobalTime('lower-lim-updated-on'),
        updated_end: convertToGlobalTime('upper-lim-updated-on'),

        duration_lower: timeToDuration(
            document.getElementById('lower-lim-dur-hr').value,
            document.getElementById('lower-lim-dur-min').value,
            document.getElementById('lower-lim-dur-sec').value,
        ),
        duration_upper: timeToDuration(
            document.getElementById('upper-lim-dur-hr').value,
            document.getElementById('upper-lim-dur-min').value,
            document.getElementById('upper-lim-dur-sec').value,
        ),

        sort_options: {
            sort_by: sort_by,
            sort_order: sort_order
        },

        page: page,
        per_page: perPage,
        type: testType
    }

    if (testType == "attempted") {
        filterData.attempts_lower = getValueOrNull('lower-lim-attempts')
        filterData.attempts_upper = getValueOrNull('upper-lim-attempts')
        filterData.best_score_perc_lower = getValueOrNull('lower-lim-best-score-perc')
        filterData.best_score_perc_upper = getValueOrNull('upper-lim-best-score-perc')
        filterData.best_score_time_perc_lower = getValueOrNull('lower-lim-best-score-time-perc')
        filterData.best_score_time_perc_upper = getValueOrNull('upper-lim-best-score-time-perc')
        filterData.last_attempted_lower = convertToGlobalTime('lower-lim-last-attempt-on')
        filterData.last_attempted_upper = convertToGlobalTime('upper-lim-last-attempt-on')
    }

    fetch(`/tests`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(filterData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('select-all-cb').checked = false
        currPageNum = data.current_page
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

    currPageTestIds = []
    tests.forEach(test => {
        currPageTestIds.push(test.id.toString())
        const testRow = document.createElement('div');
        let titleColClass = 'col-lg-5'
        let subjectColClass = 'col-lg-2'
        let marksColClass = 'col-lg-3'
        let durationColClass = 'col-lg-2'
        let checkBox = ''
        let isTestDeleted = false

        if (testType === 'attempted' || testType === 'created') {
            if (testType === 'attempted') {
                titleColClass = 'col-lg-4'
                marksColClass = 'col-lg-1'
            }
            
            const checked = selectedTestIds.has(test.id.toString()) ? 'checked' : ''
            checkBox = `<input class="form-check-input" type="checkbox" id="test-select-${test.id}" value="${test.id}" style = "transform: scale(1.2); margin-left: 4px" onchange="handleCheckboxChange(event)" onclick="event.stopPropagation()" ${checked}> &nbsp;`
        }

        testRow.className = 'row test-row light-bg fs-6 ms-1 mb-1';
        if (!test.title) {
            isTestDeleted = true
            test.title = `[Test Deleted] - Last Attempt on ${convertAndFormatToLocalTime(test.last_attempted_start_time)}`
            testRow.innerHTML = `
            <div class="col-lg-9 text-muted text-col-content test-title">
                <div style="overflow: hidden;">
                    ${checkBox}
                    ${test.title}
                </div>
            </div>
            `
        }
        else {
            testRow.innerHTML = `
            <div class="${titleColClass} text-col-content test-title">
                <div style="overflow: hidden;">
                ${checkBox}
                ${test.title}
                </div>
            </div>
            <div class="${subjectColClass} subject-container d-flex justify-content-start" style="overflow: hidden;">
                <div class="primary-col-2 text-col-content test-subject">
                    ${test.subject}
                </div>
            </div>
            
            <div class="${marksColClass} col-md-6 col-sm-6 text-col-content test-marks">
                <i class="bi bi-check2-circle"></i>
                ${formatMarks(test.total_marks)}
            </div>
            <div class="${durationColClass} col-md-6 col-sm-6 text-col-content test-duration">
                <i class="bi bi-hourglass-top"></i>
                ${formatDuration(test.duration_seconds)}
            </div>
        `;
        }
        
        if (testType === 'attempted') {
            testRow.innerHTML += `
                <div class="col-lg-2 text-col-content test-attempt">
                    <i class="bi bi-bar-chart-fill"></i>
                    Attempts: ${toTwoDigitFormat(test.attempts)}
                </div>
                `
            const btnContainer = document.createElement('div')
            const detailsButton = document.createElement('button');
            btnContainer.className = 'col-lg-1'
            detailsButton.className = 'btn secondary-col-1 attempt-details-btn';
            detailsButton.innerHTML = '<i class="bi bi-info-circle"></i> Details';
            detailsButton.addEventListener('click', (event) => showAttemptDetails(event, test, isTestDeleted));
            btnContainer.appendChild(detailsButton)
            testRow.appendChild(btnContainer);
        }

        testRow.addEventListener('click', (event) => {
            const modal = new bootstrap.Modal(document.getElementById('test-detail-modal'));
            const testDescDiv = document.getElementById('test-description-modal')
            const testExtraDetailsContainer = document.getElementById('test-extra-details')
            const testTitle = document.getElementById('test-title-modal')
            const testSubject = document.getElementById('test-subject-modal')
            const testMarks = document.getElementById('test-marks-modal')
            const testDuration = document.getElementById('test-duration-modal')
            const takeTestBtn = document.getElementById('take-test-btn-modal')
            const testDetailModalTitle = document.getElementById('test-detail-title')
            
            currClickedTestId = test.id

            testMarks.innerHTML = `<i class="bi bi-check2-circle"></i> `
            testDuration.innerHTML = `<i class="bi bi-hourglass-top"></i> `
            testTitle.textContent = test.title

            if (isTestDeleted) {
                testExtraDetailsContainer.style.display = "none"
                testTitle.classList.add('text-muted')
                testSubject.innerHTML = "Not Available"
                testMarks.innerHTML += "Not available"
                testDuration.innerHTML += "Not Available"
                takeTestBtn.disabled = true;
                modal.show()
                return
            }

            takeTestBtn.disabled = false
            testExtraDetailsContainer.style.display = "block"
            document.getElementById('test-attempt-details').style.display = "none"
            document.getElementById('test-details-modal-footer').classList.remove("d-none")
            document.getElementById('test-modal-dialog').classList.add('modal-lg')
            document.getElementById('test-marks-modal').classList.add('col-md-3')
            document.getElementById('test-marks-modal').classList.remove('col-md-5')
            testDetailModalTitle.innerHTML = `Test Details`
            testTitle.classList.remove('text-muted')

            if ((testType == "attempted" || testType == "all") && test.test_has_been_updated) {
                testDetailModalTitle.innerHTML += `&nbsp;<span class="badge text-bg-secondary">Test Updated</span>`
            }



            if (test.description !== "") {
                testDescDiv.style.display = 'block'
                testDescDiv.textContent = test.description
            }
            
            
            testSubject.textContent = test.subject
            testMarks.innerHTML += `${formatMarks(test.total_marks)}`
            testDuration.innerHTML += `${formatDuration(test.duration_seconds)}`
            document.getElementById('test-last-updated-time-modal').innerHTML = `${convertAndFormatToLocalTime(test.last_updated)}`
            document.getElementById('test-author-modal').innerHTML = `${test.author_details.username}`
            

            if (test.author_details.avatar_url)
                document.getElementById('author-avatar-modal').src = test.author_details.avatar_url

            modal.show();
        
        });
        
        
        testListContainer.appendChild(testRow);
    });
    if (testType === "attempted" || testType === "created") manageAllTestsSelectedForAPage()
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
        selectedTestIds.add(testId);
    } else {
        if (selectedTestIds.has(testId)) {
            selectedTestIds.delete(testId);
        }
    }
    const selectAllLabel = document.getElementById('select-all-label')
    const totSelectedTests = selectedTestIds.size;
    selectAllLabel.textContent = "Select All"
    if (totSelectedTests != 0) {
        selectAllLabel.textContent = "Selected " + totSelectedTests
    }
    manageAllTestsSelectedForAPage();
}

function manageAllTestsSelectedForAPage() {
    const selectAllTestCB = document.getElementById('select-all-cb')
    if (currPageTestIds.every(value => selectedTestIds.has(value))) {
        selectAllTestCB.checked = true;
    }
    else {
        selectAllTestCB.checked = false;
    }
}

function showAttemptDetails(event, test, isTestDeleted) {
    event.stopPropagation()
    const modal = new bootstrap.Modal(document.getElementById('test-detail-modal'));

    document.getElementById('test-extra-details').style.display = "none"
    document.getElementById('test-attempt-details').style.display = "block"
    document.getElementById('test-details-modal-footer').classList.add("d-none")
    document.getElementById('test-modal-dialog').classList.remove('modal-lg')
    document.getElementById('test-marks-modal').classList.remove('col-md-3')
    document.getElementById('test-marks-modal').classList.add('col-md-5')
    document.getElementById('test-detail-title').innerHTML = `Attempt Details`

    const modalTestTitleContainer = document.getElementById('test-title-modal')
    const modalSubjectContainer = document.getElementById('test-subject-modal')
    const modalMarksContainer = document.getElementById('test-marks-modal')
    const modalDurationContainer = document.getElementById('test-duration-modal')

    modalTestTitleContainer.textContent = test.title

    modalSubjectContainer.style.display = 'block'
    modalMarksContainer.style.display = 'block'
    modalDurationContainer.style.display = 'block'
    modalTestTitleContainer.classList.remove('text-muted')

    
    if (!isTestDeleted) {
        modalSubjectContainer.textContent = test.subject
        modalMarksContainer.innerHTML = `<i class="bi bi-check2-circle"></i> ${formatMarks(test.total_marks)}`
        modalDurationContainer.innerHTML = `<i class="bi bi-hourglass-top"></i> ${formatDuration(test.duration_seconds)}`
    }
    else {
        modalTestTitleContainer.classList.add('text-muted')
        modalSubjectContainer.style.display = 'none'
        modalMarksContainer.style.display = 'none'
        modalDurationContainer.style.display = 'none'
    }
    
    document.getElementById('test-attempts-modal').innerHTML = `<i class="bi bi-bar-chart-fill"></i> Attempts: ${toTwoDigitFormat(test.attempts)}`
    document.getElementById('test-last-attempted-time-modal').innerHTML = `${convertAndFormatToLocalTime(test.last_attempted_start_time)}`
    document.getElementById('test-best-score-modal').innerHTML = `<i class="bi bi-trophy-fill"></i> Best: ${formatMarks(test.best_score)}`
    document.getElementById('test-best-score-perc-modal').innerHTML = `<i class="bi bi-award-fill"></i> <b style="color: green">${formatPerc(test.best_score, test.total_marks)}</b>`
    document.getElementById('test-best-score-duration-modal').innerHTML = `<i class="bi bi-hourglass-bottom"></i> Best score time: ${formatDuration(test.best_score_duration_seconds)}`
    document.getElementById('test-best-score-achieved-time-modal').innerHTML = `${convertAndFormatToLocalTime(test.best_score_attempt_start_time)}`
    
    modal.show();

}

function formatMarks(marks) {
    var formatted = `${toTwoDigitFormat(marks)}`
    if (marks == 1) {
        return formatted + " mark"
    }
    return formatted + " marks"
}

function formatPerc(marks, totMarks) {
    let percentage = "🚫"
    if (!totMarks || totMarks === 0) {
        return percentage
    }

    percentage = (marks / totMarks) * 100;
    let formattedPercentage;

    if (percentage % 1 === 0) {
        formattedPercentage = percentage.toString();
    } else {
        formattedPercentage = percentage.toFixed(2);
    }

    return formattedPercentage + "%"
}

function convertAndFormatToLocalTime(dateString) {
    // Parse the date string
    const date = new Date(dateString);

    // Get the local time components
    const options = {
        weekday: 'short', 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true
    };

    // Format the date to the desired local format
    const formattedDate = date.toLocaleString('en-US', options).replace(' AM', ' a.m.').replace(' PM', ' p.m.');
    return formattedDate;
}

function deleteRecord() {
    bootstrap.Modal.getInstance(document.getElementById("deleteConfirmationModal")).hide();
    if (currTestType === "created") {
        fetch(`/tests/${currClickedTestId}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            showToastMessage("Test deleted successfully", "success")
            fetchTests(currTestType, currPageNum, perPageRecords)
        })
        .catch(error => {
            console.error('Error fetching test data:', error);
        });
    }
    else if (currTestType === "attempted") {
         fetch(`/tests/attempt/${currClickedTestId}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            showToastMessage("Attempt record deleted successfully", "success")
            fetchTests(currTestType, currPageNum, perPageRecords)
        })
        .catch(error => {
            console.error('Error fetching test data:', error);
        });
    }
}


function bulkDeleteRecords() {
    bootstrap.Modal.getInstance(document.getElementById("deleteAllConfirmationModal")).hide();
    const selectAllBtn = document.getElementById('select-all-label')
    if (currTestType === "created") {
        fetch(`/tests/bulk-delete`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({test_ids: Array.from(selectedTestIds)})
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            const totTestsDeleted = selectedTestIds.size
            var testWord = "Test"
            if (totTestsDeleted > 1) testWord = "Tests" 
            showToastMessage(totTestsDeleted.toString() + " " + testWord + " deleted successfully", "success")
            selectAllBtn.textContent = "Select All"
            fetchTests(currTestType, currPageNum, perPageRecords)
        })
        .catch(error => {
            console.error('Error fetching test data:', error);
        });
    }
    else if (currTestType === "attempted") {
        fetch(`/tests/attempt/bulk-delete`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({test_ids: Array.from(selectedTestIds)})
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            const totAttemptRecordsDeleted = selectedTestIds.size;
            const word = totAttemptRecordsDeleted > 1 ? "Attempt records" : "Attempt record";
            showToastMessage(`${totAttemptRecordsDeleted} ${word} deleted successfully`, "success");
            selectAllBtn.textContent = "Select All"
            fetchTests(currTestType, currPageNum, perPageRecords)
        })
        .catch(error => {
            console.error('Error fetching test data:', error);
        });
    }
}

function clearFilter() {
    document.getElementById('filter-form').reset();
}

function getValueOrNull(elementId) {
    const value = document.getElementById(elementId).value;
    return value === '' ? null : value;
}

function convertToGlobalTime(inpId) {
    const localTime = getValueOrNull(inpId)
    if (localTime) {
        return new Date(localTime).toISOString();
    }
    return localTime
}

function refetchData() {
    fetchTests(currTestType, currPageNum, perPageRecords)
}



