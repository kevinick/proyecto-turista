
var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/turista");
var Schema = mongoose.Schema;

var User = mongoose.model("User", new Schema({
    name: {type: String, required: true},
    email: {
        type: String, 
        required: true
        //match: [/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i, "No se ingreso un correo electronico valido"]
    }
}));

var Place = mongoose.model("Place",  new Schema({
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
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    date: {
        type: Date,
        required: true
    }
}));

var Comment = mongoose.model("Comment", new Schema({
    datetime: {type: Date, required:true},
    comment: String,
    author: {type: Schema.Types.ObjectId, ref:"User", required:true}
}));

var image_schema = new Schema({
    extension: {type: String, required:true},
    owner: {type: Schema.Types.ObjectId, ref:"User", required:true}
});

image_schema.methods.getFileName = function () {

    return this._id.toString() + "." + this.extension;
};

var Image = mongoose.model("Image", image_schema);

var Vote = mongoose.model("Vote", new Schema({
    owner: {type: Schema.Types.ObjectId, ref:"User", required:true}
}));

module.exports.User = User;
module.exports.Place = Place;
module.exports.Comment = Comment;
module.exports.Image = Image;
module.exports.Vote = Vote;