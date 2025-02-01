import os
import shutil

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'

    # Detect if running on Vercel
    if os.environ.get("VERCEL"):
        tmp_db_path = "/tmp/app.db"
        deployed_db_path = os.path.join(basedir, "app.db")

        # Copy database if it doesn't exist in /tmp/
        if not os.path.exists(tmp_db_path) and os.path.exists(deployed_db_path):
            shutil.copy(deployed_db_path, tmp_db_path)
        
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{tmp_db_path}"

        # Define upload folders
        ORIGINAL_UPLOAD_FOLDER = os.path.join(basedir, "app/static/uploads")
        TMP_UPLOAD_FOLDER = "/tmp/uploads"

        QUESTION_IMG_UPLOAD_FOLDER = os.path.join(TMP_UPLOAD_FOLDER, "question_images")
        USER_AVATAR_UPLOAD_FOLDER = os.path.join(TMP_UPLOAD_FOLDER, "user_avatars")

        # Ensure /tmp/uploads exists
        os.makedirs(TMP_UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(QUESTION_IMG_UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(USER_AVATAR_UPLOAD_FOLDER, exist_ok=True)

        # Copy all existing uploads to /tmp/uploads (if they haven't been copied yet)
        if not os.path.exists(os.path.join(TMP_UPLOAD_FOLDER, "copied.flag")):
            if os.path.exists(ORIGINAL_UPLOAD_FOLDER):
                shutil.copytree(ORIGINAL_UPLOAD_FOLDER, TMP_UPLOAD_FOLDER, dirs_exist_ok=True)
            # Create a flag file to avoid re-copying
            open(os.path.join(TMP_UPLOAD_FOLDER, "copied.flag"), "w").close()

    else:
        # Local environment (use original static/uploads folder)
        SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'app.db')
        QUESTION_IMG_UPLOAD_FOLDER = os.path.abspath('app/static/uploads/question_images')
        USER_AVATAR_UPLOAD_FOLDER = os.path.abspath('app/static/uploads/user_avatars')

    SQLALCHEMY_TRACK_MODIFICATIONS = False
