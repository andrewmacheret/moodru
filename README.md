moodru
======

0. Prereqs:
 * A unix server with port 80 open
 * Node.js

1. Clone the repo
cd /home/andrewm/node
git clone https://github.com/andrewmacheret/moodru.git

2. Install the following npm files:
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

3. create a file /home/andrewm/node/express.json (with permissions 600) that contains the following: 
{
"key": "connect.sid",
"secret": "<secret key>"
}

4. create a file /home/andrewm/node/facebook.json (with permissions 600) that contains the following:
{
"clientID": "<facebook clientId>",
"clientSecret": "<facebook clientSecret>"
}

5. Start the node server

Either go to that directory and typing:
sudo node moodru.js

... or to run it in "forever" mode:
sudo forever start moodru.js

6. Test it by going to http://andrewmacheret.com/moodru

