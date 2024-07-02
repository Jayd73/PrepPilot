from flask import redirect, session
from functools import wraps
from .models import TYPE_ADMIN, Question
from . import USER_ID, ROLE
from sqlalchemy.event import listens_for
import bcrypt
import os

from collections import defaultdict

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get(USER_ID) is None:
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated_function

def admin_privilege_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get(ROLE) != TYPE_ADMIN:
            return redirect("/")
        return f(*args, **kwargs)
    return decorated_function


# used ChatGPT
def generate_hash(password):
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')

# used ChatGPT
def check_password_hash(hash, password):
    return bcrypt.checkpw(password.encode('utf-8'), hash.encode('utf-8'))

# with help of ChatGPT
def get_structured_inp_ids(inp_ids):
    result = defaultdict(lambda: {'question': None, 'options': {}, 'response': None, 'marks_pos': None, 'marks_neg': None, 'image': None})
    for inp_id in inp_ids:
        parts = inp_id.split('-')
        prefix = parts[0]
        if prefix == 'question':
            question_id = parts[1]
            result[question_id]['question'] = inp_id
        elif prefix == 'option':
            question_id = parts[3]
            if inp_id not in result[question_id]['options']:
                result[question_id]['options'][inp_id] = None
        elif prefix == 'cb':
            option_id = '-'.join(parts[1:])
            question_id = parts[4]
            result[question_id]['options'][option_id] = inp_id
        elif prefix == 'resp':
            question_id = parts[3]
            result[question_id]['response'] = inp_id
        elif prefix == 'img':
            question_id = parts[3]
            result[question_id]['image'] = inp_id
        elif prefix == 'marks':
            question_id = parts[3]
            if parts[1] == 'pos':
                result[question_id]['marks_pos'] = inp_id
            elif parts[1] == 'neg':
                result[question_id]['marks_neg'] = inp_id
    return [question_dict for question_dict in result.values()]

def safe_int(numStr):
    return int(numStr) if numStr.isdigit() else 0

def delete_existing_file(user_id, upload_folder):
    for filename in os.listdir(upload_folder):
        if filename.startswith(f"{user_id}_"):
            file_path = os.path.join(upload_folder, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
                break

# Used ChatGPT
@listens_for(Question, 'before_delete')
def delete_question_image(mapper, connection, target):
    if target.image_path:
        if os.path.exists(target.image_path):
            os.remove(target.image_path)
        else:
            print(f"Image not found: {target.image_path}")



