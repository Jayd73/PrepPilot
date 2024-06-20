from flask import redirect, render_template, session, jsonify, request, current_app as app
from . import db, USER_ID, ROLE
from .models import User, Subject, Test, Question, QuestionOption, UserTest, TYPE_REGULAR_USER, TYPE_ADMIN
from .helpers import login_required, check_password_hash, generate_hash

GET = 'GET'
POST = 'POST'

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

@app.route("/login", methods=["GET", "POST"])
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

@app.route('/', methods=['GET'])
@login_required
def index():
    return "<h1>hello !<h1>"

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
