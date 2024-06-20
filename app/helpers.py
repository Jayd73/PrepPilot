from flask import redirect, session
from functools import wraps
from .models import TYPE_ADMIN
from . import USER_ID, ROLE
import bcrypt


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
