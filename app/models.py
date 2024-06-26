from . import db

TYPE_REGULAR_USER = "REG USER"
TYPE_ADMIN = "ADMIN"

QTYPE_MCQ = "MCQ"
QTYPE_MSQ = "MSQ"
QTYPE_RESP = "RESP"

# After making any changes to below models, run following in the terminal to migrate and upgrade:
# flask db migrate
# flask db upgrade

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(10), nullable=False, default = TYPE_REGULAR_USER)  # 'reg user' or 'admin'
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    avatar_path = db.Column(db.String(255), unique=True)

class Subject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)

class Test(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    duration_seconds = db.Column(db.Integer)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    marks = db.Column(db.Integer)

class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    test_id = db.Column(db.Integer, db.ForeignKey('test.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(50), nullable=False)
    marks_pos = db.Column(db.Integer, nullable=False)
    marks_neg = db.Column(db.Integer, nullable=False)
    image_path = db.Column(db.String(255), unique=True)

class QuestionOption(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('question.id'), nullable=False)
    option_text = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean)

class UserTest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    test_id = db.Column(db.Integer, db.ForeignKey('test.id'), nullable=False)
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    score = db.Column(db.Integer)
    duration_seconds = db.Column(db.Integer)
    best_score = db.Column(db.Integer)
    attempts = db.Column(db.Integer)
    db.UniqueConstraint('user_id', 'test_id')


