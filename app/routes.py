from flask import flash, redirect, render_template, url_for, send_from_directory, session, jsonify, request, current_app as app
from . import db, USER_ID, ROLE
from .models import User, Subject, Test, Question, QuestionOption, UserTest, TYPE_REGULAR_USER, TYPE_ADMIN, QTYPE_MCQ, QTYPE_MSQ, QTYPE_RESP
from .helpers import login_required, admin_privilege_required, check_password_hash, generate_hash, get_structured_inp_ids, safe_int, delete_existing_file
import os
from datetime import datetime
from sqlalchemy import func, exists


GET = 'GET'
POST = 'POST'
PUT = 'PUT'
DELETE = 'DELETE'

SUCCESS_MSG = "success"
FAILURE_MSG = "error"
WARNING_MSG = "warning"
NORMAL_MSG = "message"

SUCCESS = "success"
ERROR = "error"

@app.route('/', methods=[GET])
@login_required
def index():
    subquery = db.session.query(Test.id).subquery()
    count = db.session.query(func.count(UserTest.id)).filter(
        UserTest.user_id == session.get(USER_ID),
        ~UserTest.test_id.in_(subquery)
    ).scalar()
    if count > 0:
        flash(f'{count} of your attempted tests have been deleted', NORMAL_MSG)
    return render_template("index.html")

@app.route("/register", methods=[GET, POST])
def register():
    if request.method == "POST":
        session.clear()
        uname = request.form.get("username")
        email = request.form.get("email")
        passwd = request.form.get("password")
        user_role = TYPE_ADMIN if request.form.get("is_admin") == 'on' else TYPE_REGULAR_USER

        if not uname:
            return jsonify({ERROR: 'No username received'}), 400
        
        elif not passwd:
            return jsonify({ERROR: 'No password received'}), 400
        
        elif not email:
            return jsonify({ERROR: 'No email address received'}), 400

        user = User.query.filter_by(username = uname).first()
        if user:
            return jsonify({ERROR: 'Username already exists'}), 409

        user = User.query.filter_by(email = email).first()
        if user:
            return jsonify({ERROR: 'Email already exists'}), 409

        new_user = User(username = uname, email = email, password_hash = generate_hash(passwd), role = user_role)
        db.session.add(new_user)
        db.session.commit()

        session[USER_ID] = new_user.id
        session[ROLE] = new_user.role
        return jsonify({SUCCESS: 'User registered successfully'}), 201
    
    else:
        if session.get(USER_ID):
            return redirect("/")
        return render_template("register.html")

@app.route("/login", methods=[GET, POST])
def login():
    if request.method == "POST":
        session.clear()
        uname = request.form.get("username")
        email = request.form.get("email")
        passwd = request.form.get("password")
        user = None

        if not uname and not email:
            return jsonify({ERROR: 'No username or email address received'}), 400
        
        elif not passwd:
            return jsonify({ERROR: 'No password received'}), 400
        
        if uname:
            user = User.query.filter_by(username = uname).first()
        elif email:
            user = User.query.filter_by(email = email).first()

        if not user or not check_password_hash(user.password_hash, request.form.get("password")):
            return jsonify({ERROR: 'Invalid credentials'}), 401

        session[USER_ID] = user.id
        session[ROLE] = user.role
        return jsonify({SUCCESS: 'User logged in successfully'}), 200
    else:
        if session.get(USER_ID):
            return redirect("/")
        return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    return redirect("/login")

@app.route('/test-editor', methods=[GET])
@login_required
@admin_privilege_required
def display_test_editor():
    update_test_id = request.args.get('test_id')
    if update_test_id and type(update_test_id) == str:
        if update_test_id.isdigit():
            update_test_id = int(update_test_id)
        else:
            jsonify({ERROR: "Not a valid value for test id"}), 400

    return render_template("test_editor.html", update_test_id = update_test_id) 

