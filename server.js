var express     = require('express');
var compression = require('compression');
var app         = express();
var oneDay = 86400000;

app.use(express.static(__dirname + '/public', { maxAge: oneDay }));
app.use(compression())

var nconf = require('nconf');

nconf.env();
nconf.file({ file: 'config.json' });

nconf.defaults({
    "http": {
        "port": process.env.PORT
    }
});

app.use('/api', require('./routes'));

app.listen(nconf.get('http:port'));
console.log('Server listening on port ' + nconf.get('http:port'));
