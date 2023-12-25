const { google } = require('googleapis');
const express = require('express');
const app = express();

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
        'https://www.googleapis.com/auth/spreadsheets',
        // Add other scopes as needed
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
    });
}

// Route to start the OAuth flow
app.get('/login', (req, res) => {
    // Redirect the user to the Google Auth URL
    res.redirect(getGoogleAuthURL());
});

// Route to handle OAuth callback
app.get('/oauthcallback', async (req, res) => {
    const { code } = req.query;
    try {
        // Exchange the authorization code for an access token
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Save these tokens securely for future API calls
        // Implement secure storage for these tokens
        // Example: Save to a database, file, or session

        res.send('Authentication successful! You can close this tab.');
    } catch (error) {
        console.error('Error during OAuth callback', error);
        res.send('Authentication failed! Please try again.');
    }
});

// Initialize the Google Sheets API client
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
