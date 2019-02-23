## As a user, I want to authenticate so that I can use additional features (Authenticating via Facebook)
In this user story, the user is trying to log in through Facebook. The application will display a simple modal to start the process however the majority of the process is dictated by Facebook’s OAuth. Once the user is successfully logged on, the modal will close and the user will be taken back to the globe to continue the use.
1. The user access the home page
2. The user clicks on the “Login with Facebook”
3. A model will show up prompting the user to connect their Facebook account
4. The user gives the application a permission to access their personal information
    1. If the authentication succeeds
        1. The user is shown a success message
        2. The modal closes
    2. If the authentication fails
        1. The user is shown a failure message
        2. The modal remains open and the user is taken back to step 3