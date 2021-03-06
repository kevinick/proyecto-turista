
var mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
mongoose.connect('mongodb://turista:turista123@ds217864.mlab.com:17864/turista');
var Schema = mongoose.Schema;

var emailRegex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/;

var User = mongoose.model("User", new Schema({
    name: {type: String, required: true},
    email: {
        type: String, 
        required: true,
        validate: {
            validator: function(v) {
                return emailRegex.test(v);
            },
            message: "{VALUE} no es un correo electronico válido"
        }
    }
}));

var place_schema = new Schema({
    name: {type: String, required: true},
    description: String,
    latlng: {
        type: {latitude: Number, longitude: Number}, 
        required:true
    },
    location: {
        city: String,
        zone: String,
        street: String
    },
    comments: [{
        type: Schema.Types.ObjectId,
        ref: "Comment"
    }],
    images: [{
        type: Schema.Types.ObjectId,
        ref: "Image"
    }],
    votes: [{
        type: Schema.Types.ObjectId,
        ref: "Vote"
    }],
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    type: String
});

place_schema.methods.getDate = function() {

    var date = this.date;
    return date.getFullYear() + "-" + 
        fillZeros(date.getMonth() + 1, 2) + "-" +
        fillZeros(date.getDate(), 2);
};

var Place = mongoose.model("Place", place_schema);

var comment_schema = new Schema({
    datetime: {type: Date, required:true},
    comment: String,
    author: {type: Schema.Types.ObjectId, ref:"User", required:true}
});

comment_schema.methods.getDate = function() {

    var date = this.datetime;
    return date.getFullYear() + "-" + 
        fillZeros(date.getMonth(), 2) + "-" +
        fillZeros(date.getDate(), 2);
};

var Comment = mongoose.model("Comment", comment_schema);

var image_schema = new Schema({
    extension: {type: String, required:true},
    owner: {type: Schema.Types.ObjectId, ref:"User", required:true},
    belong: {type: Schema.Types.ObjectId, ref:"Place", required:true}
});

image_schema.methods.getFileName = function () {

    return this._id.toString() + "." + this.extension;
};

var Image = mongoose.model("Image", image_schema);

var Vote = mongoose.model("Vote", new Schema({
    user: {type: Schema.Types.ObjectId, ref:"User", required:true}
}));

var Route = mongoose.model("Route", new Schema({
    creator: {type: Schema.Types.ObjectId, ref:"User", required:true},
    waypoints: [{lat: Number, lng: Number}],
    routename: {type: String, required:true}
}));

module.exports.User = User;
module.exports.Place = Place;
module.exports.Comment = Comment;
module.exports.Image = Image;
module.exports.Vote = Vote;
module.exports.Route = Route;

function fillZeros(num, len) {

    var str = "" + num;
    while (str.length < len) {
        str = "0" + str;
    }
    return str;
}