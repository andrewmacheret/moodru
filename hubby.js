// load mongoose
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Mixed = Schema.Types.Mixed;
var ObjectId = Schema.Types.ObjectId;

// define schemas
var schemas = {
  user: new Schema({
    oauthId: {type: String, index: {unique: true, dropDups: true}, required: true},
    created: {type: Date, default: Date.now},
    updated: {type: Date, default: Date.now},
    displayName: {type: String, trim: true, required: true}//,
    //profile: {type: Mixed}
  }),
  diary: new Schema({
    userId: {type: ObjectId, required: true},
    created: {type: Date, default: Date.now},
    updated: {type: Date, default: Date.now},
    emotions: {type: Mixed, required: true}
  })
};

// define methods
schemas.user.statics.upsert = function(oauthId, profile, callback) {
  var conditions = {
    oauthId: oauthId
  };
  var update = {
    $setOnInsert: {created: Date.now()},
    updated: Date.now(),
    displayName: profile.displayName//,
    //profile: profile
  };
  var options = {
    upsert: true
  };

  return models.user.findOneAndUpdate(conditions, update, options, callback);
}

// init models
var models = {};
Object.keys(schemas).forEach(function(schemaName) {
  models[schemaName] = mongoose.model(schemaName, schemas[schemaName]);
});



// init everything else
var config = {
  models: models,
  mongoUrl: 'mongodb://127.0.0.1:27017/test',
  domain: 'andrewmacheret.com',
  port: 80,
  baseDir: '/hubby',
  staticDir: __dirname + '/static'
};
var app = require('./init.js').init(mongoose, config);

var promise = app.nodefn.call;
var when = app.when;
var io = app.io;

var emotionList = [
  'suicide',
  'sadness',
  'anxiousness',
  'pain',
  'shame',
  'anger',
  'fear',
  'joy'
];
var emotionSet = {};
for (var i=0; i<emotionList.length; i++) {
  emotionSet[emotionList[i]] = true;
}

// on a new connection
io.sockets.on('connection', function (socket) {
  var user = socket.handshake.user;
  console.log(user._id + ' - socket connected');

  // find all diaries for this user
  console.log('finding where userId=' + user._id);
  models.diary.find({userId: user._id}, function(err, diaries) {
    if (err) {
      socket.emit('init', {err: err});
      return;
    }

    // emit an event with user info, diaries, and emotions
    socket.emit('init', {
      date: Date.now(),
      user: { userId: user.userId, displayName: user.displayName },
      diaries: diaries,
      emotions: emotionList
    });

  });

  socket.on('diary:put', function(data) {
    try {
      var emotions = {};
      console.log(user._id + ' - diary:put - DEBUG ' + JSON.stringify(data, null, 4));

      // for each emotion passed in
      for (var i=0; i<data.emotions.length; i++) {
        // get the name and value of each emotion
        var name = data.emotions[i].name;
        var value = Number(data.emotions[i].value);

        // validate the name and value
        if (emotionSet[name] !== true) throw 'invalid emotion... name=' + name;
        if (typeof value !== 'number' || value < 0 || value > 100) throw 'outofrange... name=' + name + ' value=' + value;

        // store it
        emotions[name] = value;
      }

      // make sure we have all emotions
      var total = Object.keys(emotions).length;
      if (total !== emotionList.length) throw 'not enough emotions... expected=' + emotionList.length + 'actual=' + total;

      // insert the diary!
      new models.diary({userId: user._id, emotions: emotions}).save(function(err, diary) {
        console.log(user._id + ' - diary:put - ' + (!err ? ' - saved' : ' - failed to save'));
        console.log(user._id + ' - DIARY: ' + JSON.stringify(diary, null, 4));

        if (err) {
          socket.emit('diary:put', {err: err});
          return;
        }

        socket.emit('diary:put', {date: Date.now(), diary: diary});
      });

    } catch(err) {
      console.log(user._id + ' - diary:put - ' + err);
      socket.emit('diary:put', {err: err});
    }
  });
});




