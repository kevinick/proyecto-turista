
var express = require('express');
var router = express.Router();
var multipart = require("connect-multiparty");

var multipartMiddleware = multipart({
    uploadDir: __dirname + "/public/imagenes"
});

var passwordless = require('passwordless');

var models = require("./models");
var User = models.User;
var Place = models.Place;
var Comment = models.Comment;
var Image = models.Image;
var Vote = models.Vote;

/* GET home page. */

/* GET restricted site. */
router.get('/restricted', passwordless.restricted(),
 function(req, res) {
  res.render('restricted', {places: data.slice(0, 8),user: req.user});
});

router.get('/', passwordless.restricted(),
	function(req,res){
		Place
        .find({})
        .populate("images")
        .exec(function(err, data) {
            if (err) console.log(err);
            res.render('index',{places: data.slice(0, 8),user: req.user});
        });
		
	}
);

/* GET login screen. */
router.get('/login', function(req, res) {
    res.render('login', { user: req.user });
});

/* GET logout. */
router.get('/logout', passwordless.logout(), function(req, res) {
    res.redirect('/');
});

/* POST login screen. */
router.post('/sendtoken', 
	passwordless.requestToken(
		// Simply accept every user
		function(user, delivery, callback) {
			callback(null, user);
			// usually you would want something like:
			//User.find({email: user}, callback(ret) {
			// 		if(ret)
			// 			callback(null, ret.id)
			// 		else
			 //			callback(null, null)
			//})
		}),
	function(req, res) {
  		res.render('sent');
});

router.get("/new-place", function(req, res) {

    res.render("new-place",{ user: req.user });
});

router.post("/new-place/save", multipartMiddleware, function(req, res) {

    if (req.files.file.size > 0) {
        var ext = req.files.file.name.split(".").pop();
        var path = req.files.file.path;
        Image.create({
            extension: ext,
            owner: ADMIN._id
        }, function (err, img){
            if (err) {
                console.log(err); 
                res.render("save", { success: false,user: req.user });
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
            res.render("save", {success: false,user: req.user});
            return;
        }
        res.render("save", {success: true,user: req.user});
    });
}

router.get("/place/:id", function(req, res) {

    Place
        .findById(req.params.id)
        .populate({
            path: "author comments images votes",
            populate: { path: "author" }
        })
        .exec(function(err, data) {
            if (err) console.log(err);
            res.render("place", {place: data,user: req.user});
        });
});

router.post("/place/:id/comment", function(req, res) {

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

router.get("/search", function(req, res) {

    var regexp = new RegExp(req.query.pattern, "i");
    Place
        .find({name: regexp})
        .populate("images")
        .exec(function(err, places) {
            res.render("search", {results: places,user: req.user});
        });
});

module.exports = router;