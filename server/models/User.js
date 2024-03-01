const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const UserSchema = new Schema({
    email: {
        type: String, 
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    }

});

module.exports = mongoose.model('User', UserSchema);

// email: {
//     type: String, 
//     required: [true, 'Email is required'],
//     unique: true,
//     lowercase: true,
//     trim: true,
//     validate: {
//         validator: function(v) {
//             return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
//         },
//         message: props => `${props.value} is not a valid email!`
//     }
// },