
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

app.get("/", function (req, res) {

    Place
        .find({})
        .populate("images")
        .exec(function(err, data) {
            console.log(data.length);
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

    User.findOne({name: "admin"}, function(err, user) {

        if (!user) {console.log("No existe usuario admin"); return;}
        if (err) {console.log(err); return;}

        if (req.files.file.size > 0) {
            var ext = req.files.file.name.split(".").pop();
            var path = req.files.file.path;
            Image.create({
                extension: ext,
                owner: user._id
            }, function (err, img){
                if (err) {
                    console.log(err); 
                    res.render("save", { success: false });
                    return;
                } 
                fs.rename(path, __dirname + "/public/imagenes/" + img._id + "." + ext, function(err) {
                    if (err) {
                        console.log(err);
                    }
                });
                createPlace(user, img, req, res);
            });
        } else {
            fs.unlink(req.files.file.path);
            createPlace(user, null, req, res);
        }
    });
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

    Place.findById(req.params.id, function(err, place) {
        if (err) {
            console.log(err);
            res.render("not-found");
            return;
        }
        User.findById(place.author, function(uerr, author) {
            if (uerr) console.log(uerr);
            place.authorName = author.name;
            if (place.images.length > 0) {
                Image.findById(place.images[0], function(ferr, image) {
                    if (ferr) console.log(ferr);
                    place.image = image._id+"."+image.extension;
                    console.log(place.image);
                    res.render("place", {place: place});
                });
            } else {
                place.image = "image.png";
                console.log(place.image);
                res.render("place", {place: place});
            }
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
/*
function iteratePlacesAndJoinImage(i, places, join, callback) {

    if (i < places.length) {
        var place = places[i];
        var current = {
            placeId: place._id,
            placeName: place.name
        };

        if (place.images.length > 0) {
            Image.findById(place.images[0], function(ferr, image) {
                if (ferr) console.log(ferr);
                //place.image = image._id+"."+image.extension;
                current.image = !ferr ? image._id+"."+image.extension:"image.png";
                join.push(current);
                iteratePlacesAndJoinImage(i+1, places, join, callback);
            });
        } else {
            //place.image = "image.png";
            current.image = "image.png";
            join.push(current);
            iteratePlacesAndJoinImage(i + 1, places, join, callback);
        }
    } else {
        callback();
    }
}*/

app.get("*", function (req, res) {
    res.render("not-found");
});

app.listen(8080);