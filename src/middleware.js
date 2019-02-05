'use strict';

const User = require('./models').User;
const auth = require('basic-auth');

function authenticateUser(req, res, next) {
    const credentials = auth(req);
    if (credentials) {
        User.authenticate(credentials.name, credentials.pass, (error, user) => {
            // Error finding user or User not found
            if(error) return next(error);
            // User found, and password hashes match! Store user on req
            else {
                req.user = user;
                next();
            }
        });
    } else {
        // No Credentials
        const err = new Error('Authentication Failed');
        err.status = 401;
        return next(err);
    }
}

module.exports.authenticateUser = authenticateUser;