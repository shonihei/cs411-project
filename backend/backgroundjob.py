from newsapi import NewsApiClient
from dotenv import load_dotenv
import os
import random
import pymongo
from slugify import slugify
import requests
from opencage.geocoder import OpenCageGeocode, UnknownError, RateLimitExceededError
import logging

# some constants
NUM_SOURCES = 20
PAGE_SIZE = 25
LOGGER_OUTPUT = 'article-extraction.log'
CONNECTION_TEMPLATE = "mongodb+srv://{username}:{password}@worldnewsapp-1zwxu.mongodb.net/test?retryWrites=true"
DANDELION_TEMPLATE = 'https://api.dandelion.eu/datatxt/nex/v1/?lang=en&url={url}&include=types&token={token}'
TARGET_TYPE = 'http://dbpedia.org/ontology/Place'

# set up logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler = logging.FileHandler(LOGGER_OUTPUT)
handler.setFormatter(formatter)
logger.addHandler(handler)

# load environment variables
APP_ROOT = os.path.dirname(__file__)
dotenv_path = os.path.join(APP_ROOT, '.env')
load_dotenv(dotenv_path)

# connect to db
url = CONNECTION_TEMPLATE.format(username=os.getenv('DB_USERNAME'), password=os.getenv('DB_PW'))
client = pymongo.MongoClient(url)
db = client.global_news
article_collection = db.articles

# instantiate service clients
newsapi = NewsApiClient(api_key=os.getenv('NEWS_API_KEY'))
geocoder = OpenCageGeocode(os.getenv('OPENCAGE_API_KEY'))

def get_encoded_sources():
  try:
    sources_response = newsapi.get_sources(language='en')
    sources = sources_response['sources']
    random.shuffle(sources)
    picked_sources = sources[:NUM_SOURCES]
    encoded_sources = ','.join(source['id'] for source in picked_sources)
    return encoded_sources
  except Exception:
    logger.error('failed to fetch sources')
    return ''

def get_articles(encoded_sources):
  try:
    everything_response = newsapi.get_everything(
      sources=encoded_sources, 
      language='en', 
      page_size=PAGE_SIZE
    )
    return everything_response['articles']
  except Exception:
    logger.error('failed to fetch articles')
    return []

def extract_places(article):
  url = DANDELION_TEMPLATE.format(url=article['url'], token=os.getenv('DANDELION_API_KEY'))
  raw_res = requests.get(url)
  if raw_res.status_code == 200:
    res = raw_res.json()
    annotations = res['annotations']
    places = list(filter(lambda a: TARGET_TYPE in a['types'], annotations))
    places.sort(key=lambda place: place['confidence'], reverse=True)
    return places
  else:
    logger.error('failed to extract places for "{}"'.format(article['slug']))
    return []

def get_latlong(place_name):
  try:
    geocode_res = geocoder.geocode(place_name)
    if geocode_res:
      latlong = geocode_res[0]['geometry']
      return {
        'lat': latlong['lat'],
        'long': latlong['lng']
      }
    else:
      return {}
  except UnknownError:
    logger.error('geocoder encountered unknown error')
  except RateLimitExceededError:
    logger.error('geocoder exceeded rate limit')

def process_articles(articles):
  for article in articles:
    slug = slugify(article['title'])
    if not article_collection.find_one({"slug": slug}):
      article['slug'] = slug

      places = extract_places(article)
      if places:
        place = places[0]
        latlong = get_latlong(place['label'])
        if not latlong:
          logger.warn('skipping "{}" because failed to convert "{}" to latlong'.format(slug, place['label']))
          continue
        article['latlong'] = latlong
        try:
          article_collection.insert_one(article)
          logging.info('inserted "{}"'.format(slug))
        except:
          logger.error('failed to insert "{}"'.format(slug))
      else:
        logger.warn('skipping "{}" because no place was found'.format(slug))
    else:
      logger.warn('skipping "{}" because it already exists in db'.format(slug))


def extract_articles():
  logger.info('started extracting articles')
  sources = get_encoded_sources()
  articles = get_articles(sources)
  process_articles(articles)
  logger.info('finished extracting articles')

if __name__ == "__main__":
  extract_articles()