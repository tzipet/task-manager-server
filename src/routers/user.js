const express = require('express')
const router = new express.Router()
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const {sendWelcomeEmail, sendCancelEmail} = require('../emails/account')



//Create a new user
  router.post('/users', async (req, res) => {
  const user = new User(req.body)

  try {
      const token = await user.generateAuthToken()
      await user.save()
      sendWelcomeEmail(user.email, user.name)
      res.status(201).send({user, token})
  } catch (e) {
    res.status(400).send(e)
  }

})

//Log in user
router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password)
    const token = await user.generateAuthToken()
    res.send({user, token})
  } catch (e) {
    res.status(400).send({
      error: e.toString()
    })
  }
})

//Log out user
router.post('/users/logout', auth, async (req, res) => {
  try {
      req.user.tokens = req.user.tokens.filter((token) => {
        return token.token !== req.token

      })
      await req.user.save()

      res.send()
  } catch (e) {
    res.status(500).send()
  }
})

// Logout user from all sessions
router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = []
    await req.user.save()
    res.send()
  } catch (e) {
    res.status(500).send()
  }
})

//Get a user
router.get('/users/me', auth , async (req, res) => {
  res.send(req.user)
})


// Update a user
router.patch('/users/me', auth,  async (req,res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['name', 'email', 'password', 'age']
  const isValidOperation = updates.every((update) => {
    return allowedUpdates.includes(update)
  })

  if (!isValidOperation) {
    return res.status(400).send({error: 'Invalid updates'})
  }

  try {
    updates.forEach((update) => {
      req.user[update] = req.body[update]
    })

    await req.user.save()

    res.send(req.user)

  } catch(e) {
    res.status(400).send(e)
  }
})

//Delete a user
router.delete('/users/me', auth,  async(req, res) => {
  try {
      await req.user.remove()
      sendCancelEmail(req.user.email, req.user.name)
      res.send(req.user)

  } catch(e) {
    res.status(500).send()
  }
})


//Upload profile picture
const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image file'))
    }

    cb(undefined, true)
  }
})

//Upload profile pic
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  const buffer = await sharp(req.file.buffer).resize({ width:250, height: 250 }).png().toBuffer()
  req.user.avatar = buffer
  await req.user.save()
  res.send()
},(error, req, res, next) => {
  res.status(400).send({error: error.message})
})

//Delete profile pic
router.delete('/users/me/avatar', auth, async (req, res) => {
  req.user.avatar = undefined
  await req.user.save()
  res.send()
})

//Serve profile pic
router.get('/users/:id/avatar', async (req,res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user || !user.avatar) {
      throw new Error()
    }

    res.set('Content-Type', 'image/png')
    res.send(user.avatar)
  } catch(e) {
    res.status().send()
  }
})

module.exports = router
