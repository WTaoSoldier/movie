const mysql = require('mysql');

var pool = mysql.createPool({
    // host: "127.0.0.1",
    // port: "3306",
    // user: "root",
    // password:"",
    // database:"pro",

    // 新浪云上的配置参数
    host     : "w.rdc.sae.sina.com.cn",
    port     : "3306",
    user     : "zkn23zlmw0",
    password : "m33x00mlm5l2hjlkm30l3wyjm5wmy1lz2jhm3kl5",
    database : 'app_giao',

    connectionLimit: 10
});

module.exports = pool;