const express = require('express');
const serve = express();
//引入cors跨域模块
const cors = require('cors');
//引入pool.js连接池模块
const pool = require("./pool.js");
const bodyParser = require('body-parser');
//邮件服务器
const nodemailer = require('nodemailer');

//动画
const ora = require('ora');

//命令行颜色
const chalk = require('chalk');
const { constants } = require('buffer');

//动画字颜色
const spinner = ora(chalk.green('app.js serve启动成功'));

//配置邮件服务地址
var mailTransport = nodemailer.createTransport({
    host: 'smtp.qq.com',
    secureConnection: true, // 使用SSL方式（安全方式，防止被窃取信息）
    auth: {
        user: '2609942080@qq.com',
        pass: 'emamigpekgblecjd'
    },
});


//配置cors跨域  cors({})  方法中参数是对象
serve.use(cors({
    origin: ['http://127.0.0.1:8081', 'http://localhost:8081', 'http://127.0.0.1:8080', 'http://localhost:8080', 'http://giao.applinzi.com']
}))

// serve.use(bodyParser.json({
//     extended:false
// }))
serve.use(bodyParser.urlencoded({
    extended: false
}))
////////////////////////////////////////////////////////////////////
//2.导航页面  navigtion
serve.get('/navigtion',(req,res)=>{
    let page = req.query.page;
    let pagesize = 20;
    let offset = (page-1)*pagesize;
    let sql='SELECT id,subject,fenlei,uname,avata,image,views,comment,xihuan,time FROM pro_article LIMIT '+offset+','+pagesize;
    // let rescount = 0;
    // let pagecount =0;
    pool.query(sql,(err,result)=>{
        if(err) throw err;
        res.send({massage:'查询成功',code:2001,result:result})
        /////////////////
        // 查询页数
        /* let sqlcount = 'SELECT COUNT(id) AS count FROM pro_article WHERE category_id=? '
        pool.query(sqlcount,[cid],(err,results)=>{
            if(err) throw err;
            rescount = results[0].count;
            pagecount = Math.ceil(rescount / pagesize);

            res.send({massage:'查询成功',code:2001,result:result,rescount:rescount,pagecount:pagecount})
        }) */
        ////////////////
    })

})

////////////////////////////////////////////////////////////////////
//3. 注册接口
//3.1.用户名验证
serve.post('/regName', (req, res) => {
    let username = req.body.username;
    let sql = 'SELECT id FROM pro_author WHERE username=?'
    pool.query(sql, [username], (err, result) => {
        if (err) throw err;
        if (result.length == 0) {
            res.send({ massage: '可以使用', code: 3001 })
        } else {
            res.send({ massage: '用户名已存在', code: 3000 })
        }
    })
})
//3.2.注册
serve.post('/register', (req, res) => {
    let username = req.body.username;
    let upwd = req.body.upwd;
    let uemail = req.body.uemail;
    // console.log(username,upwd);
    let sql = 'INSERT INTO pro_author (username,password,uemail) VALUE (?,MD5(?),?)'
    pool.query(sql, [username, upwd,uemail], (err, result) => {
        if (err) throw (err);
        res.send({ massage: '注册成功', code: 3002 })
    })
})
//3.3.邮箱服务器
serve.get('/send', function (req, res, next) {
    let uemail = req.query.uemail;
    let uname = req.query.uname;
    let upwd = req.query.upwd;
    var options = {
        from: '"摄影之家" <2609942080@qq.com>',
        to: '"亲爱的用户"' + '<' + uemail + '>',
        // cc         : ''  //抄送
        // bcc      : ''    //密送
        subject: '一封来自摄影之家的邮件',
        html: `<h1>尊敬的${uname}，您好！</h1><div style="border: 1px solid #000; background-color: #eee;padding: 30px;"><p><h4>点击链接即可激活您的摄影之家账号<a href="http://giao.applinzi.com/ifreg?uname=${uname}&upwd=${upwd}&uemail=${uemail}">点击此处激活账号</a></h4></p><p style="color: #666;">为保障您的帐号安全，请在24小时内点击该链接，您也可以将链接复制到浏览器地址栏访问。 若如果您并未尝试修改密码，请忽略本邮件，由此给您带来的不便请谅解。本邮件由系统自动发出，请勿直接回复！</p></div>` //接收激活请求的链接
    };

    mailTransport.sendMail(options, function (err, msg) {
        if (err) {
            console.log(err);
            res.render('index', { title: err });
        }
        else {
            console.log(msg);
            res.render('index', { title: "已接收：" + msg.accepted });
        }
    });
});

