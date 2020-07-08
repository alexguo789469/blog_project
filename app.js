var express = require("express");
var template = require("art-template");
var router = require("./router");
var bodyParser = require("body-parser");
var session = require("express-session");
var app = express();

app.use('/public/', express.static("./public/"));
app.use('/node_modules', express.static("./node_modules/"));
app.use('/upload/', express.static("./uploads/"));
app.engine("html", require('express-art-template'));


app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json())

app.use(session({
    secret: 'keyboard cat', //配置加密字符串，增加安全性
    resave: false,
    saveUninitialized: true //无论是否使用session，我都默认分配一把钥匙
  }))

//把路由挂载到app中
app.use(router);


app.use(function(req, res){
  console.log("303");
  return res.send("why");
})

//404
app.use(function(req, res){
  console.log("404");
  return res.render("404.html");
})

//全局错误处理
app.use(function(err, req, res, next){
  console.log("err");
  console.log(err);
  return res.status(500).json({
    err_code: 500,
    message: err.message
  });
})

app.listen(3000, function(){
    console.log("Running...");
})