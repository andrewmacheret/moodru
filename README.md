moodru
======

0. Prereqs:
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

2. Install the following npm files:
```sh
cd /home/andrewm/node
sudo npm install express
sudo npm install file
sudo npm install forever
sudo npm install socket.io
sudo npm install mongodb
sudo npm install mongoose
sudo npm install mongoose-types
sudo npm install passport
sudo npm install passport-facebook
sudo npm install passport-google
sudo npm install passport.socketio
sudo npm install when
```

3. create a file `/home/andrewm/node/express.json` (with permissions `600`) that contains the following: 
```json
{
"key": "connect.sid",
"secret": "<secret key>"
}
```

4. create a file `/home/andrewm/node/facebook.json` (with permissions `600`) that contains the following:
```json
{
"clientID": "<facebook clientId>",
"clientSecret": "<facebook clientSecret>"
}
```

5. Start the node server

Either go to that directory and typing:
```sh
sudo node moodru.js
```

... or to run it in "forever" mode:
```sh
sudo forever start moodru.js
```

6. Test it by going to http://andrewmacheret.com/moodru

