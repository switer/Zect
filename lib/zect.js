'use strict';

var $ = require('./dm')
var is = require('./is')
var Mux = require('muxjs')
var util = require('./util')
var conf = require('./conf')
var execute = require('./execute')
var Compiler = require('./compiler')
var Expression = require('./expression')

var Directive = Compiler.Directive
var AttributeDirective = Compiler.Attribute
var TextDirective = Compiler.Text
var ElementDirective = Compiler.Element


/**
 *  private vars
 */
var buildInDirts = require('./directives')(Zect)  // preset directives getter
var elements = require('./elements')(Zect)      // preset directives getter
var allDirectives = [buildInDirts, {}]                // [preset, global]
var gdirs = allDirectives[1]
var gcomps = {}                                 // global define components

var _isExpr = Expression.isExpr
/**
 *  Global API
 */
function Zect(options) {
    var insOpt = _mergeMethodMixins([options])
    return ViewModel.call(this, insOpt)
}
Zect.create = Zect.extend = function(options) {
    function Class(opt) {
        var insOpt = _mergeMethodMixins([options, opt])
        /**
         *  Prototype inherit
         */
        return ViewModel.call(this, insOpt)
    }
    _inherit(Class, Zect)
    return Class
}
Zect.component = function(id, definition) {
    var Comp = Zect.extend(definition)
    gcomps[id.toLowerCase()] = Comp
    return Comp
}
Zect.directive = function(id, definition) {
    gdirs[id] = definition
}
Zect.namespace = function(ns) {
    conf.namespace = ns
}
Zect.$ = $
_inherit(Zect, Compiler)

