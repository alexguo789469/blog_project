var express = require("express");
var User = require("./models/user").User;
var Topic = require("./models/topic");
var md5 = require("blueimp-md5");
const { json } = require("express");
var multer = require("multer");

var router = express.Router();

//multer初始化
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        //指定文件路径
        cb(null, './uploads')
    },
    filename: function(req, file, cb){
        //指定文件名
        //文件名重复覆盖，后缀名发生改变
        var exts = file.originalname.split(".");
        var ext = exts[exts.length-1];
        var filename = Date.now() + (parseInt(Math.random()*9999));
        cb(null, `${filename}.${ext}`)
    }
})

var upload = multer({
    storage: storage
})





//首页渲染
router.get("/", function(req, res, next){
    let pageSize = req.query.pageSize || 5;
    let page = req.query.page || 1;

    Topic.find()
    .sort({'_id':-1})
    // .limit(Number(pageSize)).skip(Number((page-1)*pageSize))
    .then(function(data){
        //深拷贝
        var str = JSON.stringify(data);
        data = JSON.parse(str);

        return res.render("index.html",{
            user: req.session.user,
            topics: data
        });
    })
    
})

//登录页面
router.get("/login", function(req, res){
    res.render("login.html");
})

//登录表单提交
router.post("/login", function(req, res){
    var body = req.body
    User.findOne({
        email: body.email,
        password: md5(md5(body.password))
    }, function(err, data){
        if(err){
            next(err);
        }

        if(!data){
            return res.status(200).json({
                err_code: 1,
                err_message: "用户名或密码错误"
            })
        }

        req.session.user = data;
        return res.status(200).json({
            err_code: 0,
            err_message: "登录成功"
        })
    })

})

//注册渲染
router.get("/register", function(req, res){
    return res.render("register.html");
})

//注册表单提交
router.post("/register", function(req, res){
    User.findOne({
        $or:[{email: req.body.email},{nickname: req.body.nickname}]
    }
    , function(err, data){
        if(err){
            next(err);
        }

        if(data){
            return res.status(200).json({
                err_code: 1,
                message: "用户名或密码重复"
            })
        }

        var body = req.body;
        //二次加密
        body.password = md5(md5(body.password));
        new User(body).save(function(err, user){
            if(err){
                next(err);
            }
            //注册成功，使用session记录用户的登录状态
            req.session.user = user;

            return res.status(200).json({
                err_code: 0,
                message: "ok"
            })
        });

                
            
        
    })
})

//登出
router.get("/logout", function(req, res){
    req.session.user = null;
    return res.redirect("/login")
})

//个人中心渲染
router.get("/profile", function(req, res, next){
    if(!req.session.user){
        return res.redirect("/login");
    }
    User.findById(req.query.id.replace(/"/g, ""), function(err, user){
        if(err){
            next(err);
        }
        user = JSON.parse(JSON.stringify(user));
        req.session.user = user;

        return res.render("settings/profile.html", {
            user: req.session.user
        })
    })
})

//修改个人中心页面
router.post("/profile", function(req, res){
    var body = req.body;
    var obj = {};
    for(var item in body){
        if(item != "id"){
            obj[item] = body[item];
        }
    }
    
    User.find({
        nickname: obj.nickname
    }, function(err, data){
        if(err){
            next(err);
        }

        if(data.length > 1){
            return res.render("settings/profile.html", {
                nick: "该昵称已存在",
                user: req.session.user
            })
        }

        User.findByIdAndUpdate(body.id.replace(/"/g, ""), obj, function(err, data){
            if(err){
                next(err);
            }
            return res.redirect("/")
    
        })

    })

})

//渲染话题页面
router.get("/topics/new", function(req, res){
    if(!req.session.user){
        return res.redirect("/login");
    }
    return res.render("topic/new.html",{
        user: req.session.user
    });
})



