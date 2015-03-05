'use strict';

var _ns = 'z-'

module.exports = {
    set namespace (n) {
        _ns = n + '-'
    },
    get namespace () {
        return _ns
    }
 }