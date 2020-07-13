const express = require('express')
const Task = require('../models/task')
const router = new express.Router()
const auth = require('../middleware/auth')


router.post('/task', auth, async (req,res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try {
        await task.save()
        res.status(201).send(task)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.get('/task/:id', auth, async (req,res) => {
    const _id = req.params.id
    try {
        // const task = await Task.findById(_id)
        const task = await Task.findOne({_id, owner:req.user._id})
        if(!task){
            return res.status(404).send('Task does not exist')
        }
        res.send(task)
    } catch (error) {
        res.status(500).send(error)
    }
})

router.get('/task', auth, async (req,res) => {
    const match = {}

    if(req.query.completed) match.completed = req.query.completed.toLowerCase() === 'true'
    const sortValue = req.query.sortBy === 'createdAt:Desc'?-1:1
    console.log(sortValue)

    try {
        // const tasks = await Task.find({owner:req.user._id})
        await req.user.populate({
            path: 'myTasks',
            match,
            options:{
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort: {
                    createdAt:sortValue
                }
            }
        }).execPopulate()
        res.send(req.user.myTasks)
    } catch (error) {
        res.status(500).send(error)
    }
})

router.patch('/task/:id', auth, async (req,res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isVaildOperation = updates.every(update => allowedUpdates.includes(update))
    if(!isVaildOperation) return res.status(400).send('Invaild Update!')

    try {
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

        const task = await Task.findOne({_id:req.params.id, owner:req.user._id})

        if(!task) return res.status(404).send('Task does not exist')

        updates.forEach(update => task[update] = req.body[update])
        task.save()

        res.send(task)
    } catch (error) {
        res.status(400).send(error)
    }
})


router.delete('/task/:id', auth, async (req,res) => {
    try {
        const task = await Task.findOneAndDelete({_id:req.params.id, owner:req.user._id})
        if(!task) return res.status(404).send('Task does not exist')
        res.send(task)
    } catch (error) {
        res.status(500).send(error)
    }
})

module.exports = router