//上传头像
router.post("/upload", upload.single("file"), function(req, res, next){
    var size = req.file.size;
    var types = ["jpg", "jpeg", "png", "gif"]
    var mimetype = req.file.mimetype.split("/")[1];
    if(size > 500000){
        return res.send({err_code: -1, err_msg: "图片尺寸过大"});
    }
    if(types.indexOf(mimetype) == -1){
        return res.send({err_code: -2, err_msg: "媒体文件格式不符"});
    }
    
    var user = req.session.user;
    var avatarSrc = `/upload/${req.file.filename}`;
    User.findByIdAndUpdate(user._id, {
        avatar: avatarSrc
    }, function(err, data){
        if(err){
            next(err);
            return
        }
    })
    return res.send({err_code: 0, err_msg: "上传成功", src: avatarSrc});


    
})


//发表话题
router.post("/topics/new", function(req, res, next){
    if(!req.session.user){
        return res.redirect("/login");
    }
    var body = req.body;
    body.author = req.session.user._id;
    body.class = parseInt(body.class);
    body.createdTime = new Date();
    new Topic(body).save(function(err, data){
        if(err){
            next(err);
        }
        return res.redirect("/");
    })
})



//查看话题
router.get("/topics", function(req, res, next){
    var id = req.query.id.replace(/"/g, "");
    Topic.findById(id, function(err, data){
        if(err){
            next(err);
        }
        data = JSON.parse(JSON.stringify(data));

     
        for(let i=0; i<data.comments.length; i++){
            let parentid = data.comments[i].parentid;
            if(!parentid){
                continue;
            }
            for(let j=0; j<data.comments.length; j++){
                if(data.comments[j]._id == parentid){
                    data.comments[i].parent = data.comments[j];
                    break;
                }
            }
            
        }

        User.findById(data.author, function(err, author){
            if(err){
                next(err)
            }
            author =  JSON.parse(JSON.stringify(author))
            return res.render("topic/show.html",{
                user: req.session.user,
                topic: data,
                author: author,
       
            })
        })
    })
})

//话题点赞
router.post("/topiclike", function(req, res, next){
    if(!req.session.user){
        return res.send({
            err_code:401,
            err_message: "请先登录"
        })
    };

    var topicId = req.body.id;
    User.findById(req.session.user._id, (err, data) => {

        if(err){
            next(err)
        }
    
        if(data.likedPost.includes(topicId)){
            return res.json({
                err_code: 2
            })       
        }
        
        data.likedPost.push(topicId);
        
        data.save(err=>next(err));

        Topic.findById(topicId, function(err, data){
            if(err){
                return next(err)
            }
            
            data.likes ++;
            data.save(err=>next(err));
        
            return res.json({
                likes: data.likes
            });
        })
    })
        
})

//发表评论

router.post("/topics", function(req, res, next){
    //实现页面跳转，先渲染页面，之后在页面中通过bom元素实现跳转
    if(!req.session.user){
        return res.render("pleaseLogin.html", {
            msg: "请先登录"
        });
    };

    

    var id = req.body.id;
   
    Topic.addComment(id, req.body.content, req.session.user, function(json, data){
        if(json.err_code == 0){
            //重定向防止页面刷新
           return res.redirect(`/topics/?id=${id}`)
        }      
    })
})

//评论点赞
router.post("/like", function(req, res, next){

    if(!req.session.user){
        return res.send({
            err_code:401,
            err_message: "请先登录"
        })
    }
    let topicId = req.body.topicId;
    let commentId = req.body.commentId;

    User.findById(req.session.user._id, function(err, data){
        if(err){
            return next(err);
        }

        var obj = {
            post: topicId,
            comment: commentId
        } 
        for(let i=0; i<data.likedComment.length; i++){
            if(data.likedComment[i].post == topicId && data.likedComment[i].comment==commentId){
            
                return res.json({
                    err_code: 2
                });
            }
        }
        data.likedComment.push(obj);
        data.save(err=>{
            if(err) return next(err);
        });

        Topic.findById(topicId, function(err, data){
            if(err){
                return console.log("err");
            }
            
            data.comments.id(commentId).likes ++;
            data.save(err=>{
                if(err) return next(err);
            });
  
            return res.json({
                likes: data.comments.id(commentId).likes
            });
        })
    })

})


//评论回复
router.post("/comments", (req, res, next) => {

    if(!req.session.user){
        return res.send({
            err_code:401,
            err_message: "请先登录"
        })
    }

    Topic.addComment(req.body.topicid, req.body.content,req.session.user, function(json, data){
        return res.json(json)
    }, req.body.parentid)
})


module.exports = router;