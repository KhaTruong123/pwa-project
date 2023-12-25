# Welcome to TaskSheet Manager #
This TaskSheet Manager is a simple task management application using your spreadsheet as the database and provide an interface to log new task.

## Screens ##
Login with OAuth
Log new task (categorize by "To do" and "Content" type): Top 2 buttons are both save buttons -  each button saves to it's respective column (filtering how the input is saved).

See the list of task: Go to sheet let's me see the sheet of saved, categorized inputs.

## Use Cases ##
### Use Case 1: User Authentication with Google ###
1. User Opens the App.
* User navigates to your app's URL (e.g., http://localhost:3000 if running locally).
2. User Logs in with Google:
* User clicks a "Login with Google" button on the app's homepage.
* User Grants Permission.
### Use Case 2: Creating and Interacting with a Spreadsheet
1. Create a New Spreadsheet:
* After logging in, the user can create a new spreadsheet via the app interface.
2. View and Edit Spreadsheet:
* The user can view a list of their spreadsheets within the app.
* They select a spreadsheet to view its contents.
* The app retrieves the spreadsheet data from Google Sheets and displays it to the user.
* The user can edit the spreadsheet data within the app, which then sends updates back to Google Sheets.
3. Save Changes:
* When the user makes changes to the spreadsheet in the app, these changes are sent to Google Sheets to update the actual spreadsheet.
### Use Case 3: Logging Out
User Logs Out: The user can log out of the app.

This action should clear their session and possibly revoke the access token, ensuring their Google account is disconnected from the app.
