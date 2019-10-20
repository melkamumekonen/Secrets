//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
//const encrypt = require("mongoose-encryption"); // Database encryption
//const md5 = require('md5'); // Hash function
//const bcrypt = require('bcrypt'); //Strong Hash function + salt 
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


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
    password: String
});


//userSchema.plugin(encrypt,{secret : process.env.SECRET ,encryptedFields: ['password']});
userSchema.plugin(passportLocalMongoose);


const User = mongoose.model("User", userSchema);

// use static serialize and deserialize of model for passport session support
passport.use(User.createStrategy());
//passport.serializeUser(User.serializeUser());
//passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });


//TODO
app.get('/favicon.ico', (req, res) => res.status(204));
//HOME
app.route('/')
    .get(function (req, res) {
        res.render("home");
    })
    .post(function (req, res) {
        // res.redirect("/articles");
    })
    .delete(function (req, res) {
        //  res.redirect("/articles");
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
                console.log( err);
                redirect("/login");
            }else{
            
                passport.authenticate("local")(req, res, () => {
                    res.redirect("/secrets");
                });
            }           
        });

        // User.findOne({
        //     email: req.body.username,
        // }, (err, doc) => {
        //     if (err) console.log(err);
        //     else {
        //         if (doc) {

        //             bcrypt.compare(req.body.password, doc.password, function (err, result) {
        //                 // res == true
        //                 if (err) {
        //                     console.log(err);
        //                 } else {
        //                     if (result) {
        //                         console.log(req.body.username+" logged successfuly!!");
        //                         res.render("secrets");
        //                     } else {
        //                         console.log("Incorrect password!!!");
        //                     }
        //                 }
        //             });
        //         } else {
        //             console.log("no such user exists or unamatched password !!");
        //         }
        //     }
        // });
    })
    .delete(function (req, res) {
        //  res.redirect("/articles");
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
        // bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        //     // Store hash in your password DB.
        //     if (err) {
        //         console.log("Error genrating hash!");
        //     } else {
        //         const user = new User({
        //             email: req.body.username,
        //             password: hash
        //         });
        //         user.save((err) => {
        //             if (err) res.send(err);
        //             res.render("secrets");
        //         });
        //     }
        // });
    })
    .delete(function (req, res) {
        //  res.redirect("/articles");
    });


app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});


app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

app.listen(port, function () {
    console.log("Server started on port " + port);
});