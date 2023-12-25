const express = require('express');
const app = express();

app.use(express.static('public')); // Serve static files from 'public' folder

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
