
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

    res.render("index", {places: []});
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

        function newPlace(img) {
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
                author: user._id
            }, function(err, place) {
                if (err) {
                    console.log(err); 
                    res.render("save", {success: false});
                    return;
                }
                res.render("save", {success: true});
            });
        }
        console.log(req.files);
        console.log(fs);
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
                newPlace(img);
            });
        } else {
            fs.unlink(req.files.file.path);
            newPlace(null);
        }
    });
});

app.get("/place/:id", function(req, res) {

    console.log(req.params.id);
    res.render("place");
});

app.get("/search", function(req, res) {

    var regexp = new RegExp(req.query.pattern, "i");
    Place.find({name: regexp}, function(err, data) {
        console.log(data);
        function iterate(i, places) {
            if (i < places.length) {
                var place = places[i];
                if (place.images.length > 0) {
                    Image.findById(place.images[0], function(ferr, image) {
                        if (ferr) console.log(ferr);
                        place.image = image._id+"."+image.extension;
                        iterate(i + 1, places);
                    });
                } else{
                    place.image = "image.png";
                    iterate(i + 1, places);
                }
            } else {
                res.render("search", {results: data});
            }
        }
    })
});

app.get("*", function (req, res) {
    res.render("not-found");
});

app.listen(8080);