const express = require('express');
const router = express.Router();
const path = require('path');
const User = require('../models/user');
const Problem = require('../models/problem');
const Answer = require('../models/answer');

function isTeacher(req, res, next) {
    if (req.session.user.userType === 'teacher') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Forbidden' });
    }
}

router.get('/', (req, res) => {
    // for testing only
    let teacherid = '678773aca785c93a0dfb4958'
    let studentid = '67877374a785c93a0dfb4955'
    req.session.user = {
        id: studentid,
        username: 'teacher1',
        userType: 'student',
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

router.get('/problems', (req, res) => {
    Problem.find({ university: req.session.user.university, enabled: true })
        .then(problems => {
            res.json({ success: true, problems });
        })
        .catch(err => {
            console.error('Problems fetch error:', err);
            res.status(500).json({ success: false, message: 'Internal server error' });
        });
});

router.get('/problem/:id', async (req, res) => {
    const { id } = req.params;
    const user = req.session.user;

    let problem = await Problem.findById(id);
    let answer = await Answer.findOne({ problemId: id, userId: user.id });

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

    let answer_data = null;
    if (answer) {
        answer_data = {
            id: answer.id,
            states: answer.states,
            transitions: answer.transitions,
            isCorrect: answer.isCorrect,
            attempts: answer.attempts
        }
    }

    res.json({ success: true, problem: problem_data, answer: answer_data });
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

// Save answer
router.post('/answer/save/:id', async (req, res) => {
    const userId = req.session.user.id;
    const problemId = req.params.id;
    const { states, transitions } = req.body;

    let answer = await Answer.findOne({ problemId, userId });

    if (answer) {
        answer.states = states;
        answer.transitions = transitions;
        answer.attempts += 1;
        await answer.save();
    } else {
        answer = new Answer({
            problemId,
            userId,
            states,
            transitions
        });
        await answer.save();
    }

    res.json({
        success: true,
        message: 'Answer saved successfully',
        answerId: answer._id
    });
});

module.exports = router;