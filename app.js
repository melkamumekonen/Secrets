//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate');
//const encrypt = require("mongoose-encryption"); // Database encryption
//const md5 = require('md5'); // Hash function
//const bcrypt = require('bcrypt'); //Strong Hash function + salt 
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy; ////Google OAUTH 2.0 SETUP


//const saltRounds = 10; // number of salt rounds
const port = process.env.PORT || 3000;
const url = "mongodb://localhost:27017";
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

app.use(session({
    secret: process.env.SESSION_NAME,
    resave: false,
    saveUninitialized: true
}))
app.use(passport.initialize()); // setup passport
app.use(passport.session()); // setup passport to handle sessions


mongoose.connect(url + "/userDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}, (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("Server connected to Database!");
    }
});

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});


//userSchema.plugin(encrypt,{secret : process.env.SECRET ,encryptedFields: ['password']});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

// use static serialize and deserialize of model for passport session support
passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

//Google OAUTH 2.0 SETUP
passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function (accessToken, refreshToken, profile, cb) {
        console.log("google profile is : " + JSON.stringify(profile));
        User.findOrCreate({
            googleId: profile.id
        }, function (err, user) {
            console.log("google error : " + err);
            return cb(err, user);
        });
    }
));

//TODO
app.get('/favicon.ico', (req, res) => res.status(204));
//HOME
app.route('/')
    .get(function (req, res) {
        res.render("home");
    });

app.route("/submit")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.render("submit");
        } else {
            res.redirect("/login");
        }
    })
    .post((req, res) => {
        const submmitedSecret = req.body.secret;
        console.log(req.user);
        User.findById(req.user.id, (err, doc) => {
            if (err) {
                console.log(err);
            } else {
                if (doc) {
                    doc.secret = submmitedSecret;
                    doc.save(() => {
                        res.redirect("/secrets");
                    });
                } else {
                    console.log("Error: user doesnt exists");
                }
            }
        });
    });




// OAUTH 2.0 GOOGLE
app.get('/auth/google', (req, res) => {
    passport.authenticate('google', {
        scope: ['profile']
    })(req, res, () => {
        console.log("logged to Google Sign in !");
    });
});


//LOGIN
app.route('/login')
    .get(function (req, res) {
        res.render("login");
    })
    .post(function (req, res) {

        const user = new User({
            email: req.body.username,
            password: req.body.password
        });

        req.login(user, function (err) {
            if (err) {
                console.log(err);
                redirect("/login");
            } else {

                passport.authenticate("local")(req, res, () => {
                    res.redirect("/secrets");
                });
            }
        });
    });

// REGISTER    
app.route('/register')
    .get(function (req, res) {
        res.render("register");
    })
    .post(function (req, res) {

        console.log(req.body);

        User.register({
            username: req.body.username
        }, req.body.password, function (err, user) {
            if (err) {
                console.log("Error registring user " + req.body.username);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, () => {
                    res.redirect("/secrets");
                });
            }

        });
    });


app.get("/secrets", (req, res) => {
  
    User.find({
        "secret": {
            $ne: null
        }
    }, (err, users) => {
        if (err) {
            console.log(err);
        } else {
            if(users){
                res.render("secrets",{userWithSecrets : users});
            }
            else{
                res.render("login");
            }
         }


    });
});

app.get('/auth/google/secrets',
    passport.authenticate('google', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        // Successful authentication, redirect secrets.
        res.redirect('/secrets');
    });


app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

app.listen(port, function () {
    console.log("Server started on port " + port);
});