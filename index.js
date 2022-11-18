"use strict"
var db = require("./settings/db");
const express = require('express');
const app = express();
const http_socket = require('http').Server(app);
const io_socket = require('socket.io')(http_socket);
const passport = require('passport');
const mysql = require('mysql2');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/view" , {index: false}));
app.use(express.static(__dirname + "/public" , {index: false}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const connection = mysql.createConnection({
  host: db.dbHost,
  user: db.dbUser,
  password: db.dbPassword,
  port: db.dbPort,
  database: db.dbDatabase
});

// ログイン認証
app.use(passport.initialize());

const LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  function(email, password, done){
    const values = [
      email,
      password
    ];
    connection.query(
      "SELECT * FROM user WHERE email = ? AND pass = ?;" , values , 
      (error, results) => {
        if (error) {
          console.log('error connecting: ' + error.stack);
          return;
        }
        const count = results.length;
        if (count == 0) {
          return done(null, false); //NG
        }else{
          return done(null, results[0]); //OK
        }
      }
    );
  }
));


app.get('/', (req, res) => {
  connection.query(
    "SELECT * FROM user;" ,
    (error, results) => {
      if (error) {
        console.log('error connecting: ' + error.stack);
        res.status(400).send({ message: 'Error!!' });
        return;
      }
      res.render('index.ejs' , {values:results});
    }
  );
});

app.get('/', (req, res) => {
  res.render('index.ejs')
});

app.get('/login', (req, res) => {
  res.render('login.ejs');
});
// ログイン認証
app.post('/login', passport.authenticate('local', {
  session: false,
  failureRedirect: '/login'
}),
  function(req, res) {
    connection.query(
      `SELECT auction.auction_ID, model.name, maker.maker_name, auction.start_time, auction.ending_time 
      FROM auction 
      JOIN stock ON auction.car_ID = stock.car_ID 
      JOIN model ON stock.car_model_ID = model.car_model_ID 
      JOIN maker ON model.maker_ID = maker.maker_ID;` ,
      (error, results) => {
        console.log(results);
        if (error) {
          console.log('error connecting: ' + error.stack);
          res.status(400).send({ message: 'Error!!' });
          return;
        }
        res.render('auction.ejs', {
          auction: results,
          id: req.user.user_ID,
          name: req.user.name
        });
      });
  }
);

http_socket.listen(9000);