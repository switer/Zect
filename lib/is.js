'use strict';
var conf = require('./conf')
module.exports = {
    Element: function(el) {
        return el instanceof HTMLElement || el instanceof DocumentFragment
    },
    DOM: function (el) {
        return this.Element(el) || el instanceof Comment
    },
    IfElement: function(tn) {
        return tn == (conf.namespace + 'if').toUpperCase()
    },
    RepeatElement: function(tn) {
        return tn == (conf.namespace + 'repeat').toUpperCase()
    }
}