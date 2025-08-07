// Import required packages
const express = require('express');
const session = require('express-session');
const path = require('path');
const { createClient } = require("redis"); // MODIFIED: Import the official 'redis' client
const RedisStore = require("connect-redis").default;

// =================================================================
// == AREA TO ADD NEW USERS ==
const users = [
    { email: 'user1@example.com', password: 'password123' },
    { email: 'karan@kshirsagar.com', password: 'pro-dev-rocks' }
];
// =================================================================

// MODIFIED: Initialize the official Redis Client
const redisClient = createClient({
  url: process.env.REDIS_URL // The 'redis' client correctly handles redis:// URLs
});

// It's good practice to listen for errors and connect
redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect().catch(console.error);


// Create an Express application
const app = express();

// --- Middleware Setup ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Configure the session to use our RedisStore (No changes needed here)
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: 'your-super-secret-key-change-this-now',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));


// --- Authentication Middleware ---
const checkAuth = (req, res, next) => {
    // --- NEW DEBUG LOGS for checkAuth ---
    console.log("--- CHECKING AUTH for requested page ---");
    // This logs the session ID cookie sent by the browser
    console.log("Cookie Header from Browser:", req.headers.cookie);
    // This logs the session data found in Redis for that cookie ID
    console.log("Session data found in Redis:", req.session);

    if (req.session.isAuthenticated) {
        console.log("Result: Auth check PASSED. Allowing access.");
        console.log("------------------------------------");
        return next();
    }

    console.log("Result: Auth check FAILED. Redirecting to login.");
    console.log("------------------------------------");
    res.redirect('/');
};

// --- Routes ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/kmap', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'kmap.html'));
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    // 1. Log the incoming login attempt
    console.log("--- LOGIN ATTEMPT ---");
    console.log("Received Email:", email);
    console.log("Received Password:", password);

    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // 2. If user is found, log success
        console.log("SUCCESS: User found in database ->", user.email);
        req.session.isAuthenticated = true;

        // 3. Save the session to Redis before redirecting
        req.session.save(err => {
            if (err) {
                console.error('Session save error:', err);
                return res.redirect('/');
            }
            
            // 4. After saving, log success and redirect
            console.log("Session saved successfully. Redirecting to /kmap.");
            console.log("----------------------");
            res.redirect('/kmap');
        });

    } else {
        // 5. If user is not found, log failure and redirect
        console.log("FAILURE: User not found or password does not match.");
        console.log("----------------------");
        res.redirect('/');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if(err) {
            return res.redirect('/kmap');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

// Export the app for Vercel
module.exports = app;
