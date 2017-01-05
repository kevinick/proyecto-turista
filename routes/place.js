
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
            populate: { path: "author" }
        })
        .exec(function(err, data) {
            if (!data) {
                console.log(err);
                res.redirect("error", {
                    message: "No existe la referencia al lugar"
                });
                return;
            }
            res.render("place", {place: data});
        });
});

router.post("/:id/comment", function(req, res) {

    var placeId = req.params.id;
    var user = res.locals.user;
    console.log(req.params.id);
    Comment.create({
        author: user._id,
        comment: req.body.comment,
        datetime: new Date()
    }, function(err, comment) {
        Place.findById(placeId, function(err, place) {
            if (!place) {
                console.log(err);
                res.redirect("error", {
                    message: "No existe la referencia al lugar"
                });
                return;
            }
            place.comments.push(comment._id);
            place.save();
            // un id para asegurar que la página se recargue "?t="
            res.redirect("/app/place/" + placeId + "?t=" + Math.random());
        });
    });
});

router.get("/:id/vote", function(req, res) {

    res.send("votar");
});

router.get("/:id/images", function(req, res) {

});

module.exports = router;