var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var token = require('jsonwebtoken');

var multiparty = require('multiparty');//上传文件模块

//创建一个数据库连接对象
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "supermarket"
})

con.connect();//连接数据库
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

//登录
router.post('/login', (req, res) => {
  //连接数据库
  // var sql = "SELECT * FROM user where acc='"+ req.query.acc +"' AND pwd='"+ req.query.pwd +"'";
  var sql = `SELECT * FROM user where acc='${req.body.acc}' AND pwd='${req.body.pwd}'`;
  // var sql = "insert into user(acc,pwd) values('ymk','123')"
  //执行sql语句
  con.query(sql, (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      //登录成功
        //创建一个token对象
        //三个参数  第一个为要保存的数据  第二个为签名 第三个为需要保存的时间
        var tokenid = token.sign({}, 'cyp', {
          expiresIn: 60*60 //过期时间 单位为秒
        })
      res.send({
        id: result[0].id,
        msg: "登录成功",
        token:tokenid,//返回tokenid
        usergroup:result[0].usergroup,//返回用户组
        headerImg:result[0].headerImg,//返回头像
      })
    } else {
      res.send({
        code: "0",
        msg: "登录失败"
      })
    }
  })
})

//token验证
router.get('/tokenCheck',(req,res) => {
  let {tokenid} = req.query;
  token.verify(tokenid,'cyp',(err,decode) => {
    if(err){
      //表示过期
      res.send('fail');
    }else{
      res.send('ok');
    }
  })
})


//添加账号
router.post('/index/zh-accont-add', (req, res) => {
  //接收参数
  let { acc, pwd, usergroup } = req.body;
  //创建sql语句
  let sql = `insert into user(acc,pwd,usergroup) values('${acc}','${pwd}','${usergroup}')`;
  con.query(sql, (err, result) => {
    if (err) throw err;
    result ? res.send("ok") : res.send("fail");
  })
})

//账户管理
router.get('/index/zh-accont-man', (req, res) => {
  let {pageSize,currentPage} = req.query;
  let total;
  let sql = `select acc,usergroup,id,headerimg from user`;
  con.query(sql, (err, result) => {
    if (err) throw err;
    //后台需要返回给前台两个数据 总数 与 每页显示的条数
    total = result.length;//总条数
  })
  let n = (currentPage-1)*pageSize;
  sql += ` limit ${n},${pageSize}`;
  con.query(sql,(err,result)=>{
    if(err) throw err;
    res.send({total,result})//将总页数以及每页的数量发送给前台
  })
})

//修改密码
router.post('/index/zh-pwd-change', (req, res) => {
  let { newpwd, id, oldpwd } = req.body;
  let sql1 = `SELECT * FROM user where id='${id}' AND pwd='${oldpwd}'`

  con.query(sql1, (err, result) => {
    if (result.length > 0) {
      let sql = `update user SET pwd="${newpwd}" where id = ${id}`
      con.query(sql, (err, result) => {
        if (err) throw err;
        if (result) {
          res.send({
            msg: "ok"
          })
        } else {
          res.send({
            msg: "fail"
          })
        }
      })
    } else {
      res.send("pwderror")
    }
  })


})

//删除用户
router.get('/deleteUser', (req, res) => {
  let { deleteacc } = req.query;
  let sql = `delete from user where id=${deleteacc}`;
  con.query(sql, (err, result) => {
    if (err) throw err;
    result ? res.send("ok") : res.send("fail")
  })
})



//修改内容
router.get('/userEdit',(req,res)=>{
  let {id,value} = req.query;
  let sql = `update user set acc='${value}' where id = ${id}`;
  con.query(sql,(err,result)=>{
    if(err) throw err;
    if(result){
      res.send('ok');
    }else{
      res.send('fail')
    }
  })
})

/*----------------------------------------------------------*/
//商品管理
//添加商品
router.get('/addproduct',(req,res) => {
  let {code,name,type,price,marketprice,promotion,stock,inprice} = req.query;
  let sql = `insert into goods(code,name,type,price,marketprice,promotion,stock,inprice) values(${code},'${name}','${type}',${price},${marketprice},'${promotion}',${stock},${inprice})`;
  con.query(sql,(err,result) => {
    if(err) throw err;
    if(result){
      res.send('ok')
    }else{
      res.send('fail')
    }
  })
})

