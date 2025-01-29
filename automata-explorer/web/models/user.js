const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    user_type: {
        type: String,
        required: true,
        enum: ['teacher', 'student']
    },
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true
    },
    is_admin: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

userSchema.virtual('url').get(function() {
    return '/main/user/'+this._id;
});

userSchema.statics.validate = async function(username, password) {
    const foundUser = await this.findOne({username});
    if (!foundUser) {
        return false;
    } else {
        const isValid = await bcrypt.compare(password, foundUser.password);
        return isValid ? foundUser : false;
    }
}

userSchema.pre('save', async function(next){
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

module.exports = mongoose.model('User', userSchema);