/*******************************
      ViewModel Constructor
*******************************/
function ViewModel(options) {
    // inherit Compiler

    var vm = this
    var el = options.el
    var components = [gcomps, options.components || {}]
    var directives = allDirectives.concat([options.directives || {}])

    var _directives = [] // local refs for all directives instance of the vm    
    var _components = [] // local refs for all components    
    var NS = conf.namespace
    var componentProps = [NS + 'component', NS + 'data', NS + 'methods', NS + 'ref', NS + 'replace']
    var $childrens = options.$childrens

    // set $parent ref
    vm.$parent = options.$parent || null

    /**
     *  Mounted element detect
     */
    if (util.type(el) == 'string') {
        el = document.querySelector(el)
    } 
    if (el && options.template) {
        el.innerHTML = options.template
    } else if (options.template) {
        el = document.createElement('div')
        el.innerHTML = options.template
    } else if (!is.Element(el)) {
        throw new Error('Unmatch el option')
    }

    // replace "$NS-template" of actual instance's DOM  
    if (el.children.length == 1 && el.firstElementChild.tagName.toLowerCase() == (NS + 'template')) {
        var $holder = el.firstElementChild
        var childNodes = _slice($holder.childNodes)
        var attributes = _slice($holder.attributes)

        el.removeChild($holder)
        /**
         *  Migrate childNodes
         */
        $(childNodes).appendTo(el)
        /**
         *  Merge attributes
         */
        attributes.forEach(function (att) {
            var nv
            if (att.name == 'class') {
                nv = att.value + (el.className 
                                    ? ' ' + el.className 
                                    : '')

            } else if (!el.hasAttribute(att.name)) {
                nv = att.value
            } else {
                return
            }
            el.setAttribute(att.name, nv)
        })
    }
    // content insertion
    var points = _slice(el.querySelectorAll('content'))
    if (points) {
        var $con
        if ($childrens && $childrens.length) {
            $con = document.createDocumentFragment()
            _slice($childrens).forEach(function (n) {
                $con.appendChild(n)
            })
        }
        points.forEach(function (p) {
            if (!$childrens || !$childrens.length) {
                return $(p).remove()
            }
            var $p = $(p)
            var select = $p.attr('select')
            var tar
            var ind

            if (select 
                && (tar = $con.querySelector(select)) 
                && ~(ind = $childrens.indexOf(tar)) ) {

                $p.replace(tar)
                $childrens.splice(ind, 1)
            } else if (!select) {
                $p.replace($con)
                $childrens = null
            }
        })
    }

    /**
     * Replace external component element holder with internal child element
     */
    if (options.replace) {
        if (el.children.length !== 1) {
            console.warn('Can\'t using \'' + NS + 'replace=true\' for a component that has no or multiple child-elements.')
        } else if (el.parentNode) {
            var replacedEl = el.firstElementChild
            _cloneArributes(replacedEl, el)
            el.parentNode.replaceChild(replacedEl, el)
            el = replacedEl
        } else {
            el = el.firstElementChild
        }
    }

    vm.$el = el

    /**
     *  get component define by tagName
     */
    vm.$component = getComponent

    /**
     *  Component instance refs
     */
    vm.$refs = {}

    /**
     *  assign methods
     */
    var methods = {}
    util.objEach(options.methods, function(k, v) {
        if (util.type(v) !== 'function') return console.warn(k + ' is not a function.')
        vm[k] = methods[k] = util.bind(v, vm)
    })
    vm.$methods = methods

    var $data
    var dataOpt = {}

    Object.defineProperty(vm, '$data', {
        enumerable: true,
        get: function() {
            // $data will be undefined in created calling, so using dataOpt as temporary
            return $data || dataOpt
        },
        set: function(v) {
            if (!$data) return util.merge(dataOpt, v)

            $data.$set(v)
            return $data
        }
    })
    vm.$set = function () {
        $data.$set.apply($data, arguments)
    }
    vm.$get = function () {
        return $data.$get.apply($data, arguments)
    }
    vm.$watch = function (/*[ keypath ], fn*/) {
        return $data.$watch.apply($data, arguments)
    }
    vm.$unwatch = function (/*[ keypath ], fn*/) {
        return $data.$unwatch.apply($data, arguments)
    }

    var created = options.created
    if (options.$data) {
        $data = options.$data
        // if state model instance passsing, call after set
        created && created.call(vm)
    } else {
        util.merge(dataOpt, _funcOrObject(options, 'data'))
        // Call before vm-$data instance
        created && created.call(vm)
        // Instance observable state model
        var mopts = {
            props: dataOpt,
            computed: options.computed,
            computedContext: vm
        }
        $data = new Mux(mopts)
    }

    /**
     *  DOM Compile
     *  @TODO the unique interface for a compiled node($el, $remove)
     */
    vm.$compile = function (el, scope) {
        var compiler

        util.walk(el, function (node) {
            var isRoot = node === el
            var result = compile(node, scope, isRoot)
            if (isRoot) compiler = result.inst
            return result.into
        })
        return compiler
    }

    var beforeDestroy = options.destroy
    vm.$destroy = function () {
        if (vm.$destroyed) return
        beforeDestroy && beforeDestroy.call(vm)

        ;[_components, _directives].forEach(function (items) {
            items.forEach(function (inst) {
                inst.$destroy()
            })
        })

        $data.$destroy()

        // instance methods/properties
        vm.$el = null
        vm.$get = null
        vm.$set = null
        vm.$refs = null
        vm.$watch = null
        vm.$unwatch = null
        vm.$compile = null
        vm.$component = null

        // private vars
        directives = null
        components = null
        _directives = null
        _components = null

        // marked
        vm.$destroyed = true
    }
    vm.$compiler = vm.$compile(el)

    /**
     *  Call ready after compile
     */
    options.ready && options.ready.call(vm)

    function _getAllDirts () {
        var _dirts = {}
        directives.forEach(function(group) {
            util.objEach(group, function(id, def) {
                _dirts[NS + id] = def
            })
        })
        return _dirts
    }
    function _setBindings2Scope (scope, ref) {
        scope && scope.bindings && (scope.bindings.push(ref))
    }
    function compile (node, scope, isRoot) {
        /**
         *  1. ELEMENT_NODE; 
         *  2. ATTRIBUTE_NODE; 
         *  3. TEXT_NODE; 
         *  8. COMMENT_NODE; 
         *  9. DOCUMENT_NODE; 
         *  11. DOCUMENT_FRAGMENT;
         */
        var into = true
        var inst
        switch (node.nodeType) {
            case 1:
                /**
                 * static block no parsing
                 */
                if (node.hasAttribute(NS + 'static')) {
                    into = false
                    break
                }
                /**
                 * convert those $ns-if, $ns-repeat attribute to block element
                 */
                node = compilePseudoDirectiveElement(node)
                /**
                 *  scope syntax
                 */
                if (inst = compileElement(node, scope, isRoot)) {
                    into = false
                    break
                }
                /**
                 *  Attribute directive
                 */
                compileDirective(node, scope)
                /**
                 *  Compile custom-element
                 */
                if (inst = compileComponent(node, vm, scope, isRoot)) {
                    into = false
                    break
                }
                break
            case 3:
                // ignore whitespace
                if (node.nodeValue.trim()) inst = compileText(node, vm, scope, isRoot)
                into = false
                break
            case 11:
                // document fragment
                break
            default:
                into = false
        }
        return {
            into: !!into,
            inst: !inst && isRoot ? new Compiler(node) : inst
        }
    }

    function compilePseudoDirectiveElement (node) {
        var repeatAttName = NS + 'repeat'
        var ifAttName = NS + 'if'
        var valueAttName
        var matchedAttName

        if (node.hasAttribute(ifAttName)) {
            matchedAttName = ifAttName
            valueAttName = 'is'
        } else if (node.hasAttribute(repeatAttName)) {
            matchedAttName = repeatAttName
            valueAttName = 'items'
        } else {
            return node
        }
        var attValue = node.getAttribute(matchedAttName)
        var blockNode = document.createElement(matchedAttName)
        node.removeAttribute(matchedAttName)
        node.parentNode && node.parentNode.replaceChild(blockNode, node)
        blockNode.appendChild(node)
        blockNode.setAttribute(valueAttName, attValue)

        while(node.hasAttribute(ifAttName) || node.hasAttribute(repeatAttName)) {
            compilePseudoDirectiveElement(node)
        }
        return blockNode
    }

    /**
     *  Reverse component Constructor by tagName
     */
    function getComponent(tn) {
        var cid = tn.toLowerCase()
        var compDef
        components.some(function (comp) {
            if (comp.hasOwnProperty(cid)) {
                compDef = comp[cid]
                return true
            }
        })
        return compDef
    }
    /**
     *  Compile element for block syntax handling
     */
    function compileElement(node, scope, isRoot) {
        var tagName = node.tagName
        var inst
        switch(true) {
            /**
             *  <*-if></*-if>
             */
            case is.IfElement(tagName):
                var children = _slice(node.children)
                var exprs = [$(node).attr('is')]
                children.forEach(function(c) {
                    if (is.ElseElement(c)) {
                        exprs.push($(c).attr(conf.namespace + 'else') || '')
                    }
                })
                inst = new ElementDirective(
                        vm, 
                        scope,
                        node, 
                        elements['if'], 
                        NS + 'if', 
                        exprs
                )
                if (!isRoot) {
                    inst.$mount(node)
                }
                // save elements refs
                _directives.push(inst)
                // save bindins to scope
                _setBindings2Scope(scope, inst)
                return inst
            /**
             *  <*-repeat></*-repeat>
             */
            case is.RepeatElement(tagName):
                inst = new ElementDirective(
                        vm, 
                        scope,
                        node, 
                        elements.repeat,
                        NS + 'repeat', 
                        $(node).attr('items')
                )
                if (!isRoot) {
                    inst.$mount(node)
                }
                _directives.push(inst)
                _setBindings2Scope(scope, inst)
                return inst
        }
    }

    /**
     *  comment
     */
    function compileComponent (node, parentVM, scope) {
        var cAttName = NS + 'component'
        var CompName = node.getAttribute(cAttName)
        var tagName = node.tagName
        // filtrate most no-compoment element
        if (!CompName && (tagName == 'DIV' || tagName == 'SPAN' || tagName == 'A' || tagName == 'IMG')) return
        CompName = CompName || tagName
        var Comp = getComponent(CompName)

        /**
         *  Tag is not a custom component element
         */
        if (!Comp) return
        var $node = $(node)
        $node.removeAttr(cAttName)

        // don't need deep into self
        if (node === parentVM.$el) return
        // suport expression, TBD
        var refName = NS + 'ref'
        var dAttName = NS + 'data'
        var mAttName = NS + 'methods'
        var rAttName = NS + 'replace'

        var ref = $node.attr(refName)
        var dataExpr = $node.attr(dAttName)
        var methods = $node.attr(mAttName)
        var replace = $node.attr(rAttName)

        $node.removeAttr(refName)
             .removeAttr(dAttName)
             .removeAttr(mAttName)
             .removeAttr(rAttName)

        var _isDataExpr = _isExpr(dataExpr)
        var bindingData
        var bindingMethods
        /**
         *  Watch
         */
        var execLiteral = Expression.execLiteral
        var ast = {}
        var revealAst = {}
        var compVM

        function _parseExpr (exp) {
            var name
            exp = exp.replace(/^[^:]+:/, function (m) {
                            name = m.replace(/:$/, '').trim()
                            return ''
                        }).trim()
            return {
                name: name,
                expr: exp,
                vars: Expression.extract(exp)
            }
        }
        function _setBindingObj (expr) {
            var r = _parseExpr(expr)
            ast[r.name] = r
            ;(r.vars || []).forEach(function (v) {
                !revealAst[v] && (revealAst[v] = []);
                !~revealAst[v].indexOf(r.name) && revealAst[v].push(r.name)
            })
        }

        bindingData = execLiteral(dataExpr, parentVM, scope)
        bindingMethods = execLiteral(methods, parentVM, scope) // --> bindingMethods
        
        compVM = new Comp({
            el: node,
            data: bindingData,
            methods: bindingMethods,
            $parent: parentVM,
            $childrens: _slice(node.childNodes),
            replace: replace == 'true'
        })

        var plainDataExpr = _isDataExpr ? Expression.strip(dataExpr) : ''
        var sep = Expression.sep

        if (plainDataExpr) {
            if (plainDataExpr.match(sep)) {
                plainDataExpr.replace(new RegExp(sep + '\\s*$'), '') // trim last seperator
                       .split(sep)
                       .forEach(_setBindingObj)
            } else {
                _setBindingObj(plainDataExpr)
            }
        }
        // watch and binding
        if (_isDataExpr) {
            parentVM.$data.$watch(function (keyPath) {
                var nextState
                util.objEach(revealAst, function (varName, bindingNames) {
                    if (keyPath.indexOf(varName) === 0) {
                        ;!nextState && (nextState = {})
                        bindingNames.forEach(function (n) {
                            nextState[n] = execute(parentVM, scope, ast[n].expr)
                        })
                    }
                })
                nextState && compVM.$set(nextState)
            })
        }
        // set ref to parentVM
        ref && (parentVM.$refs[ref] = compVM)

        _components.push(compVM)
        _setBindings2Scope(scope, compVM)
        // TBM -- to be modify, instance method should not be attached here
        compVM.$update = function () {
            _isDataExpr && compVM.$set(execLiteral(dataExpr, parentVM, scope))
        }
        return compVM
    }
    /**
     *  Compile attributes to directive
     */
    function compileDirective (node, scope) {
        var ast = {
                attrs: {},
                dires: {}
            }
        var dirtDefs = _getAllDirts()
        /**
         *  attributes walk
         */
        _slice(node.attributes).forEach(function(att) {
            var aname = att.name
            var v = att.value
            // parse att
            if (~componentProps.indexOf(aname)) {
                return
            } else if (_isExpr(aname)) {
                // variable attribute name
                ast.attrs[aname] = v
            } else if (aname.indexOf(NS) === 0) {
                var def = dirtDefs[aname]
                if (def) {
                    // directive
                    ast.dires[aname] = {
                        def: def,
                        expr: v
                    }
                } else {
                    return
                }
            } else if (_isExpr(v.trim())) {
                // named attribute with expression
                ast.attrs[aname] = v
            } else {
                return
            }
            node.removeAttribute(aname)
        })

        /**
         *  Attributes binding
         */
        util.objEach(ast.attrs, function(name, value) {
            var attd = new AttributeDirective(vm, scope, node, name, value)
            _directives.push(attd)
            _setBindings2Scope(scope, attd)
        })

        /**
         *  Directives binding
         */
        util.objEach(ast.dires, function(dname, spec) {
            var def = spec.def
            var expr = spec.expr
            var sep = ';'
            var d
            // multiple defines expression parse
            if (def.multi && expr.match(sep)) {
                Expression.strip(expr)
                        .split(sep)
                        .forEach(function(item) {
                            // discard empty expression 
                            if (!item.trim()) return
                            
                            d = new Directive(vm, scope, node, def, dname, '{' + item + '}')
                            _directives.push(d)
                            _setBindings2Scope(scope, d)
                        })
            } else {
                d = new Directive(vm, scope, node, def, dname, expr)
                _directives.push(d)
                _setBindings2Scope(scope, d)
            }
        })
    }

    function compileText (node, vm, scope) {
        var originExpr = node.nodeValue
        var v = Expression.veil(originExpr)
        var exprReg = Expression.exprRegexp

        var parts = v.split(exprReg)
        var exprs = v.match(exprReg)

        var inst
        // expression match or not
        if (exprs && exprs.length) {
            inst = new TextDirective(vm, scope, node, originExpr, parts, exprs)
            _directives.push(inst)
            _setBindings2Scope(scope, inst)
        }
        return inst
    }
}

