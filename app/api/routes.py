
from flask import Blueprint
from app.extensions import mongo


api = Blueprint('API', __name__, url_prefix='/api')

def entry_mapper(entry):
    return {
        "id": str(entry["_id"]),
        "request_id": entry["request_id"],
        "author": entry["author"],
        "action": entry["action"],
        "from_branch": entry["from_branch"],
        "to_branch": entry["to_branch"],
        "timestamp": entry["timestamp"]
    }

@api.route('/logs', methods=["GET"])
def get_logs():
    try:
        logs = mongo.db.webhook.find()
        return list(map(entry_mapper, logs)), 200
    except Exception as e:
        print("Error fetching logs:", e)
        return {"error": "Failed to fetch logs"}, 500
