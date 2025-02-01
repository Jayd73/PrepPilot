import os
import shutil

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'

    # Detect Vercel environment
    if os.environ.get("VERCEL"):
        tmp_db_path = "/tmp/app.db"
        deployed_db_path = os.path.join(basedir, "app.db")

        # Copy database if it doesn't exist in /tmp/
        if not os.path.exists(tmp_db_path) and os.path.exists(deployed_db_path):
            shutil.copy(deployed_db_path, tmp_db_path)
        
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{tmp_db_path}"
    else:
        SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'app.db')

    QUESTION_IMG_UPLOAD_FOLDER = os.path.abspath('app/static/uploads/question_images')
    USER_AVATAR_UPLOAD_FOLDER = os.path.abspath('app/static/uploads/user_avatars')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
