const { google } = require('googleapis');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session'); // for session management

const app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: true }));

// Configure OAuth2 client with your Google Cloud credentials
const oauth2Client = new google.auth.OAuth2(
    "776545214681-ca3klri27ekvet96a6h85ugde809ap06.apps.googleusercontent.com",
    "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",
    "http://localhost:3000/oauthcallback"
);

// Serve static files from 'public' folder
app.use(express.static('public'));

// Set the port
const port = process.env.PORT || 3000;

// Function to generate the Google authentication URL
function getGoogleAuthURL() {
    const scopes = [
        'https://www.googleapis.com/auth/spreadsheets'
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
    });
}

// Route to start the OAuth flow
app.get('/login', (req, res) => {
    res.redirect(getGoogleAuthURL());
});

// Route to handle OAuth callback
app.get('/oauthcallback', async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Store tokens in session
        req.session.tokens = tokens;

        res.send('Authentication successful! You can close this tab.');
    } catch (error) {
        console.error('Error during OAuth callback', error);
        res.status(500).send('Authentication failed! Please try again.');
    }
});

// Initialize the Google Sheets API client
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

// Add-task API endpoint
app.post('/add-task', async (req, res) => {
    // Set credentials from session
    if (!req.session.tokens) {
        return res.status(401).send('User not authenticated');
    }
    oauth2Client.setCredentials(req.session.tokens);

    const { taskDescription, taskType } = req.body;
    const dateCreated = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD

    try {
        let spreadsheetExists = true;
        // Check if the spreadsheet exists by trying to access it
        if (req.session.spreadsheetId) {
            try {
                await sheets.spreadsheets.get({ spreadsheetId: req.session.spreadsheetId });
            } catch (error) {
                if (error.code === 404) { // Spreadsheet not found
                    spreadsheetExists = false;
                } else {
                    throw error; // Other errors are re-thrown
                }
            }
            console.log("Spreadsheet ID from session:", req.session.spreadsheetId);
            console.log("spreadsheet exists:", spreadsheetExists)
        }
        if (!spreadsheetExists || !req.session.spreadsheetId) {
            // Create a new spreadsheet and store its ID
            const spreadsheet = await sheets.spreadsheets.create({
                resource: { properties: { title: "TaskSheet Manager" } },
                fields: 'spreadsheetId',
            });
            req.session.spreadsheetId = spreadsheet.data.spreadsheetId;
        }

        // Append the new task to the spreadsheet
        await sheets.spreadsheets.values.append({
            spreadsheetId: req.session.spreadsheetId,
            range: 'A:C', // Assuming the task details go into columns A, B, and C
            valueInputOption: 'USER_ENTERED',
            resource: { values: [[taskDescription, taskType, dateCreated]] },
        });

        res.status(200).json({ message: 'Task added successfully.' });
    } catch (error) {
        console.error('Error adding task to the sheet:', error);
        res.status(500).send('Error adding task to the sheet.');
    }
});

// Route to view tasks
app.get('/view-tasks', (req, res) => {
    if (!req.session.spreadsheetId) {
        return res.status(404).json({message:'No tasks created yet.'});
    }
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${req.session.spreadsheetId}`;
    // Respond with JSON containing the URL
    res.json({ url: spreadsheetUrl });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
