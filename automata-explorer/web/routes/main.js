const express = require('express');
const router = express.Router();
const path = require('path');
const User = require('../models/user');
const Problem = require('../models/problem');

function isTeacher(req, res, next) {
    // for testing
    if (req.session.user.userType === 'teacher') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Forbidden' });
    }
}

router.get('/', (req, res) => {
    // for testing only
    req.session.user = {
        id: '678773aca785c93a0dfb4958',
        username: 'teacher1',
        userType: 'teacher',
        university: '67877331a785c93a0dfb494f',
        isAdmin: false
    };
    // end of testing
    if (req.session.user.userType === 'teacher') {
        res.sendFile(path.join(__dirname, '../public/html/teacher.html'));
    } else {
        res.sendFile(path.join(__dirname, '../public/html/student.html'));
    }
});


// Edit problem
router.get('/problem/edit/:id', isTeacher, (req, res) => {
    const { id } = req.params;
    Problem.findById(id);
});


// Create problem
router.post('/problem/create', isTeacher, (req, res) => {
    const { title, description, type } = req.body;
    university = req.session.user.university;
    creator = req.session.user.id;
    const deadline = new Date().setDate(new Date().getDate() + 14);

    const problem = new Problem({
        title,
        description,
        type,
        university,
        creator,
        deadline
    });

    problem.save()
        .then(problem => {
            res.json({ success: true, message: 'Problem created', problem });
        })
        .catch(err => {
            console.error('Problem creation error:', err);
            res.status(500).json({ success: false, message: 'Internal server error' });
        });
});

module.exports = router;