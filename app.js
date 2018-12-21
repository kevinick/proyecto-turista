
var express = require("express");
var bodyParser = require("body-parser");
var http = require('http');
var app = express();

var server = http.createServer(app);
var io = require('socket.io').listen(server);

var logger = require('morgan');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var passwordless = require('passwordless');

var MongoStore = require('passwordless-mongostore');
var email = require("emailjs");

var methodOverride = require("method-override");

var models = require("./routes/models");
var User = models.User;
var Place = models.Place;
var Comment = models.Comment;
var Image = models.Image;
var Vote = models.Vote;
var Route = models.Route;

// email must have security desactivated
var myEmail = 'applicacion.turistica@gmail.com';
var myPwd = 'kbb15d6s3d2sggf';
var mySmtp = 'smtp.gmail.com';
var smtpServer  = email.server.connect({
   user:    myEmail, 
   password: myPwd, 
   host:    mySmtp, 
   ssl:     true
});

// TODO: MongoDB setup (given default can be used)>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
//var pathToMongoDb = 'mongodb://localhost/turista';
var pathToMongoDb = 'mongodb://turista:turista123@ds217864.mlab.com:17864/turista';

var port = process.env.PORT || 3000;

// TODO: Path to be send via email
var host = 'http://'+getIPAddress()+ port +'/';

// Setup of Passwordless 
passwordless.init(new MongoStore(pathToMongoDb));

passwordless.addDelivery(
    function(tokenToSend, uidToSend, recipient, callback) {
        // Send out token
        smtpServer.send({
           text:    'Hola!\nAhora puede acceder a su cuenta: ' 
                + host + '?token=' + tokenToSend + '&uid=' + encodeURIComponent(uidToSend), 
           from:    myEmail, 
           to:      recipient,
           subject: 'Token para ' + host
        }, function(err, message) { 
            console.log(err || message);
        });
    }
);

app.use(logger('dev'));
app.use(cookieParser());
app.use(expressSession({
                secret: '42', 
                saveUninitialized: false, 
                resave: false})
    );

app.set('views', './views')
app.set("view engine", "pug");

app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(methodOverride("_method"));

app.use(passwordless.sessionSupport()); //convierte al login persistente
app.use(passwordless.acceptToken({ successRedirect: '/app' }));
// valida el token que viene desde 
// el correo del usuario 
// sigue a addDelivery()
// si le acepta le redirecciona


// Rutas que no necesitan que el usuario este logueado
app.get('/', function (req, res) {

    if (req.user) {
        res.redirect("/app");
    } else {
        res.render("index");
    }
});

app.get('/login', function(req, res) {
    
    if (req.user) {
        res.redirect("/app");
    } else {
        res.render('login');
    }
    
});

app.get('/createaccount', function(req, res) {
    
    if (req.user) {
        res.redirect("/app");
    } else {
        res.render('createaccount');
    }
});

var emailRegex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;

var User = require("./routes/models").User;
app.post("/new-user", 
    passwordless.requestToken(function(user, delivery, callback, req) {
    if (emailRegex.test(user)) {
        callback(null, user);
    } else {
        callback(null, null);
    }
}, {failureRedirect: "/createaccount"}), function(req, res) {

    var usrEmail = req.body.user;
    User.findOne({email: usrEmail}, function(err, user) {
        if (!user) {
            User.create({
                name: req.body.name,
                email: usrEmail
            }, function(cerr, ret) {
                if (cerr) console.log(cerr);
                res.render("sent", {
                    message: "Por favor revise su bandeja de entrada y acceda al link para completar el registro"
                });
            });
        } else {
            res.render("sent", {
                message: "Usted ya tiene una cuenta registrada. Por favor revise su bandeja de entrada y acceda al link para iniciar sesión"
            });
        }
    });
});


// rutas que necesitan que el usuario este logueado
app.use('/app', require('./routes/index'));

// Error 404
app.get("*", function(req, res) {
    res.render("error", {message: "Página no encontrada"});
});

io.sockets.on('connection', function (socket){

    Place
        .find({})
        .select("name latlng type")
        .exec(function(err, data) {
            socket.emit('news', data);
        });

    socket.on("getroutes", function(msg) {

        console.log(msg);
        Route.find({}, function(err, data) {

            socket.emit("sendroutes", data);
        });
    });
});

// establecer el puerto y escuchar
console.log("Host => " + host);
server.listen(port);

function getIPAddress() {
    var interfaces = require('os').networkInterfaces();
    for (var iname in interfaces) {
        var iface = interfaces[iname];

        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (alias.family === 'IPv4' && 
                alias.address !== '127.0.0.1' && 
                !alias.internal){
                return alias.address;
            }
        }
    }
    throw "No cuenta con una ip valida para el servidor";
}
