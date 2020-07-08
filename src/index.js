const express = require('express')
require('./db/mongoose')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')
const Task = require('./models/task')
const User = require('./models/user')

const app = express()
const port = process.env.PORT
let inMaintenence = false


app.use((req,res,next) => {
    if(inMaintenence) return res.status(503).send('Sorry the site is under maintenence, try again after some time')
    next()
})
app.use(express.json())
app.use(userRouter)
app.use(taskRouter)



app.listen(port, () => {
    console.log('Server is up and running on port: ', port)
})

