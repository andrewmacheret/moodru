moodru
======

1. Prereqs:
 * A unix server with the following installed
   * Node.js
   * mongodb
 * the domain name andrewmacheret.com pointing to that server
 * port 80 open on that server

1. Clone the repo
```sh
cd
mkdir node
cd node
git clone https://github.com/andrewmacheret/moodru.git
```

1. Install the following npm files:
```sh
cd /home/andrewm/node
npm install express
npm install file
npm install forever
npm install socket.io
npm install mongodb
npm install mongoose
npm install mongoose-types
npm install passport
npm install passport-facebook
npm install passport-google
npm install passport.socketio
npm install when
```

1. create a file `/home/andrewm/node/express.json` (with permissions `600`) that contains the following: 
```json
{
"key": "connect.sid",
"secret": "<secret key>"
}
```

1. create a file `/home/andrewm/node/facebook.json` (with permissions `600`) that contains the following:
```json
{
"clientID": "<facebook clientId>",
"clientSecret": "<facebook clientSecret>"
}
```

1. Start the node server
Either go to that directory and typing:
```sh
sudo node moodru.js
```
... or to run it in "forever" mode:
```sh
sudo forever start moodru.js
```

1. Test it by going to http://andrewmacheret.com/moodru

