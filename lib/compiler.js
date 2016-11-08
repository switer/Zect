'use strict';

var $ = require('./dm')
var util = require('./util')
var Expression = require('./expression')
var _execute = require('./execute')
var _relative = util.relative
/**
 *  Whether a text is with express syntax
 */
var _isExpr = Expression.isExpr
/**
 *  Get varibales of expression
 */
var _extractVars = Expression.extract

function noop () {}

var keywords = ['$index', '$value', '$parent', '$vm', '$scope']
/**
 *  watch changes of variable-name of keypath
 *  @return <Function> unwatch
 */
function _watch(vm, vars, update) {
    var watchKeys = []
    function _handler (kp) {
        if (watchKeys.some(function(key) {
            if (_relative(kp, key)) {
                return true
            }
        })) update.apply(null, arguments)
    }

    if (vars && vars.length) {
        vars.forEach(function (k) {
            if (~keywords.indexOf(k)) return
            while (k) {
                if (!~watchKeys.indexOf(k)) watchKeys.push(k)
                k = util.digest(k)
            }
        })
        if (!watchKeys.length) return noop
        return vm.$watch(_handler)
    }
    return noop
}


var _strip = Expression.strip

/**
 *  Compoiler constructor for wrapping node with consistent API
 *  @node <Node>
 */
function Compiler (node) {
    this.$el = node
}

var cproto = Compiler.prototype

Compiler.inherit = function (Ctor) {
    Ctor.prototype = Object.create(Compiler.prototype)
    return Ctor
}
cproto.$bundle = function () {
    return this.$el
}
cproto.$floor = function () {
    return this.$el
}
cproto.$ceil = function () {
    return this.$el
}
cproto.$mount = function (pos) {
    $(pos).replace(this.$bundle())
    return this
}
cproto.$remove = function () {
    var $el = this.$bundle()
    _parentNode($el) && $($el).remove()
    return this
}
cproto.$appendTo = function (pos) {
    _appendChild(pos, this.$bundle())
    return this
}
cproto.$insertBefore = function (pos) {
    _insertBefore(_parentNode(pos), this.$bundle(), pos)
    return this
}
cproto.$insertAfter = function (pos) {
    _insertBefore(_parentNode(pos), this.$bundle(), _nextSibling(pos))
    return this
}
cproto.$destroy = function () {
    this.$el = null
    return this
}
function _nextTo (src, tar) {
    var next = tar.nextSibling
    while(next) {
        if (next === src) return true
        else if (next.nodeType == 3 && /^\s*$/m.test(next.nodeValue)) {
            next = next.nextSibling
            continue
        } else {
            break
        }
    }
    return false
}
cproto.$nextTo = function (tar) {
    // Compiler of Node
    tar = tar instanceof Compiler ? tar.$ceil() : tar
    return _nextTo(tar, this.$floor())
}
cproto.$preTo = function (tar) {
    tar = tar instanceof Compiler ? tar.$floor() : tar
    return _nextTo(this.$ceil(), tar)
}
/**
 * Can be overwrited
 * @type {[type]}
 */
cproto.$update = noop
/**
 *  Standard directive
 */
