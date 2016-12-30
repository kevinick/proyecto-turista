
var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var multipart = require("connect-multiparty");
var fs = require("fs");

//------------------------------------------------------
var path = require('path');
var logger = require('morgan');   // it is a middleware  app.use(logger('dev'));
var cookieParser = require('cookie-parser'); //it is a middleware app.use(cookieParser());
var expressSession = require('express-session');

var passwordless = require('passwordless');
//var passwordless = require('../../');

var MongoStore = require('passwordless-mongostore');
var email   = require("emailjs");

var routes = require('./routes/index'); // este es el export de index.js


// TODO: email setup (has to be changed) kbb15d6s3d2sggf
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
var pathToMongoDb = 'mongodb://localhost/passwordless-simple-mail';

// TODO: Path to be send via email
var host = 'http://localhost:3000/';

// Setup of Passwordless 
passwordless.init(new MongoStore(pathToMongoDb));

passwordless.addDelivery(
    function(tokenToSend, uidToSend, recipient, callback) {
        // Send out token
        smtpServer.send({
           text:    'Hello!\nYou can now access your account here: ' 
                + host + '?token=' + tokenToSend + '&uid=' + encodeURIComponent(uidToSend), 
           from:    myEmail, 
           to:      recipient,
           subject: 'Token for ' + host
        }, function(err, message) { 
            if(err) {
                console.log(err);
            }
            callback(err);
        });
    });

app.use(logger('dev'));  // esto es de morgan para cambiar los colores segun la respuesta
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
app.use(passwordless.acceptToken({ successRedirect: '/' }));// valida el token que viene desde 
                                                            //el correo del usuario 
                                                            //sigue a addDelivery()
                                                            //si le acepta le redirecciona

// CHECK /routes/index.js to better understand which routes are needed at a minimum
app.use('/', routes);// esto es del export a routes - index.js

/*
var multipartMiddleware = multipart({
    uploadDir: __dirname + "/public/imagenes"
});
*/

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: err
    });
});

app.set('port', process.env.PORT || 3000);//para establecer el puerto a escuchar

var server = app.listen(app.get('port'), function() {//aqui anuncio funcionamiento y puerto
  console.log('Express server listening on port ' + server.address().port);
});
//------------------------------------------------------





/// No se estan usando sesiones, existe por el momento un único usuario ADMIN
/*
var ADMIN;
User.findOne({name: "admin"}, function(err, u) {
    if (err) console.log(err);
    if (u) {
        ADMIN = u;
    } else {
        User.create({
            name: "admin",
            email: "admin@turista.com"
        }, function(err_, admin) {
            ADMIN = admin;
        });
    }
});

*/


//












/*
app.get("*", function (req, res) {
    res.render("not-found");
});
*/



//app.listen(8080);