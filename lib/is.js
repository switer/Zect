'use strict';
var conf = require('./conf')
module.exports = {
    Element: function(el) {
        // 1: ELEMENT_NODE, 11: DOCUMENT_FRAGMENT_NODE
        return el.nodeType == 1 || el.nodeType == 11
    },
    DOM: function (el) {
        // 8: COMMENT_NODE
        return this.Element(el) || el.nodeType == 8
    },
    IfElement: function(tn) {
        return tn == (conf.namespace + 'if').toUpperCase()
    },
    ElseElement: function(node) {
        return node.hasAttribute && node.hasAttribute(conf.namespace + 'else')
    },
    RepeatElement: function(tn) {
        return tn == (conf.namespace + 'repeat').toUpperCase()
    }
}