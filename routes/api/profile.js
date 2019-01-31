const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const passport = require('passport')

const Profile = require('../../models/Profile')
const User = require('../../models/User')
const validateProfileInput = require('../../validation/profile')
const validateExperienceInput = require('../../validation/experience')
const validateEducationInput = require('../../validation/education')

router.get('/test', (req, res) => res.json({ msg: 'profile works' }))

// @route  GET api/profile/
// @desc   Current users profile
// @access Private
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    let errors = {}
    Profile.findOne({ user: req.user.id })
      .populate('user', ['name', 'avatar'])
      .then(profle => {
        if (!profle) {
          errors.noprofile = "Profile doesn't exists"
          return res.status(400).json(errors)
        }
        res.json(profle)
      })
      .catch(err => res.status(404).json(err))
  }
)

// @route  POST api/profile/
// @desc   Create/edit user profile
// @access Private
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const body = req.body

    const { errors, isValid } = validateProfileInput(body)
    if (!isValid) {
      return res.status(400).json(errors)
    }

    let profileFields = {}
    profileFields.user = req.user.id
    if (body.handle) profileFields.handle = body.handle
    if (body.company) profileFields.company = body.company
    if (body.website) profileFields.website = body.website
    if (body.location) profileFields.location = body.location
    if (body.bio) profileFields.bio = body.bio
    if (body.status) profileFields.status = body.status
    if (body.githubusername) profileFields.githubusername = body.githubusername

    if (typeof body.skills !== 'undefined') {
      profileFields.skills = body.skills.split(',')
    }
    profileFields.social = {}
    if (body.youtube) profileFields.social.youtube = body.youtube
    if (body.twitter) profileFields.social.twitter = body.twitter
    if (body.linkedin) profileFields.social.linkedin = body.linkedin
    if (req.body.instagram) profileFields.social.instagram = req.body.instagram
    if (body.facebook) profileFields.social.facebook = body.facebook

    Profile.findOne({ user: req.user.id }).then(profile => {
      if (profile) {
        // Update
        Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        ).then(profile => res.json(profile))
      } else {
        // Create
        Profile.findOne({ handle: profileFields.handle }).then(profile => {
          if (profile) {
            errors.handle = 'Handle already exists'
            res.status(400).json(errors)
          }

          new Profile(profileFields).save().then(profile => res.json(profile))
        })
      }
    })
  }
)

// @route  GET api/profile/handle/:handle
// @desc   Profile by handle
// @access Public
router.get('/handle/:handle', (req, res) => {
  let errors = {}
  Profile.findOne({ handle: req.params.handle })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "Profile doesn't exists"
        return res.status(404).json(errors)
      }
      res.json(profile)
    })
    .catch(err => res.status(404).json(err))
})

// @route  GET api/profile/user/:user_id
// @desc   Profile by user_id
// @access Public
router.get('/user/:user_id', (req, res) => {
  let errors = {}
  Profile.findOne({ user: req.params.user_id })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "Profile doesn't exists"
        return res.status(404).json(errors)
      }
      res.json(profile)
    })
    .catch(err => res.status(404).json({ profile: 'There is no profile' }))
})

// @route  GET api/profile/all
// @desc   All profiles
// @access Public
router.get('/all', (req, res) => {
  let errors = {}
  Profile.find()
    .populate('user', ['name', 'avatar'])
    .then(profiles => {
      if (!profiles) {
        errors.noprofile = 'There are no profiles'
        return res.status(404).json(errors)
      }
      res.json(profiles)
    })
    .catch(err => res.status(404).json({ profiles: 'There are no profiles' }))
})

// @route  POST api/profile/experience
// @desc   Add experience to profile
// @access Private
router.post(
  '/experience',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validateExperienceInput(req.body)
    if (!isValid) {
      return res.status(400).json(errors)
    }
    Profile.findOne({
      user: req.user.id
    }).then(profile => {
      const newExp = {
        title: req.body.title,
        company: req.body.company,
        location: req.body.location,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      }

      profile.experience.unshift(newExp)
      profile.save().then(profile => res.json(profile))
    })
  }
)

router.post(
  '/education',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const { errors, isValid } = validateEducationInput(req.body)
    if (!isValid) {
      return res.status(400).json(errors)
    }
    Profile.findOne({
      user: req.user.id
    }).then(profile => {
      const newEducation = {
        school: req.body.school,
        degree: req.body.degree,
        fieldofstudy: req.body.fieldofstudy,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      }

      profile.education.unshift(newEducation)
      profile.save().then(profile => res.json(profile))
    })
  }
)

// @route  DELETE api/profile/experience/:exp_id
// @desc   Delete experience by exp_id
// @access Private
router.delete(
  '/experience/:exp_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        const removeIndex = profile.experience
          .map(item => item.id)
          .indexOf(req.params.exp_id)

        profile.experience.splice(removeIndex, 1)
        profile.save().then(profile => res.json(profile))
      })
      .catch(err => res.status(404).json(err))
  }
)

router.delete(
  '/education/:edu_id',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        const removeIndex = profile.education
          .map(item => item.id)
          .indexOf(req.params.exp_id)

        profile.education.splice(removeIndex, 1)
        profile.save().then(profile => res.json(profile))
      })
      .catch(err => res.status(404).json(err))
  }
)

// @route  DELETE api/profile
// @desc   Delete profile
// @access Private
router.delete(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    Profile.findOneAndRemove({ user: req.user.id }).then(() => {
      User.findOneAndRemove({ _id: req.user.id }).then(() =>
        res.json({ success: true })
      )
    })
  }
)

module.exports = router
