const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    regex: {
        type: String,
        required: false,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['DFA', 'NFA', 'ε-NFA', 'REGEX'],
        uppercase: true
    },
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    deadline: {
        type: Date,
        required: true,
        validate: {
            validator: function(v) {
                return v > this.createdAt;
            },
            message: 'Deadline must be after creation date'
        }
    },
    difficulty: {
        type: String,
        required: false,
        enum: ['easy', 'medium', 'hard']
    },
    enabled: {
        type: Boolean,
        default: true
    },
    solution: {
        type: mongoose.Schema.Types.Mixed,
        required: false,
        validate: {
            validator: function(v) {
                // Basic validation based on problem type
                switch(this.type) {
                    case 'DFA':
                    case 'NFA':
                    case 'ε-NFA':
                        return v.states && v.transitions && v.initialState && v.acceptStates;
                    case 'REGEX':
                        return typeof v === 'string' && v.length > 0;
                    default:
                        return false;
                }
            },
            message: 'Invalid solution format for the specified problem type'
        }
    }
}, {
    timestamps: true, // Adds updatedAt field automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for checking if problem is expired
problemSchema.virtual('isExpired').get(function() {
    return Date.now() > this.deadline;
});

// Index for efficient querying
problemSchema.index({ university: 1, type: 1 });
problemSchema.index({ creator: 1, createdAt: -1 });

const Problem = mongoose.model('Problem', problemSchema);

module.exports = Problem;
