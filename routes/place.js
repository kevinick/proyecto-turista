
var express = require("express");
var router = express.Router();

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
            path: "author comments images votes",
            populate: { path: "author owner" }
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
        ownerid = votes[i].owner._id.toString();
        userVote = userid === ownerid;
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

router.get("/:id/vote", function(req, res) {

    var placeId = req.params.id;
    var user = res.locals.user;
    Vote.create({
        owner: user._id
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
            res.render("images", {images: place.images});
        });
});

module.exports = router;