/**
 *  private functions
 */
function _slice (obj) {
    if (!obj) return []
    return [].slice.call(obj)
}
function _funcOrObject(obj, prop) {
    var tar = obj[prop]
    return util.type(tar) == 'function' ? tar.call(obj):tar
}
function _extend (args) {
    return util.extend.apply(util, args)
}
function _inherit (Ctor, Parent) {
    var proto = Ctor.prototype
    Ctor.prototype = Object.create(Parent.prototype)
    return proto
}
function _mergeOptions (opts) {
    var dest = {}
    _extend([dest].concat(opts))
    ;['data', 'methods', 'directives', 'components'].forEach(function (prop) {
        dest[prop] = _extend([{}].concat(opts.map(function (opt) {
            return _funcOrObject(opt, prop)
        })))
    })
    return dest
}
function _mergeMethodMixins (optMixins) {
    var mixins = []
    /**
     *  Merge option mixins
     */
    optMixins.forEach(function (o) {
        if (o) {
            mixins.push(o)
            o.mixins && (mixins = mixins.concat(o.mixins))
        }
    })
    var insOpt = _mergeOptions(mixins)
    /**
     *  Merge method mixins
     */
    var m = insOpt.methods = insOpt.methods || {}
    optMixins.forEach(function (o) {
        var mxs = o && o.methods && o.methods.mixins
        if (mxs) {
            mxs.forEach(function (mx) {
                util.objEach(mx, function (k, v) {
                    if (k !== 'mixins') m[k] = v
                })
            })
        }
    })
    delete insOpt.methods.mixins
    return insOpt
}
function _cloneArributes(el, target) {
    var $tar = $(target)
    _slice(el.attributes).forEach(function (att) {
        if (att.name == 'class') $tar.addClass(att.value)
        else $tar.attr(att.name, att.value)
    })
    return target
}

module.exports = Zect
