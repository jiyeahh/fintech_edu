const express = require('express')
const path = require('path')
const request = require('request');
const app = express()
const jwt = require('jsonwebtoken');
const auth = require("./lib/auth")
const companyId = "M202111589U"
var moment = require('moment');
// json타입에 데이터 전송을 허용한다
app.use(express.json());
//form타입에 데이터 전송을 허용한다
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));//to use static asset

//뷰파일이 있는 디렉토리를 설정하는 코드
app.set('views', __dirname + '/views');
//뷰엔진으로 ejs를 사용함
app.set('view engine', 'ejs');

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'password',
  database : 'fintech210222'
});
 
connection.connect();
// connection.query('SELECT * FROM user;', function (error, results, fields) {
//     console.log(results);
// });
// connection.end();

// app.get('/user', function (req, res) {
//     connection.query('SELECT * FROM user;', function (error, results, fields) {
//         console.log(results);
//         res.send(results)
//     });
// })
 
app.get('/', function (req, res) {
  res.send('Hello World');
})
app.get('/signup', function (req, res) {
  res.render('signup');
})
app.get('/login', function (req, res) {
  res.render('login');
})
app.get('/main', function (req, res) {
  res.render('main');
})
app.get('/balance', function (req, res) {
  res.render('balance');
})
app.get('/qrcode', function (req, res) {
  res.render('qrcode');
})
app.get('/qrreader', function (req, res) {
  res.render('qrreader');
})
app.get('/authTest', auth, function (req, res) {
  res.send('정상적으로 로그인 되셨습니다.');
})
app.get('/authResult', function (req, res) {
  var authCode = req.query.code;
  var option = {
    method : "POST",
    url : "https://testapi.openbanking.or.kr/oauth/2.0/token",
    header : {
        'Content-Type' : 'application/x-www-form-urlencoded'
    },
    form: {
      code: authCode,
      client_id: "89358db6-c434-40fe-9ae2-a2254dc1506a",
      client_secret: "4ada8450-c969-4af7-b622-c605f341f7d6",
      redirect_uri: "http://localhost:3000/authResult",
      grant_type: "authorization_code",
    }
  }
  request(option, function(err, response, body){
      if(err){
        console.error(err);
        throw err;
      }
      else {
        var accessRequestResult = JSON.parse(body);
        // console.log(accessRequestResult);
        res.render('resultChild', { data: accessRequestResult });
      }
  })
})
 
app.post('/signup', function(req, res) {
  var userName = req.body.userName;
  var userEmail = req.body.userEmail;
  var userPassword = req.body.userPassword;
  var userAccessToken = req.body.userAccessToken;
  var userRefreshToken = req.body.userRefreshToken;
  var userSeqNo = req.body.userSeqNo;

  // console.log(userName, userEmail, userPassword, userAccessToken);
  var sql = "INSERT INTO user (name, email, password, accesstoken, refreshtoken, userseqno) VALUES (?,?,?,?,?,?)";
  connection.query(sql,[userName, userEmail, userPassword, userAccessToken, userRefreshToken, userSeqNo], function (err, result) {
      if(err){
          console.error(err);
          throw err;
      }
      else {
          res.json(1);
      }
  });
})