# Took help from ChatGPT
@login_required
@app.route('/tests', methods=[GET])
def provide_test_details():
    test_type = request.args.get('type', 'all')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per-page', 50))
    
    user_id = session.get(USER_ID)

    if test_type == 'all':
        pagination = Test.query.paginate(page=page, per_page=per_page, error_out=False)
    elif test_type == 'attempted':
        pagination = UserTest.query.filter_by(user_id=user_id).paginate(page=page, per_page=per_page, error_out=False)
    elif test_type == 'created':
        pagination = Test.query.filter_by(created_by=user_id).paginate(page=page, per_page=per_page, error_out=False)
    else:
        return jsonify({ERROR: "Invalid query argument provided for fetching test details"}), 400
    
    if page > pagination.pages:
        return jsonify({
                            'tests': [],
                            'total_pages': pagination.pages,
                            'current_page': None
                        }), 200
    
    tests_data = []
    if test_type == 'attempted':
        user_tests = pagination.items
        tests = [Test.query.get(user_test.test_id) for user_test in user_tests]

        for user_test, test in zip(user_tests, tests):
            test_data = {
                'id' : user_test.test_id,
                'attempts' : user_test.attempts,
                'last_attempted_start_time' : user_test.last_attempted_start_time,
                'best_score' : user_test.best_score,
                'best_score_attempt_start_time' : user_test.best_score_attempt_start_time,
                'best_score_duration_seconds' :  user_test.best_score_duration_seconds
            }
            if test: add_test_details_to_dict(test, test_data)
            tests_data.append(test_data)

    else:
        tests = pagination.items
        for test in tests:
            test_data = {}
            add_test_details_to_dict(test, test_data)
            tests_data.append(test_data)
        
    return jsonify({
        'tests': tests_data,
        'total_pages': pagination.pages,
        'current_page': pagination.page
    }), 200


@app.route('/tests', methods=[POST])
@login_required
@admin_privilege_required
def create_test():
    test_form = request.form
    if not any(inp_name_id.startswith("question") for inp_name_id in test_form.keys()):
        flash("Empty test discarded", WARNING_MSG)
        return jsonify({SUCCESS: 'Empty test discarded'}), 200
    
    # New Test creation
    test_title = test_form.get("test-title").strip()
    test_desc = test_form.get("test-description").strip()
    test_subject = test_form.get("test-subject").strip()
    test_dur_hr = safe_int(test_form.get("test-duration-hr"))
    test_dur_min = safe_int(test_form.get("test-duration-min"))
    test_dur_sec = test_dur_hr * 60 * 60 + test_dur_min * 60 + safe_int(test_form.get("test-duration-sec"))

    subject = Subject.query.filter_by(name = test_subject).first()
    if not subject:
        new_subject = Subject(name = test_subject)
        db.session.add(new_subject)
        db.session.commit()
        subject = new_subject

    new_test = Test (
                        subject_id = subject.id,
                        title = test_title, 
                        description = test_desc, 
                        duration_seconds = test_dur_sec,
                        created_by = session[USER_ID]
                    )
    
    db.session.add(new_test)
    db.session.commit()

    add_questions_to_test(test_form, new_test)

    flash("Test created successfully", SUCCESS_MSG)
    return jsonify({SUCCESS: 'Test created and saved successfully'}), 200


@login_required
@app.route('/tests/<int:test_id>', methods=[GET])
def provide_test(test_id):
    test = Test.query.get(test_id)
    if not test: return jsonify({ERROR : "Test with given id doesn't exist"}), 404

    test_data = {}
    add_test_details_to_dict(test, test_data)
    test_data['questions'] = []

    # questions = Question.query.filter_by(test_id=test_id).all()
    
    for question in test.questions:
        question_image_url = None
        
        if question.image_path:
            question_image_url = url_for('provide_question_image_file', filename=question.image_path.split('\\')[-1])

        question_data = {
            'id': question.id,
            'question_text': question.question_text,
            'question_type': question.question_type,
            'marks_pos': question.marks_pos,
            'marks_neg': question.marks_neg,
            'image_path': question_image_url,
            'options': []
        }

        options = QuestionOption.query.filter_by(question_id=question.id).all()
        for option in options:
            option_data = {
                'id': option.id,
                'option_text': option.option_text,
                'is_correct': option.is_correct
            }
            question_data['options'].append(option_data)
        test_data['questions'].append(question_data)
    
    return jsonify(test_data), 200

