from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from .config import Config
from sqlalchemy import MetaData

USER_ID = 'user_id'
ROLE = 'role'

db = SQLAlchemy()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    db.init_app(app)
    
    with app.app_context():
        from . import routes, models
        db.create_all()
    
    return app
