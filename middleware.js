var express = require("express");

var app = express();

app.use(function(req, res, next){
    console.log("nnnn");
    req.a = "a"
    next();
})

app.use(function(req, res, next){
    console.log("jjjjjjjj");
    console.log(req.a);
    next();
})


app.use("/", function(req, res, next){
    console.log("3");
})

app.listen(3000, function(){
    console.log("Running...");
})