app.post('/login', function(req, res){
  var userEmail = req.body.userEmail;
  var userPassword = req.body.userPassword;
  // console.log(userEmail, userPassword)
  var sql = "SELECT * FROM user WHERE email = ?";
  connection.query(sql, [userEmail], function(err, result){
      if(err){
          console.error(err);
          res.json(0);
          throw err;
      }
      else {
          if(result.length == 0){
              res.json(3)
          }
          else {
              var dbPassword = result[0].password;
              if(dbPassword == userPassword){
                  var tokenKey = "f@i#n%tne#ckfhlafkd0102test!@#%"
                  jwt.sign(
                    {
                        userId : result[0].id,
                        userEmail : result[0].email
                    },
                    tokenKey,
                    {
                        expiresIn : '10d',
                        issuer : 'fintech.admin',
                        subject : 'user.login.info'
                    },
                    function(err, token){
                        console.log('로그인 성공', token)
                        res.json(token)
                    }
                  )            
              }
              else {
                  res.json(2);
              }
          }
      }
  })

})
app.post('/list', auth, function (req, res) {
  var user = req.decoded;
  var sql = "SELECT * FROM user WHERE id = ?";
  connection.query(sql,[user.userId], function(err, result){
    if(err) throw err;
    else {
      var dbUserData = result[0];
      // console.log('db**********', dbUserData);
      var option = {
          method : "GET",
          url : "https://testapi.openbanking.or.kr/v2.0/user/me",
          headers : {
              Authorization : "Bearer " + dbUserData.accesstoken
          },
          qs : {
              user_seq_no : dbUserData.userseqno
          }
      }
      request(option, function(err, response, body){
          if(err){
              console.error(err);
              throw err;
          }
          else {
              var listRequestResult = JSON.parse(body);
              res.json(listRequestResult)
          }
      })        

    }
  })
})
app.post('/balance', auth, function (req, res) {
  var user = req.decoded;
  var finusenum = req.body.fin_use_num
  var sql = "SELECT * FROM user WHERE id = ?";
  var countnum = Math.floor(Math.random() * 1000000000) + 1;
  var transId = companyId + countnum;
  // console.log(transId);
  var transdtime = moment(new Date()).format('YYYYMMDDhhmmss');

  connection.query(sql,[user.userId], function(err, result){
    if(err) throw err;
    else {
      var dbUserData = result[0];
      var option = {
          method : "GET",
          url : "https://testapi.openbanking.or.kr/v2.0/account/balance/fin_num",
          headers : {
              Authorization : "Bearer " + dbUserData.accesstoken
          },
          qs : {
            bank_tran_id: transId,
            fintech_use_num: finusenum,
            tran_dtime: transdtime
          }
      }
      request(option, function(err, response, body){
          if(err){
              console.error(err);
              throw err;
          }
          else {
              var balanceRequestResult = JSON.parse(body);
              res.json(balanceRequestResult)
          }
      })        

    }
  })
})
app.post('/transactionList', auth, function (req, res) {
  var user = req.decoded;
  var finusenum = req.body.fin_use_num
  var sql = "SELECT * FROM user WHERE id = ?";
  var countnum = Math.floor(Math.random() * 1000000000) + 1;
  var transId = companyId + countnum;
  // console.log(transId);
  var transdtime = moment(new Date()).format('YYYYMMDDhhmmss');

  connection.query(sql,[user.userId], function(err, result){
    if(err) throw err;
    else {
      var dbUserData = result[0];
      var option = {
          method : "GET",
          url : "https://testapi.openbanking.or.kr/v2.0/account/transaction_list/fin_num",
          headers : {
              Authorization : "Bearer " + dbUserData.accesstoken
          },
          qs : {
            bank_tran_id: transId,
            fintech_use_num: finusenum,
            tran_dtime: transdtime,
            inquiry_type: "A",
            inquiry_base: "D",
            from_date: "20210224",
            to_date: "20210225",
            sort_order: "D"

          }
      }
      request(option, function(err, response, body){
          if(err){
              console.error(err);
              throw err;
          }
          else {
              var transactionRequestResult = JSON.parse(body);
              res.json(transactionRequestResult)
          }
      })        

    }
  })
})
app.post('/balance', auth, function (req, res) {
  var user = req.decoded;
  var finusenum = req.body.fin_use_num
  var sql = "SELECT * FROM user WHERE id = ?";
  var countnum = Math.floor(Math.random() * 1000000000) + 1;
  var transId = companyId + countnum;
  // console.log(transId);
  var transdtime = moment(new Date()).format('YYYYMMDDhhmmss');

  connection.query(sql,[user.userId], function(err, result){
    if(err) throw err;
    else {
      var dbUserData = result[0];
      var option = {
          method : "GET",
          url : "https://testapi.openbanking.or.kr/v2.0/account/balance/fin_num",
          headers : {
              Authorization : "Bearer " + dbUserData.accesstoken
          },
          qs : {
            bank_tran_id: transId,
            fintech_use_num: finusenum,
            tran_dtime: transdtime
          }
      }
      request(option, function(err, response, body){
          if(err){
              console.error(err);
              throw err;
          }
          else {
              var balanceRequestResult = JSON.parse(body);
              res.json(balanceRequestResult)
          }
      })        

    }
  })
})
app.post('/withdraw', auth, function (req, res) {
  //사용자 출금이체 API

  var user = req.decoded;
  var finusenum = req.body.fin_use_num
  var countnum = Math.floor(Math.random() * 1000000000) + 1;
  var amount = req.body.amount
  var transId = companyId + countnum;
  var transdtime = moment(new Date()).format('YYYYMMDDhhmmss');
  var sql = "SELECT * FROM user WHERE id = ?";

  console.log(req.body);
  connection.query(sql, [user.userId], function (err, result) {
    if (err) throw err;
    else {
      //requset 출금 이체 Api 요청하기
      var dbUserData = result[0];
      var option = {
        method: "POST",
        url: "https://testapi.openbanking.or.kr/v2.0/transfer/withdraw/fin_num",
        headers: {
          Authorization: "Bearer " + dbUserData.accesstoken
        },
        json: {
          "bank_tran_id": transId,
          "cntr_account_type": "N",
          "cntr_account_num": "098709871234",
          "dps_print_content": "asdfasf",
          "fintech_use_num": finusenum,
          "wd_print_content": "오픈뱅킹출금1",
          "tran_amt": amount,
          "tran_dtime": transdtime,
          "req_client_name": "한지예",
          "req_client_fintech_use_num": finusenum,
          "req_client_num": "HONGGILDONG1234",
          "transfer_purpose": "ST",
          "recv_client_name": "홍길동",
          "recv_client_bank_code": "097",
          "recv_client_account_num": "098709871234"
        }
      }
      request(option, function (err, response, body) {
        if (err) {
          console.error(err);
          throw err;
        }
        else {
          var withdrawRequestResult = body;
          if (withdrawRequestResult.rsp_code === "A0000") {
            var countnum2 = Math.floor(Math.random() * 1000000000) + 1;
            var transId2 = companyId + countnum2;
            var transdtime2 = moment(new Date()).format('YYYYMMDDhhmmss');
            var option = {
              method: "POST",
              url: "https://testapi.openbanking.or.kr/v2.0/transfer/deposit/fin_num",
              headers: {
                Authorization: "Bearer " + "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJNMjAyMTExNTg5Iiwic2NvcGUiOlsib29iIl0sImlzcyI6Imh0dHBzOi8vd3d3Lm9wZW5iYW5raW5nLm9yLmtyIiwiZXhwIjoxNjIyMDg2Nzc3LCJqdGkiOiJmMTMyMTk1Ni1iMjcwLTRlNjItOTk0NC0wN2MxYzNkODliNWQifQ.GbX_mmtp-I9TZbmiSh6zYz6mjk02JLZgoitqcDvCRYs"
              },
              //get 요청을 보낼때 데이터는 qs, post 에 form, json 입력가능
              json: {
                "cntr_account_type": "N",
                "cntr_account_num": "098709871234",
                "wd_pass_phrase": "NONE",
                "wd_print_content": "환불금액",
                "name_check_option": "off",
                "tran_dtime": transdtime2,
                "req_cnt": "1",
                "req_list": [
                  {
                    "tran_no": "1",
                    "bank_tran_id": transId2,
                    "fintech_use_num": req.body.to_fin_use_num,
                    "print_content": "쇼핑몰환불",
                    "tran_amt": req.body.amount,
                    "req_client_name": "홍길동",
                    "req_client_num": "HONGGILDONG1234",
                    "req_client_fintech_use_num": req.body.fin_use_num,
                    "transfer_purpose": "ST"
                  }
                ]
              }
            }
            request(option, function (error, response, body) {
              console.log(body);
              res.json(body);
            });
          
          }
          //입금 api 실행 A0000 res_code 입급이체 발생
        }
      })
    }
  })
})
app.listen(3000)