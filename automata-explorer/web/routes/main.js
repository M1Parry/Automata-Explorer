const express = require('express');
const router = express.Router();
const path = require('path');
const User = require('../models/user');
const Problem = require('../models/problem');

function isTeacher(req, res, next) {
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
router.get('/problem/update/:id', isTeacher, async (req, res) => {
    const { id } = req.params;
    let problem = await Problem.findById(id);

    if (!problem) {
        return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    let problem_data = {
        id: problem.id,
        title: problem.title,
        description: problem.description,
        type: problem.type,
        deadline: problem.deadline,
        difficulty: problem.difficulty,
        enabled: problem.enabled
    }

    res.json({ success: true, problem: problem_data });
});

router.post('/problem/update/:id', isTeacher, (req, res) => {
    const { id } = req.params;
    const { title, description, type, difficulty, deadline, enabled } = req.body;

    // Validate input
    if (!title || !description || !type || !difficulty || !deadline || !enabled) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    Problem.findByIdAndUpdate(id, {
        title,
        description,
        type,
        difficulty,
        deadline,
        enabled
    }, { new: true })
        .then(problem => {
            if (!problem) {
                return res.status(404).json({ success: false, message: 'Problem not found' });
            }
            res.json({ success: true, message: 'Problem updated', problem });
        })
        .catch(err => {
            console.error('Problem update error:', err);
            res.status(500).json({ success: false, message: 'Internal server error' });
        });
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

// Delete problem
router.delete('/problem/delete/:id', isTeacher, (req, res) => {
    const { id } = req.params;

    Problem.findByIdAndDelete(id)
        .then(problem => {
            if (!problem) {
                return res.status(404).json({ success: false, message: 'Problem not found' });
            }
            res.json({ success: true, message: 'Problem deleted' });
        })
        .catch(err => {
            console.error('Problem deletion error:', err);
            res.status(500).json({ success: false, message: 'Internal server error' });
        });
});


module.exports = router;