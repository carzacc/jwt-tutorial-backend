var express = require('express');
var jwt = require('jsonwebtoken');
var sqlite = require('sqlite3');
var crypto = require('crypto');

const KEY = "kissing-dressage-contrite-lied-yanine-electrum-unendingsukiyaki-pays44";

var db = new sqlite.Database("users.sqlite3");

var app = express();


app.post('/signup', express.urlencoded(), function(req, res) {
  // in a production environment you would ideally add salt and store that in the database as well
  // or even use bcrypt instead of sha256. No need for external libs with sha256 though
  var password = crypto.createHash('sha256').update(req.body.password).digest('hex');
  db.get("SELECT FROM users WHERE username = ?", [req.body.username], function(err, row) {
    if(row != undefined ) {
      console.error("can't create user " + req.body.username);
      res.status(409);
      res.send("An user with that username already exists");
    } else {
      console.log("Can create user " + req.body.username);
      db.run('INSERT INTO users(username, password) VALUES (?, ?)', [req.body.username, password]);
      res.status(201);
      res.send("Success");
    }
  });
});

app.post('/login', express.urlencoded(), function(req, res) {
  console.log(req.body.username + " attempted login");
  var password = crypto.createHash('sha256').update(req.body.password).digest('hex');
  db.get("SELECT * FROM users WHERE (username, password) = (?, ?)", [req.body.username, password], function(err, row) {
    if(row != undefined ) {
      var payload = {
        username: req.body.username,
      };

      var token = jwt.sign(payload, KEY, {algorithm: 'HS256', expiresIn: 30}); //30  (number) means seconds, or string "15d"
      console.log("Success");
      res.send(token);
    } else {
      console.error("Failure");
      res.status(401)
      res.send("There's no user matching that");
    }
  });
});

app.get('/data', function(req, res) {
  var str = req.get('Authorization');
  var textToSend = "";
  try {
    jwt.verify(str, KEY, {algorithm: 'HS256'});
    setTimeout(function () {
      res.send("Very Secret Data");
    }, 3000);
  } catch {
    if (jwt) {
      console.log("Bad Token")
      res.send("Bad Token");
    } else {
      res.status(401);
      res.send("No JWT");
    }
  }

});

let port = process.env.PORT || 3000;
app.listen(port, function () {
    return console.log("Started user authentication server listening on port " + port);
});
