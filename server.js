const { google } = require('googleapis');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session'); // for session management

require('dotenv').config();

const app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use(session({ 
    secret: 'your_secret_key', 
    resave: false, 
    saveUninitialized: true }));

// Configure OAuth2 client with your Google Cloud credentials
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:3000/oauthcallback"
);

// Serve static files from 'public' folder
app.use(express.static('public'));

// Set the port
const port = process.env.PORT || 3000;

// Function to generate the Google authentication URL
function getGoogleAuthURL() {
    const scopes = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
    });
}

// Function to check if a spreadsheet is existed once login
async function findOrCreateSpreadsheetWhenLogin(oAuth2Client, spreadsheetName) {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    // Try to find an existing spreadsheet
    try {
        const response = await drive.files.list({
            q: `mimeType='application/vnd.google-apps.spreadsheet' and name='${spreadsheetName}' and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        const files = response.data.files;
        if (files.length > 0) {
            return files[0].id;
        } else {
            const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
            const spreadsheet = await sheets.spreadsheets.create({
                resource: { properties: { title: spreadsheetName } },
                fields: 'spreadsheetId',
            });
            return spreadsheet.data.spreadsheetId;
        }
    } catch (error) {
        console.error("Error finding spreadsheet: ", error);
        throw error;
    }
}

// checkAndCreateSpreadsheetIfNecessary
async function checkAndCreateSpreadsheetIfNecessary(oAuth2Client, spreadsheetId, spreadsheetName) {
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });
    console.log ('checkAndCreateSpreadsheetIfNecessary', spreadsheetId, spreadsheetName);
    // Check if the current spreadsheet is trashed or doesn't exist
    if (spreadsheetId) {
        try {
            const file = await drive.files.get({
                fileId: spreadsheetId,
                fields: 'trashed'
            });
            if (!file.data.trashed) {
                return spreadsheetId; // Spreadsheet is fine, return its ID
            }
            else {
                const newSpreadsheet = await sheets.spreadsheets.create({
                    resource: { properties: { title: spreadsheetName } },
                    fields: 'spreadsheetId',
                });
                return newSpreadsheet.data.spreadsheetId;
            }


        } catch (error) {
            // Spreadsheet not found or other errors
            console.error("Error accessing spreadsheet: ", error);
        }
    }
}

async function appendTaskToSpreadsheet(oAuth2Client, spreadsheetId, taskDescription, taskType) {
    const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
    const dateCreated = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

    await sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: 'A:C', // Update as per your spreadsheet's structure
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [[dateCreated, taskType, taskDescription]],
        },
    });
}

// Check authentication
app.get('/check-auth', (req, res) => {
    res.json({ isAuthenticated: !!req.session.tokens });
});

// Route to start the OAuth flow
app.get('/login', (req, res) => {
    res.redirect(getGoogleAuthURL());
});

// Route to handle OAuth callback
app.get('/oauthcallback', async (req, res) => {
    const { code } = req.query;

    // Check if the authorization code is present
    if (!code) {
        return res.status(400).send('Invalid request: No code provided');
    }

    try {
        const { tokens } = await oauth2Client.getToken(code); // Exchange the authorization code for an access token
        oauth2Client.setCredentials(tokens); // Set the credentials for future use
        req.session.tokens = tokens;        // Store tokens in session

        // Check for the existence of the "TaskSheet Manager" spreadsheet
        // or create one if it does not exist, then store its ID in the session
        const spreadsheetId = await findOrCreateSpreadsheetWhenLogin(oauth2Client, "TaskSheet Manager");
        req.session.spreadsheetId = spreadsheetId; 
        console.log('OAuth callback: Spreadsheet ID -', spreadsheetId);

        // Redirect the user to the home page or another relevant page
        res.redirect('/');
    } catch (error) {
        console.error('Error during OAuth callback:', error);
        res.redirect('/login'); // Redirect back to the login page
        res.status(500).send('Authentication failed. Please try again.');
    }
});

// Add-task API endpoint
app.post('/add-task', async (req, res) => {
    // Set credentials from session
    if (!req.session.tokens) {
        return res.status(401).send('User not authenticated');
    }

    try {
        oauth2Client.setCredentials(req.session.tokens);

        // Check the current spreadsheet status and create a new one if necessary
        const spreadsheetId = await checkAndCreateSpreadsheetIfNecessary(oauth2Client, req.session.spreadsheetId, "TaskSheet Manager");
        req.session.spreadsheetId = spreadsheetId; // Update the session with the current spreadsheet ID
        console.log ('current spreadhsheet: ', spreadsheetId)
        // Append the task to the spreadsheet
        await appendTaskToSpreadsheet(oauth2Client, spreadsheetId, req.body.taskDescription, req.body.taskType);
        res.status(200).json({ message: 'Task added successfully' });
    } catch (error) {
        console.error('Error adding task:', error);
        res.status(500).send('Error adding task to the sheet');
    }
});

// Route to view tasks
app.get('/view-tasks', (req, res) => {
    if (!req.session.spreadsheetId) {
        return res.status(404).json({message:'No tasks created yet.'});
    }
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${req.session.spreadsheetId}`;
    console.log ("spreadsheetUrl: ",spreadsheetUrl);
    // Respond with JSON containing the URL
    res.json({ url: spreadsheetUrl });
});

// Route to log out
app.post('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err);
                res.status(500).send('Error logging out');
            } else {
                res.clearCookie('connect.sid'); // Clear the session cookie
                res.redirect('/'); // Redirect to home page after logout
            }
        });
    } else {
        res.redirect('/'); // Redirect to home page if no session found
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
