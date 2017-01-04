
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

// TODO: email setup  pass kbb15d6s3d2sggf
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
var pathToMongoDb = 'mongodb://localhost/turista';

// TODO: Path to be send via email
var host = 'http://localhost:3000/';

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
            if(err) {
                console.log(err);
            }
            callback(err);
        });
    });

app.use(logger('dev'));
app.use(cookieParser());
app.use(expressSession({
                secret: '42', 
                saveUninitialized: false, 
                resave: false})
    );

app.set("view engine", "jade");

app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

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


var User = require("./routes/models").User;
app.post("/new-user", 
    passwordless.requestToken(function(user, delivery, callback, req) {

    callback(null, user);
}), function(req, res) {

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

/*
/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
app.use(function(err, req, res, next) {

    console.log(err);
    var error = err.status || 500;
    res.status(error);
    if (error >= 400 && error <= 499) {
        res.render("error", {message: "Página no encontrada"});
    } else if (error >= 500 && error <= 599) {
        res.render("error", {message: "Error de servidor"});
    } else {
        res.render("error", {message: "Error desconocido"});
    }
});*/


// establecer el puerto y escuchar
server.listen(3000);
console.log('Server listening on port 3000');

//------------------------------------------------------