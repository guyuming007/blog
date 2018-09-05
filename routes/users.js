var express = require('express');
var router = express.Router();
const db = require('../models/db')
const crypto = require('crypto')
const moment = require('moment')
const formidable = require('formidable');
const path = require('path')
const fs = require('fs')
const gm = require('gm')
const ObjectId = require('mongodb').ObjectID

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
  //res.render('index', {title:'首页', active:'index'})
});

// 用户登录页面呈递
router.get('/login', function(req, res) {
  res.render('login', {'title':'登录', active:'login'})
})

// 用户注册页面呈递
router.get('/register', (req, res) => {
  res.render('register', {'title':'注册',active:'register'})
// 发送字符串，那么将被解释为html文件
// 例如，发送了一个post，然后我res.send("aaa")，那么网页将跳转到一个只有文本aaa的页面
})

// 注册功能
router.post('/register', (req, res, next) => {
  let {username, psw, sex, age} = req.body
  let avatar = '/img/avatar/avatar.jpg'
  if(username == '') {
    res.send('请输入你的用户名')
    return
  }
  if(psw == '') {
    res.send('请输入你的密码')
    return
  }

  db.find("users", {username}, (err, r) => {
    if(err) {
      console.log(err);
      next(err)
      return
    }
    // r  ==> []   ||  非空数组
    if(r.length == 0) {
      let md5 = crypto.createHash('md5')
      let sbt = parseInt(psw * 10000)+username
      let secretPsw = md5.update(sbt).digest('hex')
      db.insertDocument('users', [{username, secretPsw, sex, age, avatar}], (err,result) => {
        if(err) {
          console.log(err);
          next(err)
          return
        }
        res.redirect('/users/login')
      })
    }else {
      if(r[0].username == username) {
        res.send('用户名已被占用')
      }else {
        let md5 = crypto.creatHash('md5')
        let sbt = parseInt(psw * 10000)+username
        let secretPsw = md5.update(sbt).digest('hex')
        db.insertDocument('users', [{username, secretPsw, sex, age, avatar}], (err, result) => {
          if(err) {
            console.log(err);
            next(err)
            return
          }
          res.redirect('/users/login')
        })
      }
    }
  })
})

// 登录功能
router.post('/login', (req, res) => {
  let {username, psw} = req.body
  if(username == '') {
    res.send('请输入你的用户名')
    return
  }
  if(psw == '') {
    res.send('请输入你的密码')
    return
  }
  db.find('users', {username}, (err, r) => {
    if(err) {
      console.log(err);
      next(err)
      return
    }
    // r  ==>  []  ||  [{},{}]
    if(r.length == 0) {
      res.send('你的用户名不存在,请注册')
    }else {
      let md5 = crypto.createHash('md5')
      let sbt = parseInt(psw * 10000)+username
      let secretPsw = md5.update(sbt).digest('hex')
      if(r[0].username == username && r[0].secretPsw == secretPsw) {
        req.session.user = r[0]   // 会话状态使用
        res.redirect('/')
      }else {
        res.send('密码错误')
      }
    }
  })
})

// 注销功能
router.get('/logout', (req, res) => {
  req.session.user = null;
  res.redirect('/')
})

// 发表功能
router.post('/dopost', requiredLogin, (req, res) => {
  let {content} = req.body;
  let {username} = req.session.user;
  let time = Date.now(),comment = []; // 评论
    console.log(content, username, time, comment);
    db.insertDocument('posts',[{username,content,time,comment}], (err, r) => {
      if(err) {
          console.log(err);
          res.json(-1)
          return
      }
      res.json(1)
    })
})

// 呈递修改头像页面
router.get('/showavatar', (req, res) => {
    res.render('showavatar', {title:'设置个人头像', 'active':'index'})
})

module.exports = router;

// 会话状态  session(存的信息是加密过的,是一堆乱码)依赖于cookie

// 判断是否登陆状态  ==>  执行下一步
function requiredLogin(req, res, next) {
  if(req.session.user) {
    next()
  }else {
    req.json('-1')
  }
}

//