
var express = require("express");
var router = express.Router();

var fs = require("fs");
var path = require("path");
var multipart = require("connect-multiparty");

var multipartMiddleware = multipart({
    uploadDir: path.join(__dirname, "../public/imagenes")
});

var pug = require("pug");

var models = require("./models");
var User = models.User;
var Place = models.Place;
var Comment = models.Comment;
var Image = models.Image;
var Vote = models.Vote;



function checkUserVote(userid, votes) {

    var userVote = false;
    var i = 0;
    userid = userid.toString();
    while (i < votes.length && !userVote) {
        userVote = userid === votes[i].user.toString();
        i++;
    }
    return userVote;
}

function simpleId() {

    return Math.round(Math.random() * 100);
}

function placeNotFound(err, res) {

    console.log(err);
    res.render("loggederror", { 
        message: "No existe la referencia al lugar"
    });
}

function cannotCreateVote(err, res) {

    console.log(err);
    res.render("loggederror", {
        message: "No se pudo crear el voto"
    });
}

function cannotCreateImage(err, res) {

    console.log(err); 
    res.render("loggederror", {
        message: "No se pudo crear la imagen"
    });
}

function cannontCreateComment(err, res) {

    console.log(err);
    res.render("loggederror", {
        message: "No se pudo crear el comentario"
    })
}

function placeDeleteError(err, res) {

    console.log(err);
    res.render("success", {
        success: false,
        message: "No se pudo borrar el lugar"
    });
}

function removeAll(schema, objects) {

    for (var i = 0; i< objects.length; i++) {
        schema.findOneAndRemove({
            _id: objects[i]
        }, function(err) {
            if (err) console.log(err);
        });
    }
}

router.route("/:id")
    .get(function(req, res) {

        var userid = res.locals.user._id;
        Place
            .findById(req.params.id)
            .populate({
                path: "creator comments images votes",
                populate: { path: "author" }
            })
            .exec(function(err, place) {
                if (!place) return placeNotFound(err, res);
                var userVote = checkUserVote(userid, place.votes);
                try {
                    var filepath = path.join(
                        __dirname, "../views/place.pug");
                    var html = pug.renderFile(filepath, {
                        place: place, 
                        userVote: userVote,
                        user: res.locals.user
                    });
                    res.send(html);
                } catch (err) {
                    console.log(place);
                    console.log(err);
                    res.render("loggederror", {
                        message: "Error de servidor vuelva a cargar"
                    });
                }
            });
    })
    .delete(function(req, res) {

        var placeId = req.params.id;
        Place
            .findById({_id: placeId})
            .populate("comments votes")
            .exec(function(err, place) {
                if (!place) return placeDeleteError(err, res);
                removeAll(Vote, place.votes);
                removeAll(Comment, place.comments);
                place.remove();
                res.render("success", {
                    success: true,
                    message: "Lugar eliminado"
                });
        });
    });


router.post("/:id/comment", function(req, res) {

    var placeId = req.params.id;
    var user = res.locals.user;
    Place.findById(placeId, function(err, place) {
        if (!place) return placeNotFound(err, res);
        Comment.create({
            author: user._id,
            comment: req.body.comment,
            datetime: new Date()
        }, function(cerr, comment) {
            if (!comment) return cannotCreateComment(cerr, res);
            place.comments.push(comment._id);
            place.save();
            res.redirect("/app/place/" + placeId + "?t=" + simpleId()); 
        });
    });
});

router.get("/:id/vote", function(req, res) {

    var userId = res.locals.user._id;
    var placeId = req.params.id;
    Place
        .findById(placeId)
        .populate("votes")
        .exec(function(err, place) {
            if (!place) return placeNotFound(err, res);
            var userVote = checkUserVote(userId, place.votes);
            if (!userVote) {
                Vote.create({user: userId}, function(verr, vote) {
                    if (!vote) return cannotCreateVote(verr, res);
                    place.votes.push(vote);
                    place.save();
                    res.redirect("/app/place/" + placeId + "?t=" + simpleId());
                })
            } else {
                res.redirect("/app/place/" + placeId + "?t=" + simpleId());
            }
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
            if (!place) return placeNotFound(err, res);
            res.render("images", {
                images: place.images,
                placeId: placeId,
                placeName: place.name
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

        Place.findById(placeId, function(perr, place) {
            if (!place){
                fs.unlink(_path);
                return placeNotFound(perr, res);
            }
            Image.create({
                extension: ext,
                owner: user._id,
                belong: place._id
            }, function (err, img){
                if (!img) {
                    fs.unlink(_path);
                    return cannotCreateImage(err, res);
                }
                var newDir = path.join(
                    __dirname, 
                    "../public/imagenes/" + img._id + "." + ext);
                fs.rename(_path, newDir, function(ferr) {
                    if (ferr) console.log(ferr);
                });
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