/////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////
// 4.登陆
serve.post('/login',(req,res)=>{
    let username=req.body.username;
    let password=req.body.password;
    let sql='SELECT username,nickname,avatar FROM pro_author WHERE username=? AND password=MD5(?)'
    pool.query(sql,[username,password],(err,result)=>{
        if(err) throw err;
        if(result.length == 0){
            res.send({massage:"用户名或者密码错误",code:4000});
        }else{
            res.send({massage:"登陆成功",code:4001,result:result[0].avatar})
        }
    })
})
// 搜索
///////////////////////////////////////////////////////////
const Segment = require('segment');
const segment = new Segment();
segment.useDefault(); // 载入默认词典
segment.loadDict('test.text'); // 载入字典，详见dicts目录，或者是自定义字典文件的绝对路径

serve.get('/search', (req, res) => {
    let key = req.query.key
    key = segment.doSegment(key, {
        stripPunctuation: true //去除标点符号
    })
    let _res = []
    for(let i=0;i<key.length;i++){
        if(key[i].w.length<2) continue
        console.log(key[i].w)
        let sql = "SELECT * FROM pro_article WHERE pro_article.subject LIKE ?"
        pool.query(sql, ["%"+key[i].w+"%"], (err, result) => {
            if (err) throw err;
            result.length!==0?_res=_res.concat(...result):""
            if (i == key.length - 1) {
                if (_res.length === 0) {
                    res.send({ massage: "没有数据", code: 400,data:[] });
                } else {
                    res.send({ massage: "搜索成功", code: 200, data: _res })
                }
            }
        })
        
    };

})



/////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////
//5.评论接口服务器部分
serve.get('/commall',(req,res)=>{
    //查询数据表中的这些字段的所有数据
    let sql = 'select userid,username,userimage,content,commtime from comm'
    //通过MYSQL连接池执行SQL语句
    //并把查询到的数据通过形参results传递赋值给results客户端接收
    pool.query(sql,(err,results)=>{
      if(err) throw err;
      res.send({message:'查询成功',code:1,results:results})
    })
});
//6.客户端提交评论的接口服务器部分
serve.post('/commvalue',(req,res)=>{
    //提交数据的username
    let username = req.body.username;
    //提交的评论内容
    let userx = req.body.userx;
    //打印看一下提交信息
    console.log('用户:'+username,'评论内容:'+userx);
    //查询username等于用户登录的username条件下
    //数据表中是否有此userid
    let sql = 'select userid from comm where username=?';
    pool.query(sql,[username],(error,results)=>{
        if(error) throw error;
        if(results.length !== 0){
            //如果用户名存在，results获取到的就不是空数组
            //假设提交的用户名是迟梦
            //我们就将相关评论写入数据表
            sql=`insert into comm(username,userimage,content,commtime) values("迟梦","a1.jpg",?,"2020-10-30")`
            pool.query(sql,[userx],(error,results)=>{
                if(error) throw error;
                res.send({message:'评论成功',code:1});
            })
        }else{
            //数据库没有该用户
            res.send({message:'评论成功',code:0});
        }
    })
});
///////////////////////////////////////////////////////////////////////////

//设置端口监听
serve.listen(5050, () => {
    // console.log(chalk.blue("app.js serve启动成功！"))

    // 动画引用
    spinner.start();
})


