const express = require('express')
const path = require('path')
const request = require('request');
const app = express()
var jwt = require('jsonwebtoken');

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
        console.log(accessRequestResult);
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

  console.log(userName, userEmail, userPassword, userAccessToken);
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
  console.log(userEmail, userPassword)
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


app.listen(3000)
