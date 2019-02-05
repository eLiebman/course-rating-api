'use strict';

// Import Express
const express = require('express');
const router = express.Router();

// Import Middleware
const mid = require('./middleware');

// Import Models
const User = require('./models').User;
const Course = require('./models').Course;
const Review = require('./models').Review;


/*---------------
-- User Routes --
---------------*/

// GET /api/users 200
// Returns the currently authenticated user
router.get('/users', mid.authenticateUser, (req, res, next) => {
    res.json(req.user);
});

// POST /api/users 201
// Creates a user, sets Location header to '/' and returns no content
router.post('/users', (req, res, next) => {
    if (req.body.password === req.body.confirmPassword) {
        User.create(req.body, function(err) {
            if (err) {
                if (err.type = 'MongooseValidationError') err.status = 400;
                return next(err);
            } else {
                return res.status(201).send();
            }
        });
    } else {
        const error = new Error('Passwords must match');
        error.status = 400;
        next(error);
    }
});


/*-----------------
-- Course Routes --
-----------------*/

// Get /api/courses 200
// Returns all Course "_id" and title properties
router.get('/courses', (req, res, next) => {
    Course.find({}, '_id title', (error, courses) => {
        if(error) return next(error);
        else if (!courses) {
            const err = new Error('No Courses found');
            err.status = 404;
            return next(err);
        } else {
            res.json(courses);
        }
    })
});

// Get /api/course/:courseId 200
// Returns all properties and related documents for provided Course ID
// Use mongoose population to load the related user and reviews documents
router.get('/courses/:courseId', (req, res, next) => {
    Course
        .findOne({ _id: req.params.courseId })
        .populate('reviews')
        .populate('user', 'fullName')
        .exec((error, course) => {
            if (error) return next(error);
            else if (!course) {
                const err = new Error(`No Course found with id: ${req.params.courseId}`);
                err.status = 404;
                return next(err);
            } else {
                res.json(course);
            }
        });
});

// POST /api/courses 201
// Createss a course, sets the Location header, and returns no content
router.post('/courses', mid.authenticateUser, (req, res, next) => {
    req.body.user = req.user._id;
    Course.create(req.body, (err) => {
        if (err) {
            if (err.type = 'MongooseValidationError') err.status = 400;
            return next(err);
        }
        res.location('/');
        res.status(201).send();
    });
});

// PUT /api/courses/:courseId 204
// Updates a course and returns no content
router.put('/courses/:courseId', mid.authenticateUser, (req, res, next) => {
    Course.findOneAndUpdate({ _id: req.params.courseId }, req.body, (error, course) => {
        if (error) {
            if (error.type = 'MongooseValidationError') error.status = 400;
            return next(error);
        } else if (!course) {
            const err = new Error(`No Course found with id: ${req.params.courseId}`);
            err.status = 404;
            return next(err);
        } else {
            res.status(204).send();
        }
    });
});

// POST api/courses/:courseId/reviews 201
// Creates a review for the specified course ID, sets the Location header to the related course, and returns no content
router.post('/courses/:courseId/reviews', mid.authenticateUser, (req, res, next) => {
    req.body.user = req.user._id;
    // Make sure the course exists
    Course.findOne({ _id: req.params.courseId }, (error, course) => {
        if (error) return next(error);
        else if (!course) {
            const err = new Error('Course not found');
            err.status = 404;
            return next(err);
        } else {
            // If someone tries to review their own course, send 403 Forbidden
            if (req.user._id.toString() === course.user.toString()) {
                const err = new Error('Forbidden');
                err.status = 403;
                return next(err);
            }
            // Create a review
            Review.create(req.body, (error, review) => {
                if (error) {
                    if (error.type = 'MongooseValidationError') error.status = 400;
                    return next(error);
                } else if (!review) {
                    const err = new Error('Unable to create review');
                    err.status = 500;
                    return next(err);
                } else {
                    // Add the review id to the course reviews array. Send response.
                    course.update({ $push: { reviews: review._id }}, (error, course) => {
                        if(error) return next(error);
                        else {
                            res.location('/');
                            res.status(201).send();
                        }
                    });
                }
            });
        }
    });
});


module.exports = router;