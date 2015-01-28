'use strict';

var _namespace = 'z-'
module.exports = {
    set namespace (n) {
        _namespace = n + '-'
    },
    get namespace () {
        return _namespace
    }
 }