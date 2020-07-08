var mongoose = require("mongoose");
var Schema = mongoose.Schema;

mongoose.connect("mongodb://localhost/blog");

var userSchema = require("./user").userSchema;

var commentSchema = new Schema({
    content:{
        type: String,
        required: true
    },
    author:{
        type: userSchema
    },
    createdTime:{
        type: String,
        default: new Date()
    },
    likes:{
        type: Number,
        default: 0
    },
    parentid:{
        type: mongoose.Schema.ObjectId
    } 
})

var topicSchema = new Schema({
    class: {
        enum: [0,1,2,3],
        type: Number,
        default: 0
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        default: ""
    },
    followers:{
        type: Number,
        default: 0
    },
    comments: {
        type: [commentSchema]
    },
    author:{
        type: mongoose.Schema.ObjectId
    },
    createdTime: {
        type: String,
        default: Date.now()
    },
    likes: {
        type: Number,
        default: 0
    }
})

var Topic = mongoose.model("Topic", topicSchema);


Topic.addComment = function(topicId, content, author, callback, parentid){
    var comment = {
        content: content,
        author: author,
        parentid: parentid,
        createdTime: new Date()
    }
    Topic.findById(topicId, function(err, data){
        if(err){
            callback({
                err_code: 500,
                err_message: "server Error..."
            })
        }
        if(!data){
            callback({
                err_code: 1,
                err_message: "topic does not exist anymore"
            })
        }
        data.comments.unshift(comment);
        data.save(function(err){
            if(err){
                callback({
                    err_code: 500,
                    err_message: "server Error..."
                })
            }
        })
        callback({
            err_code: 0,
            err_message: "Successfully commented!"
        }, data)
    })
}



module.exports = Topic;