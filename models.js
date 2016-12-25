
var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/turista");
var Schema = mongoose.Schema;

// importante: se debe compilar un schema usando siempre mongoose.model
var User = mongoose.model("User", new Schema({
    name: String,
    email: String
}));

var Place = mongoose.model("Place",  new Schema({
    name: String,
    description: String
}));

var Comment = mongoose.model("Comment", new Schema({
    datetime: Date,
    comment: String
}));

var Image = mongoose.model("Image", new Schema({
    path: String
}));

var LatLng = mongoose.model("LatLng", new Schema({
    latitude: Number,
    longitude: Number
}));

var Vote = mongoose.model("Vote", new Schema({

}));

module.exports.User = User;
module.exports.Place = Place;
module.exports.Comment = Comment;
module.exports.Image = Image;
module.exports.LatLng = LatLng;
module.exports.Vote = Vote;