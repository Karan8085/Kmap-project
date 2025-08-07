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
    if (req.session.isAuthenticated) {
        return next();
    }
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
    // --- START DEBUG LOGS ---
    console.log("--- LOGIN ATTEMPT ---");
    console.log("Received Email:", email);
    console.log("Received Password:", password);

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        console.log("SUCCESS: User found in database ->", user.email);
    } else {
        console.log("FAILURE: User not found or password does not match.");
    }
    console.log("----------------------");
    // --- END DEBUG LOGS ---
    if (user) {
        req.session.isAuthenticated = true;
        res.redirect('/kmap');
    } else {
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
