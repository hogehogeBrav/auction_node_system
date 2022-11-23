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
// app.use(express.static(__dirname + "/js" , {index: false}));
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

app.get('/auction/:auction_ID', (req, res) => {
  connection.query(
    `SELECT * , MAX(auction_bid.amount) as max_amount FROM auction 
    INNER JOIN stock
    ON (auction.car_ID = stock.car_ID)
    INNER JOIN model
    ON (stock.car_model_ID = model.car_model_ID)
    INNER JOIN maker
    ON (model.maker_ID = maker.maker_ID)
    INNER JOIN auction_bid
    ON (auction.auction_ID = auction_bid.auction_ID)
    AND (auction.auction_ID = ` + req.params.auction_ID + `);`, 
    (error, results) => {
      console.log(results);
      console.log(req.params);
      if (error) {
        console.log('error connecting: ' + error.stack);
        res.status(400).send({ message: 'Error!!' });
        return;
      }
      const now = new Date();
      const finish = new Date(results[0].ending_time);
      const diff = finish.getTime() - now.getTime();
      res.render('auction_room.ejs', {
        auction: results,
        id: req.query.id,
        name: req.query.username,
      }); 
    });
});

app.post('/auction', (req, res) => {
  let values = [
    req.body.auctionid,
    req.body.id,
    req.body.amount,
  ];

  console.log(values);

  connection.query(
    "INSERT INTO auction_bid (auction_ID, user_ID, amount) VALUES (? , ? , ?);" ,
    values,
    (error, results , fields) => {
      if (error) {
        console.log('error connecting: ' + error.stack);
        res.status(400).send({ message: 'Error!!'});
        return;
      }
      res.write(JSON.stringify({ message: 'Success!!' }));
    }
  );
});

io_socket.on('connection', function(socket){
  console.log('connected');
  socket.on('c2s' , function(msg){
    io_socket.to(msg.auctionid).emit('s2c', msg);
  });
  socket.on('c2s-join', function(msg){
    console.log('c2s-join:' + msg.auctionid);
    socket.join(msg.auctionid);
  });
});

http_socket.listen(9000);