const mongoose = require('mongoose')
const Message = require('../database/models/Message')

const chai = require('chai')
const mocha = require('mocha')
const chaiHttp = require('chai-http')
const app = require('../app')
const should = chai.should()
const assert = chai.assert
const axios = require('axios')
const md5 = require('md5')
const {uuid} = require('uuidv4')
require('dotenv').config()

chai.use(chaiHttp);
//Our parent block

let messagesObj = {}
for (let i = 1; i <= 20; i++) {
    messagesObj[`msg${i}`] = new Message({
        board: `Mocha Board ${i}`,
        text: `Mocha Text ${i}`,
        delete_password: md5('1234'),
        reported: false,
        replies: [{
            text: "Mocha Axios Reply 1",
            delete_password: md5('1234'),
            reported: false,
            id: uuid()
        }, {
            text: "Mocha Axios Reply 2",
            delete_password: md5('1234'),
            reported: false,
            id: uuid()
        }, {
            text: "Mocha Axios Reply 3",
            delete_password: md5('1234'),
            reported: false,
            id: uuid()
        }, {
            text: "Mocha Axios Reply 4",
            delete_password: md5('1234'),
            reported: false,
            id: uuid()
        }]
    })
}
describe('Main', () => {
    before((done) => {
        mongoose
            .connect(process.env.DB_CONNECTION, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            })
            .then(async () => {
                console.log("Database connection established");
                try {
                    await Message.deleteMany({})
                    for (let msg in messagesObj) {
                        messagesObj[msg].save();
                    }

                } catch (err) {
                    console.log(err)
                }
                done()
            })
            .catch((err) => {
                console.error(`ERROR: ${err}`);
            })

    })
    describe('API Endpoints', () => {
        it('Creates a new thread', async () => {
            const result = await axios.post('http://localhost:3000/api/threads/test', {
                password: '1234',
                message: "Mocha testing"
            })
            assert.equal(result.status, 201)
        })
        it('Viewing the 10 most recent threads with 3 replies each', async () => {
            const result = await axios.get('http://localhost:3000/api/threads/test')
            assert.equal(result.status, 200)
        })
        it('Deleting a thread with the incorrect password', async () => {
            const foundMessage = await Message.findOne({})
            const foundId = String(foundMessage._id).split('"')[0]
            const result = await axios.delete('http://localhost:3000/api/threads/test', {
                data: {
                    thread_id: foundId,
                    password: "4321"
                }
            })
            assert.equal(result.status, 204)

        })
        it('Deleting a thread with the correct password', async () => {
            const foundMessage = await Message.findOne({})
            const foundId = String(foundMessage._id).split('"')[0]
            const result = await axios.delete('http://localhost:3000/api/threads/test', {
                data: {
                    thread_id: foundId,
                    password: "1234"
                }
            })
            assert.equal(result.status, 200)

        })
        it('Reports a thread', async () => {
            const foundMessage = await Message.findOne({})
            const foundId = String(foundMessage._id).split('"')[0]
            const result = await axios.put('http://localhost:3000/api/threads/test',
                {
                    thread_id: foundId,
                }
            )
            assert.equal(result.status, 201)
        })
        it('Creates a new reply', async () => {
            const foundMessage = await Message.findOne({})
            const foundId = String(foundMessage._id).split('"')[0]
            const result = await axios.post('http://localhost:3000/api/replies/test',
                {
                    thread_id: foundId,
                    text: "Mocha Axios Reply",
                    password: '1234'
                }
            )
            assert.equal(result.status, 201)
        })
    })
    it('Views a single thread with all replies', async () => {
        const foundMessage = await Message.findOne({})
        const foundId = String(foundMessage._id).split('"')[0]
        const result = await axios.get('http://localhost:3000/api/replies/test', {
            data: {
                thread_id: foundId
            }
        })
        assert.equal(result.status, 200)
    })
    it('deletes a reply with the incorrect password', async () => {
        const foundMessage = await Message.findOne({})
        const foundId = String(foundMessage._id).split('"')[0]
        const foundReplyId = String(foundMessage.replies[0].id)
        const result = await axios.delete('http://localhost:3000/api/replies/test', {
            data: {
                thread_id: foundId,
                password: "4321",
                reply_id: foundReplyId
            }
        })
        assert.equal(result.status, 205)
    })
    it('deletes a reply with the correct password', async () => {
        const foundMessage = await Message.findOne({})
        const foundId = String(foundMessage._id).split('"')[0]
        const foundReplyId = String(foundMessage.replies[0].id)
        const result = await axios.delete('http://localhost:3000/api/replies/test', {
            data: {
                thread_id: foundId,
                password: "1234",
                reply_id: foundReplyId
            }
        })
        assert.equal(result.status, 201)
    })
    it('reports a reply', async () => {
        const foundMessage = await Message.findOne({})
        const foundId = String(foundMessage._id).split('"')[0]
        const foundReplyId = String(foundMessage.replies[0].id)
        console.log(foundId)
        console.log(foundReplyId)
        const result = await axios.put('http://localhost:3000/api/replies/test', {
            thread_id: foundId,
            reply_id: foundReplyId
        })
        assert.equal(result.status, 201)
    })
})
