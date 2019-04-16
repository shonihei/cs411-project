# Global News Backend Server

### Initial Setup
#### 1. Install virtualenv
virtualenv creates a virtual environment for python development that is isolated from the global python installation. We use this so that any python module we use in this project will not affect other python projects you might have on your machine.
```bash
pip3 install virtualenv
```

#### 2. Creating a virtual environment
once you've installed `virtualenv`, you can then create a virtual environment by:
```bash
cd backend
virtualenv -p python3 env
```
This will create a folder called `env` where all of our modules will be stored.\
We need to then activate the environment with the following command
```bash
source env/bin/activate
```
If you did it correctly, you should see `(env)` in your terminal at the beginning of each line.\
When you're done working, call the following to exit out of the virtual environment
```bash
deactivate
```
You should now see that `(env)` is gone from your terminal

#### 3. Install requirements **(WITH THE VIRUAL ENVIRONMENT ACTIVATED)**
In the root of this backend directory, you will find `requirements.txt` which lists out all the modules we use in this python project. You can tell pip to install all the listed modules by:
```bash
cd backend
pip install -r requirements.txt
```

#### 4. Adding secrets to the server
We're using dotenv files to load secrets into the python runtime so that we don't accidentally expose this information to github. To do so, create a file called `.env` in the backend root and add all the secrets
```bash
cd backend
touch .env
```
Open up `.env` file that you just created and add the following:
```bash
NEWS_API_KEY=PUT_KEY_HERE
DANDELION_API_KEY=PUT_KEY_HERE
DB_USERNAME=PUT_KEY_HERE
DB_PW=PUT_KEY_HERE
OPENCAGE_API_KEY=PUT_KEY_HERE
```

#### 4. Running the development server **(WITH THE VIRUAL ENVIRONMENT ACTIVATED)**
To run the flask server, simply run this command:
```bash
python flask.py
```
This will start the development server in `localhost:5000` and the server will automatically reload everytime you change the code.

#### 5. Exit the virtual environment
When you're done developing, just run the following to exit the virtual environment:
```bash
deactivate
```