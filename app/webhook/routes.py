from enum import Enum
from typing import Optional
from flask import request
from flask import Blueprint
from app.extensions import mongo
from pydantic import BaseModel, ValidationError

webhook = Blueprint('Webhook', __name__, url_prefix='/webhook')

class ActionType(str, Enum):
    push = "PUSH"
    pull_request = "PULL_REQUEST"
    merge = "MERGE"

class EntrySchema(BaseModel):
    _id: Optional[str] = None
    request_id: str
    author: str
    action: ActionType
    from_branch: str
    to_branch: str
    timestamp: str

@webhook.route('/receiver', methods=["POST"])
def receiver():
    data = request.get_json(force=True)

    event = request.headers.get('X_GITHUB_EVENT')
    if event is None:
        return {"error": "Missing X_GITHUB_EVENT header"}, 400
    if event == "push":
        log_push_request(data)
    elif event == "pull_request":
        if data.get('action') == 'opened':
            log_pull_request(data)
        elif data.get('action') == 'closed' and data.get('pull_request').get('merged'):
            log_merge_request(data)
    else:
        print("Unhandled event type:", event)
        return {"error": "Unhandled event type"}, 400

    print("Hook ID:", event)
    return {}, 200

def log_push_request(data):
    try:
        entry = EntrySchema(
            request_id=str(data['head_commit']['id']),
            author=data['head_commit']['author']['username'],
            action=ActionType.push,
            from_branch=data['ref'].split('/')[-1],
            to_branch=data['ref'].split('/')[-1],
            timestamp=data['head_commit']['timestamp']
        )
        mongo.db.webhook.insert_one(entry.dict())
    except ValidationError as e:
        print("Validation error:", e)
    except Exception as e:
        print("Error logging push request:", e)

def log_pull_request(data):
    try:
        entry = EntrySchema(
            request_id=str(data['pull_request']['id']),
            author=data['pull_request']['user']['login'],
            action=ActionType.pull_request,
            from_branch=data['pull_request']['head']['ref'],
            to_branch=data['pull_request']['base']['ref'],
            timestamp=data['pull_request']['created_at']
        )
        mongo.db.webhook.insert_one(entry.model_dump())
    except ValidationError as e:
        print("Validation error:", e)
    except Exception as e:
        print("Error logging pull request:", e)

def log_merge_request(data):
    try:
        entry = EntrySchema(
            request_id=str(data['pull_request']['id']),
            author=data['pull_request']['merged_by']['login'] if data['pull_request'].get('merged_by') else 'unknown',
            action=ActionType.merge,
            from_branch=data['pull_request']['head']['ref'],
            to_branch=data['pull_request']['base']['ref'],
            timestamp=data['pull_request']['closed_at']
        )
        mongo.db.webhook.insert_one(entry.model_dump())
    except ValidationError as e:
        print("Validation error:", e)
    except Exception as e:
        print("Error logging merge request:", e)
