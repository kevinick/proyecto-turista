
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var multipart = require("connect-multiparty");
var fs = require("fs");

var models = require("./models");
var User = models.User;
var Place = models.Place;
var Comment = models.Comment;
var Image = models.Image;
var Vote = models.Vote;

var multipartMiddleware = multipart({
    uploadDir: __dirname + "/public/imagenes"
});
app.set("view engine", "jade");

app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


/// No se estan usando sesiones, existe por el momento un único usuario ADMIN

var ADMIN;
User.findOne({name: "admin"}, function(err, u) {
    if (err) console.log(err);
    if (u) {
        ADMIN = u;
    } else {
        User.create({
            name: "admin",
            email: "admin@turista.com"
        }, function(err_, admin) {
            ADMIN = admin;
        });
    }
});

///

app.get("/", function (req, res) {

    console.log(res);
    Place
        .find({})
        .populate("images")
        .exec(function(err, data) {
            if (err) console.log(err);
            res.render("index", {places: data.slice(0, 8)});
        });
});

app.get("/login", function(req, res) {

    res.render("login");
});

app.post("/login/valid", function(req, res) {

    console.log(req.body.username);
    console.log(req.body.password);
    res.redirect("/");
});

app.get("/new-place", function(req, res) {

    res.render("new-place");
});

app.post("/new-place/save", multipartMiddleware, function(req, res) {

    if (req.files.file.size > 0) {
        var ext = req.files.file.name.split(".").pop();
        var path = req.files.file.path;
        Image.create({
            extension: ext,
            owner: ADMIN._id
        }, function (err, img){
            if (err) {
                console.log(err); 
                res.render("save", { success: false });
                return;
            } 
            fs.rename(
                path, 
                __dirname + "/public/imagenes/" + img._id + "." + ext, 
                function(err) {
                if (err) console.log(err);
            });
            createPlace(ADMIN, img, req, res);
        });
    } else {
        fs.unlink(req.files.file.path);
        createPlace(ADMIN, null, req, res);
    }
});

function createPlace(user, img, req, res) {

    Place.create({
        name: req.body.name,
        description: req.body.description,
        location: {
            city: req.body.city,
            zone: req.body.zone,
            street: req.body.street,
        },
        latlng: {
            latitude: req.body.latitude,
            longitude: req.body.longitude
        },
        date: new Date(),
        images: img ? [img._id]:[],
        author: user._id //required
    }, function(err, place) {
        if (err) {
            console.log(err); 
            res.render("save", {success: false});
            return;
        }
        res.render("save", {success: true});
    });
}

app.get("/place/:id", function(req, res) {

    Place
        .findById(req.params.id)
        .populate({
            path: "author comments images votes",
            populate: { path: "author" }
        })
        .exec(function(err, data) {
            if (err) console.log(err);
            res.render("place", {place: data});
        });
});

app.post("/place/:id/comment", function(req, res) {

    var placeId = req.params.id;
    Comment.create({
        author: ADMIN._id,
        comment: req.body.comment,
        datetime: new Date()
    }, function(err, comment) {
        Place.findById(placeId, function(err, place) {
            if (err) console.log(err);
            place.comments.push(comment._id);
            place.save();
            // un id para asegurar que la página se recargue "?t="
            res.redirect("/place/" + placeId + "?t=" + Math.random());
        });
    });
});

app.get("/search", function(req, res) {

    var regexp = new RegExp(req.query.pattern, "i");
    Place
        .find({name: regexp})
        .populate("images")
        .exec(function(err, places) {
            res.render("search", {results: places});
        });
});

app.get("*", function (req, res) {
    res.render("not-found");
});

app.listen(8080);