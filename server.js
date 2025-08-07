// Import required packages
const express = require('express');
const session = require('express-session');
const path = require('path');
const { createClient } = require("@vercel/kv");
const RedisStore = require("connect-redis").default;

// =================================================================
// == AREA TO ADD NEW USERS ==
// This is where you will hardcode the users you have verified.
const users = [
    { email: 'user1@example.com', password: 'password123' },
    { email: 'karan@kshirsagar.com', password: 'pro-dev-rocks' }
    // Add more verified users here
];
// =================================================================

// Initialize the Redis Client using environment variables from Vercel
const redisClient = createClient({
  url: process.env.KV_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// Create an Express application
const app = express();

// --- Middleware Setup ---

// Serve static files (CSS, client-side JS, images) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Allow the server to understand POST request bodies (like from a login form)
app.use(express.urlencoded({ extended: true }));

// Configure the session to use our RedisStore, saving data in Vercel KV
app.use(session({
    store: new RedisStore({ client: redisClient }), // Use Redis as the session store
    secret: 'your-super-secret-key-change-this-now', // IMPORTANT: Change this to a long random string
    resave: false,
    saveUninitialized: false, // Recommended setting for Redis
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Ensure cookies are only sent over HTTPS in production
        httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        maxAge: 1000 * 60 * 60 * 24 // Cookie will expire in 1 day (in milliseconds)
    }
}));


// --- Authentication Middleware to protect routes ---
const checkAuth = (req, res, next) => {
    // Check if the session object has our 'isAuthenticated' flag
    if (req.session.isAuthenticated) {
        next(); // If yes, proceed to the requested page (e.g., /kmap)
    } else {
        res.redirect('/'); // If no, send them back to the login page
    }
};

// --- Routes (URL Endpoints) ---

// Route for the root URL ('/'), serves the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Route for '/kmap', protected by our checkAuth middleware
app.get('/kmap', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'kmap.html'));
});

// Route to handle the login form submission
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        // If user is found, set a flag on the session object
        req.session.isAuthenticated = true;
        // Redirect them to the protected K-Map page
        res.redirect('/kmap');
    } else {
        // If user is not found, redirect them back to the login page
        res.redirect('/');
    }
});

// Route to handle logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if(err) {
            // If there's an error destroying the session, redirect anyway
            return res.redirect('/kmap');
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.redirect('/');
    });
});

// Export the configured app for Vercel to use as a serverless function
module.exports = app;
