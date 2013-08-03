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
git clone https://github.com/andrewmacheret/moodru.git
```

1. Install the npm files:
```sh
cd moodru
sudo ./setup.sh
```

1. create a file `express.json` (with permissions `600`) that contains the following: 
```json
{
"key": "connect.sid",
"secret": "<secret key>"
}
```

1. create a file `facebook.json` (with permissions `600`) that contains the following:
```json
{
"clientID": "<facebook clientId>",
"clientSecret": "<facebook clientSecret>"
}
```

1. Start the node server
To run and be able to terminate with ctrl-c:
```sh
sudo node moodru.js
```
... or to run it in "forever" mode:
```sh
sudo forever start moodru.js
```

1. Test it by going to http://andrewmacheret.com/moodru