@login_required
@admin_privilege_required
@app.route('/tests/<int:test_id>', methods=[PUT])
def update_test(test_id):
    test = Test.query.get(test_id)
    if not test: return jsonify({ERROR : "Test with given id doesn't exist"}), 404
    if test.created_by != session.get(USER_ID): return jsonify({ERROR : "Unauthorized action - Updation refused"}), 403

    test.title = request.form.get("test-title").strip()
    test.description = request.form.get("test-description").strip()
    test_subject = request.form.get("test-subject".strip())
    test_dur_hr = safe_int(request.form.get("test-duration-hr"))
    test_dur_min = safe_int(request.form.get("test-duration-min"))
    test.duration_seconds = test_dur_hr * 60 * 60 + test_dur_min * 60 + safe_int(request.form.get("test-duration-sec"))

    if not Subject.query.get(test.subject_id).name == test_subject:
        delete_subject_if_not_shared(test)

    subject = Subject.query.filter_by(name = test_subject).first()
    if not subject:
        new_subject = Subject(name = test_subject)
        db.session.add(new_subject)
        db.session.commit()
        subject = new_subject
    
    test.subject_id = subject.id

    questions = Question.query.filter_by(test_id=test_id).all()
    for question in questions:
        db.session.delete(question)
    db.session.commit()

    add_questions_to_test(request.form, test)
    test.last_updated = db.func.current_timestamp()

    db.session.commit()

    return jsonify({SUCCESS : "Test updated successfully"}), 200

@login_required
@admin_privilege_required
@app.route('/tests/<int:test_id>', methods=[DELETE])
def delete_test(test_id):
    test = Test.query.get(test_id)
    if not test: return jsonify({ERROR : "Test with given id doesn't exist"}), 404
    if test.created_by != session.get(USER_ID): return jsonify({ERROR : "Unauthorized action - Deletion refused"}), 403

    delete_subject_if_not_shared(test)

    db.session.delete(test)
    db.session.commit()

    return jsonify({SUCCESS: "Test deleted successfully"}), 200

# with help from ChatGPT
@login_required
@admin_privilege_required
@app.route('/tests/bulk-delete', methods=[POST])
def bulk_delete_tests():
    test_ids = request.json.get('test_ids', [])
    test_ids = [ int(test_id) for test_id in test_ids ]
    result = verify_test_ids_for_deletion(test_ids)
    if not result[-1]:
        return result[:2]
    
    # From ChatGPT
    # Identify subjects with only one test and test is among the ones to be deleted
    # Step 1: Subquery to count the number of tests for each subject_id in the given test_ids
    subquery = db.session.query(
        Test.subject_id,
        func.count(Test.id).label('count_in_list')
    ).filter(
        Test.id.in_(test_ids)
    ).group_by(
        Test.subject_id
    ).subquery()

    # Step 2: Main query to count the total number of tests for each subject_id in the entire table
    full_count_subquery = db.session.query(
        Test.subject_id,
        func.count(Test.id).label('total_count')
    ).group_by(
        Test.subject_id
    ).subquery()

    # Step 3: Join the subqueries and ensure the counts match
    exclusive_subjects = db.session.query(
        subquery.c.subject_id
    ).join(
        full_count_subquery,
        subquery.c.subject_id == full_count_subquery.c.subject_id
    ).filter(
        subquery.c.count_in_list == full_count_subquery.c.total_count
    ).all()

    # Extracting subject_ids from the result
    exclusive_subject_ids = [row.subject_id for row in exclusive_subjects]

    # Delete tests
    tests_to_delete = Test.query.filter(Test.id.in_(test_ids)).all()
    for test in tests_to_delete:
        db.session.delete(test)

    # Step 4: Delete the subjects with those subject IDs
    if exclusive_subject_ids:
        db.session.query(Subject).filter(
            Subject.id.in_(exclusive_subject_ids)
        ).delete(synchronize_session=False)
    
    db.session.commit()

    return jsonify({"SUCCESS": "Tests deleted successfully"}), 200



