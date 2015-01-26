'use strict';

var $ = require('./dom')

module.exports = {
    'html': {
        bind: function (wkey) {
            return [wkey] // those dependencies need to watch
        },
        update: function (next) {
            $(this.tar).html(next)
        }
    },
    'attr': {
        bind: function (wkey, attname) {
            this.attname = attname
            return [wkey] // those dependencies need to watch
        },
        update: function (next) {
            if (!next && next !== '') {
                $(this.tar).removeAttr(this.attname)
            } else {
                $(this.tar).attr(this.attname, next)
                
            }
        }
    }
}