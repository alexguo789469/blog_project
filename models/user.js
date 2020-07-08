var mongoose = require('mongoose');
var Schema = mongoose.Schema;


mongoose.connect("mongodb://localhost/blog");

var userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    nickname:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    createdTime:{
        type: Date,
        //不能写Date.now()
        default: Date.now
    },
    lastModifiedTime:{
        type: Date,
        default: Date.now
    },
    avatar:{
        type: String,
        default: '/public/img/avatar-default.png'
    },
    bio:{
        type: String,
        default: ''
    },
    gender:{
        type: Number,
        enum: [-1,0,1],
        default: -1
    },
    birthday:{
        type: Date
    },
    status:{
        type: Number,
        //1 不可以评论
        //2 不可以登录
        enum:[0, 1 ,2],
        //没有权限限制
        default:0
    },
    likedPost: [mongoose.Schema.ObjectId],
    likedComment: [
        {
            post: mongoose.Schema.ObjectId,
            comment: mongoose.Schema.ObjectId
        }
    ]
})

exports.User = mongoose.model('User', userSchema);
exports.userSchema = userSchema;