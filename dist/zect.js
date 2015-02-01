/**
* Zect v0.0.1
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
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
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

	var $ = __webpack_require__(2)
	var Mux = __webpack_require__(3)
	var util = __webpack_require__(4)
	var conf = __webpack_require__(5)
	/**
	 *  private vars
	 */
	var _getPresetDirective = __webpack_require__(6)
	var _globalDirectives = {}

	/**
	 *  Global API
	 */
	function Zect(options) {
	    return ViewModel.call(this, options || {})
	}
	Zect.extend = function(options) {
	    return function() {
	        _insertProto(this, Zect.prototype)
	        return ViewModel.call(this, options || {})
	    }
	}
	Zect.directive = function(id, definition) {
	    _globalDirectives[id] = definition
	}
	Zect.namespace = function(n) {
	    conf.namespace = n
	}


	function ViewModel (options) {
	    var proto = this.__proto__
	    var vm = this
	    var el = options.el

	    if (!el && options.template) {
	        el = document.createElement('div')
	        el.innerHTML = options.template
	    } else if (util.type(el) == 'string') {
	        el = document.querySelector(el)
	    } else if (!(el instanceof HTMLElement)) {
	        throw new Error('Unmatch el option')
	    }
	    vm.$el = el

	    var $data = new Mux({
	        deep: true,
	        props: options.data,
	        computed: options.computed
	    })
	    Object.defineProperty(vm, '$data', {
	        enumerable: true,
	        get: function() {
	            return $data
	        },
	        set: function(v) {
	            $data.$set(v)
	        }
	    })
	    util.objEach(_getPresetDirective(Zect), function (id, def) {
	        registerDirective(vm, id, def)
	    })
	    util.objEach(_globalDirectives, function (id, def) {
	        registerDirective(vm, id, def)
	    })

	    var ready = options.ready
	    ready && ready.call(vm)
	}


	var _dirId = 0

	function registerDirective(vm, id, definition) {
	    var attrName = conf.namespace + id
	    function defaultExpGetter(exp) {
	        if (/\:/.exec(exp)) {
	            return [exp.split(':')[1].trim(), exp.split(':')[0].trim()]
	        } else {
	            return [exp.trim()]
	        }
	    }

	    function directiveParse(tar) {
	        var directive = {
	            tar: tar,
	            mounted: vm.$el,
	            id: _dirId
	        }
	        var exp = $(tar).attr(attrName)
	        var expGetter = definition.exp
	        var bind = definition.bind
	        var update = definition.update

	        /**
	         *  remove declare syntax from element
	         */
	        $(tar).removeAttr(attrName)
	        
	        var watches = bind.apply(directive, (expGetter || defaultExpGetter)(exp) || [])
	        if (watches) {
	            var args = new Array(watches.length)
	            vm.$data.$watch(function (kp) {
	                watches.forEach(function(key, index) {
	                    if (kp.indexOf(key) === 0) {
	                        args[index] = vm.$data.$get(key)
	                        update.apply(directive, args)
	                    }
	                })
	            })
	            // take params initially
	            watches.forEach(function(key, index) {
	                args[index] = vm.$data.$get(key)
	                update.apply(directive, args)
	            })
	        }
	    }
	    /**
	     *  using selector to parse declare syntax
	     */
	    vm.$el.hasAttribute(attrName) && directiveParse(vm.$el)

	    $(vm.$el).find('[' + attrName + ']').each(function (tar) {
	        if(!vm.$el.contains(tar)) return
	        directiveParse(tar)
	    })
	}


	/**
	 *  utils
	 */
	function _insertProto(obj, proto) {
	    var end = obj.__proto__
	    obj.__proto__ = proto
	    obj.__proto__.__proto__ = end
	}

	module.exports = Zect

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var util = __webpack_require__(4)

	function Selector (sel) {
	    if (util.type(sel) == 'string') {
	        var nodes = util.copyArray(document.querySelectorAll(sel))
	        return Dom(nodes)
	    } else if (sel instanceof Dom) return sel
	    else if (sel instanceof HTMLElement) {
	        return Dom([sel])
	    } else {
	        throw new Error('Unexpect selector !')
	    }
	}

	function Dom (nodes) {
	    var ins = {
	        find: function (sel) {
	            var subs = []
	            nodes.forEach(function (n) {
	                subs = subs.concat(util.copyArray(n.querySelectorAll(sel)))
	            })
	            return Dom(subs)
	        },
	        attr: function (attname, attvalue) {
	            var len = arguments.length
	            var el = nodes[0]
	            if (len > 1) {
	                el.setAttribute(attname, attvalue)
	            } else if (len == 1) {
	                return (el.getAttribute(attname) || '').toString()
	            }
	            return this
	        },
	        removeAttr: function (attname) {
	            nodes.forEach(function (el) {
	                el.removeAttribute(attname)
	            })
	            return this
	        },
	        addClass: function (clazz) {
	            nodes.forEach(function (el) {
	                var classes = util.copyArray(el.classList)
	                if (!~classes.indexOf(clazz)) classes.push(clazz)
	                el.className = classes.join(' ')
	            })
	            return this
	        },
	        removeClass: function (clazz) {
	            nodes.forEach(function (el) {
	                el.className = classes.reduce(function (r, n) {
	                    if (n != clazz) r.push(n)
	                    return r
	                }, []).join(' ')
	            })
	            return this
	        },
	        each: function (fn) {
	            nodes.forEach(fn)
	            return this
	        },
	        on: function (type, listener, capture) {
	            nodes.forEach(function (el) {
	                el.addEventListener(type, listener, capture)
	            })
	            return this
	        },
	        off: function (type, listener) {
	            nodes.forEach(function (el) {
	                el.removeEventListener(type, listener)
	            })
	            return this
	        },
	        html: function (html) {
	            var len = arguments.length
	            if (len >= 1) {
	                nodes.forEach(function (el) {
	                    el.innerHTML = html
	                })
	            } else if (nodes.length){
	                return nodes[0].innerHTML
	            }
	            return this
	        },
	        parent: function () {
	            if (!nodes.length) return null
	            return Dom([nodes[0].parentNode])
	        },
	        remove: function () {
	            nodes.forEach(function (el) {
	                var parent = el.parentNode
	                parent && parent.removeChild(el)
	            })
	            return this
	        },
	        // return element by index
	        get: function (i) {
	            return nodes[i]
	        },
	        append: function (n) {
	            if (nodes.length) this.get(0).appendChild(n)
	            return this
	        },
	        replace: function (n) {
	            var $parent = this.parent()
	            $parent.get(0).replaceChild(n, this.get(0))
	            return this
	        }
	    }
	    ins.__proto__ = Dom.prototype
	    return ins
	}

	module.exports = Selector

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	/**
	* Mux.js v2.2.3
	* (c) 2014 guankaishe
	* Released under the MIT License.
	*/
	(function webpackUniversalModuleDefinition(root, factory) {
		if(true)
			module.exports = factory();
		else if(typeof define === 'function' && define.amd)
			define(factory);
		else if(typeof exports === 'object')
			exports["Mux"] = factory();
		else
			root["Mux"] = factory();
	})(this, function() {
	return /******/ (function(modules) { // webpackBootstrap
	/******/ 	// The module cache
	/******/ 	var installedModules = {};
	/******/
	/******/ 	// The require function
	/******/ 	function __webpack_require__(moduleId) {
	/******/
	/******/ 		// Check if module is in cache
	/******/ 		if(installedModules[moduleId])
	/******/ 			return installedModules[moduleId].exports;
	/******/
	/******/ 		// Create a new module (and put it into the cache)
	/******/ 		var module = installedModules[moduleId] = {
	/******/ 			exports: {},
	/******/ 			id: moduleId,
	/******/ 			loaded: false
	/******/ 		};
	/******/
	/******/ 		// Execute the module function
	/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
	/******/
	/******/ 		// Flag the module as loaded
	/******/ 		module.loaded = true;
	/******/
	/******/ 		// Return the exports of the module
	/******/ 		return module.exports;
	/******/ 	}
	/******/
	/******/
	/******/ 	// expose the modules object (__webpack_modules__)
	/******/ 	__webpack_require__.m = modules;
	/******/
	/******/ 	// expose the module cache
	/******/ 	__webpack_require__.c = installedModules;
	/******/
	/******/ 	// __webpack_public_path__
	/******/ 	__webpack_require__.p = "";
	/******/
	/******/ 	// Load entry module and return exports
	/******/ 	return __webpack_require__(0);
	/******/ })
	/************************************************************************/
	/******/ ([
	/* 0 */
	/***/ function(module, exports, __webpack_require__) {

		'use strict';

		module.exports = __webpack_require__(1)


	/***/ },
	/* 1 */
	/***/ function(module, exports, __webpack_require__) {

		'use strict';

		/**
		 *  External module's name startof "$"
		 */
		var $Message = __webpack_require__(2)
		var $expect = __webpack_require__(3)
		var $keypath = __webpack_require__(4)
		var $arrayHook = __webpack_require__(5)
		var $info = __webpack_require__(6)
		var $util = __webpack_require__(7)

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

		/**
		 *  Mux model factory
		 *  @private
		 */
		function MuxFactory(options) {

		    return function (receiveProps) {
		        if (!(this instanceof Mux)) $util.insertProto(this, Mux.prototype)
		        Ctor.call(this, options, receiveProps)
		    }
		}
		/**
		 *  Mux's model class, could instance with "new" operator or call it directly.
		 *  @param receiveProps <Object> initial props set to model which will no trigger change event.
		 */
		function Ctor(options, receiveProps) {
		    var model = this
		    var emitter = options.emitter || new $Message(model) // EventEmitter of this model, context bind to model
		    var _emitter = options._emitter || new $Message(model)
		    var _isDeep = options.deep || !options.hasOwnProperty('deep') // default to true
		    var __kp__ = options.__kp__
		    var proto = {
		        '__muxid__': allotId()
		    }
		    $util.insertProto(model, proto)

		    /**
		     *  return current keypath prefix of this model
		     */
		    function _rootPath () {
		        return __kp__ || ''
		    }

		    var getter = options.props

		    /**
		     *  Get initial props from options
		     */
		    var _initialProps = {}
		    if ($util.type(getter) == 'function') {
		        _initialProps = getter()
		    } else if ($util.type(getter) == 'object') {
		        _initialProps = getter
		    }

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
		        _$add(pn, pv)
		    })
		    _initialProps = null

		    /**
		     *  Define initial computed properties
		     */
		    $util.objEach(_initialComputedProps, function (pn, def) {
		        _$computed(pn, def.deps, def.fn, def.enum)
		    })
		    _initialComputedProps = null


		    /**
		     *  local proxy for EventEmitter
		     */
		    function _emitChange(propname/*, arg1, ..., argX*/) {
		        var args = arguments
		        var evtArgs = $util.copyArray(args)
		        var kp = $keypath.normalize($keypath.join(_rootPath(), propname))

		        args[0] = 'change:' + kp
		        _emitter.emit('change', kp)
		        emitter.emit.apply(emitter, args)

		        evtArgs[0] = kp
		        evtArgs.unshift('*')
		        emitter.emit.apply(emitter, evtArgs)
		    }
		    /**
		     *  batch emit computed property change
		     */
		    _emitter.on('change', function (kp) {
		        var willComputedProps = []
		        /**
		         *  get all computed props that depend on kp
		         */
		        ;(_cptDepsMapping[kp] || []).reduce(function (pv, cv) {
		            if (!~pv.indexOf(cv)) pv.push(cv)
		            return pv
		        }, willComputedProps)

		        willComputedProps.forEach(function (ck) {
		            $util.patch(_cptCaches, ck, {})
		            var pre = _cptCaches[ck].pre = _cptCaches[ck].current
		            var next = _cptCaches[ck].current = (_computedProps[ck].fn || NOOP).call(model, model)

		            if ($util.diff(next, pre)) _emitChange(ck, next, pre)
		        })
		    })
		    /**
		     *  Add dependence to "_cptDepsMapping"
		     *  @param propname <String> property name
		     *  @param dep <String> dependency name
		     */
		    function _prop2CptDepsMapping (propname, dep) {
		        if (~_computedKeys.indexOf(dep)) 
		           return $info.warn('Dependency should not computed property')

		        $util.patch(_cptDepsMapping, dep, [])
		        if (~_cptDepsMapping[dep].indexOf(propname)) return
		        _cptDepsMapping[dep].push(propname)
		    }
		    /**
		     *  Instance or reuse a sub-mux-instance with specified keyPath and emitter
		     *  @param target <Object> instance target, it could be a Mux instance
		     *  @param props <Object> property value that has been walked
		     *  @param kp <String> keyPath of target, use to diff instance keyPath changes or instance with the keyPath
		     */
		    function _subInstance (target, props, kp) {

		        var ins
		        if (target instanceof Mux && target.__kp__ === kp && target.__root__ == model.__muxid__) {
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
		                deep: true,
		                _emitter: _emitter,
		                __kp__: kp
		            })
		        }
		        if (ins.__root__ == undefined) {
		            $util.def(ins, '__root__', {
		                enumerable: false,
		                value: model.__muxid__
		            })
		        }
		        return ins
		    }

		    /**
		     *  A hook method for setting value to "_props"
		     *  @param name <String> property name
		     *  @param value
		     *  @param basePath <String> property's value mouted path
		     */
		    function _walk (name, value, basePath) {
		        var tov = $util.type(value) // type of value
		        // initial path prefix is root path
		        var kp = basePath ? basePath : $keypath.join(_rootPath(), name)
		        /**
		         *  Array methods hook
		         */
		        if (tov == 'array') {
		            $arrayHook(value, function (self, methodName, nativeMethod, args) {
		                var pv = $util.copyArray(self)
		                var result = nativeMethod.apply(self, args)
		                // set value directly after walk
		                _props[name] = _walk(name, self, kp)

		                _emitChange(name, self, pv)
		                return result
		            })
		        }

		        if (!_isDeep) return value
		        // deep observe into each property value
		        switch(tov) {
		            case 'object': 
		                // walk deep into object items
		                var props = {}
		                var obj = value
		                if (value instanceof Mux) obj = value.$props()
		                $util.objEach(obj, function (k, v) {
		                    props[k] = _walk(k, v, $keypath.join(kp, k))
		                })
		                return _subInstance(value, props, kp)
		            case 'array':
		                // walk deep into array items
		                value.forEach(function (item, index) {
		                    value[index] = _walk(index, item, $keypath.join(kp, index))
		                    /**
		                     *  "defineProperty" to array indexcies will cause performance problem
		                     *  remove it
		                     */
		                    // $util.def(value, index, {
		                    //     enumerable: true,
		                    //     get: function () {
		                    //         return item
		                    //     },
		                    //     set: function (v) {
		                    //         var pv = item
		                    //         var mn = $keypath.join(name, index) // mounted property name
		                    //         item = _walk(index, v, $keypath.join(kp, index))
		                    //         _emitChange(mn, item, pv)
		                    //     }
		                    // })
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
		    function _$sync(kp, value) {
		        var parts = $keypath.normalize(kp).split('.')
		        var prop = parts[0]

		        if (~_computedKeys.indexOf(prop)) {
		            $info.warn('Can\'t set value to computed property "' + prop + '"')
		            // return false means sync prop fail
		            return false
		        }
		        if (!~_observableKeys.indexOf(prop)) {
		            $info.warn('Property "' + prop + '" has not been observed')
		            // return false means sync prop fail
		            return false
		        }

		        var pv = _props[prop] // old value
		        var isArrayChange
		        var piv
		        $keypath.set(_props, kp, value, function (tar, key, v) {
		            v = $util.copyValue(value)
		            if (tar instanceof Mux) {
		                if (tar.hasOwnProperty(key)) {
		                    tar.$set(key, v)
		                } else {
		                    tar.$add(key, v)
		                }
		            } else {
	                	if ( _isDeep && $util.type(tar) == 'array' && key.match(/^\d+$/) )  {
		        			isArrayChange = true
		        			piv = tar[key]
				        }
		                tar[key] = v
		            }
		        })
				if (isArrayChange) {
					_emitChange(kp, value, piv)
				}
		        /**
		         *  return previous and next value for another compare logic
		         */
		        return {
		            mounted: prop,
		            next: _props[prop],
		            pre: pv
		        }
		    }

		    /**
		     *  sync props value and trigger change event
		     *  @param kp <String> keyPath
		     */
		    function _$set(kp, value) {
		        var diff = _$sync(kp, value)
		        if (!diff) return
		        /**
		         *  Base type change of object type will be trigger change event
		         *  next and pre value are not keypath value but property value
		         */
		        if ( ((_isDeep && kp == diff.mounted) || !_isDeep) && $util.diff(diff.next, diff.pre) ) {
		            var propname = diff.mounted
		            // emit change immediately
		            _emitChange(propname, diff.next, diff.pre)
		        }
		    }

		    /**
		     *  sync props's value in batch and trigger change event
		     *  @param keyMap <Object> properties object
		     */
		    function _$setMulti(keyMap) {

		        if (!keyMap || $util.type(keyMap) != 'object') return
		        $util.objEach(keyMap, function (key, item) {
		            _$set(key, item)
		        })
		    }

		    /**
		     *  create a prop observer
		     *  @param prop <String> property name
		     *  @param value property value
		     */
		    function _$add(prop, value) {
		        var len = arguments.length
		        $expect(!prop.match(/[\.\[\]]/), 'Propname shoudn\'t contains "." or "[" or "]"')

		        if (~_observableKeys.indexOf(prop)) {
		            // If value is specified, reset value
		            if (len > 1) return true
		            return
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
		        _emitChange(prop, value)
		    }

		    /**
		     *  define computed prop/props of this model
		     *  @param propname <String> property name
		     *  @param deps <Array> computed property dependencies
		     *  @param fn <Function> computed property getter
		     *  @param enumerable <Boolean> whether property enumerable or not
		     */
		    function _$computed (propname, deps, fn, enumerable) {
		        switch (false) {
		            case ($util.type(propname) == 'string'): 
		                $info.warn('Propname\'s should be "String"')
		            case ($util.type(deps) == 'array'): 
		                $info.warn('"deps" should be "Array"')
		            case ($util.type(fn) == 'function'):
		                $info.warn('"fn" should be "Function"')
		        }
		        /**
		         *  property is exist
		         */
		        if (~_computedKeys.indexOf(propname)) return

		        _computedKeys.push(propname)
		        _computedProps[propname] = {
		            'deps': deps, 
		            'fn': fn
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
		        _cptCaches[propname].current = fn ? fn.call(model, model):undefined

		        $util.def(model, propname, {
		            enumerable: enumerable === undefined ? true : !!enumerable,
		            get: function () {
		                return _cptCaches[propname].current
		            },
		            set: function () {
		                $info.warn('Can\'t set value to computed property')
		            }
		        })
		        // emit change event when define
		        _emitChange(propname, _cptCaches[propname].current)
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
		    proto.$add = function(/* [propname [, defaultValue]] | propnameArray | propsObj */) {
		        var args = arguments
		        var first = args[0]
		        var pn, pv

		        switch($util.type(first)) {
		            case 'string':
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
		            case 'array':
		                // observe properties without value
		                first.forEach(function (item) {
		                    _$add(item)
		                })
		                break
		            case 'object':
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
		                info.warn('Unexpect params')
		        }
		        return this
		    }
		        /**
		         *  define computed prop/props
		         *  @param propname <String> property name
		         *  @param deps <Array> computed property dependencies
		         *  @param fn <Function> computed property getter
		         *  @param enumerable <Boolean> Optional, whether property enumerable or not
		         *  --------------------------------------------------
		         *  @param propsObj <Object> define multiple properties
		         */
		    proto.$computed = function (propname, deps, fn, enumerable/* | [propsObj]*/) {
		        if ($util.type(propname) == 'string') {
		            _$computed.apply(null, arguments)
		        } else if ($util.type(propname) == 'object') {
		            $util.objEach(arguments[0], function (pn, pv/*propname, propnamevalue*/) {
		                _$computed(pn, pv.deps, pv.fn, pv.enum)
		            })
		        } else {
		            $info.warn('$computed params show be "(String, Array, Function)" or "(Object)"')
		        }
		        return this
		    }
		    /**
		     *  subscribe prop change
		     *  change prop/props value, it will be trigger change event
		     *  @param kp <String>
		     *  ---------------------
		     *  @param kpMap <Object>
		     */
		    proto.$set = function( /*[kp, value] | [kpMap]*/ ) {
		        var args = arguments
		        var len = args.length
		        if (len >= 2 || (len == 1 && $util.type(args[0]) == 'string')) {
		            _$set(args[0], args[1])
		        } else if (len == 1 && $util.type(args[0]) == 'object') {
		            _$setMulti(args[0])
		        } else {
		            $info.warn('Unexpect $set params')
		        }

		        return this
		    }

		    /**
		     *  Get property value by name, using for get value of computed property without cached
		     *  change prop/props value, it will be trigger change event
		     *  @param kp <String> keyPath
		     */
		    proto.$get = function(kp) {
		        if (~_observableKeys.indexOf(kp)) 
		            return _props[kp]
		        else if (~_computedKeys.indexOf(kp)) {
		            return (_computedProps[kp].fn || NOOP).call(model, model)
		        } else {
		            // keyPath
		            var normalKP = $keypath.normalize(kp)
		            var parts = normalKP.split('.')
		            if (!~_observableKeys.indexOf(parts[0])) {
		                return
		            } else {
		                return $keypath.get(_props, normalKP)
		            }
		        }
		    }
		    /**
		     *  if params is (key, callback), add callback to key's subscription
		     *  if params is (callback), subscribe any prop change events of this model
		     *  @param key <String> optional
		     *  @param callback <Function>
		     */
		    proto.$watch =  function( /*[key, ]callback*/ ) {
		        var args = arguments
		        var len = args.length
		        var first = args[0]
		        var key, callback
		        if (len >= 2) {
		            key = 'change:' + $keypath.normalize($keypath.join(_rootPath(), first))
		            callback = args[1]
		        } else if (len == 1 && $util.type(first) == 'function') {
		            key = '*'
		            callback = first
		        } else {
		            $info.warn('Unexpect $watch params')
		            return NOOP
		        }
		        emitter.on(key, callback)

		        var that = this
		        // return a unsubscribe method
		        return function() {
		            that.$unwatch.apply(that, args)
		        }
		    }
		    /**
		     *  unsubscribe prop change
		     *  if params is (key, callback), remove callback from key's subscription
		     *  if params is (callback), remove all callbacks from key' ubscription
		     *  if params is empty, remove all callbacks of current model
		     *  @param key <String>
		     *  @param callback <Function>
		     */
		    proto.$unwatch = function( /*[key, ] [callback] */ ) {
		        var args = arguments
		        var len = args.length
		        var first = args[0]
		        var params
		        var prefix
		        if (len >= 2) {
		            prefix = $keypath.normalize($keypath.join(_rootPath(), first))
		            // key + callback
		            params = ['change:' + prefix, args[1]]
		        } else if (len == 1 && $util.type(first) == 'string') {
		            prefix = $keypath.normalize($keypath.join(_rootPath(), first))
		            // key
		            params = ['change:' + prefix]
		        } else if (len == 1 && $util.type(first) == 'function') {
		            // callback
		            params = ['*', first]
		        } else if (len == 0) {
		            // all
		            params = []
		        } else {
		            $info.warn('Unexpect param type of ' + first)
		        }
		        if (params) {
		            emitter.off.apply(emitter, params)
		        }
		        return this
		    }
		    /**
		     *  Return all properties without computed properties
		     *  @return <Object>
		     */
		    proto.$props = function() {
		        return $util.copyObject(_props)
		    }
		    /**
		     *  Reset event emitter
		     *  @param em <Object> emitter
		     */
		    proto.$emitter = function (em, _pem) {
		        emitter = em
		        _isDeep && _walkResetEmiter(this.$props(), em, _pem)
		        return this
		    }
		    /**
		     *  set emitter directly
		     */
		    proto._$emitter = function (em) {
		        emitter = em
		    }
		    /**
		     *  set private emitter directly
		     */
		    proto._$_emitter = function (em) {
		        em instanceof $Message && (_emitter = em)
		    }
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
		    if ($util.type(ins) == 'object') {
		        var items = ins
		        if (ins instanceof Mux) {
		            ins._$emitter(em, _pem)
		            items = ins.$props()
		        }
		        $util.objEach(items, function (k, v) {
		            _walkResetEmiter(v, em, _pem)
		        })
		    } else if ($util.type(ins) == 'array') {
		        ins.forEach(function (v) {
		            _walkResetEmiter(v, em, _pem)
		        })
		    }
		}

		function NOOP() {}

		module.exports = Mux


	/***/ },
	/* 2 */
	/***/ function(module, exports, __webpack_require__) {

		/**
		 *  Simple Pub/Sub module
		 *  @author switer <guankaishe@gmail.com>
		 **/
		'use strict';

		var $util = __webpack_require__(7)
		var _patch = $util.patch
		var _type = $util.type

		function Message(context) {
		    this._observers = {}
		    this._context = context
		}

		Message.prototype.on = function(sub, cb) {
		    _patch(this._observers, sub, [])

		    this._observers[sub].push({
		        cb: cb
		    })
		}

		/**
		 *  @param subject <String> subscribe type
		 *  @param [cb] <Function> callback, Optional, if callback is not exist, 
		 *      will remove all callback of that sub 
		 */
		Message.prototype.off = function(subject, cb) {
		    var types
		    var args = arguments

		    var len = args.length
		    if (len >= 2) {
		        // clear all observers of this subject and callback eq "cb"
		        types = [subject]
		    } else if (len == 1 && _type(args[0]) == 'function') {
		        // clear all observers those callback equal "cb"
		        cb = args[0]
		        types = Object.keys(this._observers)
		    } else if (len == 1) {
		        // clear all observers of this subject
		        types = [subject]
		    } else {
		        // clear all
		        this._observers = []
		        return this
		    }

		    var that = this
		    types.forEach(function(sub) {

		        var obs = that._observers[sub]
		        if (!obs) return

		        var nextObs = []
		        if (cb) {
		            obs.forEach(function(observer) {
		                if (observer.cb !== cb) {
		                    nextObs.push(observer)
		                }
		            })
		        }
		        // if cb is not exist, clean all observers
		        that._observers[sub] = nextObs

		    })

		    return this
		}
		Message.prototype.emit = function(sub) {
		    var obs = this._observers[sub]
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
	/* 3 */
	/***/ function(module, exports, __webpack_require__) {

		'use strict';

		/**
		 *  Expect condition is truely
		 *  @param cnd <Boolean>
		 *  @param msg <String> *optional*
		 */
		function expect(cnd, msg) {
		    if (!cnd) throw new Error(msg || 'Unexpect error')
		}
		module.exports = expect


	/***/ },
	/* 4 */
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
		 *  get value of object by keypath
		 */
		function _get(obj, keypath) {
		    var parts = _keyPathNormalize(keypath).split('.')
		    var dest = obj
		    parts.forEach(function(key) {
		        // Still set to non-object, just throw that error
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

		function _digest(nkp) {
		    var reg = /\.[^\.]+|\[([^\[\]])+\]$/
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
	/* 5 */
	/***/ function(module, exports, __webpack_require__) {

		'use strict';

		var $util = __webpack_require__(7)
		var hookMethods = ['splice', 'push', 'pop', 'shift', 'unshift', 'reverse']
		var hookFlag ='__hook__'

		module.exports = function (arr, hook) {
		    hookMethods.forEach(function (m) {
		        if (arr[m][hookFlag]) {
		            // reset hook method
		            arr[m][hookFlag](hook)
		            return
		        }
		        // cached native method
		        var nativeMethod = arr[m]
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
	/* 6 */
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
	/* 7 */
	/***/ function(module, exports, __webpack_require__) {

		'use strict';

		module.exports = {
		    type: function (obj) {
		        return /\[object (\w+)\]/.exec(Object.prototype.toString.call(obj))[1].toLowerCase()
		    },
		    objEach: function (obj, fn) {
		        if (!obj) return
		        for(var key in obj) {
		            if (obj.hasOwnProperty(key)) {
		                fn(key, obj[key])
		            }
		        }
		    },
		    patch: function (obj, prop, defValue) {
		        !obj[prop] && (obj[prop] = defValue)
		    },
		    diff: function (next, pre) {
		        return next !== pre || next instanceof Object
		    },
		    merge: function (dest, source) {
		        this.objEach(source, function (k, v) {
		            dest[k] = v
		        })
		        return dest
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
		    insertProto: function (obj, proto) {
		        var end = obj.__proto__
		        obj.__proto__ = proto
		        obj.__proto__.__proto__ = end
		    },
		    def: function () {
		        return Object.defineProperty.apply(Object, arguments)
		    }
		}

	/***/ }
	/******/ ])
	});


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';


	module.exports = {
	    type: function(obj) {
	        return /\[object (\w+)\]/.exec(Object.prototype.toString.call(obj))[1].toLowerCase()
	    },
	    copyArray: function(arr) {
	        var len = arr.length
	        var nArr = new Array(len)
	        while (len--) {
	            nArr[len] = arr[len]
	        }
	        return nArr
	    },
	    objEach: function(obj, fn) {
	        if (!obj) return
	        for (var key in obj) {
	            if (obj.hasOwnProperty(key)) {
	                fn(key, obj[key])
	            }
	        }
	    },
	    /**
	     *  two level diff
	     */
	    diff: function(next, pre) {
	        var method
	        if (this.type(next) == 'array' && this.type(pre) == 'array')
	            method = this.arrayDiff
	        else if (this.type(next) == 'object' && this.type(pre) == 'object')
	            method = this.objDiff
	        else method = this.valueDiff

	        return method.call(this, next, pre)
	    },
	    objDiff: function(next, pre) {
	        var nkeys = Object.keys(next)
	        var pkeys = Object.keys(pre)
	        if (nkeys.length != pkeys.length) return true

	        var that = this
	        return nkeys.some(function(k) {
	            return (!~pkeys.indexOf(k)) || that.valueDiff(next[k], pre[k])
	        })
	    },
	    arrayDiff: function(next, pre) {
	        if (next.length !== pre.length) return true
	        var that = this
	        next.some(function(item, index) {
	            return that.valueDiff(item, pre[index])
	        })
	    },
	    valueDiff: function(next, pre) {
	        return next !== pre || next instanceof Object
	    }
	}


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _namespace = 'z-'
	module.exports = {
	    set namespace (n) {
	        _namespace = n + '-'
	    },
	    get namespace () {
	        return _namespace
	    }
	 }

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var $ = __webpack_require__(2)
	var conf = __webpack_require__(5)
	var util = __webpack_require__(4)

	module.exports = function(Zect) {
	    return {
	        'repeat': {
	            bind: function(wkey) {
	                var $el = $(this.tar)
	                this.$parent = $el.parent()
	                this.$holder = document.createComment(conf.namespace + 'repeat')
	                $el.replace(this.$holder, this.tar)
	                return [wkey]
	            },
	            update: function(items) {
	                if (!items || !items.forEach) {
	                    return console.warn('"' + conf.namespace + 'repeat" only accept Array data')
	                }
	                var that = this
	                function createSubVM (item, index) {
	                    var $subEl = that.tar.cloneNode(true)
	                    var $data = util.type(item) == 'object' ? item : {}
	                    $data.$index = index
	                    $data.$value = item

	                    var subVM = new Zect({
	                        el: $subEl,
	                        data: $data
	                    })

	                    subVM.$parentVM = that.vm
	                    return subVM
	                }

	                var vms = new Array(items.length)
	                var olds = this.last ? util.copyArray(this.last): olds
	                var oldVms = this.$vms ? util.copyArray(this.$vms): oldVms

	                items.forEach(function (item, index) {
	                    var v
	                    if (!olds) {
	                        v = createSubVM(item, index)
	                    } else {
	                        var i = olds.indexOf(item)
	                        if (~i && !util.diff(olds[i], item)) {
	                            // reused
	                            v = oldVms[i]
	                            // clean
	                            olds.splice(i, 1)
	                            oldVms.splice(i, 1)
	                            // reset $index
	                            v.$index = i
	                        } else {
	                            v = createSubVM(item, index)
	                        }
	                    }
	                    vms[index] = v
	                })
	                this.$vms = vms
	                this.last = util.copyArray(items)

	                var $floor = this.$holder
	                // from rear to head
	                var len = vms.length
	                while(len --) {
	                    var v = vms[len]
	                    that.$parent.get(0).insertBefore(v.$el, $floor)
	                    $floor = v.$el
	                }
	                oldVms && oldVms.forEach(function (v) {
	                    $(v.$el).remove()
	                })
	            }
	        },
	        'html': {
	            bind: function(wkey) {
	                return [wkey] // those dependencies need to watch
	            },
	            update: function(next) {
	                $(this.tar).html(next === undefined ? '':next)
	            }
	        },
	        'attr': {
	            bind: function(wkey, attname) {
	                this.attname = attname
	                return [wkey] // those dependencies need to watch
	            },
	            update: function(next) {
	                if (!next && next !== '') {
	                    $(this.tar).removeAttr(this.attname)
	                } else {
	                    $(this.tar).attr(this.attname, next)

	                }
	            }
	        },
	        'show': {
	            bind: function(wkey) {
	                return [wkey] // those dependencies need to watch
	            },
	            update: function(next) {
	                this.tar.style.display = next ? '': 'none'
	            }
	        },
	        'if': {
	            bind: function(wkey){
	                console.log(wkey)
	                var $el = $(this.tar)
	                this.$parent = $el.parent();
	                this.pnode = this.tar.parentNode;
	                this.$holder = document.createComment(conf.namespace + 'if')
	                
	                // insert ref
	                this.pnode.insertBefore(this.$holder, this.tar)
	                this.pnode.removeChild(this.tar)

	                return [wkey]
	            },
	            // next: true show || false del
	            update: function(next, key){
	                var $el = $(this.tar)
	                var $p = this.$parent

	                console.log(this.tar, next, this.$holder)

	                if(next){
	                    this.pnode.insertBefore(this.tar, this.$holder)
	                }else{
	                    this.pnode.removeChild(this.tar)
	                }
	            }
	        }
	    }
	}


/***/ }
/******/ ])
});
