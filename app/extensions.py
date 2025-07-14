from typing import cast
from flask_pymongo import PyMongo
from flask_pymongo.wrappers import Database

mongo = PyMongo()
mongo.db = cast(Database, mongo.db)
