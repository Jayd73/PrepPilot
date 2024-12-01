# PrepPilot: An Online Platform to Create and Take Mock Tests

#### Video Demo: [PrePilot Demonstration](https://www.youtube.com/watch?v=Zl5sDcCO_As)

## Description:

PrepPilot is an all-in-one platform for creating, taking, and managing tests, quizzes, and trivia, offering an easy-to-use test-taking experience with detailed result analysis and comprehensive management tools for users and authors

Users can view the details for all the tests they have taken, and details regarding all their attempts in the 'Attempted Tests' section. They can also delete any of your attempt records for a particular test. Test authors can view their created tests in the 'Created Tests' section and edit or delete them.

## Technologies used:

Frontend: HTML, CSS, Bootstrap and JavaScript\
Backend: Python-Flask, SQLite database

## Project structure:

```bash
app/
├── static/                # Contains all static files
│   ├── images/            # Contains app logo and other images used in the web app
│   ├── javascript/        # Contains JavaScript files associated with each html file
│   ├── style/             # Contains CSS files associated with each html file
│   └── uploads/           # Contains images uploaded by users
├── templates/             # Contains all HTML files for the application
├── app.db                 # SQLite database storing application data
├── config.py              # Contains backend configurations for the application
├── models.py              # Defines database models and their relationships
├── routes.py              # Contains backend business logic and route handling
└── helpers.py             # Contains reusable helper functions for the app
```

## Functionality:

- User registration:

  - New users can register with an email and set their username and password which are stored in hashed format in the database
  - They can check the box `Register as test author` which allows them to create tests
  - Users can login using their username or email and password
  - Data for the logged-in user is stored in a session

- Dashboard:

  - After logging in, users are taken to the dashboard
  - In the sidebar, there are 2 sections visible to all users:
    - `All Tests` displays all available tests on the platform
    - `Attempted Tests` displays records for all the tests that the user had attempted
  - If, registered as a test author, users can see:
    - `Create Test` button at the top
    - `Created Tests` section which displays all the tests created by the user
  - Users can navigate through different pages using the pagination buttons provided in the top right
  - Pagination is implemented in the backend as well. Test details are sent from the server based on the page number requested
  - The top bar displays currently logged-in user's username and their avatar. Clicking on the avatar opens a pop up box from where users can change their avatar or logout
  - The top bar also contains search box along with various filter and sort options

- Test creation:

  - Test authors can create a new test by clicking on the `Create Test` button
  - In the test editor page, authors can provide the title, description, topic, duration and marks for the test
  - Authors have 2 buttons to add a question:
    - `MCQ` button adds a question with multiple options for answers
    - `Response Question` button adds a question with text input for an answer from the test taker
  - Authors can edit the question text, add 2 or more options with one or more options marked as correct for MCQ questions
  - Authors can edit marks for a specific question, attach an image to a question and shift the question up or down in the order
  - Authors can also delete a created question or an option for MCQ question
  - After saving the tests, created test is visible in the `ALl Tests` and `Created Tests` section in the dashboard
  - Created test is visible to all the users on the web app
  - Authors can edit or delete their created tests (individually or in bulk) from the `Created Tests` section on the dashboard

- Taking the Test:

  - Users can view view test details by clicking on the test which opens a modal containing all the details specified by the author along with last updated / created time, the author's username and a `Take Test` button
  - Clicking on `Take Test` button fetches the complete test with question and answer data from the server. User can then start the test by clicking the `Start Test` button
  - In the test interface, users can see the test details, current question and answer input, countdown timer and question palette for navigating through different questions
  - Users can save and answer for a questions or mark it for a review later. Unanswered and unmarked questions are highlighted in red.
  - Users can submit the test by clicking the `Submit Test` button. The test is automatically submitted if the time runs out
  - On clicking the submit button, a pop up boxes opens up showing number of unsaved questions if there are any unsaved questions. Only saved questions are considered for evaluation.

- Result analysis:

  - After submitting the test, the user can view the test results displayed on the result screen
  - The result includes marks obtained, total marks, percentage, an total time taken for the test
  - It also displays `Accuracy` calculated as `No. of correct answers / No. of attempted questions` and average time spent per question.
  - A doughnut chart is displayed which shows the amount of correct, incorrect and attempted questions

- Attempted tests:
  - Users can view details regarding their test attempts in the `Attempted Tests` section
  - Details are shown test-wise. Clicking on a record / row shows a modal which contains following details:
    - Number of times the test has been attempted
    - Best score so far with percentage
    - Best time so far
    - The time on which best score was achieved
    - The time on which test was last attempted
  - Users can delete their attempt records (individually or in bulk) from here
  - If an attempted test is deleted by the author, that info is shown for that test record in the `Attempted Tests` section

## Backend safeguards:

- Server side validations have been implemented
- Implemented checks which only allows the created / author of the test to edit or delete the test
