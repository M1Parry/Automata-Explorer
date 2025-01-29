const express = require('express');
const router = express.Router();
const path = require('path');
const User = require('../models/user');

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/html/login.html'));
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username and password are required' 
            });
        }

        const user = await User.validate(username, password);

        // Check if user exists and password matches
        if (user) {
            // Store user info in session
            req.session.user = {
                id: user._id,
                username: user.username,
                userType: user.user_type,
                university: user.university,
                isAdmin: user.is_admin
            };

            res.json({ 
                success: true, 
                message: 'Login successful',
                user: { 
                    id: user._id,
                    username: user.username,
                    userType: user.user_type 
                }
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Add logout route
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to logout' 
            });
        }

        res.redirect('/auth/login');
    });
});

module.exports = router;
