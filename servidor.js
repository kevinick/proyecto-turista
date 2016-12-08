
var http = require("http");
var fs = require("fs");

var servidor = http.createServer(function(req, res) {
    fs.readFile("./index.html", function(err, data) {
        res.end(data);
    });
});

servidor.listen(8080);
