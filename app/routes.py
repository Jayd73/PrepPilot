from flask import flash, redirect, render_template, session, jsonify, request, current_app as app
from . import db, USER_ID, ROLE
from .models import User, Subject, Test, Question, QuestionOption, UserTest, TYPE_REGULAR_USER, TYPE_ADMIN, QTYPE_MCQ, QTYPE_MSQ, QTYPE_RESP
from .helpers import login_required, admin_privilege_required, check_password_hash, generate_hash, get_structured_inp_ids
import os

GET = 'GET'
POST = 'POST'

SUCCESS_MSG = "success"
FAILURE_MSG = "error"
WARNING_MSG = "warning"
NORMAL_MSG = "message"

@app.route('/', methods=[GET])
@login_required
def index():
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
            return jsonify({'error': 'No username received'}), 400
        
        elif not passwd:
            return jsonify({'error': 'No password received'}), 400
        
        elif not email:
            return jsonify({'error': 'No email address received'}), 400

        user = User.query.filter_by(username = uname).first()
        if user:
            return jsonify({'error': 'Username already exists'}), 409

        user = User.query.filter_by(email = email).first()
        if user:
            return jsonify({'error': 'Email already exists'}), 409

        new_user = User(username = uname, email = email, password_hash = generate_hash(passwd), role = user_role)
        db.session.add(new_user)
        db.session.commit()

        session[USER_ID] = new_user.id
        session[ROLE] = new_user.role
        return jsonify({'success': 'User registered successfully'}), 201
    
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
            return jsonify({'error': 'No username or email address received'}), 400
        
        elif not passwd:
            return jsonify({'error': 'No password received'}), 400
        
        if uname:
            user = User.query.filter_by(username = uname).first()
        elif email:
            user = User.query.filter_by(email = email).first()

        if not user or not check_password_hash(user.password_hash, request.form.get("password")):
            return jsonify({'error': 'Invalid credentials'}), 401

        session[USER_ID] = user.id
        session[ROLE] = user.role
        return jsonify({'success': 'User logged in successfully'}), 200
    else:
        if session.get(USER_ID):
            return redirect("/")
        return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")

@app.route('/test_editor/create', methods=[GET, POST])
@login_required
@admin_privilege_required
def test_editor():
    if request.method == POST:
        test_form = request.form
        safe_int = lambda s: int(s) if s.isdigit() else 0
        if not any(inp_name_id.startswith("question") for inp_name_id in test_form.keys()):
            flash("Empty test discarded", WARNING_MSG)
            return jsonify({'success': 'Empty test discarded'}), 200
        
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

        # New Question creation
        question_data = get_structured_inp_ids(list(test_form.keys()) + list(request.files.keys()))
        for question_inp_data in question_data:
            question_text = test_form.get(question_inp_data['question'])
            question_type = QTYPE_RESP
            if question_inp_data['options']:
                tot_correct_options = len([checked_box_ids for checked_box_ids in question_inp_data['options'].values() if checked_box_ids])
                if tot_correct_options == 1:
                    question_type = QTYPE_MCQ
                else:
                    question_type = QTYPE_MSQ
            
            new_question = Question(
                                        test_id = new_test.id, 
                                        question_text = question_text, 
                                        question_type = question_type,
                                    )
            
            question_image = request.files.get(question_inp_data['image'])
            if question_image:
                prefix = Question.query.count() + 1
                question_image_filename = f"{prefix}_{question_image.filename[:20]}"
                question_image_filepath = os.path.join(app.config['UPLOAD_FOLDER'], question_image_filename)
                question_image.save(question_image_filepath)
                new_question = Question(
                                            test_id = new_test.id, 
                                            question_text = question_text, 
                                            question_type = question_type,
                                            image_path = question_image_filepath
                                        )
            
            db.session.add(new_question)
            db.session.commit()

            # New QuestionOptionCreation
            for option_inp_id, checkbox_inp_id in question_inp_data['options'].items():
                option_text = test_form.get(option_inp_id)
                is_correct = True if checkbox_inp_id else False
                new_option = QuestionOption(
                                                question_id = new_question.id,
                                                option_text = option_text,
                                                is_correct = is_correct
                                            )
                db.session.add(new_option)
                db.session.commit()
            
            # Response answer is added as a single option of a question, which by default makes it the only correct answer
            if question_inp_data['response']:
                resp_answer_text = test_form.get(question_inp_data['response'])
                new_option = QuestionOption(
                                                question_id = new_question.id,
                                                option_text = resp_answer_text,
                                                is_correct = True
                                            )
                db.session.add(new_option)
                db.session.commit()

        flash("Test created successfully", SUCCESS_MSG)
        return jsonify({'success': 'Test created and saved successfully'}), 200
    else:
        return render_template("test_editor.html")
    
@app.route('/search_subjects', methods=['GET'])
def search_subjects():
    query = request.args.get('query', '')
    if query:
        subjects = Subject.query.filter(Subject.name.ilike(f'%{query}%')).all()
        subjects_list = [subject.name for subject in subjects]
    else:
        subjects_list = []
    return jsonify(subjects_list)

# @app.route('/api/tests/<int:test_id>', methods=['GET'])
# def get_test(test_id):
#     test = Test.query.get_or_404(test_id)
#     questions = Question.query.filter_by(test_id=test_id).all()
#     test_data = {
#         'id': test.id,
#         'title': test.title,
#         'description': test.description,
#         'duration_minutes': test.duration_minutes,
#         'created_at': test.created_at,
#         'questions': []
#     }
    
#     for question in questions:
#         question_data = {
#             'id': question.id,
#             'question_text': question.question_text,
#             'question_type': question.question_type,
#             'options': []
#         }
#         if question.question_type == 'mcq':
#             options = QuestionOption.query.filter_by(question_id=question.id).all()
#             for option in options:
#                 option_data = {
#                     'id': option.id,
#                     'option_text': option.option_text,
#                     'is_correct': option.is_correct
#                 }
#                 question_data['options'].append(option_data)
#         test_data['questions'].append(question_data)
    
#     return jsonify(test_data)
