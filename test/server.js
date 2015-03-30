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



/**
 *  static folder
 **/
app.use(express.static(path.join(__dirname, '.')))

/**
 *  server and port
 **/
var port = process.env.PORT || 1024
app.listen(port, function () {
    console.log('Server is listen on port', String(port).blue)
    
})