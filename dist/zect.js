/**
* Zect v1.2.26
* (c) 2015 guankaishe
* Released under the MIT License.
*/
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define(factory);
	else if(typeof exports === 'object')
		exports["Zect"] = factory();
	else
		root["Zect"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1)

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var $ = __webpack_require__(2)
	var is = __webpack_require__(3)
	var Mux = __webpack_require__(11)
	var util = __webpack_require__(4)
	var conf = __webpack_require__(5)
	var execute = __webpack_require__(6)
	var Compiler = __webpack_require__(7)
	var Expression = __webpack_require__(8)

	var Directive = Compiler.Directive
	var AttributeDirective = Compiler.Attribute
	var TextDirective = Compiler.Text
	var ElementDirective = Compiler.Element


	/**
	 *  private vars
	 */
	var buildInDirts = __webpack_require__(9)(Zect)  // preset directives getter
	var elements = __webpack_require__(10)(Zect)      // preset directives getter
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


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 *  DOM manipulations
	 */

	'use strict';
	var util = __webpack_require__(4)
	var is = __webpack_require__(3)

	function Selector(sel) {
	    if (util.type(sel) == 'string') {
	        return Shell(util.copyArray(document.querySelectorAll(sel)))
	    }
	    else if (util.type(sel) == 'array') {
	        return Shell(sel)
	    }
	    else if (sel instanceof Shell) return sel
	    else if (is.DOM(sel)) {
	        return Shell(new ElementArray(sel))
	    }
	    else {
	        throw new Error('Unexpect selector !')
	    }
	}

	function Shell(nodes) {
	    if (nodes instanceof Shell) return nodes
	    var $items = new ElementArray()
	    nodes.forEach(function (item) {
	        $items.push(item)
	    })
	    return $items
	}

	function ElementArray () {
	    this.push = function () {
	        Array.prototype.push.apply(this, arguments)
	    }
	    this.forEach = function () {
	        Array.prototype.forEach.apply(this, arguments)
	    }
	    this.push.apply(this, arguments)
	}

	ElementArray.prototype = Object.create(Shell.prototype)

	var proto = Shell.prototype
	proto.find = function(sel) {
	    var subs = []
	    this.forEach(function(n) {
	        subs = subs.concat(util.copyArray(n.querySelectorAll(sel)))
	    })
	    return Shell(subs)
	}
	proto.attr = function(attname, attvalue) {
	    var len = arguments.length
	    var el = this[0]

	    if (len > 1) {
	        el.setAttribute(attname, attvalue)
	    } else if (len == 1) {
	        return (el.getAttribute(attname) || '').toString()
	    }
	    return this
	}
	proto.removeAttr = function(attname) {
	    this.forEach(function(el) {
	        el.removeAttribute(attname)
	    })
	    return this
	}
	proto.addClass = function(clazz) {
	    this.forEach(function(el) {

	        // IE9 below not support classList
	        // el.classList.add(clazz)

	        var classList = el.className.split(' ')
	        if (!~classList.indexOf(clazz)) classList.push(clazz)
	        el.className = classList.join(' ')
	    })
	    return this
	}
	proto.removeClass = function(clazz) {
	    this.forEach(function(el) {
	        
	        // IE9 below not support classList
	        // el.classList.remove(clazz)

	        var classList = el.className.split(' ')
	        var index = classList.indexOf(clazz)
	        if (~index) classList.splice(index, 1)
	        el.className = classList.join(' ')
	    })
	    return this
	}
	proto.each = function(fn) {
	    this.forEach(fn)
	    return this
	}
	proto.on = function(type, listener, capture) {
	    this.forEach(function(el) {
	        el.addEventListener(type, listener, capture)
	    })
	    return this
	}
	proto.off = function(type, listener) {
	    this.forEach(function(el) {
	        el.removeEventListener(type, listener)
	    })
	    return this
	}
	proto.html = function(html) {
	    var len = arguments.length
	    if (len >= 1) {
	        this.forEach(function(el) {
	            el.innerHTML = html
	        })
	    } else if (this.length) {
	        return this[0].innerHTML
	    }
	    return this
	}
	proto.parent = function() {
	    if (!this.length) return null
	    return Shell([_parentNode(this[0])])
	}
	proto.remove = function() {
	    this.forEach(function(el) {
	        var parent = _parentNode(el)
	        parent && parent.removeChild(el)
	    })
	    return this
	}
	proto.insertBefore = function (pos) {
	    var tar
	    if (!this.length) return this
	    else if (this.length == 1) {
	        tar = this[0]
	    } else {
	        tar = _createDocumentFragment()
	        this.forEach(function (el) {
	            _appendChild(tar, el)
	        })
	    }
	    _parentNode(pos).insertBefore(tar, pos)
	    return this
	}
	proto.insertAfter = function (pos) {
	    var tar
	    if (!this.length) return this
	    else if (this.length == 1) {
	        tar = this[0]
	    } else {
	        tar = _createDocumentFragment()
	        this.forEach(function (el) {
	            _appendChild(tar, el)
	        })
	    }
	    _parentNode(pos).insertBefore(tar, pos.nextSibling)
	    return this
	}
	// return element by index
	proto.get = function(i) {
	    return this[i]
	}
	proto.append = function(n) {
	    if (this.length) _appendChild(this[0], n)
	    return this
	}
	proto.appendTo = function (p) {
	    if (this.length == 1) _appendChild(p, this[0])
	    else if (this.length > 1) {
	        var f = _createDocumentFragment()
	        this.forEach(function (n) {
	            _appendChild(f, n)
	        })
	        _appendChild(p, f)
	    }
	}
	proto.replace = function(n) {
	    var tar = this[0]
	    var pn = _parentNode(tar)
	    pn && pn.replaceChild(n, tar)
	    return this
	}

	function _parentNode (e) {
	    return e && e.parentNode
	}

	function _createDocumentFragment () {
	    return document.createDocumentFragment()
	}

	function _appendChild (p, c) {
	    return p.appendChild(c)
	}
	module.exports = Selector


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var conf = __webpack_require__(5)
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

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var Mux = __webpack_require__(11)
	var mUtils = Mux.utils
	var _normalize = Mux.keyPath.normalize
	var _digest = Mux.keyPath.digest

	function _keys(o) {
	    return Object.keys(o)
	}
	function _forEach (items, fn) {
	    var len = items.length || 0
	    for (var i = 0; i < len; i ++) {
	        if(fn(items[i], i)) break
	    }
	}
	function _slice (obj) {
	    if (!obj) return []
	    return [].slice.call(obj)
	}
	var escapeCharMap = {
	    '&': '&amp;',
	    '<': '&lt;',
	    '>': '&gt;',
	    '\"': '&quot;',
	    '\'': '&#x27;',
	    '/': '&#x2F;'
	}
	var escapeRex = new RegExp(_keys(escapeCharMap).join('|'), 'g')
	module.exports = {
	    type: mUtils.type,
	    diff: mUtils.diff,
	    merge: mUtils.merge,
	    objEach: mUtils.objEach,
	    copyArray: mUtils.copyArray,
	    copyObject: mUtils.copyObject,
	    
	    extend: function(obj) {
	        if (this.type(obj) != 'object') return obj;
	        var source, prop;
	        for (var i = 1, length = arguments.length; i < length; i++) {
	            source = arguments[i];
	            for (prop in source) {
	                obj[prop] = source[prop];
	            }
	        }
	        return obj;
	    },
	    valueDiff: function(next, pre) {
	        return next !== pre || next instanceof Object
	    },
	    walk: function(node, fn) {
	        var into = fn(node) !== false
	        var that = this
	        if (into) {
	            _slice(node.childNodes).forEach(function (node) {
	                that.walk(node, fn)
	            })
	        }
	    },
	    domRange: function (tar, before, after) {
	        var children = []
	        var nodes = tar.childNodes
	        var start = false
	        for (var i = 0; i < nodes.length; i++) {
	            var item = nodes[i]
	            if (item === after) break
	            else if (start) {
	                children.push(item)
	            } else if (item == before) {
	                start = true
	            }
	        }
	        return children
	    },
	    immutable: function (obj) {
	        var that = this
	        var _t = this.type(obj)
	        var n

	        if (_t == 'array') {
	            n = obj.map(function (item) {
	                return that.immutable(item)
	            })
	        } else if (_t == 'object') {
	            n = {}
	            this.objEach(obj, function (k, v) {
	                n[k] = that.immutable(v)
	            })
	        } else {
	            n = obj
	        }
	        return n
	    },
	    tagHTML: function (tag) {
	        var h = tag.outerHTML
	        var open = h.match(/^<[^>]+?>/)
	        var close = h.match(/<\/[^<]+?>$/)
	        
	        return [open ? open[0]:'', close ? close[0]:'']
	    },
	    relative: function (src, dest) {
	        src = _normalize(src)
	        dest = _normalize(dest)

	        if (src == dest) return true
	        else {
	            var start = src.indexOf(dest) === 0
	            var subkp = src.replace(dest, '').match(/^[\.\[]/)
	            return start && subkp
	        }
	    },
	    escape: function (str) {
	        if (!this.type(str) == 'string') return str
	        return str.replace(escapeRex, function (m) {
	            return escapeCharMap[m]
	        })
	    },
	    isUndef: function (o) {
	        return o === void(0)
	    },
	    isNon: function (o) {
	        var t = this.type(o)
	        return t === 'undefined' || t === 'null'
	    },
	    bind: function (fn, ctx) {
	        var dummy = function () {
	            return fn.apply(ctx, arguments)
	        }
	        dummy.toString = function () {
	            return fn.toString.apply(fn, arguments)
	        }
	        return dummy
	    },
	    forEach: _forEach,
	    normalize: _normalize,
	    digest: _digest
	}


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

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

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 *  execute expression from template with specified Scope and ViewModel
	 */

	var util = __webpack_require__(4)
	var __$compile__ = __webpack_require__(12)
	var __$compiledExprs___ = {}
	/**
	 *  Calc expression value
	 */
	function _execute($vm, $scope/*, expression, [label], [target]*/) {
	    /**
	     *  $scope is passed when call instance method $compile, 
	     *  Each "scope" object maybe include "$parent, data, methods" properties
	     */
	    // var $parent = $scope && $scope.$parent ? util.extend({}, $scope.$parent.methods, $scope.$parent.data) : {}
	    if ($scope && $scope.$parent) {
	        $scope.data.$parent = $scope.$parent.data
	    }
	    var __$expression__ = arguments[2]
	    var __$fn__ = __$compiledExprs___[__$expression__]
	    $scope = $scope || {}
	    $scope = util.extend({}, $vm.$methods, $vm.$data, $scope.methods, $scope.data)
	    try {
	        if (!__$fn__) {
	            __$fn__ = __$compiledExprs___[__$expression__] = __$compile__(__$expression__)
	        }
	        return util.immutable(__$fn__($scope))
	    } catch (e) {
	        __$expression__ = /^\{/.test(__$expression__) 
	                        ? '. ' + __$expression__
	                        : '. {' + __$expression__ + '}' // expr
	        // arguments[3] // label
	        // arguments[4] // target
	        switch (e.name) {
	            case 'ReferenceError':
	                console.warn(e.message + __$expression__)
	                break
	            default:
	                console.error(
	                     (arguments[3] ? '\'' + arguments[3] + '\': ' : ''),
	                    e.message + __$expression__,
	                    arguments[4] || ''
	                )
	        }
	        return ''
	    }
	}
	module.exports = _execute

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var $ = __webpack_require__(2)
	var util = __webpack_require__(4)
	var Expression = __webpack_require__(8)
	var _execute = __webpack_require__(6)
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


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var execute = __webpack_require__(6)
	var util = __webpack_require__(4)
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

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 *  Build-in Global Directives
	 */

	'use strict';

	var $ = __webpack_require__(2)
	var conf = __webpack_require__(5)
	var util = __webpack_require__(4)


	module.exports = function() {
	    return {
	        'attr': {
	            multi: true,
	            bind: function(attname) {
	                this.attrs = attname ? attname.trim().split(/\s+/) : []
	                if (this.attrs.length) {
	                    this._$el = $(this.$el)
	                }
	            },
	            update: function(next) {
	                var that = this
	                this.attrs.forEach(function (attname) {
	                    if (util.isUndef(next)) {
	                        that._$el.removeAttr(attname)
	                    } else {
	                        that._$el.attr(attname, next)
	                    }
	                })
	            },
	            unbind: function () {
	                this._$el = this.attname = null
	            }
	        },
	        'class': {
	            multi: true,
	            bind: function(className) {
	                this.classes = className ? className.trim().split(/\s+/) : []
	                if (this.classes.length) {
	                    this._$el = $(this.$el)
	                }
	            },
	            update: function(isUseClass) {
	                var that = this
	                this.classes.forEach(function (className) {
	                    if (isUseClass) that._$el.addClass(className)
	                    else that._$el.removeClass(className)
	                })
	            },
	            unbind: function () {
	                this._$el = this.className = null
	            }
	        },
	        'html': {
	            update: function (nextHTML) {
	                this.$el.innerHTML = nextHTML
	            }
	        },
	        'model': {
	            bind: function () {
	                var tagName = this.$el.tagName
	                var type = tagName.toLowerCase()
	                var $el = this._$el = $(this.$el)

	                // pick input element type spec
	                type = type == 'input' ? $el.attr('type') || 'text' : type

	                switch (type) {
	                    case 'tel':
	                    case 'url':
	                    case 'text':
	                    case 'search':
	                    case 'password':
	                    case 'textarea':
	                        this.evtType = 'input'
	                        break
	                    
	                    case 'date':
	                    case 'week':
	                    case 'time':
	                    case 'month':
	                    case 'datetime':
	                    case 'datetime-local':
	                    case 'color':
	                    case 'range':
	                    case 'number':
	                    case 'select':
	                    case 'checkbox':
	                        this.evtType = 'change'
	                        break
	                    default:
	                        console.warn('"' + conf.namespace + 'model" only support input,textarea,select')
	                        return
	                }

	                var vm = this.$vm
	                var _update = this.$update
	                var vType = type == 'checkbox' ? 'checked':'value'
	                var that = this

	                /**
	                 *  DOM input 2 state
	                 */
	                this._requestChange = function () {
	                    vm.$set(that._prop, that.$el[vType])
	                }
	                /**
	                 *  State 2 DOM input
	                 */
	                this._update = function () {
	                    var nv = vm.$get(that._prop)
	                    nv = util.isUndef(nv) ? '' : nv
	                    if (that.$el[vType] !== nv) {
	                        that.$el[vType] = nv
	                    }
	                }
	                this.$update = function () {
	                    that._update()
	                    _update && _update.apply(this, arguments)
	                }
	                $el.on(this.evtType, this._requestChange)
	            },
	            watch: function (prop) {
	                if (this._watches) {
	                    this._watches.forEach(function (fn) {
	                        fn()
	                    })
	                    this._watches = []
	                }
	                if (!prop) return
	                var watches = this._watches = []
	                var wKeypath = util.normalize(prop)
	                while (wKeypath) {
	                    watches.push(this.$vm.$watch(wKeypath, this._update))
	                    wKeypath = util.digest(wKeypath)
	                }
	            },
	            update: function (prop) {
	                this._prop = prop
	                this.watch(prop)
	                this._update()
	            },
	            unbind: function () {
	                this._$el.off(this.evtType, this._requestChange)
	                this._watches.forEach(function (f) {
	                    f()
	                })
	                this._$el = null
	                this._requestChange = this._update = noop
	            }
	        },
	        'on': {
	            multi: true,
	            watch: false,
	            bind: function(evtType, handler, expression ) {
	                this._expr = expression
	                this.type = evtType
	                this._$el = $(this.$el)
	            },
	            update: function (handler) {
	                this.off()
	                var fn = handler
	                if (util.type(fn) !== 'function') 
	                    return console.warn('"' + conf.namespace + 'on" only accept function. {' + this._expr + '}')

	                this.fn = fn.bind(this.$vm)
	                this._$el && this._$el.on(this.type, this.fn, false)

	            },
	            off: function () {
	                if (this.fn) {
	                    this._$el && this._$el.off(this.type, this.fn)
	                    this.fn = null
	                }
	            },
	            unbind: function() {
	                this.off()
	                this._$el = this.type = null
	            }
	        },
	        'show': {
	            update: function(next) {
	                this.$el.style.display = next ? '' : 'none'
	            }
	        },
	        'style': {
	            multi: true,
	            bind: function (sheet) {
	                this.sheet = sheet
	            },
	            update: function (next) {
	                this.$el.style && (this.$el.style[this.sheet] = next)
	            },
	            unbind: function () {
	                this.sheet = null
	            }
	        },
	        'src': {
	            bind: function () {
	                this._$el = $(this.$el)
	            },
	            update: function (src) {
	                if (util.isNon(src)) {
	                    this._$el.removeAttr('src')
	                } else {
	                    this._$el.attr('src', src)
	                }
	            },
	            unbind: function () {
	                this._$el = null
	            }
	        }
	    }
	}
	function noop () {}

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 *  Build-in Global Custom-Elements
	 */

	'use strict';

	var $ = __webpack_require__(2)
	var conf = __webpack_require__(5)
	var util = __webpack_require__(4)
	var is = __webpack_require__(3)
	var Scope = __webpack_require__(13)
	var Expression = __webpack_require__(8)

	module.exports = function() {
	    return {
	        'if': {
	            multiExpr: 'exclusion',
	            bind: function(cnd, exprs) {
	                this._tmpCons = exprs.map(function () {
	                    return document.createDocumentFragment()
	                })

	                /**
	                 *  Initial unmount childNodes
	                 */
	                var cursor = 0
	                ;[].slice
	                    .call(this.$el.childNodes)
	                    .forEach(function(e) {
	                        if (is.ElseElement(e)) {
	                            cursor ++
	                        } else {
	                            this._tmpCons[cursor].appendChild(e)
	                        }
	                    }.bind(this))

	                /**
	                 *  Instance method
	                 */
	                var mounteds = {}
	                this._mount = function (index) {
	                    if (mounteds[index]) return
	                    mounteds[index] = true
	                    var $floor = this.$floor()
	                    $floor.parentNode.insertBefore(this._tmpCons[index], $floor)
	                }
	                this._unmount = function (index) {
	                    if (!mounteds) return
	                    mounteds[index] = false
	                    var $ceil = this.$ceil()
	                    var $floor = this.$floor()

	                    var that = this
	                    util.domRange($ceil.parentNode, $ceil, $floor)
	                        .forEach(function(n) {
	                            that._tmpCons[index].appendChild(n)
	                        })
	                }
	                this.compileds = {}
	                this._lIndex = -1
	            },
	            update: function(next) {
	                var lIndex = this._lIndex
	                var rearIndex = next.length - 1
	                var tIndex = -1
	                var cnd = false
	                next.some(function (v, i) {
	                    if (v) tIndex = i
	                    return !!v
	                })

	                cnd = next[tIndex]
	                // is last else without condition
	                if (!~tIndex && next.length > 1 && !this.$expr[rearIndex]) {
	                    tIndex = rearIndex
	                    cnd = true
	                }

	                this._lIndex = tIndex
	                if (lIndex != tIndex && ~lIndex) {
	                    this._unmount(lIndex)
	                }

	                // not else and all conditions is false
	                if (!~tIndex) return

	                if (!cnd) {
	                    this._unmount(tIndex)
	                } else if (this.compileds[tIndex]) {
	                    this._mount(tIndex)
	                } else {
	                    this.compileds[tIndex] = true
	                    this.$vm.$compile(this._tmpCons[tIndex], this.$scope)
	                    this._mount(tIndex)
	                }
	            },
	            unbind: function () {
	                this.$update = this._mount = this._unmount = noop
	                this.compileds = this._tmpCons = null
	            }
	        },
	        'repeat': {
	            bind: function(items, expr) {
	                var name = this.$el.getAttribute('ref')
	                var that = this
	                if (name) {
	                    this.$vm.$refs[name] = this
	                }
	                this.$items = function() {
	                    return this.$vms
	                },
	                this.$itemBindings = function(index) {
	                    if (!that.$vms || !that.$vms.length) return []
	                    var target = that.$vms[index]
	                    if (!target) return []
	                    return target.$scope.bindings
	                }
	                this.child = this.$el.firstElementChild
	                this.expr = expr
	                if (!this.child) {
	                    return console.warn('"' + conf.namespace + 'repeat"\'s childNode must has a HTMLElement node. {' + expr + '}')
	                }
	                // if use filter, Zect can't patch array by array-method
	                this._noArrayFilter = Expression.notFunctionCall(expr)
	            },
	            unbind: function () {
	                this.$vms && this.$vms.forEach(function (vm) {
	                    destroyVM(vm)
	                })
	                this.child = this.$vms = this._lastItems = null
	                this.$items = this.$itemBindings = noop
	            },
	            delta: function (nv, pv, kp) {
	                if (!kp) return false
	                var exprProp = util.normalize(Expression.strip(this.$expr).trim())
	                var path = kp.replace(exprProp, '')
	                var index
	                var matches
	                /**
	                 * 1. mount.0
	                 * 2. mount.0.0.prop
	                 * 3. $value.prop
	                 */
	                if (exprProp == '$value' && (matches = path.match(/^\d+\.(\d+)(\.|$)/))) {
	                    path = path.replace(/\d+\.?/, '')
	                } else if (matches = path.match(/^\.(\d+)(\.|$)/)) {
	                    path = path.replace(/^\./, '')
	                } else {
	                    return false
	                }
	                index = Number(matches[1])
	                // can be delta update
	                if (this.$vms && index < this.$vms.length) return {
	                    index: index,
	                    path:  path,
	                    mount: exprProp
	                }
	                else return false
	            },
	            deltaUpdate: function (nextItems, preItems, kp, payload) {
	                var index = payload.index
	                var nv = nextItems[index]
	                // delta update
	                this._lastItems[index] = nv

	                var $vm = this.$vms[index]
	                updateVMData($vm, nv, index, payload.path)
	            },
	            update: function(items, preItems, kp, method, args) {
	                if (!items || !items.forEach) {
	                    return console.warn('"' + conf.namespace + 'repeat" only accept Array data. {' + this.expr + '}')
	                }
	                var that = this
	                var valueOnly = Expression.variableOnly(this.$expr)
	                
	                // it's not modify
	                if (valueOnly && method == 'splice' && args.length == 2 && (!args[1] || args[1] < 0)) return

	                var $floor = this.$floor()
	                var $ceil = this.$ceil()
	                var arrayPatcher = {
	                    splice: function () {
	                        var ind = Number(args[0] || 0)
	                        var len = Number(args[1] || 0)
	                        var max = this.$vms.length
	                        ind = ind > max ? max : ind
	                        if (args.length > 2) {
	                            /**
	                             *  Insert
	                             */
	                            // create vms for each inserted item
	                            var insertVms = [].slice.call(args, 2).map(function (item, index) {
	                                return createSubVM.call(that, item, ind + index)
	                            })
	                            // insert items into current $vms
	                            this.$vms.splice.apply(this.$vms, [ind, len].concat(insertVms))

	                            // element bound for inserted item vm element
	                            $(insertVms.map(function (vm) {
	                                return vm.$compiler.$bundle()
	                            })).insertAfter(
	                                ind === 0 
	                                ? $ceil
	                                : this.$vms[ind - 1].$compiler.$bundle()
	                            )
	                            // get last update index
	                            var start = ind + insertVms.length
	                            this.$vms.forEach(function (vm, i) {
	                                if (i >= start) {
	                                    updateVMIndex(vm, i)
	                                }
	                            })

	                        } else {
	                            /**
	                             *  remove
	                             */
	                            this.$vms.splice
	                                     .apply(this.$vms, args)
	                                     .forEach(function (vm) {
	                                        destroyVM(vm)
	                                     })

	                            this.$vms.forEach(function (vm, i) {
	                                if (i >= ind) {
	                                    updateVMIndex(vm, i)
	                                }
	                            })
	                        }
	                    },
	                    push: function () {
	                        var index = items.length - 1
	                        var vm = createSubVM.call(that, items[index], index)
	                        this.$vms.push(vm)
	                        vm.$compiler.$insertBefore($floor)
	                    },
	                    pop: function () {
	                        var vm = this.$vms.pop()
	                        destroyVM(vm)
	                    },
	                    shift: function () {
	                        var vm = this.$vms.shift()
	                        destroyVM(vm)
	                        this.$vms.forEach(function (v, i) {
	                            updateVMIndex(v, i)
	                        })
	                    },
	                    unshift: function () {
	                        var vm = createSubVM.call(that, items[0], 0)
	                        this.$vms.unshift(vm)
	                        vm.$compiler.$insertAfter($ceil)
	                        this.$vms.forEach(function (v, i) {
	                            if (i !== 0) {
	                                updateVMIndex(v, i)
	                            }
	                        })
	                    },
	                    $concat: function () {
	                        var len = this.$vms.length
	                        $(items.slice(len).map(function (item, i) {
	                            var vm = createSubVM.call(that, item, i + len)
	                            that.$vms.push(vm)
	                            return vm.$compiler.$bundle()
	                        })).insertBefore($floor)
	                    }
	                }

	                var patch = arrayPatcher[method]
	                if (valueOnly && this._noArrayFilter && patch) {
	                    patch.call(this)
	                    this._lastItems = util.copyArray(items)
	                    return
	                }
	                /**
	                 *  vms diff
	                 */
	                var source = this._lastItems 
	                                ? this._lastItems.map(function (item) {
	                                        return {
	                                            data: item
	                                        }
	                                    })
	                                : null
	                var diffItems = items.map(function (item, index) {
	                    var data = {
	                        data: item
	                    }
	                    if (!source) {
	                        data.status = 'created'
	                    } else {
	                        var i = -1
	                        var dontUpdated
	                        source.some(function (s, k) {
	                            if (s.used) return

	                            var hasDiff = util.diff(s.data, item)
	                            if (!hasDiff) {
	                                i = k
	                                // and reuse the pos
	                                if (index === i) return (dontUpdated = true)
	                                else if (!~i) i = k
	                            }
	                        })
	                        if (~i && dontUpdated) {
	                            source[i].used = true
	                            data.status = 'reused'
	                        } else if (~i) {
	                            source[i].used = true
	                            data.status = 'moved'
	                            data.from = i
	                        } else {
	                            source.some(function (s, k) {
	                                if (!s.used && index == k) {
	                                    i = k
	                                    return true
	                                }
	                            })
	                            if (~i) {
	                                source[i].used = true
	                                data.status = 'updated'
	                                data.from = i
	                            } else {
	                                data.status = 'created'
	                            }
	                        }
	                    }
	                    return data
	                })

	                
	                /**
	                 * reuse those instance that data changed and index unmatch
	                 * state from "created" to "recycled"
	                 */
	                var reusables = (source || []).reduce(function (collects, item, index) {
	                    if (!item.used) {
	                        collects.push(index)
	                    }
	                    return collects
	                }, [])

	                diffItems.some(function (item) {
	                    if (!reusables.length) return true

	                    if (item.status == 'created') {
	                        item.from = reusables.pop()
	                        item.status = 'recycled'
	                    }
	                })
	                /**
	                 * destroy
	                 */
	                reusables.forEach(function (i) {
	                    destroyVM(that.$vms[i])
	                })
	                /**
	                 * Patch
	                 */
	                var floor = $ceil
	                this.$vms = diffItems.map(function (item, index) {
	                    var vm
	                    switch (item.status) {
	                        case 'created':
	                            vm = createSubVM.call(that, item.data, index)
	                            break
	                        case 'updated':
	                            vm = that.$vms[index]
	                            updateVMData(vm, item.data, index, kp)
	                            break
	                        case 'moved':
	                            vm = that.$vms[item.from]
	                            updateVMIndex(vm, index)
	                            break
	                        case 'reused':
	                            vm = that.$vms[index]
	                            break
	                        case 'recycled':
	                            vm = that.$vms[item.from]
	                            updateVMData(vm, item.data, item.from, kp)
	                            break
	                    }
	                    var $compiler = vm.$compiler
	                    if (!$compiler.$preTo(floor)) {
	                        vm.$compiler.$insertAfter(floor)
	                    }
	                    floor = $compiler.$floor()
	                    return vm
	                })
	                // prevent data source changed
	                this._lastItems = util.copyArray(items)
	            }
	        }
	    }
	}
	function shallowClone (data) {
	    return util.type(data) == 'object' ? util.copyObject(data) : {}
	}
	// function RepeatViewModel (el, data, index, parentVM, parentScope) {
	//     data = shallowClone(data)
	//     data.$index = index
	//     data.$value = data
	//     var $scope = new Scope(data, parentScope)
	//     // on the top of current scope
	//     parentScope && parentScope.children.push($scope)
	//     this.$index = index
	//     this.$value = data
	//     this.$compiler = parentVM.$compile(el, $scope)
	//     this.$scope = $scope
	// }
	/**
	 *  create a sub-vm for array item with specified index
	 */
	function createSubVM (item, index) {
	    var subEl = this.child.cloneNode(true)
	    var data = shallowClone(item)

	    data.$index = index
	    data.$value = item

	    var $scope = new Scope(data, this.$scope)
	    // this.$scope is a parent scope, 
	    // on the top of current scope
	    if(this.$scope) {
	        this.$scope.children.push($scope)
	        // data.$parent = this.$scope.data
	    }
	    return {
	        $index: index,
	        $value: item,
	        $compiler: this.$vm.$compile(subEl, $scope),
	        $scope: $scope
	    }
	}
	function updateVMData (vm, data, index, mounted) {
	    // next time will add props to data object
	    var $data = vm.$scope.data = shallowClone(data)
	    $data.$index = index
	    $data.$value = data
	    // $data.$parent = vm.$scope.$parent ? vm.$scope.$parent.data : null

	    vm.$value = data
	    vm.$index = index
	    vm.$scope.$update(mounted || '')
	}
	function updateVMIndex (vm, index) {
	    vm.$index = index
	    var $data = vm.$scope.data
	    $data.$index = index
	    vm.$scope.$update()
	}
	function destroyVM (vm) {
	    var $parent = vm.$scope.$parent
	    $parent && $parent.$removeChild(vm.$scope)
	    // $compiler be inclued in $scope.bindings probably
	    vm.$compiler.$remove().$destroy()
	    vm.$scope.bindings.forEach(function (bd) {
	        bd.$destroy()
	    })                    
	}
	function noop () {}


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	module.exports = __webpack_require__(14)


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = function (__$expr__) {
		if (/^[_$][\w$]*$/.test(__$expr__)) {
			// access property if begin with _ or $
			return function ($scope) {
				return $scope[__$expr__]
			}
		} else {
			return new Function('$scope', 'with($scope){return (' + __$expr__ + ')}')
		}
	}

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 *  Scope abstraction is a colletor when compiler child template with scope 
	 */

	'use strict';

	function Scope (data, parent) {
	    this.data = data
	    this.bindings = []
	    this.children = []
	    this.$parent = parent || null
	}

	Scope.prototype.$update = function () {
	    var args = arguments
	    this.bindings.forEach(function (bd) {
	        bd.$update.apply(bd, args)
	    })
	    this.children.forEach(function (child) {
	        child.$update.apply(child, args)
	    })
	}
	Scope.prototype.$removeChild = function (scope) {
	    var i = this.children.indexOf(scope)
	    if (~i) {
	        scope.$parent = null
	        this.children.splice(i, 1)
	    }
	    return this
	}
	Scope.prototype.$addChild = function (scope) {
	    if (!~this.children.indexOf(scope)) this.children.push(scope)
	    return this
	}

	module.exports = Scope

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/**
	 *  External module's name startof "$"
	 */
	var $Message = __webpack_require__(15)
	var $keypath = __webpack_require__(16)
	var $arrayHook = __webpack_require__(17)
	var $info = __webpack_require__(18)
	var $util = __webpack_require__(19)
	var $normalize = $keypath.normalize
	var $join = $keypath.join
	var $type = $util.type
	var $indexOf = $util.indexOf
	var $hasOwn = $util.hasOwn
	var $warn = $info.warn

	/**
	 *  CONTS
	 */
	var STRING = 'string'
	var ARRAY = 'array'
	var OBJECT = 'object'
	var FUNCTION = 'function'
	var CHANGE_EVENT = 'change'

	var _id = 0
	function allotId() {
	    return _id ++
	}

	/**
	 *  Mux model constructor
	 *  @public
	 */
	function Mux(options) {
	    // static config checking
	    options = options || {}
	    Ctor.call(this, options)
	}

	/**
	 *  Mux model creator 
	 *  @public
	 */
	Mux.extend = function(options) {
	    return MuxFactory(options || {})
	}

	/**
	 *  Mux global config
	 *  @param conf <Object>
	 */
	Mux.config = function (conf) {
	    if (conf.warn === false) $info.disable()
	    else $info.enable()
	}

	/**
	 *  Create a emitter instance
	 *  @param `Optional` context use for binding "this"
	 */
	Mux.emitter = function (context) {
	    return new $Message(context)
	}

	/**
	 *  Expose Keypath API
	 */
	Mux.keyPath = $keypath
	Mux.utils = $util

	/**
	 *  Mux model factory
	 *  @private
	 */
	function MuxFactory(options) {

	    function Class (receiveProps) {
	        Ctor.call(this, options, receiveProps)
	    }
	    Class.prototype = Object.create(Mux.prototype)
	    return Class
	}
	/**
	 *  Mux's model class, could instance with "new" operator or call it directly.
	 *  @param receiveProps <Object> initial props set to model which will no trigger change event.
	 */
	function Ctor(options, receiveProps) {
	    var model = this
	    var emitter = options.emitter || new $Message(model) // EventEmitter of this model, context bind to model
	    var _emitter = options._emitter || new $Message(model)
	    var _computedCtx = $hasOwn(options, 'computedContext') ? options.computedContext : model
	    var __kp__ = $keypath.normalize(options.__kp__ || '')
	    var __muxid__ = allotId()
	    var _isExternalEmitter =  !!options.emitter
	    var _isExternalPrivateEmitter =  !!options._emitter
	    var _destroy // interanl destroyed flag
	    var _privateProperties = {}

	    _defPrivateProperty('__muxid__', __muxid__)
	    _defPrivateProperty('__kp__', __kp__)
	    /**
	     *  return current keypath prefix of this model
	     */
	    function _rootPath () {
	        return __kp__ || ''
	    }

	    /**
	     *  define priavate property of the instance object
	     */
	    function _defPrivateProperty(name, value) {
	        if (instanceOf(value, Function)) value = value.bind(model)
	        _privateProperties[name] = value
	        $util.def(model, name, {
	            enumerable: false,
	            value: value
	        })
	    }

	    var getter = options.props

	    /**
	     *  Get initial props from options
	     */
	    var _initialProps = {}
	    var _t = $type(getter)
	    if (_t == FUNCTION) {
	        _initialProps = getter()
	    } else if (_t == OBJECT) {
	        _initialProps = getter
	    }
	    // free
	    getter = null

	    var _initialComputedProps = options.computed
	    var _computedProps = {}
	    var _computedKeys = []
	    var _cptDepsMapping = {} // mapping: deps --> props
	    var _cptCaches = {} // computed properties caches
	    var _observableKeys = []
	    var _props = {} // all observable properties {propname: propvalue}

	    /**
	     *  Observe initial properties
	     */
	    $util.objEach(_initialProps, function (pn, pv) {
	        _$add(pn, pv, true)
	    })
	    _initialProps = null

	    /**
	     *  Define initial computed properties
	     */
	    $util.objEach(_initialComputedProps, function (pn, def) {
	        _$computed(pn, def.deps, def.get, def.set, def.enum)
	    })
	    _initialComputedProps = null


	    /**
	     *  batch emit computed property change
	     */
	    _emitter.on(CHANGE_EVENT, function (kp) {
	        var willComputedProps = []
	        var mappings = []

	        if (!Object.keys(_cptDepsMapping).length) return

	        while(kp) {
	            _cptDepsMapping[kp] && (mappings = mappings.concat(_cptDepsMapping[kp]))
	            kp = $keypath.digest(kp)
	        }

	        if (!mappings.length) return
	        /**
	         *  get all computed props that depend on kp
	         */
	        mappings.reduce(function (pv, cv) {
	            if (!$indexOf(pv, cv)) pv.push(cv)
	            return pv
	        }, willComputedProps)

	        willComputedProps.forEach(function (ck) {
	            $util.patch(_cptCaches, ck, {})

	            var cache = _cptCaches[ck]
	            var pre = cache.pre = cache.cur
	            var next = cache.cur = (_computedProps[ck].get || NOOP).call(_computedCtx, model)
	            if ($util.diff(next, pre)) _emitChange(ck, next, pre)
	        })
	    }, __muxid__/*scope*/)


	    /**
	     *  private methods
	     */
	    function _destroyNotice () {
	        $warn('Instance already has bean destroyed')
	        return _destroy
	    }
	    //  local proxy for EventEmitter
	    function _emitChange(propname/*, arg1, ..., argX*/) {
	        var args = arguments
	        var kp = $normalize($join(_rootPath(), propname))
	        args[0] = CHANGE_EVENT + ':' + kp
	        _emitter.emit(CHANGE_EVENT, kp)
	        emitter.emit.apply(emitter, args)

	        args = $util.copyArray(args)
	        args[0] = kp
	        args.unshift('*')
	        emitter.emit.apply(emitter, args)
	    }
	    /**
	     *  Add dependence to "_cptDepsMapping"
	     *  @param propname <String> property name
	     *  @param dep <String> dependency name
	     */
	    function _prop2CptDepsMapping (propname, dep) {
	        // if ($indexOf(_computedKeys, dep))
	        //    return $warn('Dependency should not computed property')
	        $util.patch(_cptDepsMapping, dep, [])

	        var dest = _cptDepsMapping[dep]
	        if ($indexOf(dest, propname)) return
	        dest.push(propname)
	    }
	    /**
	     *  Instance or reuse a sub-mux-instance with specified keyPath and emitter
	     *  @param target <Object> instance target, it could be a Mux instance
	     *  @param props <Object> property value that has been walked
	     *  @param kp <String> keyPath of target, use to diff instance keyPath changes or instance with the keyPath
	     */
	    function _subInstance (target, props, kp) {

	        var ins
	        var _mux = target.__mux__
	        if (_mux && _mux.__kp__ === kp && _mux.__root__ === __muxid__) {
	            // reuse
	            ins = target
	            // emitter proxy
	            ins._$emitter(emitter)
	            // a private emitter for communication between instances
	            ins._$_emitter(_emitter)
	        } else {
	            ins = new Mux({
	                props: props,
	                emitter: emitter, 
	                _emitter: _emitter,
	                __kp__: kp
	            })
	        }
	        if (!ins.__root__) {
	            $util.def(ins, '__root__', {
	                enumerable: false,
	                value: __muxid__
	            })
	        }
	        return ins
	    }

	    /**
	     *  A hook method for setting value to "_props"
	     *  @param name <String> property name
	     *  @param value
	     *  @param mountedPath <String> property's value mouted path
	     */
	    function _walk (name, value, mountedPath) {
	        var tov = $type(value) // type of value
	        // initial path prefix is root path
	        var kp = mountedPath ? mountedPath : $join(_rootPath(), name)
	        /**
	         *  Array methods hook
	         */
	        if (tov == ARRAY) {
	            $arrayHook(value, function (self, methodName, nativeMethod, args) {
	                var pv = $util.copyArray(self)
	                var result = nativeMethod.apply(self, args)
	                // set value directly after walk
	                _props[name] = _walk(name, self, kp)
	                if (methodName == 'splice') {
	                    _emitChange(kp, self, pv, methodName, args)
	                } else {
	                    _emitChange(kp, self, pv, methodName)
	                }
	                return result
	            })
	        }

	        // deep observe into each property value
	        switch(tov) {
	            case OBJECT: 
	                // walk deep into object items
	                var props = {}
	                var obj = value
	                if (instanceOf(value, Mux)) obj = value.$props()
	                $util.objEach(obj, function (k, v) {
	                    props[k] = _walk(k, v, $join(kp, k))
	                })
	                return _subInstance(value, props, kp)
	            case ARRAY:
	                // walk deep into array items
	                value.forEach(function (item, index) {
	                    value[index] = _walk(index, item, $join(kp, index))
	                })
	                return value
	            default: 
	                return value
	        }
	    }

	    /*************************************************************
	            Function name start of "_$" are expose methods
	    *************************************************************/
	    /**
	     *  Set key-value pair to private model's property-object
	     *  @param kp <String> keyPath
	     *  @return <Object> diff object
	     */
	    function _$sync(kp, value, lazyEmit) {
	        var parts = $normalize(kp).split('.')
	        var prop = parts[0]

	        if ($indexOf(_computedKeys, prop)) {
	            // since Mux@2.4.0 computed property support setter
	            model[prop] = value
	            return
	        }
	        if (!$indexOf(_observableKeys, prop)) {
	            $warn('Property "' + prop + '" has not been observed')
	            // return false means sync prop fail
	            return
	        }
	        var pv = $keypath.get(_props, kp)
	        var isObj = instanceOf(value, Object)
	        var nKeypath = parts.join('.')
	        var name = parts.pop()
	        var parentPath = parts.join('.')
	        var parent = $keypath.get(_props, parentPath)
	        var isParentObserved = instanceOf(parent, Mux)
	        var changed
	        if (isParentObserved) {
	            if ($hasOwn(parent, name)) {
	                changed = parent._$set(name, value, lazyEmit)
	            } else {
	                parent._$add(name, value, lazyEmit)
	                changed = [$keypath.join(_rootPath(), kp), value]
	            }
	        } else {
	            $keypath.set(
	                _props, 
	                kp, 
	                isObj
	                    ? _walk(name, value, $join(_rootPath(), nKeypath))
	                    : value
	            )
	            if ($util.diff(value, pv)) {
	                if (!lazyEmit) {
	                    _emitChange(kp, value, pv)
	                } else {
	                    changed = [$keypath.join(_rootPath(), kp), value, pv]
	                }
	            }
	        }
	        return changed
	    }

	    /**
	     *  sync props value and trigger change event
	     *  @param kp <String> keyPath
	     */
	    function _$set(kp, value, lazyEmit) {
	        if (_destroy) return _destroyNotice()

	        return _$sync(kp, value, lazyEmit)
	        // if (!diff) return
	        /**
	         *  Base type change of object type will be trigger change event
	         *  next and pre value are not keypath value but property value
	         */
	        // if ( kp == diff.mounted && $util.diff(diff.next, diff.pre) ) {
	        //     var propname = diff.mounted
	        //     // emit change immediately
	        //     _emitChange(propname, diff.next, diff.pre)
	        // }
	    }

	    /**
	     *  sync props's value in batch and trigger change event
	     *  @param keyMap <Object> properties object
	     */
	    function _$setMulti(keyMap) {
	        if (_destroy) return _destroyNotice()

	        if (!keyMap || $type(keyMap) != OBJECT) return
	        var changes = []
	        $util.objEach(keyMap, function (key, item) {
	            var cg = _$set(key, item, true)
	            if (cg) changes.push(cg)
	        })

	        changes.forEach(function (args) {
	            _emitChange.apply(null, args)
	        })
	    }

	    /**
	     *  create a prop observer if not in observer, 
	     *  return true if no value setting.
	     *  @param prop <String> property name
	     *  @param value property value
	     */
	    function _$add(prop, value, lazyEmit) {
	        if (prop.match(/[\.\[\]]/)) {
	            throw new Error('Propname shoudn\'t contains "." or "[" or "]"')
	        }

	        if ($indexOf(_observableKeys, prop)) {
	            // If value is specified, reset value
	            return arguments.length > 1 ? true : false
	        }
	        _props[prop] = _walk(prop, $util.copyValue(value))
	        _observableKeys.push(prop)
	        $util.def(model, prop, {
	            enumerable: true,
	            get: function() {
	                return _props[prop]
	            },
	            set: function (v) {
	                _$set(prop, v)
	            }
	        })
	        // add peroperty will trigger change event
	        if (!lazyEmit) {
	            _emitChange(prop, value)
	        } else {
	            return {
	                kp: prop,
	                vl: value
	            }
	        }
	    }

	    /**
	     *  define computed prop/props of this model
	     *  @param propname <String> property name
	     *  @param deps <Array> computed property dependencies
	     *  @param get <Function> computed property getter
	     *  @param set <Function> computed property setter
	     *  @param enumerable <Boolean> whether property enumerable or not
	     */
	    function _$computed (propname, deps, getFn, setFn, enumerable) {
	        /**
	         *  property is exist
	         */
	        if ($indexOf(_computedKeys, propname)) return

	        _computedKeys.push(propname)
	        _computedProps[propname] = {
	            'deps': deps, 
	            'get': getFn,
	            'set': setFn
	        }

	        /**
	         *  Add to dependence-property mapping
	         */
	        ;(deps || []).forEach(function (dep) {
	            while(dep) {
	                _prop2CptDepsMapping(propname, dep)
	                dep = $keypath.digest(dep)
	            }
	        })
	        /**
	         *  define getter
	         */
	        $util.patch(_cptCaches, propname, {})
	        var dest = _cptCaches[propname]
	        dest.cur = getFn ? getFn.call(_computedCtx, model):undefined

	        $util.def(model, propname, {
	            enumerable: enumerable === undefined ? true : !!enumerable,
	            get: function () {
	                return dest.cur
	            },
	            set: function () {
	                setFn && setFn.apply(_computedCtx, arguments)
	            }
	        })
	        // emit change event when define
	        _emitChange(propname, dest.cur)
	    }

	    /*******************************
	               define instantiation's methods
	     *******************************/
	    /**
	     *  define observerable prop/props
	     *  @param propname <String> | <Array>
	     *  @param defaultValue Optional
	     *  ----------------------------
	     *  @param propnameArray <Array>
	     *  ------------------------
	     *  @param propsObj <Object>
	     */
	    _defPrivateProperty('$add', function(/* [propname [, defaultValue]] | propnameArray | propsObj */) {
	        var args = arguments
	        var first = args[0]
	        var pn, pv

	        switch($type(first)) {
	            case STRING:
	                // with specified value or not
	                pn = first
	                if (args.length > 1) {
	                    pv = args[1]
	                    if (_$add(pn, pv)) {
	                        _$set(pn, pv)
	                    }
	                } else {
	                    _$add(pn)
	                }
	                break
	            case ARRAY:
	                // observe properties without value
	                first.forEach(function (item) {
	                    _$add(item)
	                })
	                break
	            case OBJECT:
	                // observe properties with value, if key already exist, reset value only
	                var resetProps
	                $util.objEach(first, function (ipn, ipv) {
	                    if (_$add(ipn, ipv)) {
	                        !resetProps && (resetProps = {})
	                        resetProps[ipn] = ipv
	                    }
	                })
	                if (resetProps) _$setMulti(resetProps)
	                break
	            default:
	                $warn('Unexpect params')
	        }
	        return this
	    })
	    _defPrivateProperty('_$add', function (prop, value, lazyEmit) {
	        var result = _$add(prop, value, !!lazyEmit)
	        if (result === true) {
	            return _$set(prop, value, !!lazyEmit)
	        }
	        return result
	    })
	    /**
	     *  define computed prop/props
	     *  @param propname <String> property name
	     *  @param deps <Array> computed property dependencies
	     *  @param getFn <Function> computed property getter
	     *  @param setFn <Function> computed property setter
	     *  @param enumerable <Boolean> Optional, whether property enumerable or not
	     *  --------------------------------------------------
	     *  @param propsObj <Object> define multiple properties
	     */
	    _defPrivateProperty('$computed', function (propname/*, deps, getFn, setFn, enumerable | [propsObj]*/) {
	        if ($type(propname) == STRING) {
	            _$computed.apply(null, arguments)
	        } else if ($type(propname) == OBJECT) {
	            $util.objEach(arguments[0], function (pn, pv /*propname, propnamevalue*/) {
	                _$computed(pn, pv.deps, pv.get, pv.set, pv.enum)
	            })
	        } else {
	            $warn('$computed params show be "(String, Array, Function, Function)" or "(Object)"')
	        }
	        return this
	    })
	    /**
	     *  subscribe prop change
	     *  change prop/props value, it will be trigger change event
	     *  @param kp <String>
	     *  ---------------------
	     *  @param kpMap <Object>
	     */
	    _defPrivateProperty('$set', function( /*[kp, value] | [kpMap]*/ ) {
	        var args = arguments
	        var len = args.length
	        if (len >= 2 || (len == 1 && $type(args[0]) == STRING)) {
	            return _$set(args[0], args[1])
	        } else if (len == 1 && $type(args[0]) == OBJECT) {
	            return _$setMulti(args[0])
	        } else {
	            $warn('Unexpect $set params')
	        }
	    })
	    _defPrivateProperty('_$set', function(key, value, lazyEmit) {
	        return _$set(key, value, !!lazyEmit)
	    })
	    /**
	     *  Get property value by name, using for get value of computed property without cached
	     *  change prop/props value, it will be trigger change event
	     *  @param kp <String> keyPath
	     */
	    _defPrivateProperty('$get', function(kp) {
	        if ($indexOf(_observableKeys, kp)) 
	            return _props[kp]
	        else if ($indexOf(_computedKeys, kp)) {
	            return (_computedProps[kp].get || NOOP).call(_computedCtx, model)
	        } else {
	            // keyPath
	            var normalKP = $normalize(kp)
	            var parts = normalKP.split('.')
	            if (!$indexOf(_observableKeys, parts[0])) {
	                return
	            } else {
	                return $keypath.get(_props, normalKP)
	            }
	        }
	    })
	    /**
	     *  if params is (key, callback), add callback to key's subscription
	     *  if params is (callback), subscribe any prop change events of this model
	     *  @param key <String> optional
	     *  @param callback <Function>
	     */
	    _defPrivateProperty('$watch', function( /*[key, ]callback*/ ) {
	        var args = arguments
	        var len = args.length
	        var first = args[0]
	        var key, callback
	        if (len >= 2) {
	            key = CHANGE_EVENT + ':' + $normalize($join(_rootPath(), first))
	            callback = args[1]
	        } else if (len == 1 && $type(first) == FUNCTION) {
	            key = '*'
	            callback = first
	        } else {
	            $warn('Unexpect $watch params')
	            return NOOP
	        }
	        emitter.on(key, callback, __muxid__/*scopre*/)
	        var that = this
	        // return a unsubscribe method
	        return function() {
	            that.$unwatch.apply(that, args)
	        }
	    })
	    /**
	     *  unsubscribe prop change
	     *  if params is (key, callback), remove callback from key's subscription
	     *  if params is (callback), remove all callbacks from key's subscription
	     *  if params is empty, remove all callbacks of current model
	     *  @param key <String>
	     *  @param callback <Function>
	     */
	    _defPrivateProperty('$unwatch', function( /*[key, ] [callback] */ ) {
	        var args = arguments
	        var len = args.length
	        var first = args[0]
	        var params
	        var prefix
	        switch (true) {
	            case (len >= 2):
	                params = [args[1]]
	            case (len == 1 && $type(first) == STRING):
	                !params && (params = [])
	                prefix = CHANGE_EVENT + ':' + $normalize($join(_rootPath(), first))
	                params.unshift(prefix)
	                break
	            case (len == 1 && $type(first) == FUNCTION):
	                params = ['*', first]
	                break
	            case (len === 0):
	                params = []
	                break
	            default:
	                $warn('Unexpect param type of ' + first)
	        }
	        if (params) {
	            params.push(__muxid__)
	            emitter.off.apply(emitter, params)
	        }
	        return this
	    })
	    /**
	     *  Return all properties without computed properties
	     *  @return <Object>
	     */
	    _defPrivateProperty('$props', function() {
	        return $util.copyObject(_props)
	    })
	    /**
	     *  Reset event emitter
	     *  @param em <Object> emitter
	     */
	    _defPrivateProperty('$emitter', function (em, _pem) {
	        // return emitter instance if args is empty, 
	        // for share some emitter with other instance
	        if (arguments.length === 0) return emitter
	        emitter = em
	        _walkResetEmiter(this.$props(), em, _pem)
	        return this
	    })
	    /**
	     *  set emitter directly
	     */
	    _defPrivateProperty('_$emitter', function (em) {
	        emitter = em
	    })
	    /**
	     *  set private emitter directly
	     */
	    _defPrivateProperty('_$_emitter', function (em) {
	        instanceOf(em, $Message) && (_emitter = em)
	    })
	    /**
	     *  Call destroy will release all private properties and variables
	     */
	    _defPrivateProperty('$destroy', function () {
	        // clean up all proto methods
	        $util.objEach(_privateProperties, function (k, v) {
	            if ($type(v) == FUNCTION && k != '$destroyed') _privateProperties[k] = _destroyNotice
	        })

	        if (!_isExternalEmitter) emitter.off()
	        else emitter.off(__muxid__)

	        if (!_isExternalPrivateEmitter) _emitter.off()
	        else _emitter.off(__muxid__)

	        emitter = null
	        _emitter = null
	        _computedProps = null
	        _computedKeys = null
	        _cptDepsMapping = null
	        _cptCaches = null
	        _observableKeys = null
	        _props = null

	        // destroy external flag
	        _destroy = true
	    })
	    /**
	     *  This method is used to check the instance is destroyed or not
	     */
	    _defPrivateProperty('$destroyed', function () {
	        return _destroy
	    })
	    /**
	     *  A shortcut of $set(props) while instancing
	     */
	    _$setMulti(receiveProps)

	}
	/**
	 *  Reset emitter of the instance recursively
	 *  @param ins <Mux>
	 */
	function _walkResetEmiter (ins, em, _pem) {
	    if ($type(ins) == OBJECT) {
	        var items = ins
	        if (instanceOf(ins, Mux)) {
	            ins._$emitter(em, _pem)
	            items = ins.$props()
	        }
	        $util.objEach(items, function (k, v) {
	            _walkResetEmiter(v, em, _pem)
	        })
	    } else if ($type(ins) == ARRAY) {
	        ins.forEach(function (v) {
	            _walkResetEmiter(v, em, _pem)
	        })
	    }
	}

	function NOOP() {}
	function instanceOf(a, b) {
	    return a instanceof b
	}

	module.exports = Mux

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 *  Simple Pub/Sub module
	 *  @author switer <guankaishe@gmail.com>
	 **/
	'use strict';

	var $util = __webpack_require__(19)
	var _patch = $util.patch
	var _type = $util.type
	var _scopeDefault = '__default_scope__'

	function Message(context) {
	    this._obs = {}
	    this._context = context
	}
	var proto = Message.prototype
	proto.on = function(sub, cb, scope) {
	    scope = scope || _scopeDefault
	    _patch(this._obs, sub, [])

	    this._obs[sub].push({
	        cb: cb,
	        scope: scope
	    })
	}

	/**
	 *  @param subject <String> subscribe type
	 *  @param [cb] <Function> callback, Optional, if callback is not exist,
	 *      will remove all callback of that sub
	 */
	proto.off = function( /*subject, cb, scope*/ ) {
	    var types
	    var args = arguments
	    var len = args.length
	    var cb, scope

	    if (len >= 3) {
	        // clear all observers of this subject and callback eq "cb"
	        types = [args[0]]
	        cb = args[1]
	        scope = args[2]
	    } else if (len == 2 && _type(args[0]) == 'function') {
	        // clear all observers those callback equal "cb"
	        types = Object.keys(this._obs)
	        cb = args[0]
	        scope = args[1]
	    } else if (len == 2) {
	        // clear all observers of this subject
	        types = [args[0]]
	        scope = args[1]
	    } else if (len == 1) {
	        // clear all observes of the scope
	        types = Object.keys(this._obs)
	        scope = args[0]
	    } else {
	        // clear all observes
	        this._obs = []
	        return this
	    }

	    scope = scope || _scopeDefault

	    var that = this
	    types.forEach(function(sub) {

	        var obs = that._obs[sub]
	        if (!obs) return
	        var nextObs = []
	        if (cb) {
	            obs.forEach(function(observer) {
	                if (observer.cb === cb && observer.scope === scope) {
	                    return
	                }
	                nextObs.push(observer)
	            })
	        } else {
	            obs.forEach(function(observer) {
	                if (observer.scope === scope) return
	                nextObs.push(observer)
	            })
	        }
	        // if cb is not exist, clean all observers
	        that._obs[sub] = nextObs

	    })

	    return this
	}
	proto.emit = function(sub) {
	    var obs = this._obs[sub]
	    if (!obs) return
	    var args = [].slice.call(arguments)
	    args.shift()
	    var that = this
	    obs.forEach(function(item) {
	        item.cb && item.cb.apply(that._context || null, args)
	    })
	}

	module.exports = Message


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/**
	 *  normalize all access ways into dot access
	 *  @example "person.books[1].title" --> "person.books.1.title"
	 */
	function _keyPathNormalize(kp) {
	    return new String(kp).replace(/\[([^\[\]]+)\]/g, function(m, k) {
	        return '.' + k.replace(/^["']|["']$/g, '')
	    })
	}
	/**
	 *  set value to object by keypath
	 */
	function _set(obj, keypath, value, hook) {
	    var parts = _keyPathNormalize(keypath).split('.')
	    var last = parts.pop()
	    var dest = obj
	    parts.forEach(function(key) {
	        // Still set to non-object, just throw that error
	        dest = dest[key]
	    })
	    if (hook) {
	        // hook proxy set value
	        hook(dest, last, value)
	    } else {
	        dest[last] = value
	    }
	    return obj
	}
	/**
	 *  Get undefine
	 */
	function undf () {
	    return void(0)
	}
	function isNon (o) {
	    return o === undf() || o === null
	}
	/**
	 *  get value of object by keypath
	 */
	function _get(obj, keypath) {
	    var parts = _keyPathNormalize(keypath).split('.')
	    var dest = obj
	    parts.forEach(function(key) {
	        if (isNon(dest)) return !(dest = undf())
	        dest = dest[key]
	    })
	    return dest
	}

	/**
	 *  append path to a base path
	 */
	function _join(pre, tail) {
	    var _hasBegin = !!pre
	    if(!_hasBegin) pre = ''
	    if (/^\[.*\]$/.exec(tail)) return pre + tail
	    else if (typeof(tail) == 'number') return pre + '[' + tail + ']'
	    else if (_hasBegin) return pre + '.' + tail
	    else return tail
	}
	/**
	 *  remove the last section of the keypath
	 *  digest("a.b.c") --> "a.b"
	 */
	function _digest(nkp) {
	    var reg = /(\.[^\.]+|\[([^\[\]])+\])$/
	    if (!reg.exec(nkp)) return ''
	    return nkp.replace(reg, '')
	}
	module.exports = {
	    normalize: _keyPathNormalize,
	    set: _set,
	    get: _get,
	    join: _join,
	    digest: _digest
	}


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var $util = __webpack_require__(19)
	var hookMethods = ['splice', 'push', 'pop', 'shift', 'unshift', 'reverse', 'sort', '$concat']
	var _push = Array.prototype.push
	var _slice = Array.prototype.slice
	var attachMethods = {
	    '$concat': function () {
	        var args = _slice.call(arguments)
	        var arr = this
	        args.forEach(function (items) {
	            $util.type(items) == 'array' 
	                ? items.forEach(function (item) {
	                        _push.call(arr, item)
	                    })
	                : _push.call(arr, items)
	        })
	        return arr
	    }
	}
	var hookFlag ='__hook__'

	module.exports = function (arr, hook) {
	    hookMethods.forEach(function (m) {
	        if (arr[m] && arr[m][hookFlag]) {
	            // reset hook method
	            arr[m][hookFlag](hook)
	            return
	        }
	        // cached native method
	        var nativeMethod = arr[m] || attachMethods[m]
	        // method proxy
	        $util.def(arr, m, {
	            enumerable: false,
	            value: function () {
	                return hook(arr, m, nativeMethod, arguments)
	            }
	        })
	        // flag mark
	        $util.def(arr[m], hookFlag, {
	            enumerable: false,
	            value: function (h) {
	                hook = h
	            }
	        })
	    })
	}

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _enable = true

	module.exports = {
	    enable: function () {
	        _enable = true
	    },
	    disable: function () {
	        _enable = false
	    },
	    warn: function (msg) {
	        if (!_enable) return
	        if (console.warn) return console.warn(msg)
	        console.log(msg)
	    }
	}

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	function hasOwn (obj, prop) {
	    return obj && obj.hasOwnProperty(prop)
	}
	var undef = void(0)
	module.exports = {
	    type: function (obj) {
	        if (obj === null) return 'null'
	        else if (obj === undef) return 'undefined'
	        var m = /\[object (\w+)\]/.exec(Object.prototype.toString.call(obj))
	        return m ? m[1].toLowerCase() : ''
	    },
	    objEach: function (obj, fn) {
	        if (!obj) return
	        for(var key in obj) {
	            if (hasOwn(obj, key)) {
	                if(fn(key, obj[key]) === false) break
	            }
	        }
	    },
	    patch: function (obj, prop, defValue) {
	        !obj[prop] && (obj[prop] = defValue)
	    },
	    diff: function (next, pre, _t) {
	        var that = this
	        // defult max 4 level        
	        _t = _t === undefined ? 4 : _t

	        if (_t <= 0) return next !== pre

	        if (this.type(next) == 'array' && this.type(pre) == 'array') {
	            if (next.length !== pre.length) return true
	            return next.some(function(item, index) {
	                return that.diff(item, pre[index], _t - 1)
	            })
	        } else if (this.type(next) == 'object' && this.type(pre) == 'object') {
	            var nkeys = Object.keys(next)
	            var pkeys = Object.keys(pre)
	            if (nkeys.length != pkeys.length) return true

	            return nkeys.some(function(k) {
	                return (!~pkeys.indexOf(k)) || that.diff(next[k], pre[k], _t - 1)
	            })
	        }
	        return next !== pre
	    },
	    copyArray: function (arr) {
	        var len = arr.length
	        var nArr = new Array(len)
	        while(len --) {
	            nArr[len] = arr[len]
	        }
	        return nArr
	    },
	    copyObject: function (obj) {
	        var cObj = {}
	        this.objEach(obj, function (k, v) {
	            cObj[k] = v
	        })
	        return cObj
	    },
	    copyValue: function (v) {
	        var t = this.type(v)
	        switch(t) {
	            case 'object': return this.copyObject(v)
	            case 'array': return this.copyArray(v)
	            default: return v
	        }
	    },
	    def: function () {
	        return Object.defineProperty.apply(Object, arguments)
	    },
	    indexOf: function (a, b) {
	        return ~a.indexOf(b)
	    },
	    merge: function (to, from) {
	        if (!from) return to
	        this.objEach(from, function (k, v) {
	            to[k] = v
	        })
	        return to
	    },
	    hasOwn: hasOwn
	}

/***/ }
/******/ ])
});
;