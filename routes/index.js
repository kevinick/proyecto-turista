
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
var Route = models.Route;


// la única ruta que no tiene que ser restricted
router.post("/sendtoken", 
    passwordless.requestToken(function(user, delivery, callback, req) {
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

    res.render("new-place", {
        lat: req.query.lat, 
        lng: req.query.lng
    });
});


function cannotCreateImage(err, res) {

    console.log(err); 
    res.render("success", {
        success: true,
        message: "La referencia fue guardada, pero no se creo la imagen"
    });
}

function cannotCreatePlace(err, res) {

    console.log(err); 
    res.render("success", {
        success: false,
        message: "No se pudo crear la referencia al lugar"
    });
}

function cannotCreateRoute(err, res) {

    console.log(err);
    res.send("No se pudo guardar la ruta");
}

function routeNotFound(err, res) {

    console.log(err);
    res.render("loggederror", {
        message: "Ruta no encontrada"
    });
}

function renameUploadImg(imgpath, name, ext) {

    var newpath = path.join(
        __dirname, "../public/imagenes/" + name + "." + ext);
    fs.rename(imgpath, newpath,  function(err) {
        if (err) console.log(err);
    });
}

router.post("/new-place/save", multipartMiddleware, function(req, res) {

    var user = res.locals.user;
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
        images: [],
        votes: [],
        comments: [],
        creator: user._id,
        type: req.body.type
    }, function(err, place) {
        if (!place) return cannotCreatePlace(err, res);
        newPlaceCallback(place, user, req, res);
    });
});

function newPlaceCallback(place, user, req, res) {

    var file = req.files.file;
    if (file.size > 0) {
        var ext = file.name.split(".").pop();
        var imgpath = file.path;

        Image.create({
            extension: ext,
            owner: user._id
        }, function (ierr, img) {

            if (!img) {
                fs.unlink(req.files.file.path);
                return cannotCreateImage(ierr, res);
            }
            renameUploadImg(imgpath, img._id, ext);
            place.images.push(img);
            place.save();
            res.render("success", {
                success: true, 
                message: "La referencia fue guardada con exito."
            });
        });
    } else {
        fs.unlink(file.path);
        res.render("success", {
            success: true, 
            message: "La referencia fue guardada con exito."
        });
    }
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

router.get("/routes", function(req, res) {

    res.render("routes");
});

router.post("/routes/save", function(req, res) {

    console.log(req.body.waypoints);
    console.log(req.body.name);
    console.log(res.locals.user._id);
    Route.create({
        waypoints: req.body.waypoints,
        routename: req.body.name,
        creator: res.locals.user._id
    }, function(err, route) {
        if (!route) return cannotCreateRoute(err, res);
        res.send(route);
    })
});

router.get("/user", function(req, res) {

    var userId = res.locals.user._id;
    Place.find({creator: userId}, function(perr, places) {
        if (perr) console.log(perr);

        Image.find({owner: userId}, function(ierr, images) {
            if (ierr) console.log(ierr);

            Route.find({creator: userId}, function(rerr, routes) {
                if (rerr) console.log(rerr);

                res.render("user", {
                    places: places,
                    images: images,
                    routes: routes
                });
            })
        });
    })
});

// ruta modular para place
router.use("/place", require("./place"));

module.exports = router;