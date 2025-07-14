from flask import Flask

from app.webhook.routes import webhook
from app.index.routes import index
from app.api.routes import api
from app.extensions import mongo
import config


# Creating our flask app
def create_app():

    app = Flask(__name__)
    
    # registering all the blueprints
    app.register_blueprint(index)
    app.register_blueprint(webhook)
    app.register_blueprint(api)
    mongo.init_app(app, uri=config.MONGO_URI)

    return app