@login_required
@app.route('/tests/attempt/<int:test_id>', methods = [POST])
def add_test_attempt(test_id):
    test = Test.query.get(test_id)
    if not test: return jsonify({ERROR: "Test with the given id doesn't exist"}), 404
    user_id = session.get(USER_ID)
    test_attempt_time = datetime.fromisoformat(request.form.get("test_attempt_time"))
    test_score = safe_int(request.form.get("test_score"))
    test_duration_seconds = safe_int(request.form.get("test_duration"))

    user_test = UserTest.query.filter_by(test_id=test.id, user_id = user_id).first()
    if not user_test:
        new_user_test = UserTest(
                                    user_id = user_id,
                                    test_id = test_id,
                                    last_attempted_start_time = test_attempt_time,
                                    best_score_attempt_start_time = test_attempt_time,
                                    best_score_duration_seconds = test_duration_seconds,
                                    best_score = test_score,
                                    attempts = 1
                                )
        db.session.add(new_user_test)
        db.session.commit()
        return jsonify({"success": "Test attempt added successfully"}), 201
    
    user_test.last_attempted_start_time = test_attempt_time
    user_test.attempts += 1

    if user_test.best_score < test_score:
        user_test.best_score = test_score
        user_test.best_score_attempt_start_time = test_attempt_time
        user_test.best_score_duration_seconds = test_duration_seconds
    
    db.session.commit()
    return jsonify({"success": "Test attempt saved successfully"}), 200

@login_required
@app.route('/tests/attempt/<int:test_id>', methods = [DELETE])
def delete_user_test(test_id):
    user_test = UserTest.query.filter_by(test_id = test_id, user_id = session.get(USER_ID)).first()
    if not user_test: return jsonify({ERROR: "Cannot find requested attempt record"}), 404
    db.session.delete(user_test)
    db.session.commit()
    return jsonify({"success": "Attempt for given test deleted successfully"}), 200

@login_required
@app.route('/tests/attempt/bulk-delete', methods = [POST])
def bulk_delete_user_tests():
    test_ids = request.json.get('test_ids', [])
    test_ids = [ int(test_id) for test_id in test_ids ]
    result = verify_test_ids_for_deletion(test_ids, check_user = False)
    if not result[-1]:
        return result[:2]
    
    UserTest.query.filter(
        UserTest.user_id == session.get(USER_ID),
        UserTest.test_id.in_(test_ids)
    ).delete(synchronize_session=False)

    db.session.commit()

    return jsonify({"success": "Attempts for given tests deleted successfully"}), 200

@login_required
@app.route('/subjects', methods=[GET])
def search_subjects():
    query = request.args.get('query', '')
    if query:
        subjects = Subject.query.filter(Subject.name.ilike(f'%{query}%')).all()
        subjects_list = [subject.name for subject in subjects]
    else:
        subjects_list = []
    return jsonify(subjects_list)

# With help from ChatGPT
@login_required
@app.route('/uploads/user-avatars/<filename>')
def provide_user_avatar_file(filename):
    return send_from_directory(app.config['USER_AVATAR_UPLOAD_FOLDER'], filename)

@login_required
@app.route('/uploads/question-images/<filename>')
def provide_question_image_file(filename):
    return send_from_directory(app.config['QUESTION_IMG_UPLOAD_FOLDER'], filename)


@login_required
@app.route('/users/<identifier>', methods=[GET])
def provide_user_details(identifier):
    if identifier == 'current-user':
        user_id = session.get(USER_ID)
    else:
        try:
            user_id = int(identifier)
        except ValueError:
            return jsonify({ERROR: "Invalid user identifier"}), 400 
    user = User.query.get(user_id)
    avatar_url = None
    if user:
        if user.avatar_path:
            avatar_url = url_for('provide_user_avatar_file', filename=user.avatar_path.split('\\')[-1])
        return jsonify({"username": user.username, "email": user.email, "avatar_path": avatar_url}), 200
    return jsonify({ERROR: "No user found"}), 400


@login_required
@app.route('/users/current-user/avatar', methods=[POST])
def upload_user_avatar():
    if 'avatar' not in request.files:
        return jsonify({ERROR: 'No avatar file detected'}), 400
    file = request.files.get('avatar')
    if file:
        filename = file.filename
        user_id = session.get(USER_ID)
        unique_filename = f"{user_id}_{filename[:20]}"
        file_path = os.path.join(app.config['USER_AVATAR_UPLOAD_FOLDER'], unique_filename)
        delete_existing_file(user_id, app.config['USER_AVATAR_UPLOAD_FOLDER'])
        file.save(file_path)
        
        # Save the file path to the user's record in the database
        user = User.query.get(user_id)
        user.avatar_path = file_path
        db.session.commit()
        
        return jsonify({SUCCESS: 'File uploaded successfully!'}), 200

    return jsonify({ERROR: 'File upload failed'}), 500

