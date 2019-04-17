from flask import Flask, Response, request
from flask_cors import CORS
from newsapi import NewsApiClient
from dotenv import load_dotenv
import os
import pymongo
from bson.json_util import dumps
import atexit
from apscheduler.schedulers.background import BackgroundScheduler
from backgroundjob import extract_articles
from datetime import datetime

# load environment variables
APP_ROOT = os.path.dirname(__file__)
dotenv_path = os.path.join(APP_ROOT, '.env')
load_dotenv(dotenv_path)
newsapi = NewsApiClient(api_key=os.getenv('NEWS_API_KEY'))

# connect to db
CONNECTION_TEMPLATE = "mongodb+srv://{username}:{password}@worldnewsapp-1zwxu.mongodb.net/test?retryWrites=true"
url = CONNECTION_TEMPLATE.format(username=os.getenv('DB_USERNAME'), password=os.getenv('DB_PW'))
client = pymongo.MongoClient(url)
db = client.global_news
article_collection = db.articles

# initialize and start background job
scheduler = BackgroundScheduler()
scheduler.add_job(
    func=extract_articles, 
    trigger='interval', 
    next_run_time=datetime.now(), 
    minutes=15
)
scheduler.start()
atexit.register(lambda: scheduler.shutdown())

app = Flask(__name__)
CORS(app)

@app.route('/articles', methods=['GET'])
def get_n_random_articles():
    n = 20
    if 'n' in request.args:
        n = int(request.args.get('n'))
    try:
        articles = list(article_collection.aggregate([{'$sample': {'size': n}}]))
        status = 200
        payload = {
            'articles': articles
        }
    except Exception:
        status = 500
        payload = {
            'status': 'failed'
        }
    js = dumps(payload)
    return Response(js, status=status, mimetype='application/json')
    
if __name__ == '__main__':
    app.run(use_reloader=False)
