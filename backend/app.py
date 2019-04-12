from flask import Flask, Response, json, request
from flask_cors import CORS
from newsapi import NewsApiClient
from dotenv import load_dotenv
import os
import atexit
from apscheduler.schedulers.background import BackgroundScheduler
from backgroundjob import job

# load environment variables
APP_ROOT = os.path.dirname(__file__)
dotenv_path = os.path.join(APP_ROOT, '.env')
load_dotenv(dotenv_path)
newsapi = NewsApiClient(api_key=os.getenv('NEWS_API_KEY'))

# initialize and start background job
scheduler = BackgroundScheduler()
scheduler.add_job(func=job, trigger='interval', seconds=10)
scheduler.start()
atexit.register(lambda: scheduler.shutdown())

app = Flask(__name__)
CORS(app)

@app.route('/articles', methods=['GET'])
def home():
    news = newsapi.get_everything(
        q=request.args.get('q'),
        language='en',
        sort_by='relevancy',
        page=2
    )
    js = json.dumps(news)
    if news['status'] == 'ok':
        return Response(js, status=200, mimetype='application/json')
    else:
        return Response(js, status=500)

if __name__ == '__main__':
    app.run(use_reloader=False)
