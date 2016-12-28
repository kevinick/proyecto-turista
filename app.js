
var express = require("express");
var bodyParser = require("body-parser");
var app = express();

var models = require("./models");
var User = models.User;
var Place = models.Place;
var Comment = models.Comment;
var Image = models.Image;
var LatLng = models.LatLng;
var Vote = models.Vote;

app.set("view engine", "jade");
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get("/", function (req, res) {

    res.render("index");
});

app.get("/login", function(req, res) {

    res.render("login");
});

app.post("/login/valid", function(req, res) {

    console.log(req.body.username);
    console.log(req.body.password);
    res.redirect("/");
});

app.get("/place/",  function(req, res) {
    res.redirect("/");
})

app.get("/place/:id", function(req, res) {

    console.log(req.params.id);
    res.render("place");
});

app.listen(8080);