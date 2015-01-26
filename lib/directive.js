'use strict';

var $ = require('./dom')

module.exports = {
    'html': {
        exp: function (exp) {
            return [exp]
        },
        bind: function (key) {
            return [key] // those dependencies need to watch
        },
        update: function (next) {
            $(this.tar).html(next)
        }
    }
}