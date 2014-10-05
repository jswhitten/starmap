// server.js

var express    = require('express'); 	// call express
var app        = express(); 		// define our app using express
//var bodyParser = require('body-parser');
//app.use(bodyParser.urlencoded({ extended: true }));
//app.use(bodyParser.json());

var nconf = require('nconf');

nconf.env();
nconf.file({ file: 'config.json' });

nconf.defaults({
    "http": {
        "port": 23902
    }
});

// all of our routes will be prefixed with /api
app.use('/', require('./routes'));

// START THE SERVER
app.listen(nconf.get('http:port'));
console.log('Server listening on port ' + nconf.get('http:port'));
