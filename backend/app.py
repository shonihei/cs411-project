from flask import Flask
from newsapi import NewsApiClient
newsapi = NewsApiClient(api_key='')
everythingRequest = newsapi.get_everything(q='jews',
                                      sources='bbc-news,the-verge',
                                      #domains='bbc.co.uk,techcrunch.com',
                                      #from_param='2017-12-01',
                                      #to='2017-12-12',
                                      language='en',
                                      sort_by='relevancy',
                                      page=2)


app = Flask(__name__)


@app.route('/')
def home():
    everythingRequest = newsapi.get_everything(q='dogs',
                                               #sources='bbc-news,the-verge',
                                               # domains='bbc.co.uk,techcrunch.com',
                                               # from_param='2017-12-01',
                                               # to='2017-12-12',
                                               language='en',
                                               sort_by='relevancy',
                                               page=2)
    totalResults = everythingRequest['totalResults']
    articles = everythingRequest['articles']
    authors = []
    titles = []
    descriptions = []
    urls = []
    for article in articles:
        authors += [article['author']]
        titles += [article['title']]
        descriptions += [article['description']]
        urls += [article['url']]

    s = ''
    for i in range(len(authors)):
        if authors[i] == None:
            authors[i] = 'Author not found'
        if titles[i] == None:
            titles[i] = 'Title not found'
        if descriptions[i] == None:
            descriptions[i] = 'Description not found'
        if urls[i] == None:
            urls[i] = 'URL not found'
        s += 'Title: ' + titles[i] + '\n'
        s += 'Author: ' + authors[i] + '\n'
        s += 'Description: ' + descriptions[i] + '\n'
        s += 'Link: ' + urls[i] + '\n'
    return s

if __name__ == '__main__':
    app.run()
