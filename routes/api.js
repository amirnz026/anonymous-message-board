const express = require('express');
const router = express.Router()
const Message = require('../database/models/Message')
const md5 = require('md5')
const {uuid} = require('uuidv4')
const {stringify} = require("nodemon/lib/utils");

router.post('/threads/:board', async (req, res, next) => {
    try {
        const newMessage = new Message({
            text: req.body.message,
            delete_password: md5(req.body.password),
            board: req.params.board,
            reported: false
        })
        await newMessage.save()
        res.status(201).send('New thread has been created')
    } catch (err) {
        console.log(err)
    }
});

router.post('/replies/:board', async (req, res, next) => {
    try {
        const reply = {
            text: req.body.text,
            delete_password: md5(req.body.password),
            reported: false,
            created_on: new Date(),
            id: uuid()
        }
        await Message.findByIdAndUpdate(req.body.thread_id, {
            $push: {replies: reply}
        })
        res.status(201).send('Reply posted')
    } catch (err) {
        res.status(400).send('Error while posting a reply')
        console.log(err)
    }

});

router.get('/threads/:board', async (req, res, next) => {
    console.log('entered endpoint')
    try {
        const foundMessages = await Message.find({}).sort({'updatedAt': -1}).limit(2);
        const recentMessages = []

        for (let i in foundMessages) {
            recentMessages.push({
                _id: String(foundMessages[i]._id).split('"')[0],
                board: foundMessages[i].board,
                replies: [],
                text: foundMessages[i].text,
                createdAt: foundMessages[i].createdAt,
                updatedAt: foundMessages[i].updatedAt
            })
        }
        for (let messageObject in foundMessages) {
            recentMessages[messageObject].replies = foundMessages[messageObject].replies.slice(0, 3);
        }
        res.status(200).send(recentMessages)

        console.log(recentMessages)
    } catch {

    }
});


router.get('/replies/:board', async (req, res, next) => {
    const foundThread = await Message.findById(req.body.thread_id)
    console.log('yoyoyoyyoyoyoyoyoyoyoyoyyoyoyoyoyoiyoyooyoyoyyoyopytpoypotypyoptyoptyptoy')
    console.log(req.body)
    if (foundThread) {
        res.status(200).send(foundThread)
    } else {

        res.status(400).send('Thread not found')
    }
});

router.delete('/threads/:board', async (req, res, next) => {
    try {
        const deletedMessage = await Message.findOneAndDelete({
            _id: req.body.thread_id,
            delete_password: md5(req.body.password)
        })
        console.log(deletedMessage)
        if (deletedMessage) {
            res.status(200).send('success')
        } else {
            res.status(204).send('no item is found')
        }
    } catch (err) {
        res.status(205).send('incorrect password')
    }
});

router.delete('/replies/:board', async (req, res, next) => {
    console.log(req.body)
    await Message.findById(req.body.thread_id, async function (err, foundMessage) {
        for (let i in foundMessage['replies']) {
            if (foundMessage['replies'][i].delete_password === md5(req.body.password) &&
                foundMessage['replies'][i].id === req.body.reply_id) {
                foundMessage['replies'][i] = {
                    text: '[deleted]',
                    delete_password: foundMessage['replies'][i].delete_password,
                    reported: foundMessage['replies'][i].reported,
                    created_on: foundMessage['replies'][i].created_on,
                    id: foundMessage['replies'][i].id
                }
                await foundMessage.save()
                return res.status(201).send('correct password')
            }
        }
        return res.status(205).send('wrong password')
    }).clone();
});

router.put('/threads/:board', async (req, res, next) => {
    await Message.findById(req.body.thread_id, async (err, foundMessage) => {
        foundMessage.reported = true
        await foundMessage.save()
    }).clone()
    res.status(201).send('reported')
})

router.put('/replies/:board', async (req, res, next) => {
    await Message.findOne({_id: req.body.thread_id}, async function (err, foundMessage) {
        for (let i in foundMessage['replies']) {
            if (foundMessage['replies'][i]['id'] === req.body.reply_id) {
                foundMessage['replies'][i] = {
                    text: foundMessage['replies'][i].text,
                    delete_password: foundMessage['replies'][i].delete_password,
                    reported: true,
                    created_on: foundMessage['replies'][i].created_on,
                    id: foundMessage['replies'][i].id
                }
                await foundMessage.save()
                res.status(201).send('reported')
            }
        }
    }).clone();
});

module.exports = router