// server.js

var router = require('express').Router();
var nconf = require('nconf');
var mysql = require('mysql');


nconf.env();
nconf.file({ file: 'config.json' });

var connectionpool = mysql.createPool({
    host     : nconf.get('mysql:host'),
    user     : nconf.get('mysql:user'),
    password : nconf.get('mysql:password'),
    database : nconf.get('mysql:database')
});

// test route to make sure everything is working (accessed at GET http://localhost:23902/api)
// middleware to use for all requests
router.use(function(req, res, next) {
	console.log('Request received.');
	next();
});

router.get('/', function(req, res) {
	res.send('hello world!');	
});

router.get('/stars', function(req,res) {
    connectionpool.getConnection(function(err, connection) {
        if (err) {
            console.error('CONNECTION error: ',err);
            res.statusCode = 503;
            res.send({
                result: 'error',
                err:    err.code
            });
        } else {
            connection.query('SELECT h.StarId,BayerFlam,ProperName,Spectrum,X,Y,Z FROM tblHYG h JOIN tblGalactic g ON h.StarID = g.StarId ORDER BY h.StarId DESC LIMIT 20', function(err, rows, fields) {
                if (err) {
                    console.error(err);
                    res.statusCode = 500;
                    res.send({
                        result: 'error',
                        err:    err.code
                    });
                }
                res.send({
                    result: 'success',
                    err:    '',
                    data:   rows,
                    length: rows.length
                });
                connection.release();
            });
        }
    });
});

router.get('/stars/:id', function(req,res) {
    connectionpool.getConnection(function(err, connection) {
        if (err) {
            console.error('CONNECTION error: ',err);
            res.statusCode = 503;
            res.send({
                result: 'error',
                err:    err.code
            });
        } else {
            connection.query('SELECT * FROM tblHYG h JOIN tblGalactic g ON h.StarID = g.StarId WHERE h.StarId = ?', req.params.id, function(err, rows, fields) {
                if (err) {
                    console.error(err);
                    res.statusCode = 500;
                    res.send({
                        result: 'error',
                        err:    err.code
                    });
                }
                res.send({
                    result: 'success',
                    err:    '',
                    data:   rows,
                    length: rows.length
                });
                connection.release();
            });
        }
    });
});

module.exports = router;
