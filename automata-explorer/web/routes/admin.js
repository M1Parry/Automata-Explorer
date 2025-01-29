const express = require('express');
const router = express.Router();
const User = require('../models/user');
const University = require('../models/university');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.isAdmin === true) {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied' });
    }
};
// on root get, direct to dashboard
router.get('/', isAdmin, (req, res) => {
    res.redirect('/admin/dashboard');
});

router.get('/dashboard', isAdmin, (req, res) => {
    res.sendFile('admin.html', { root: './public/html' });
});

router.post('/university/create', isAdmin, async (req, res) => {
    try {
        const { name, country } = req.body;
        const university = new University({ name, country });
        await university.save();
        res.json({ success: true, university });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post('/user/create', isAdmin, async (req, res) => {
    try {
        const { username, password, user_type, university } = req.body;
        const user = new User({ username, password, user_type, university });
        await user.save();
        res.json({ success: true, user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.get('/universities', isAdmin, async (req, res) => {
    try {
        const universities = await University.find({});
        res.json({ success: true, universities });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
