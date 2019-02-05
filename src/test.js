'use strict';

const expect = require('chai').expect;
const mongoose = require('mongoose');
const User = require('./models.js').User;
const axios = require('axios');

describe('When I make a request to the GET route with the correct credentials', () => {
    // Variable will hold our user once created
    let jane;

    before( 'Connect to db', function(done) {
        mongoose.connect('mongodb://localhost:27017/course-api', {useNewUrlParser: true});
        const db = mongoose.connection;
        
        db.on('error', error => {
            console.log(error)
        });
        
        db.once('open', () => {
            console.log('db connection successful');
            done();
        });
    });

    beforeEach( 'Create Jane Smith in db, assign to variable: jane', function(done) {
        User.create({
            fullName: "Jane Smith",
            emailAddress: "jane@smith.com",
            password: "password",
            confirmPassword: "password"
        }, function(error, user) {
            if (error) return done(error);
            else {
                jane = user;
                return done();
            }
        });
    });

    afterEach( 'Destroy Jane Smith in db, set variable jane = null', function(done) {
        User.deleteOne({ emailAddress: "jane@smith.com" }, error => {
            jane = null;
            if (error) return done(error);
            else return done();
        });
    });

    it('Returns the correct user document', function(done) {
        axios.get('http://localhost:5000/api/users', {
            withCredentials: true,
            auth: {
                username: "jane@smith.com",
                password: "password"
            }
        }).then( res => {
            const user = res.data;
            expect(user._id).to.equal(jane._doc._id.toString('hex'));
            done();
        }).catch(err => done(err));
    });
});

describe('When I make a request to the GET /api/users route with invalid credentials', function() {
    it('Returns a 401 status error', function(done) {
        axios.get('http://localhost:5000/api/users', {
            withCredentials: true,
            auth: {
                username:"nobody@nothing.com",
                password:"wrongPassword"
            }
        }).then( res => done(res))
        .catch( err => {
            expect(err.response.status).to.equal(401);
            done();
        });
    });
});