const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
    stateId: Number,
    label: String,
    x: Number,
    y: Number,
    isInitial: Boolean,
    isFinal: Boolean
}, { _id: false });

const transitionSchema = new mongoose.Schema({
    from: Number,
    to: Number,
    symbol: String
}, { _id: false });

const answerSchema = new mongoose.Schema({
    problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    states: [stateSchema],
    transitions: [transitionSchema],
    isCorrect: {
        type: Boolean,
        default: false
    },
    attempts: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

answerSchema.index({ userId: 1, problemId: 1 });

module.exports = mongoose.model('Answer', answerSchema);
