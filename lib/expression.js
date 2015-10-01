'use strict';

var execute = require('./execute')
var util = require('./util')
var _sep = ';'
var _sepRegexp = new RegExp(_sep, 'g')
var _literalSep = ','
var _exprRegexp = /\{[\s\S]*?\}/g
var _varsRegexp = /("|').+?[^\\]\1|\.\w*|\$\w*|\w*:|\b(?:this|true|false|null|undefined|new|typeof|Number|String|Object|Array|Math|Date|JSON)\b|([a-z_]\w*)\(|([a-z_]\w*)/gi
/**
 *  Whether a text is with express syntax
 */
function _isExpr(c) {
    return c ? !!c.trim().match(/^\{[\s\S]*?\}$/m) : false
}
module.exports = {
    sep: _sep,
    literalSep: _literalSep,

    sepRegexp: _sepRegexp,
    exprRegexp: _exprRegexp,

    isExpr: _isExpr,
    isUnescape: function(expr) {
        return !!expr.match(/^\{\- /)
    },
    execLiteral: function (expr, vm, scope) {
        if (!_isExpr(expr)) return {}
        return execute(vm, scope, expr.replace(_sepRegexp, _literalSep))
    },
    veil: function (expr) {
        return expr.replace(/\\{/g, '\uFFF0')
                   .replace(/\\}/g, '\uFFF1')
    },
    unveil: function (expr) {
        return expr.replace(/\uFFF0/g, '\\{')
                   .replace(/\uFFF1/g, '\\}')
    },
    strip: function (expr) {
        // -\d*\.?\d* TBD
        var m =  expr.trim().match(/^\{([\s\S]*)\}$/m)
        return m && m[1] ? m[1].replace(/^- /, '') : ''
    },
    extract: function(expr) {
        if (!expr) return null
        var vars = expr.match(_varsRegexp)
        vars = !vars ? [] : vars.filter(function(i) {
            if (!i.match(/^[\."'\]\[]/) && !i.match(/\($/)) {
                return i
            }
        })
        return vars
    },
    /**
     * abc
     * abc.0
     * abc[0]
     * abc[0].abc
     * abc["xx-xx"] || abc['xx-xx']
     */
    variableOnly: function (expr) {
        return !util.normalize(expr || '').split('.').some(function (k) {
            return !k.match(/^([a-zA-Z_$][\w$]*|\d+|".*"|'.*')$/)  
        })
    },
    notFunctionCall: function (expr) {
        return !/[()]/.test(expr)
    }
}