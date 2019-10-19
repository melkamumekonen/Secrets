//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt = require("mongoose-encryption");

const port = process.env.PORT || 3000;
const url = "mongodb://localhost:27017";
const app = express();


mongoose.connect(url + "/userDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


userSchema.plugin(encrypt,{secret : process.env.SECRET ,encryptedFields: ['password']});

const User = mongoose.model("User", userSchema);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

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
        User.findOne({
            email: req.body.username,
        }, (err, doc) => {
            if (err) console.log(err);
            else{
                if(doc){
                    if(doc.password === req.body.password){
                    res.render("secrets");
                    }else{
                        console.log("Incorrect password!!!");
                    }
                }else {
                    console.log("no such user exists or unamatched password !!");
                }
            }
        });
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
        const user = new User({
            email: req.body.username,
            password: req.body.password
        });
        user.save((err) => {
            if (err) res.send(err);
            res.render("secrets");
        })

    })
    .delete(function (req, res) {
        //  res.redirect("/articles");
    });

app.listen(port, function () {
    console.log("Server started on port " + port);
});