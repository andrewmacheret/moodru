hubby
======

1. Prereqs:
 * A unix server with the following installed
   * Node.js
   * mongodb
 * the domain name andrewmacheret.com pointing to that server
 * port 80 open on that server

2. Clone the repo
```sh
git clone https://github.com/andrewmacheret/hubby.git
```

3. Install the npm files:
```sh
cd hubby
sudo ./setup.sh
```

4. create a file `express.json` (with permissions `600`) that contains the following: 
```json
{
"key": "connect.sid",
"secret": "<secret key>"
}
```

5. create a file `facebook.json` (with permissions `600`) that contains the following:
```json
{
"clientID": "<facebook clientId>",
"clientSecret": "<facebook clientSecret>"
}
```

6. Start the node server
To run and be able to terminate with ctrl-c:
```sh
sudo node hubby.js
```
... or to run it in "forever" mode:
```sh
sudo forever start hubby.js
```

7. Test it by going to http://andrewmacheret.com/hubby

