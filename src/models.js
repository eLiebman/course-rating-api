'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

// User Schema
const UserSchema = Schema({
    fullName: {
        type: String,
        required: true
    },
    emailAddress: {
        type: String,
        unique: true,
        required: true,
        validate: {
            validator: function(email) {
                return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email);
            },
            message: props => `${props.value} is not a valid e-mail address`
        }
    },
    password: {
        type: String,
        required: true
    }
});

// Hash passwords before saving
UserSchema.pre('save', function(next) {
    const user = this;
    bcrypt.hash(user.password, 10, function(err, hash){
        if(err) return next(err);
        user.password = hash;
        return next();
    });
});

UserSchema.statics.authenticate = function(email, password, callback) {
    this.findOne({emailAddress: email})
        .exec( function(error, user) {
            // Error finding user
            if (error) return callback(error);
            else if (!user) {
                // No user found
                const err = new Error('Authentication Failed');
                err.status = 401;
                return callback(err);
            } else {
                // User found, check password
                bcrypt.compare(password, user.password, (error, isMatch) => {
                    // Error checking password
                    if (error) return callback(error);
                    else if (!isMatch) {
                        // Hashes don't match
                        const err = new Error('Authentication Failed')
                        err.status = 401;
                        return callback(err);
                    } else {
                        // Passwords hashes match, return user
                        return callback(null, user);
                    }    
                });
            }
        });
}

// Declare User
const User = mongoose.model('User', UserSchema);

// Reviews Schema
const ReviewSchema = Schema({
    user: {
        type: String,
        required: true
    },
    postedOn: {
        type: Date,
        default: Date.now
    },
    rating: {
        type: Number,
        required: true,
        min: [1, 'Ratings must be between 1 and 5'],
        max: [5, 'Ratings must be between 1 and 5']
    },
    review: {
        type: String
    }
});

// Delcare Review
const Review = mongoose.model('Review', ReviewSchema);

// Steps Schema
const StepSchema = Schema({
    stepNumber: Number,
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    }
});
// Declare Step
const Step = mongoose.model('Step', StepSchema);

// Course Schema
const CourseSchema = Schema({
    user: {
        type: String,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    estimatedTime: String,
    materialsNeeded: String,
    steps: [ StepSchema ],
    reviews: [ {type: Schema.Types.ObjectId, ref: 'Review'} ]
});

// Declare Course
const Course = mongoose.model('Course', CourseSchema);

module.exports.User = User;
module.exports.Review = Review;
module.exports.Step = Step;
module.exports.Course = Course;