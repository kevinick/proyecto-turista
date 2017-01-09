
var mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
mongoose.connect("mongodb://localhost/turista");
var Schema = mongoose.Schema;

// email pattern => /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/

var User = mongoose.model("User", new Schema({
    name: {type: String, required: true},
    email: {
        type: String, 
        required: true
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
    owner: {type: Schema.Types.ObjectId, ref:"User", required:true}
});

image_schema.methods.getFileName = function () {

    return this._id.toString() + "." + this.extension;
};

var Image = mongoose.model("Image", image_schema);

var Vote = mongoose.model("Vote", new Schema({
    user: {type: Schema.Types.ObjectId, ref:"User", required:true}
}));

module.exports.User = User;
module.exports.Place = Place;
module.exports.Comment = Comment;
module.exports.Image = Image;
module.exports.Vote = Vote;

function fillZeros(num, len) {

    var str = "" + num;
    while (str.length < len) {
        str = "0" + str;
    }
    return str;
}