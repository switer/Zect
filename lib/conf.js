'use strict';

var _ns = 'z-' // default namespace is z that means "Zect" 

module.exports = {
    set namespace (n) {
        _ns = n + '-'
    },
    get namespace () {
        return _ns
    }
 }