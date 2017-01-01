
var express = require('express');
var router = express.Router();
var multipart = require("connect-multiparty");
var fs = require("fs");
var path = require("path");

var multipartMiddleware = multipart({
    uploadDir: path.join(__dirname, "../public/imagenes")
});

var passwordless = require('passwordless');

var models = require("./models");
var User = models.User;
var Place = models.Place;
var Comment = models.Comment;
var Image = models.Image;
var Vote = models.Vote;


// la única ruta que no tiene que ser restricted
/* POST login screen. */
router.post('/sendtoken',  passwordless.requestToken(
        // Simply accept every user
        function(user, delivery, callback) {
            callback(null, user);
            // usually you would want something like:
            //User.find({email: user}, callback(ret) {
            //      if(ret)
            //          callback(null, ret.id)
            //      else
             //         callback(null, null)
            //})
        }), 
        function(req, res) {
            res.render('sent');
        }
);



// desde aqui todas las rutas son restringidas
router.use("/", passwordless.restricted());

router.get('/restricted', function(req, res) {
    res.render('restricted');
});


/* GET logout. */
router.get('/logout', passwordless.logout(), function(req, res) {
    res.redirect('/');
});



// middleware para obtener al usuario usuario de la base de datos
// y no tener que hacer esto cada vez
// tambien se reemplaza automaticamente en las vistas por que esta 
// en los locals de la respuesta
router.use("/", function(req, res, next) {

    if (!req.user) {
        // se supone que el usuario ya inicio sesión
        res.send("Fatal Error");
    } else {
        var userEmail = req.user;
        User.findOne({email: userEmail}, function(err, user) {
            if (!user) {
                User.create({email: userEmail}, function(err, user) {
                    res.locals.user = user;
                    next();
                });
            } else {
                res.locals.user = user;
                next();                
            }
        })
    }
});

router.get('/', function(req, res){

	Place
        .find({})
        .populate("images")
        .exec(function(err, data) {
            if (err) console.log(err);
            res.render('home', {
                places: data.slice(0, 8)
            });
        });
});


router.get("/new-place", function(req, res) {

    res.render("new-place");
});

router.post("/new-place/save", multipartMiddleware, function(req, res) {

    var user = res.locals.user;
    if (req.files.file.size > 0) {
        var ext = req.files.file.name.split(".").pop();
        var _path = req.files.file.path;
        Image.create({
            extension: ext,
            owner: user._id
        }, function (err, img){
            if (err) {
                console.log(err); 
                res.render("save", { success: false});
                return;
            }
            var newDir = path.join(
                __dirname, 
                "../public/imagenes/" + img._id + "." + ext);
            fs.rename(_path, newDir,  function(err) {
                if (err) console.log(err);
            });
            createPlace(user, img, req, res);
        });
    } else {
        fs.unlink(req.files.file.path);
        createPlace(user, null, req, res);
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

router.get("/place/:id", function(req, res) {

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

router.post("/place/:id/comment", function(req, res) {

    var placeId = req.params.id;
    var user = res.locals.user;
    console.log(req.params.id);
    Comment.create({
        author: user._id,
        comment: req.body.comment,
        datetime: new Date()
    }, function(err, comment) {
        Place.findById(placeId, function(err, place) {
            if (err) console.log(err);
            place.comments.push(comment._id);
            place.save();
            // un id para asegurar que la página se recargue "?t="
            res.redirect("/app/place/" + placeId + "?t=" + Math.random());
        });
    });
});

router.get("/search", function(req, res) {

    var regexp = new RegExp(req.query.pattern, "i");
    Place
        .find({name: regexp})
        .populate("images")
        .exec(function(err, places) {
            res.render("search", {results: places});
        });
});

module.exports = router;