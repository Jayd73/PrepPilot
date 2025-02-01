import os

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    # Use /tmp/ for SQLite in Vercel to allow writes
    if os.environ.get("VERCEL"):  
        SQLALCHEMY_DATABASE_URI = "sqlite:////tmp/app.db"
    else:
        SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'app.db')
    QUESTION_IMG_UPLOAD_FOLDER = os.path.abspath('app/static/uploads/question_images')
    USER_AVATAR_UPLOAD_FOLDER = os.path.abspath('app/static/uploads/user_avatars')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
