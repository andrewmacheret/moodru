
exports.init = function(mongoose, config) {



  // INIT SOME DIRS AND URLS

  if (!config) config = {};
  var baseDir = config.baseDir || '/moodru';
  var port = config.port || 80;
  var protocol = config.protocol || (port == 443 ? 'https' : 'http' );
  var domain = config.domain || 'andrewmacheret.com';
  var baseUrl = config.baseUrl || protocol + '://' + domain + ':' + port + baseDir;
  var staticDir = config.staticDir || __dirname + '/static';
  var mongoUrl = config.mongoUrl || 'mongodb://127.0.0.1:27017/test';
  var User = config.models.user || {};



  // LOAD THE REQUIRED LIBS

  var fs = require('fs');
  var file = require('file');
  var express = require('express');
  var session = require('express-session');
  var cookieParser = require('cookie-parser');
  var app = express();
  var http = require('http');
  var server = http.createServer(app);
  var io = require('socket.io').listen(server, {resource: baseDir + '/socket.io'});
  var when = require('when');
  var nodefn = require('when/node/function');
  var passport = require('passport');
  var FacebookStrategy = require('passport-facebook').Strategy;
  var GoogleStrategy = require('passport-google').Strategy;
  var passportSocketIo = require("passport.socketio");
  var Schema = mongoose.Schema;


  // CONFIGURE AND LISTEN ON PORT

  // listen on port
  server.listen(port);

  var expressAuthRaw = fs.readFileSync(__dirname + '/express.json');
  expressAuth = JSON.parse(expressAuthRaw);
  expressAuth.store = new session.MemoryStore;

  // configure the express server
  app.use(cookieParser());
  app.use(session(expressAuth));
  app.use(passport.initialize());
  app.use(passport.session());


  // SERVE STATIC FILES

  // get the static files, and load a map of paths to point to those files
  var allowedPaths = {};
  file.walkSync(staticDir, function(dir, subdirs, files) {
    var path = dir.substring(staticDir.length);
    allowedPaths[baseDir + path] = dir + '/index.html';

    files.forEach(function(filename) {
      allowedPaths[baseDir + path + '/' + filename] = dir + '/' + filename;
    });
  });

  // define the paths allowed for a non-authenticated user
  var login_pages = {};
  login_pages[baseDir + '/login'] = true;
  login_pages[baseDir + '/login/index.html'] = true;
  login_pages[baseDir + '/css/login.css'] = true;
  login_pages[baseDir + '/js/login.js'] = true;
  login_pages[baseDir + '/images/moodru_main_logo.png'] = true;
  login_pages[baseDir + '/images/buttons.png'] = true;

  // have the server listen to all the allowed paths
  Object.keys(allowedPaths).forEach(function(relPath) {
    var fullPath = allowedPaths[relPath];
    console.log('path: ' + relPath + ' -> ' + fullPath);
    app.get(relPath, function(req, res) {
      var userString = (req.user ? req.user.id : '(not logged in)');

      // if the user is not logged in and not requesting to log in, then redirect to the login page
      if (!req.user && !login_pages.hasOwnProperty(relPath)) {
        console.log("requested " + relPath);
        console.log(userString + ' - redirecting to: ' + baseDir + '/login');
        res.redirect(baseDir + '/login');
        return;
      }

      console.log(userString + ' - sending file: ' + fullPath);
      res.sendfile(fullPath);
    });
  });



  // INIT SOCKET.IO

  // enable full debugging on socket.io
  io.set('loglevel', 10);



  // INIT DB

  // connect to db
  mongoose.connect(mongoUrl);
  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));



  // INIT LOGIN

  // read facebook.json for app key and secret key, and insert a callback url
  var facebookAuthRaw = fs.readFileSync(__dirname + '/facebook.json');
  facebookAuth = JSON.parse(facebookAuthRaw);
  facebookAuth.callbackURL = baseUrl + '/auth/facebook/return';

  // set up a function for creating a user
  var createUser = function(oauthId, profile, done) {
    console.log(oauthId + ' - creating user');

    User.upsert(oauthId, profile, function (err, user) {
      console.log(oauthId + (!err ? ' - created user' : ' - failed to create user'));
      console.log(oauthId + ' - CREATED: ' + JSON.stringify(user, null, 4));
      done(err, user);
    });
  }

  // set up and handle facebook authentication
  passport.use(new FacebookStrategy(facebookAuth,
    function(accessToken, refreshToken, profile, done) {
      var oauthId = 'facebook:' + profile.id;
      createUser(oauthId, profile, done);
    }
  ));

  // set up and handle google authentication
  passport.use(new GoogleStrategy({
      returnURL: baseUrl + '/auth/google/return',
      realm: baseUrl
    },
    function(identifier, profile, done) {
      var oauthId = 'google:' + identifier;
      createUser(oauthId, profile, done);
    }
  ));

  // set up authentication urls
  app.get(baseDir + '/auth/facebook', passport.authenticate('facebook'));
  app.get(baseDir + '/auth/google', passport.authenticate('google'));

  // set up authentication callback redirects
  var redirects = {
    successRedirect: baseDir + '/',
    failureRedirect: baseDir + '/login'
  };
  app.get(baseDir + '/auth/facebook/return', passport.authenticate('facebook', redirects));
  app.get(baseDir + '/auth/google/return', passport.authenticate('google', redirects));

  // set up a logout path
  app.get(baseDir + '/logout', function(req, res){
    var userString = (req.user ? req.user.id : '(not logged in)');
    console.log(userString + ' - logging out');
    req.logout();

    console.log(userString + ' - redirecting to: ' + baseDir + '/login');
    res.redirect(baseDir + '/login');
  });

  // serialize user object to id
  passport.serializeUser(function(user, done) {
    console.log(user._id + ' - serializeUser');
    //console.log(user._id + ' - DEBUGX: ' + JSON.stringify(user, null, 4));
    done(null, user._id);
  });

  // deserialize user object from id
  passport.deserializeUser(function(id, done) {
    console.log(id + ' - deserializeUser');
    User.findOne({_id: id}, function(err, user) {
      console.log(id + (!err ? ' - loaded user' : ' - failed to load user'));
      //console.log(id + ' - DEBUGX: ' + JSON.stringify(user, null, 4));
      done(err, user);
    });
  });



  // INIT SOCKET IO AUTHORIZATION

  io.set('authorization', passportSocketIo.authorize({
    cookieParser: cookieParser(),
    key:          expressAuth.key,
    secret:       expressAuth.secret,
    store:        expressAuth.store,
    fail: function(data, accept) {
      accept(null, false);
    },
    success: function(data, accept) {
      accept(null, true);
    }
  }));



  // RETURN THINGS THAT WILL BE USED

  return {
    io: io,
    when: when,
    nodefn: nodefn
  };

};


