from flask import Blueprint, render_template


index = Blueprint('Index', __name__, url_prefix='/')

@index.route('/')
def index_route():
    return render_template('index.html')
