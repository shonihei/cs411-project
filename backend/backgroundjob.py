from datetime import datetime

def job():
    with open('test.txt', 'a') as f:
        f.write('hello world at {}\n'.format(datetime.now()))