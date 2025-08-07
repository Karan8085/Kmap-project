// Import required packages
const express = require('express');
const session = require('express-session');
const path = require('path');

// Create an Express application
const app = express();
const PORT = 3000; // The port your website will run on

// =================================================================
// == AREA TO ADD NEW USERS ==
// This is where you will hardcode the users you have verified.
// After a user pays and you verify their details in the Google Sheet,
// add their email and chosen password here.
const users = [
    { email: 'user1@example.com', password: 'password123' },
    { email: 'karan@kshirsagar.com', password: 'pro-dev-rocks' },
  { email: 'karan01ksh@gmail.com', password: 'Password321' },
  
    // Add more verified users here like this:
    // { email: 'newstudent@email.com', password: 'securepassword' },
];
// =================================================================

// -- Middleware Setup --

// Serve static files (CSS, client-side JS, images) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Allow the server to understand POST request bodies (like from a login form)
app.use(express.urlencoded({ extended: true }));

// Set up the session middleware
app.use(session({
    secret: 'you-should-not-know-this', // Change this to a random string
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if you use HTTPS
}));

// -- Authentication Middleware --
// This function checks if a user is logged in before allowing access to a protected page.
const checkAuth = (req, res, next) => {
    if (req.session.isAuthenticated) {
        // If the user's session is authenticated, let them proceed.
        next();
    } else {
        // If not, redirect them back to the login page.
        res.redirect('/');
    }
};

// -- Routes (The URL endpoints for our app) --

// 1. Root Route ('/'): Serves the login page.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// 2. K-Map Route ('/kmap'): Serves the K-Map tool. It's protected by our checkAuth middleware.
app.get('/kmap', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'kmap.html'));
});

// 3. Login Logic Route ('/login'): Handles the form submission from the login page.
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    // Find a user in our hardcoded 'users' array
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        // If user is found and password matches, set the session variable
        req.session.isAuthenticated = true;
        // Redirect them to the protected K-Map page
        res.redirect('/kmap');
    } else {
        // If user is not found, redirect them back to the login page with an error message
        // For simplicity, we just redirect. A more advanced version could show an error.
        res.redirect('/');
    }
});

// 4. Logout Route ('/logout')
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if(err) {
            return res.redirect('/kmap');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});


// Start the server and listen for connections
app.listen(PORT, () => {
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
