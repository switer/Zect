/**
* Mux.js v2.1.0
* (c) 2014 guankaishe
* Released under the MIT License.
*/
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
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
	    staticOptionCheck(options)
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
	 *  Mux model factory
	 *  @private
	 */
	function MuxFactory(options) {
	    // static config checking
	    staticOptionCheck(options)

	    return function (receiveProps) {
	        $util.insertProto(this, Mux.prototype)
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
	    var _isDeep = !!options.deep
	    var proto = {}
	    $util.insertProto(model, proto)

	    /**
	     *  instance identifier
	     */
	    Object.defineProperty(model, '__muxid__', {
	        enumerable: false,
	        value: allotId()
	    })
	    /**
	     *  return current keypath prefix of this model
	     */
	    function _rootPath () {
	        return model.__kp__ || ''
	    }
	    /**
	     *  local proxy for EventEmitter
	     */
	    function _emit(propname/*, arg1, ..., argX*/) {
	        var prefix = _rootPath()
	        var args = arguments
	        prefix && (prefix += '.')
	        args[0] = 'change:' + prefix + propname
	        emitter.emit.apply(emitter, args)
	    }
	    function _emitAll() {
	        var args = $util.copyArray(arguments)
	        var message = '*:' + _rootPath()
	        args.unshift(message)
	        emitter.emit.apply(emitter, args)
	    }

	    var getter = options.props

	    /**
	     *  Get initial props from options
	     */
	    var _initialProps
	    if ($util.type(getter) == 'function') {
	        _initialProps = getter()
	    } else if ($util.type(getter) == 'object') {
	        _initialProps = getter
	    } else {
	        _initialProps = {}
	    }

	    var _initialComputedProps = options.computed
	    var _computedProps = {}
	    var _computedKeys = []
	    var _computedDepsMapping = {} // mapping: deps --> props
	    var _computedCaches = {}
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
	        _$computed(pn, def.deps, def.fn)
	    })
	    _initialComputedProps = null

	    /**
	     *  Add dependence to "_computedDepsMapping"
	     *  @param propname <String> property name
	     *  @param dep <String> dependency name
	     */
	    function _addProp2ComputedDepsMapping (propname, dep) {
	        if (~_computedKeys.indexOf(dep)) 
	           return $info.warn('"' + prop + '" is a computed property, couldn\'t depend a computed property')

	        $util.patch(_computedDepsMapping, dep, [])
	        if (~_computedDepsMapping[dep].indexOf(propname)) return
	        _computedDepsMapping[dep].push(propname)
	    }
	    /**
	     *  Instance or reuse a sub-mux-instance with specified keyPath and emitter
	     *  @param target <Object> instance target, it could be a Mux instance
	     *  @param props <Object> property value that has been walked
	     *  @param kp <String> keyPath of target, use to diff instance keyPath changes or instance with the keyPath
	     */
	    function _subInstance (target, props, kp) {

	        var ins
	        if (target instanceof Mux && target.__kp__ == kp) {
	            // reuse
	            ins = target
	            ins.$emitter(emitter)
	        } else {
	            ins = new Mux({
	                props: props, 
	                emitter: emitter, 
	                deep: true
	            })
	        }
	        if (ins.__kp__ == undefined) {
	            Object.defineProperty(ins, '__kp__', {
	                enumerable: false,
	                get: function () {
	                    return kp
	                },
	                set: function (value) {
	                    kp = value
	                }
	            })
	        } else if (ins.__kp__ != kp) {
	            ins.__kp__ = kp
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
	                // set value directly afer walk
	                _props[name] = _walk(name, self, kp)

	                _emit(name, self, pv)
	                _triggerPropertyComputedChange(name)
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
	                    item = _walk(index, item, $keypath.join(kp, index))
	                    Object.defineProperty(value, index, {
	                        enumerable: true,
	                        get: function () {
	                            return item
	                        },
	                        set: function (v) {
	                            var pv = item
	                            var mn = $keypath.join(name, index) // mounted property name
	                            item = _walk(index, v, $keypath.join(kp, index))
	                            _emit(mn, item, pv)
	                        }
	                    })
	                })
	                return value
	            default: 
	                return value
	        }
	    }

	    /**
	     *  Trigger computed change
	     *  @param propname <String>
	     */
	    function _triggerPropertyComputedChange (propname) {
	        ;(_computedDepsMapping[propname] || []).forEach(function (ck/*computed key*/) {
	            // values cached in meta object
	            $util.patch(_computedCaches, ck, {})
	            // value swap
	            _computedCaches[ck].pre = _computedCaches[ck].current
	            _computedCaches[ck].current = (_computedProps[ck].fn || NOOP).call(model, model)
	            // emit and passing (next-value, previous-value) 
	            _emit(ck, _computedCaches[ck].current, _computedCaches[ck].pre)
	        })
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

	        $keypath.set(_props, kp, value, function (tar, key, v) {
	            v = $util.copyValue(value)
	            if (tar instanceof Mux) {
	                if (tar.hasOwnProperty(key)) {
	                    tar.$set(key, v)
	                } else {
	                    tar.$add(key, v)
	                }
	            } else {
	                tar[key] = v
	            }
	        })
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
	        var pps = $util.merge({}, model) // previous props
	        var diff = _$sync(kp, value)
	        if (!diff) return
	        /**
	         *  Base type change of object type will be trigger change event
	         *  next and pre value are not keypath value but property value
	         */
	        if ( ((_isDeep && kp == diff.mounted) || !_isDeep) && $util.diff(diff.next, diff.pre) ) {
	            var propname = diff.mounted
	            _triggerPropertyComputedChange(propname)
	            _emit(propname, diff.next, diff.pre)
	            
	            // emit those wildcard callbacks
	            // passing nextPropsObj and prePropsObj as arguments
	            _emitAll($util.merge({}, model), pps)
	        }
	    }

	    /**
	     *  sync props's value in batch and trigger change event
	     *  @param keyMap <Object> properties object
	     */
	    function _$setMulti(keyMap) {

	        if (!keyMap || $util.type(keyMap) != 'object') return

	        var willComputedProps = []
	        var pps = $util.merge({}, model)
	        var hasDiff = false
	        var diff

	        $util.objEach(keyMap, function (key, item) {
	            diff = _$sync(key, item)
	            if (!diff) return
	            /**
	             *  if props is not congruent or diff is an object reference value
	             *  then emit change event
	             */
	            if (((_isDeep && key == diff.mounted) || !_isDeep) && $util.diff(diff.next, diff.pre)) {
	                var propname = diff.mounted
	                // emit change immediately
	                _emit(propname, diff.next, diff.pre)

	                // for batching emit, if deps has multiple change in once, only trigger one times 
	                ;(_computedDepsMapping[propname] || []).reduce(function (pv, cv) {
	                    if (!~pv.indexOf(cv)) pv.push(cv)
	                    return pv
	                }, willComputedProps)
	                hasDiff = true
	            }
	        })
	        /**
	         *  Trigger computed property change event in batch
	         */
	        willComputedProps.forEach(function (ck) {
	            $util.patch(_computedCaches, ck, {})
	            // next --> pre, last --> next swap
	            var pre = _computedCaches[ck].pre = _computedCaches[ck].current
	            var next = _computedCaches[ck].current = (_computedProps[ck].fn || NOOP).call(model, model)
	            if ($util.diff(next, pre)) _emit(ck, next, pre)
	        })
	        // emit those wildcard listener's callbacks
	        hasDiff && _emitAll($util.merge({}, model), pps)
	    }

	    /**
	     *  create a prop observer
	     *  @param prop <String> property name
	     *  @param value property value
	     */
	    function _$add(prop, value) {
	        var len = arguments.length
	        $expect(!prop.match(/[\.\[\]]/), 'Unexpect propname ' + +', it shoudn\'t has "." and "[" and "]"')

	        if (~_observableKeys.indexOf(prop)) {
	            // If value is specified, reset value
	            if (len > 1) return true
	            return
	        }
	        _props[prop] = _walk(prop, $util.copyValue(value))
	        _observableKeys.push(prop)
	        Object.defineProperty(model, prop, {
	            enumerable: true,
	            get: function() {
	                return _props[prop]
	            },
	            set: function (v) {
	                _$set(prop, v)
	            }
	        })
	        // add peroperty will trigger change event
	        _emit(prop, value)
	    }

	    /**
	     *  define computed prop/props of this model
	     *  @param propname <String> property name
	     *  @param deps <Array> computed property dependencies
	     *  @param fn <Function> computed property getter
	     */
	    function _$computed (propname, deps, fn) {
	        switch (false) {
	            case ($util.type(propname) == 'string'): 
	                $info.warn('Computed property\'s name should be type of String')
	            case ($util.type(deps) == 'array'): 
	                $info.warn('Computed property\'s "deps" should be type of Array')
	            case ($util.type(fn) == 'function'):
	                $info.warn('Computed property\'s "fn" should be type of Function')
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
	            _addProp2ComputedDepsMapping(propname, dep)
	        })
	        /**
	         *  define getter
	         */
	        $util.patch(_computedCaches, propname, {})
	        _computedCaches[propname].current = (fn || NOOP).call(model, model)

	        Object.defineProperty(model, propname, {
	            enumerable: true,
	            get: function () {
	                return _computedCaches[propname].current
	            },
	            set: function () {
	                $info.warn('Can not set value to a computed property')
	            }
	        })
	        // emit change event when define
	        _emit(propname, _computedCaches[propname].current)
	    }

	    /**
	     *  define instantiation's methods
	     */
	    Object.defineProperties(proto, {
	        /**
	         *  define observerable prop/props
	         *  @param propname <String> | <Array>
	         *  @param defaultValue Optional
	         *  ----------------------------
	         *  @param propnameArray <Array>
	         *  ------------------------
	         *  @param propsObj <Object>
	         */
	        "$add": {
	            enumerable: false,
	            value: function(/* [propname [, defaultValue]] | propnameArray | propsObj */) {
	                var first = arguments[0]
	                var pn, pv

	                switch($util.type(first)) {
	                    case 'string':
	                        // with specified value or not
	                        pn = first
	                        if (arguments.length > 1) {
	                            pv = arguments[1]
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
	        },
	        /**
	         *  define computed prop/props
	         *  @param propname <String> property name
	         *  @param deps <Array> computed property dependencies
	         *  @param fn <Function> computed property getter
	         *  --------------------------------------------------
	         *  @param propsObj <Object> define multiple properties
	         */
	        "$computed":  {
	            enumerable: false,
	            value: function (propname, deps, fn/* | [propsObj]*/) {

	                if ($util.type(propname) == 'string') {

	                    _$computed(propname, deps, fn)
	                } else if ($util.type(propname) == 'object') {

	                    $util.objEach(arguments[0], function (pn, pv/*propname, propnamevalue*/) {
	                        _$computed(pn, pv.deps, pv.fn)
	                    })
	                } else {
	                    $info.warn('$computed params show be "(String, Array, Function)" or "(Object)"')
	                }

	                return this
	            }
	        },
	        /**
	         *  subscribe prop change
	         *  change prop/props value, it will be trigger change event
	         *  @param kp <String>
	         *  ---------------------
	         *  @param kpMap <Object>
	         */
	        "$set": {
	            enumerable: false,
	            value: function( /*[kp, value] | [kpMap]*/ ) {
	                var len = arguments.length
	                if (len >= 2 || (len == 1 && $util.type(arguments[0]) == 'string')) {
	                    _$set(arguments[0], arguments[1])
	                } else if (len == 1 && $util.type(arguments[0]) == 'object') {
	                    _$setMulti(arguments[0])
	                } else {
	                    $info.warn('Unexpect $set params')
	                }

	                return this
	            }
	        },

	        /**
	         *  Get property value by name, using for get value of computed property without cached
	         *  change prop/props value, it will be trigger change event
	         *  @param kp <String> keyPath
	         */
	        "$get": {
	            enumerable: false,
	            value: function(kp) {

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
	        },
	        /**
	         *  if params is (key, callback), add callback to key's subscription
	         *  if params is (callback), subscribe any prop change events of this model
	         *  @param key <String> optional
	         *  @param callback <Function>
	         */
	        "$watch": {
	            enumerable: false,
	            value: function( /*[key, ]callback*/ ) {
	                var len = arguments.length
	                var key, callback

	                if (len >= 2) {
	                    var prefix = _rootPath()
	                    prefix && (prefix += '.')
	                    key = 'change:' + arguments[0]
	                    callback = arguments[1]
	                } else if (len == 1 && $util.type(arguments[0]) == 'function') {
	                    key = '*:' + _rootPath()
	                    callback = arguments[0]
	                } else {
	                    $info.warn('Unexpect $watch params')
	                    return NOOP
	                }
	                emitter.on(key, callback)

	                var that = this
	                var args = arguments
	                    // return a unsubscribe method
	                return function() {
	                    that.$unwatch.apply(that, args)
	                }
	            }
	        },
	        /**
	         *  unsubscribe prop change
	         *  if params is (key, callback), remove callback from key's subscription
	         *  if params is (callback), remove all callbacks from key' ubscription
	         *  if params is empty, remove all callbacks of current model
	         *  @param key <String>
	         *  @param callback <Function>
	         */
	        "$unwatch": {
	            enumerable: false,
	            value: function( /*[key, ] [callback] */ ) {
	                var len = arguments.length
	                var key
	                var prefix = _rootPath()
	                if (len >= 2) {
	                    // key + callback
	                    prefix && (prefix += '.')
	                    key = 'change:' + prefix + arguments[0]
	                    emitter.off(key, arguments[1])
	                } else if (len == 1 && $util.type(arguments[0]) == 'string') {
	                    // key
	                    prefix && (prefix += '.')
	                    emitter.off('change:' + prefix + arguments[0])
	                } else if (len == 1 && $util.type(arguments[0]) == 'function') {
	                    // callback
	                    emitter.off('*:' + prefix, arguments[0])
	                } else if (len == 0) {
	                    // all
	                    emitter.off()
	                } else {
	                    $info.warn('Unexpect param type of ' + arguments[0])
	                }

	                return this
	            }
	        },
	        /**
	         *  Return all properties without computed properties
	         *  @return <Object>
	         */
	        "$props": {
	            enumerable: false,
	            value: function() {
	                return $util.copyObject(_props)
	            }
	        },
	        /**
	         *  Reset event emitter
	         *  @param em <Object> emitter
	         */
	        "$emitter": {
	            enumerable: false,
	            value: function (em) {
	                emitter = em
	                return this
	            }
	        }
	    })
	    /**
	     *  A shortcut of $set(props) while instancing
	     */
	    _$setMulti(receiveProps)

	}
	function NOOP() {}
	/**
	 *  Check option's keys type when Mux class instance
	 *  if type is unvalid throw an error
	 */
	function staticOptionCheck(options) {
	    if (!options) return
	    var getter = options.props
	    var computed = options.computed
	    getter && $expect.type(getter, ['function', 'object'])
	    computed && $expect.type(computed, ['object'])
	}

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

	    var len = arguments.length
	    if (len >= 2) {
	        // clear all observers of this subject and callback eq "cb"
	        types = [subject]
	    } else if (len == 1 && _type(arguments[0]) == 'function') {
	        // clear all observers those callback equal "cb"
	        cb = arguments[0]
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

	var util = __webpack_require__(7)

	/**
	 *  Expect condition is truely
	 *  @param cnd <Boolean>
	 *  @param msg <String> *optional*
	 */
	function expect(cnd, msg) {
	    if (!cnd) throw new Error(msg || 'Unexpect error')
	}

	/**
	 *  Expect obj should be type of/in "type"
	 *  @param obj
	 *  @param type <String> | <Array>
	 *  @param msg <String> *optional*
	 */
	expect.type = function(obj, type, msg) {
	    var tot = util.type(type) // type of "type"
	    var too = util.type(obj) // type of "obj"
	    if (tot == 'string') {
	        if (too != type) throw new Error(msg || 'Expect param\'s type be ' + type + ' not ' + too)
	    } else if (tot == 'array') {
	        if (!type.some(function(t) {
	            if (too == t) return true
	        })) throw new Error(msg || 'Unexpect param\'s type ' + too + ', it should one of ' + type.join(','))
	    }
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
	    return new String(kp).replace(/\[([^\[\]])+\]/g, function(m, k) {
	        return '.' + k
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
	    var _isIndex = /^\[.*\]$/.exec(tail)
	    var _isNum = typeof(tail) == 'number'
	    var _hasBegin = !!pre
	    !_hasBegin && (pre = '')
	    if (_isIndex) return pre + tail
	    else if (_isNum) return pre + '[' + tail + ']'
	    else if (_hasBegin) return pre + '.' + tail
	    else return tail 
	}

	module.exports = {
	    normalize: _keyPathNormalize,
	    set: _set,
	    get: _get,
	    join: _join
	}


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var hookMethods = ['splice', 'push', 'pop', 'shift', 'unshift']
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
	        Object.defineProperty(arr, m, {
	            enumerable: false,
	            value: function () {
	                return hook(arr, m, nativeMethod, arguments)
	            }
	        })
	        // flag mark
	        Object.defineProperty(arr[m], hookFlag, {
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
	        for (var key in source) {
	            if (source.hasOwnProperty(key)) {
	                dest[key] = source[key]
	            }
	        }
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
	    }
	}

/***/ }
/******/ ])
});
