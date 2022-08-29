const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    board: {
        type: String,
        required: true
    },
    delete_password: {
        type: String,
        required: true,
    },
    replies: [Object],
    text: String,
    reported: Boolean
}, {timestamps: true})

module.exports = mongoose.model('Message', messageSchema)