import pymongo
from newsapi import NewsApiClient
import os
client = pymongo.MongoClient("mongodb+srv://admin:<password>@worldnewsapp-1zwxu.mongodb.net/test?retryWrites=true")
db = client["mydatabase"]
mycol = db["articleData"]
#mydict = { "name": "John", "address": "Highway 37" }
#x = mycol.insert_one(mydict)

newsapi = NewsApiClient(api_key=os.getenv('NEWS_API_KEY'))
data = newsapi.get_everything(q='bitcoin',
                                      from_param='2019-03-10',
                                      language='en',
                                      sort_by='relevancy',
                                      page=2)

articles = data['articles']
toMongo = []
for article in articles:
    articleDict = {}
    if (article['author'] != None):
        articleDict['author'] = article['author']
    else:
        articleDict['author'] = 'No author found'
    if (article['source']['name'] != None):
        articleDict['source'] = article['source']['name']
    else:
        articleDict['source'] = 'No source found'
    if (article['title'] != None):
        articleDict['title'] = article['title']
    else:
        articleDict['title'] = 'No title found'
    if (article['url'] != None):
        articleDict['url'] = article['url']
    else:
        articleDict['url'] = 'No URL found'
    if (article['description'] != None):
        articleDict['description'] = article['description']
    else:
        articleDict['description'] = 'Description not available'
    toMongo += [articleDict]

db.articleData.insert_many(toMongo)