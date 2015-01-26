'use strict';

var express = require('express')
var path = require('path')
var app = express()
var colors = require('colors')

/**
 *  LiveReload
 **/
var livereload = require('express-livereload')
livereload(app, {
    
    watchDir: path.join(__dirname, '.')
})
app.get('/livereload', function (req, res) {
    res.send("document.write('<script src=\"http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js\"></' + 'script>')")
})




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
    
    console.log('[Put livereload script into HTML]:  '.white.gray + '<script src="/livereload"></script>'.gray)
    
})