var _did = 0
Compiler.Directive = Compiler.inherit(function Directive (vm, scope, tar, def, name, expr) {
    var d = this
    var bindParams = []
    var isExpr = !!_isExpr(expr)

    d.$expr = expr
    
    isExpr && (expr = _strip(expr))

    if (def.multi) {
        // extract key and expr from "key: expression" format
        var key
        expr = expr.replace(/^[^:]+:/, function (m) {
            key = m.replace(/:$/, '').replace(/(^\s*['"]?|['"]?\s*$)/g, '')
            return ''
        }).trim()
        bindParams.push(key)
    }

    d.$id = 'd' + _did++
    d.$name = name
    d.$el = tar
    d.$vm = vm
    d.$scope = scope || null

    var bind = def.bind
    var unbind = def.unbind
    var upda = def.update
    var prev
    var unwatch


    // set properties
    util.objEach(def, function (k, v) {
        d[k] = v
    })
    
    /**
     *  execute wrap with directive name
     */
    function _exec(expr) {
        return _execute(vm, scope, expr, name)
    }

    /**
     *  update handler
     */
    function _update(kp) {
        if (d.$destroyed) return
        var nexv = _exec(expr)

        if (util.diff(nexv, prev)) {
            var p = prev
            prev = nexv
            upda && upda.call(d, nexv, p, kp)
        }
    }

    /**
     *  If expression is a string iteral, use it as value
     */
    prev = isExpr ? _exec(expr):expr
    bindParams.push(prev)
    bindParams.push(expr)
    // watch variable changes of expression
    if (def.watch !== false && isExpr) {
        unwatch = _watch(vm, _extractVars(expr), _update)
    }

    d.$destroy = function () {
        unbind && unbind.call(d)
        unwatch && unwatch()
        d.$el = null
        d.$vm = null
        d.$scope = null
        d.$destroyed = true
    }
    d.$update = _update

    // ([property-name], expression-value, expression) 
    bind && bind.apply(d, bindParams, expr)
    upda && upda.call(d, prev)

})


var _eid = 0
Compiler.Element = Compiler.inherit(function ZElement(vm, scope, tar, def, name, expr) {
    var d = this
    var bind = def.bind
    var unbind = def.unbind
    var upda = def.update
    var delta = def.delta
    var deltaUpdate = def.deltaUpdate
    var isMultiExpr = def.multiExpr && util.type(expr) == 'array'
    var isExclusion = def.multiExpr == 'exclusion'
    var multiExprMetas
    var prev
    var unwatch


    d.$expr = expr
    if (isMultiExpr) {
        multiExprMetas = expr.map(function (exp) {
            var isExpr = _isExpr(exp)
            return [!!isExpr, isExpr ? _strip(exp) : exp]
        })
    }
    d.$id = 'e' + _eid ++
    d.$name = name
    d.$vm = vm
    d.$el = tar
    d.$scope = scope // save the scope reference

    var tagHTML = util.tagHTML(tar)
    d.$before = _createComment(tagHTML[0])
    d.$after = _createComment(tagHTML[1])
    d.$container = document.createDocumentFragment()

    _appendChild(d.$container, d.$before)
    _appendChild(d.$container, d.$after)

    // set properties
    util.objEach(def, function (k, v) {
        d[k] = v
    })

    d.$bundle = function () {
        var $ceil = this.$ceil()
        var $floor = this.$floor()
        var $con = this.$container
        var that = this

        if (!_contains($con, $ceil)) {
            util.domRange(_parentNode($ceil), $ceil, $floor)
                .forEach(function(n) {
                    _appendChild(that.$container, n)
                })
            _insertBefore($con, $ceil, $con.firstChild)
            _appendChild($con, $floor)
        }
        return $con
    }
    d.$floor = function () {
        return this.$after
    }
    d.$ceil = function () {
        return this.$before
    }

    d.$destroy = function () {
        unbind && unbind.call(d)
        unwatch && unwatch()
        d.$el = null
        d.$vm = null
        d.$scope = null
        d.$destroyed = true
    }
    /**
     *  update handler
     */
    function _update(kp, nv, pv, method, ind, len) {
        if (d.$destroyed) return

        var nexv
        if (isMultiExpr) {
            var lastV
            nexv = expr.map(function (exp, i) {
                if (multiExprMetas[i][0]) {
                    if (lastV && isExclusion) return false
                    return (lastV = _exec(multiExprMetas[i][1]))
                } else {
                    return exp
                }
            })
        } else {
            nexv = _exec(expr)
        }
        var deltaResult 
        if ( delta && (deltaResult = delta.call(d, nexv, prev, kp)) ) {
            return deltaUpdate && deltaUpdate.call(d, nexv, prev, kp, deltaResult)
        }
        if (util.diff(nexv, prev)) {
            var p = prev
            prev = nexv
            upda && upda.call(d, nexv, p, kp, method, ind, len)
        }
    }

    d.$update = _update

    /**
     *  execute wrap with directive name
     */
    function _exec(expr) {
        return _execute(vm, scope, expr, name)
    }

    if (isMultiExpr) {
        var watchedKeys = []
        // result exclusion
        var lastV
        prev = expr.map(function (exp, i) {
            if (multiExprMetas[i][0]) {
                exp = multiExprMetas[i][1]
                watchedKeys = watchedKeys.concat(_extractVars(exp))
                if (lastV && isExclusion) {
                    return false
                } else {
                    return (lastV = _exec(exp))
                }
            } else {
                return exp
            }
        })
        if (watchedKeys.length) {
            unwatch = _watch(vm, watchedKeys, _update)
        }
    } else {
        var isExpr = !!_isExpr(expr)
        isExpr && (expr = _strip(expr))
        prev = isExpr ? _exec(expr) : expr
        if (def.watch !== false && isExpr) {
            unwatch = _watch(vm, _extractVars(expr), _update)
        }
    }
    bind && bind.call(d, prev, expr)
    upda && upda.call(d, prev)
})

var _tid = 0
Compiler.Text = Compiler.inherit(function ZText(vm, scope, tar, originExpr, parts, exprs) {
    var d = this
    d.$expr = originExpr
    d.$id = 't' + _tid ++

    function _exec (expr) {
        return _execute(vm, scope, expr, null)
    }
    var cache = new Array(exprs.length)
    var isUnescape = exprs.some(function (expr) {
        return Expression.isUnescape(expr)
    })
    var unwatches = []

    exprs.forEach(function(exp, index) {
        // watch change
        exp = _strip(exp)
        var vars = _extractVars(exp)

        function _update() {
            if (d.$destroyed) return

            var pv = cache[index]
            var nv = _exec(exp)

            if (util.diff(nv, pv)) {
                // re-render
                cache[index] = nv
                render()
            }
        }
        // initial value
        cache[index] = _exec(exp)

        unwatches.push(_watch(vm, vars, _update))
    })

    if (isUnescape) {
        var $tmp = document.createElement('div')
        var $con = document.createDocumentFragment()
        var $before = _createComment('{' + _strip(originExpr))
        var $after = _createComment('}')

        var pn = _parentNode(tar)
        _insertBefore(pn, $before, tar)
        _insertBefore(pn, $after, _nextSibling(tar))
    }

    function render() {
        var frags = []
        parts.forEach(function(item, index) {
            frags.push(item)
            if (index < exprs.length) {
                frags.push(cache[index])
            }
        })

        var value = Expression.unveil(frags.join(''))

        if (isUnescape) {
            var cursor = _nextSibling($before)
            while(cursor && cursor !== $after) {
                var next = _nextSibling(cursor)
                _parentNode(cursor).removeChild(cursor)
                cursor = next
            }
            $tmp.innerHTML = value
            ;[].slice.call($tmp.childNodes).forEach(function (n) {
                _appendChild($con, n)
            }) 
            _insertBefore(_parentNode($after), $con, $after)
        } else {
            tar.nodeValue = value
        }
    }

    this.$destroy = function () {
        d.$destroyed = true
        unwatches.forEach(function (f) {
            f()
        })
    }

    this.$update = function () {
        if (d.$destroyed) return

        var hasDiff
        exprs.forEach(function(exp, index) {
            exp = _strip(exp)
            var pv = cache[index]
            var nv = _exec(exp)

            if (!hasDiff && util.diff(nv, pv)) {
                hasDiff = true
            }
            cache[index] = nv
        })
        hasDiff && render()
    }

    /**
     *  initial render
     */
    render()
})

var _aid = 0
Compiler.Attribute = function ZAttribute (vm, scope, tar, name, value) {
    var d = this
    d.$name = name
    d.$expr = value
    d.$id = 'a' + _aid ++

    var isNameExpr = _isExpr(name)
    var isValueExpr = _isExpr(value)

    var nexpr = isNameExpr ? _strip(name) : null
    var vexpr = isValueExpr ? _strip(value) : null

    var unwatches = []

    function _exec(expr) {
        return _execute(vm, scope, expr, name + '=' + value)
    }
    // validate atrribute name, from: http://www.w3.org/TR/REC-xml/#NT-NameChar
    // /^(:|[a-zA-Z0-9]|_|-|[\uC0-\uD6]|[\uD8-\uF6]|[\uF8-\u2FF]|[\u370-\u37D]|[\u37F-\u1FFF]|[\u200C-\u200D]|[\u2070-\u218F]|[\u2C00-\u2FEF]|[\u3001-\uD7FF]|[\uF900-\uFDCF]|[\uFDF0-\uFFFD]|[\u10000-\uEFFFF])+$/

    // cache last name/value
    var preName = isNameExpr ? _exec(nexpr) : name
    var preValue = isValueExpr ? _exec(vexpr) : value
    var $tar = $(tar)
    function _emptyUndef(v) {
        return util.isUndef(v) ? '' : v
    }
    $tar.attr(preName, _emptyUndef(preValue))

    function _updateName() {
        if (d.$destroyed) return

        var next = _exec(nexpr)

        if (util.diff(next, preName)) {
            $tar.removeAttr(preName)
                  .attr(next, _emptyUndef(preValue))
            preValue = next
        }
    }
    function _updateValue() {
        if (d.$destroyed) return
        
        var next = _exec(vexpr)
        if (util.diff(next, preValue)) {
            $tar.attr(preName, _emptyUndef(next))
            preValue = next
        }
    }


    this.$destroy = function () {
        unwatches.forEach(function (f) {
            f()
        })
        d.$destroyed = true
    }

    this.$update = function () {
        if (d.$destroyed) return

        isNameExpr && _updateName()
        isValueExpr && _updateValue()
    }
    /**
     *  watch attribute name expression variable changes
     */
    if (isNameExpr) {
        unwatches.push(_watch(vm, _extractVars(name), _updateName))
    }
    /**
     *  watch attribute value expression variable changes
     */
    if (isValueExpr) {
        unwatches.push(_watch(vm, _extractVars(value), _updateValue))
    }

}

function _appendChild (con, child) {
    return con.appendChild(child)
}
function _createComment (ns) {
    return document.createComment(ns)
}
function _insertBefore (con, child, pos) {
    return con.insertBefore(child, pos)
}
function _parentNode (tar) {
    return tar && tar.parentNode
}
function _nextSibling (tar) {
    return tar && tar.nextSibling
}
function _contains (con, tar) {
    return tar && tar.parentNode === con
}

module.exports = Compiler
