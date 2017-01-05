
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
router.post("/sendtoken", 
    passwordless.requestToken(function(user, delivery, callback, req) {
            console.log(user);
            User.findOne({email: user}, function(err, ret) {
                if (!ret) {
                    callback(null, null);
                } else {
                    callback(null, user);
                }
            });
        }, {failureRedirect: "/createaccount"}) , 
    function(req, res) {
        res.render("sent", {
            message: "Por favor revise su bandeja de entrada y acceda al link para iniciar sesión"
        });
    }
);



// desde aqui todas las rutas son restringidas
router.use("/", passwordless.restricted({failureRedirect: "/login"}));


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
                console.log("Usuario no encontrado");
                res.send("ERROR. Usuario no encontrado");
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

router.get("/search", function(req, res) {

    if (req.query.pattern == "") {
        res.render("search", {results: []});
        return;
    }
    var regexp = new RegExp(req.query.pattern, "i");
    Place
        .find({name: regexp})
        .populate("images")
        .exec(function(err, places) {
            res.render("search", {results: places});
        });
});

// ruta modular para place
router.use("/place", require("./place"));

module.exports = router;