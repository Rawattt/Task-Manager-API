const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const router = new express.Router()
const auth = require('../middleware/auth')



// USER ROUTING USING .THEN

// app.get('/users', (req,res) => {
//     User.find({}).then(users => {
//         res.send(users)
//     }).catch(e => {
//         res.status(400).send(e)
//     })
// })


// app.get('/users/:id', (req,res) => {
//     const _id = req.params.id
//     User.findById(_id).then(user => {
//         if(!user){
//             return res.status(404).send()
//         }
//         res.send(user)
//     }).catch(e => {
//         res.status(500).send()
//     })
// })


// app.post('/users', (req,res) => {
//     const user = new User(req.body)

//     user.save().then(() => {
//         console.log('User created!')
//         res.status(201).send(user)
//     }).catch((err) => {
//         console.log('Something went wrong!!! Unable to create user')
//         console.log(err)
//         res.status(400).send(err)
//     })

// })


// USER ROUTING USING ASYNC-AWAIT

router.get('/users/me', auth, async (req,res) => {
    try {
        res.send(req.user)
    } catch (error) {
        res.status(500).send(error)
    }

})



router.post('/users', async (req,res) => {
    const user = new User(req.body)
    
    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    } catch (error) {
        res.status(400).send(error)
    }
})

router.patch('/users/me',auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'age', 'email', 'password']
    const isVaildOperation = updates.every(update => allowedUpdates.includes(update))
    if(!isVaildOperation) return res.status(400).send('Invaild Update!')

    try {
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators:true})
        // const user = await User.findById(req.user._id)

        updates.forEach(update => req.user[update] = req.body[update])
        await req.user.save()

        res.send(req.user)
    } catch (error) {
        res.status(400).send(error)
    }

})


router.delete('/users/me',auth, async (req,res) => {
    try {
        await req.user.remove()
        res.send(req.user)
    } catch (error) {
        res.status(500).send(error)
    }
})


router.post('/users/login', async (req,res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (error) {
        res.status(400).send()
    }
})

router.post('/users/logout',auth, async (req,res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)
        await req.user.save()

        res.send('Logged out successfully')
    } catch (error) {
        res.status(500).send(error)
    }
})

router.post('/users/logoutAll', auth, async (req,res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send('Account is logged out from all devices')
    } catch (error) {
        res.status(500).send(error)
    }
})


const upload = multer({
    // dest: 'avatar',      Removed to not save the images locally 
    limits:{
        fileSize: 1000000
    },
    fileFilter(req,file,cb){
        if(!file.originalname.match(/\.(jpeg|jpg|png)/)){
            return cb(new Error('Please upload an image file'))
        }
        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req,res) => {
    // req.user.avatar = req.file.buffer

    const buffer = await sharp(req.file.buffer).resize({width:250, height:250}).png().toBuffer()
    req.user.avatar = buffer

    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})


router.delete('/users/me/avatar', auth, async (req,res) => {
    req.user.avatar = undefined
    await req.user.save
    res.send()
})

router.get('/users/:id/avatar', async (req,res) => {
    try {
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar){
            throw new Error()
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
        
    } catch (error) {
        res.status(404).send()
    }
})

module.exports = router