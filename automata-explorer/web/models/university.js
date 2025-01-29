const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    country: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('University', universitySchema);
