'use strict';

var express = require('express')
var path = require('path')
var app = express()
var colors = require('colors')


/**
 *  midllewares
 **/
var compression = require('compression')
app.use(compression())

app.get('/log', function (req, res) {
	var k = req.query.k
	var t = req.query.t
	console.log((k + ': ').blue.grey + t + 'ms')
	res.send('1')
})

/**
 *  static folder
 **/
app.use(express.static(path.join(__dirname, '..')))

/**
 *  server and port
 **/
var port = process.env.PORT || 1024
app.listen(port, function () {
    console.log('Server is listen on port', String(port).blue)
    
})