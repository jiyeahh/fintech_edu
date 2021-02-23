const express = require('express')
const app = express()

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
connection.query('SELECT * FROM user;', function (error, results, fields) {
    console.log(results);
});
// connection.end();

 
app.get('/', function (req, res) {
  res.send('Hello World')
})

app.get('/user', function (req, res) {
    connection.query('SELECT * FROM user;', function (error, results, fields) {
        console.log(results);
        res.send(results)
    });
})

app.get('/ejs', function (req, res) {
    res.render('ejsTest');
})
 
app.listen(3000)