def add_questions_to_test(test_form, test):
    tot_test_marks = 0
    question_data = get_structured_inp_ids(list(test_form.keys()) + list(request.files.keys()))
    print(question_data)
    for question_inp_data in question_data:
        question_text = test_form.get(question_inp_data['question'])
        question_marks_pos = safe_int(test_form.get(question_inp_data['marks_pos']))
        question_marks_neg = safe_int(test_form.get(question_inp_data['marks_neg']))
        question_type = QTYPE_RESP

        tot_test_marks += question_marks_pos
        
        if question_inp_data['options']:
            tot_correct_options = len([checked_box_ids for checked_box_ids in question_inp_data['options'].values() if checked_box_ids])
            if tot_correct_options == 1:
                question_type = QTYPE_MCQ
            else:
                question_type = QTYPE_MSQ
        
        new_question_prop = {
                                "test_id" : test.id, 
                                "question_text" : question_text, 
                                "question_type" : question_type,
                                "marks_pos" : question_marks_pos,
                                "marks_neg" : question_marks_neg
                            } 
        
        question_image = request.files.get(question_inp_data['image'])
        if question_image:
            max_id = db.session.query(func.max(Question.id)).scalar()
            prefix = (max_id or 0) + 1
            question_image_filename = f"{prefix}_{question_image.filename[:20]}"
            question_image_filepath = os.path.join(app.config['QUESTION_IMG_UPLOAD_FOLDER'], question_image_filename)
            question_image.save(question_image_filepath)
            new_question_prop["image_path"] = question_image_filepath
            
        new_question = Question(**new_question_prop)
        db.session.add(new_question)
        db.session.commit()

        # New QuestionOptionCreation
        new_option_prop = {"question_id" : new_question.id,}
        for option_inp_id, checkbox_inp_id in question_inp_data['options'].items():
            option_text = test_form.get(option_inp_id)
            is_correct = True if checkbox_inp_id else False
            new_option_prop["option_text"] = option_text
            new_option_prop["is_correct"] = is_correct
            new_option = QuestionOption(**new_option_prop)
            db.session.add(new_option)
            db.session.commit()
        
        # Response answer is added as a single option of a question, which by default makes it the only correct answer
        if question_inp_data['response']:
            resp_answer_text = test_form.get(question_inp_data['response'])
            new_option_prop["option_text"] = resp_answer_text
            new_option_prop["is_correct"] = True
            new_option = QuestionOption(**new_option_prop)
            db.session.add(new_option)
            db.session.commit()

    test.marks = tot_test_marks
    db.session.commit()

def verify_test_ids_for_deletion(test_ids, check_user = True):
    if not test_ids:
        return jsonify({"ERROR": "No test IDs provided"}), 400, False

    user_id = session.get(USER_ID)

    # Check for unauthorized tests before deletion
    if check_user:
        unauthorized_tests = Test.query.filter(Test.id.in_(test_ids), Test.created_by != user_id).all()
        if unauthorized_tests:
            return jsonify({ERROR: f"Unauthorized deletion request for test IDs {[test.id for test in unauthorized_tests]}. Bulk deletion refused"}), 403, False
    return (True,)

def add_test_details_to_dict(test, test_data_dict):
    author = User.query.get(test.created_by)
    author_details = {
        "username": author.username,
        "avatar_url": url_for('provide_user_avatar_file', filename = author.avatar_path.split('\\')[-1]) if author.avatar_path else None  
    }
    test_data_dict['id'] = test.id
    test_data_dict['title'] = test.title
    test_data_dict['description'] = test.description
    test_data_dict['subject'] = Subject.query.get(test.subject_id).name
    test_data_dict['duration_seconds'] = test.duration_seconds
    test_data_dict['total_marks'] = test.marks
    test_data_dict['author_details'] = author_details
    test_data_dict['created_at'] = test.created_at
    test_data_dict['last_updated'] = test.last_updated

def delete_subject_if_not_shared(test):
    has_other_same_subject_tests = db.session.query(
        exists().where(Test.subject_id == test.subject_id).where(Test.id != test.id)
        ).scalar()
    
    if not has_other_same_subject_tests:
        db.session.delete(Subject.query.get(test.subject_id))
        db.session.commit()






