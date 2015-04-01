'use strict';
var NS = require('./conf').namespace
module.exports = {
    Element: function(el) {
        return el instanceof HTMLElement || el instanceof DocumentFragment
    },
    DOM: function (el) {
        return this.Element(el) || el instanceof Comment
    },
    IfElement: function(tn) {
        return tn == (NS + 'if').toUpperCase()
    },
    RepeatElement: function(tn) {
        return tn == (NS + 'repeat').toUpperCase()
    }
}