//获取商品列表
router.get('/getproduct',(req,res) => {
  let {currentPage,pageSize} = req.query;
  let sql = `select * from goods`;
  let totalcount; // 返回给前端的参数一 总数量
  con.query(sql,(err,result) => {
    if(err) throw err;
    totalcount = result.length;
  })
  let n = (currentPage-1)*pageSize;
  sql += ` limit ${n},${pageSize}`;
  con.query(sql,(err,result) => {
    if(err) throw err;
    if(result){
      res.send({totalcount,result});//返回总条数与数据源
    }
  })
})

//删除商品
router.get('/deleteproduct',(req,res) => {
  let {code} = req.query;
  let sql = `delete from goods where code = ${code}`;
  con.query(sql,(err,result) => {
    if(err) throw err;
    result?res.send('ok'):res.send('fail');
  })
})


//保存修改
router.get('/saveEdit',(req,res) => {
  let { code,price,inprice,marketprice,promotion } = req.query;
  let sql = `update goods set price=${price},inprice=${inprice},marketprice=${marketprice},promotion='${promotion}' where code = ${code}`
  con.query(sql,(err,result) => {
    if(err) throw err;
    if(result){
      res.send('ok')
    }else{
      res.send('fail')
    }
  })
})

//添加库存
router.get('/addstock',(req,res) => {
  let { code,stock,inprice} = req.query;
  let sql = `update goods set stock = stock+${stock},inprice = ${inprice}  where code = ${code}`;
  con.query(sql,(err,result) => {
    if(err) throw err;
    if(result) res.send('ok');
    else res.send('fail');
  })
})

//搜索
router.get('/searchproduct',(req,res)=>{
  let {value,currentPage,pageSize} = req.query;
  let n = (currentPage-1)*pageSize;
  let leng;//长度
  let sql = `select * from goods where name like '%${value}%' or type like '%${value}%'`;
  con.query(sql,(err,result) => {
    if(err) throw err;
    leng = result.length;
  })
  sql += ` limit ${n},${pageSize}`;
  con.query(sql,(err,data) => {
    if(err) throw err;
    if(data) res.send({leng,data});
  })
})

//上传文件
router.post('/upload',(req,res)=>{
  //生成multiparty对象，并配置上传目标路径
  var form = new multiparty.Form({ uploadDir: './public/headimgs/' });

  //上传完成后处理
  form.parse(req, function (err, fields, files) {
      var filesTmp = JSON.stringify(files, null, 2);
      if (err) {
          console.log('parse error: ' + err);
          //错误
      }
      else {
          var inputFile = files.inputFile[0];
          var uploadedPath = inputFile.path;
          //成功
          //public\headimgs\mtFOuT2Dj8x4uTm6VUcW3sZv.jpg
          //http://localhost:3000/headimgs/mtFOuT2Dj8x4uTm6VUcW3sZv.jpg
          var str = uploadedPath.replace(/public\\/,'http://localhost:3000/');
          var newstr = str.replace(/\\/,'/');
          //注意uploadedPath路径的转化!!!!
          //拼接sql
          var sql = `update user set headerImg='${newstr}' where id =${req.query.id}`;
          con.query(sql,(err,result)=>{
            if(err) throw err;
            if(result){
              res.send(newstr);
            }else{
              res.send('fail');
            }
          })
         
      }
  });
})

//出库管理
router.get('/reducestock',(req,res) => {
  let {code,saled} = req.query;
  let sql = `update goods set saled=ifNUll(saled,0)+${saled} where code=${code}`;
  con.query(sql,(err,result) => {
    if(err) throw err;
    if(result) res.send('ok');
    else res.send('fail')
  })
})

//获取统计数据
router.get('/getEchartsData', (req, res) => {

  var sql = `SELECT
              count(type = '饮品' OR NULL) AS 饮品,
              count(type = '零食' OR NULL) AS 零食,
              count(type = '香烟' OR NULL)  AS 香烟,
              count(type = '酒类' OR NULL)  AS 酒类,
              count(type = '日用' OR NULL)  AS 日用
          FROM goods`

  con.query(sql, (err, result) => {
      if(err) throw err

      if(result.length > 0){
          //成功
          res.send(result)
      }else{
          //失败
          res.send('fail')
      }
  })

})

//批量删除
router.get('/batchDel',(req,res)=>{
  let {idArr} = req.query;
  var sql = `delete from user where id in (${idArr})`
  con.query(sql,(err,result)=>{
    if(err) throw err;
    if(result){
      res.send('ok')
    }else res.send('fail')
  })
})

module.exports = router;
