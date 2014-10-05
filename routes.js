// server.js

var router = require('express').Router();
var nconf = require('nconf');
var mysql = require('mysql');


nconf.env();
nconf.file({ file: 'config.json' });
nconf.defaults({
    "mysql": {
        "host"     : "localhost",
        "user"     : "starmap",
        "password" : "secret",
        "database" : "starmap"
    }
});

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
    var sql = 'SELECT h.StarId,BayerFlam,ProperName,Spectrum,AbsMag,X,Y,Z FROM tblHYG h JOIN tblGalactic g ON h.StarID = g.StarId ' +
              'WHERE g.X > ? AND g.X < ? AND g.Y > ? AND g.Y < ? AND g.Z > ? AND g.Z < ? ' +
              'ORDER BY h.StarId LIMIT 500';
    var bounds = [
        req.query.xmin ? req.query.xmin : 0,
        req.query.xmax ? req.query.xmax : 0,
        req.query.ymin ? req.query.ymin : 0,
        req.query.ymax ? req.query.ymax : 0,
        req.query.zmin ? req.query.zmin : 0,
        req.query.zmax ? req.query.zmax : 0
    ];
    connectionpool.getConnection(function(err, connection) {
        if (err) {
            console.error('CONNECTION error: ',err);
            res.statusCode = 503;
            res.send({
                result: 'error',
                err:    err.code
            });
        } else {
            connection.query(sql, bounds, function(err, rows, fields) {
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
    var sql = 'SELECT * FROM tblHYG h JOIN tblGalactic g ON h.StarID = g.StarId WHERE h.StarId = ?';
    connectionpool.getConnection(function(err, connection) {
        if (err) {
            console.error('CONNECTION error: ',err);
            res.statusCode = 503;
            res.send({
                result: 'error',
                err:    err.code
            });
        } else {
            connection.query(sql, req.params.id, function(err, rows, fields) {
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
