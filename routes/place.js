
var express = require("express");
var router = express.Router();

var fs = require("fs");
var path = require("path");
var multipart = require("connect-multiparty");

var multipartMiddleware = multipart({
    uploadDir: path.join(__dirname, "../public/imagenes")
});

var models = require("./models");
var User = models.User;
var Place = models.Place;
var Comment = models.Comment;
var Image = models.Image;
var Vote = models.Vote;

router.get("/:id", function(req, res) {

    Place
        .findById(req.params.id)
        .populate({
            path: "creator comments images votes",
            populate: { path: "author user" }
        })
        .exec(function(err, place) {
            if (!place) {
                console.log(err);
                res.render("error", {
                    message: "No existe la referencia al lugar"
                });
                return;
            }
            console.log(place);
            var userVote = checkUserVote(res.locals.user, place.votes);
            res.render("place", {
                place: place, 
                userVote: userVote
            });
        });
});

function checkUserVote(user, votes) {

    var userVote = false;
    var i = 0;
    var userid = user._id.toString();
    var ownerid;
    while (i < votes.length && !userVote) {
        _userid = votes[i].user._id.toString();
        userVote = userid === _userid;
        i++;
    }
    return userVote;
}

function simpleId() {

    return Math.round(Math.random() * 100);
}

router.post("/:id/comment", function(req, res) {

    var placeId = req.params.id;
    var user = res.locals.user;
    Comment.create({
        author: user._id,
        comment: req.body.comment,
        datetime: new Date()
    }, function(err, comment) {
        Place.findById(placeId, function(err, place) {
            if (!place) {
                console.log(err);
                res.render("error", {
                    message: "No existe la referencia al lugar"
                });
                return;
            }
            place.comments.push(comment._id);
            place.save();
            // un id para asegurar que la página se recargue "?t="
            res.redirect("/app/place/" + placeId + "?t=" + simpleId());
        });
    });
});

function findPlace(id, callback) {

    Place.findById(id, function(err, place) {
        if (!place) {
            console.log(err);
        } else {
            callback(place);
        }
    })
}

router.get("/:id/vote", function(req, res) {

    var placeId = req.params.id;
    var user = res.locals.user;
    Vote.create({
        user: user._id
    }, function (err, vote) {
        Place.findById(placeId, function(err, place) {
            if (!place) {
                console.log(err);
                res.render("error", {
                    message: "No existe la referencia al lugar"
                });
                return;
            }
            place.votes.push(vote._id);
            place.save();
            res.redirect("/app/place/" + placeId + "?t=" + simpleId());
        })
    });
});

router.get("/:id/images", function(req, res) {

    var placeId = req.params.id;
    Place
        .findById(placeId)
        .populate({
            path: "images",
            populate: {path: "owner"}
        })
        .exec(function(err, place) {
            if (!place) {
                console.log(err);
                res.render("error", {
                    message: "No existe la referencia al lugar"
                });
                return;
            }
            res.render("images", {
                images: place.images,
                placeId: placeId
            });
        });
});

router.post("/:id/images/upload", 
    multipartMiddleware,  function(req, res) {

    var user = res.locals.user;
    var placeId = req.params.id;
    if (req.files.file.size > 0) {
        var ext = req.files.file.name.split(".").pop();
        var _path = req.files.file.path;
        Image.create({
            extension: ext,
            owner: user._id
        }, function (err, img){
            if (err) {
                console.log(err); 
                res.render("error", {
                    message: "No se pudo subir la imágen"
                });
                return;
            }
            var newDir = path.join(
                __dirname, 
                "../public/imagenes/" + img._id + "." + ext);
            fs.rename(_path, newDir,  function(ferr) {
                if (ferr) console.log(ferr);
            });

            Place.findById(placeId, function(perr, place) {
                if (!place) {
                    console.log(perr);
                    res.render("error", {
                        message: "No existe la referencia al lugar"
                    });
                    return;
                }
                place.images.push(img._id);
                place.save();
                res.redirect("/app/place/" + placeId + "/images?=t" + simpleId());
            });
        });
    } else {
        fs.unlink(req.files.file.path);
        res.redirect("/app/place/" + placeId + "/images?=t" + simpleId());
    }
});

module.exports = router;