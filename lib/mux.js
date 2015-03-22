/**
* Mux.js v2.4.1
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
	var $keypath = __webpack_require__(3)
	var $arrayHook = __webpack_require__(4)
	var $info = __webpack_require__(5)
	var $util = __webpack_require__(6)
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

	/**
	 *  Mux model factory
	 *  @private
	 */
	function MuxFactory(options) {

	    return function (receiveProps) {
	        if (!instanceOf(this, Mux)) $util.insertProto(this, Mux.prototype)
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
	    var _isDeep = options.deep || !$hasOwn(options,'deep') // default to true
	    var _computedCtx = $hasOwn(options, 'computedContext') ? options.computedContext : model
	    var __kp__ = options.__kp__
	    var __muxid__ = allotId()
	    var _isExternalEmitter =  !!options.emitter
	    var _isExternalPrivateEmitter =  !!options._emitter
	    var proto = {
	        '__muxid__': __muxid__
	    }
	    var _destroy // interanl destroyed flag


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
	        _$add(pn, pv)
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
	        /**
	         *  get all computed props that depend on kp
	         */
	        ;(_cptDepsMapping[kp] || []).reduce(function (pv, cv) {
	            if (!$indexOf(pv, cv)) pv.push(cv)
	            return pv
	        }, willComputedProps)

	        willComputedProps.forEach(function (ck) {
	            $util.patch(_cptCaches, ck, {})

	            var cache = _cptCaches[ck]
	            var pre = cache.pre = cache.cur
	            var next = cache.cur = (_computedProps[ck].get || NOOP).call(model, model)

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
	        var evtArgs = $util.copyArray(args)
	        var kp = $normalize($join(_rootPath(), propname))

	        args[0] = CHANGE_EVENT + ':' + kp
	        _emitter.emit(CHANGE_EVENT, kp)
	        emitter.emit.apply(emitter, args)

	        evtArgs[0] = kp
	        evtArgs.unshift('*')
	        emitter.emit.apply(emitter, evtArgs)
	    }
	    /**
	     *  Add dependence to "_cptDepsMapping"
	     *  @param propname <String> property name
	     *  @param dep <String> dependency name
	     */
	    function _prop2CptDepsMapping (propname, dep) {
	        if ($indexOf(_computedKeys, dep)) 
	           return $warn('Dependency should not computed property')

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
	        if (instanceOf(target, Mux) && target.__kp__ === kp && target.__root__ === __muxid__) {
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
	     *  @param basePath <String> property's value mouted path
	     */
	    function _walk (name, value, basePath) {
	        var tov = $type(value) // type of value
	        // initial path prefix is root path
	        var kp = basePath ? basePath : $join(_rootPath(), name)
	        /**
	         *  Array methods hook
	         */
	        if (tov == ARRAY) {
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
	    function _$sync(kp, value) {
	        var parts = $normalize(kp).split('.')
	        var prop = parts[0]

	        if ($indexOf(_computedKeys, prop)) {
	            // since Mux@2.4.0 computed property support setter
	            model[prop] = value
	            return false
	        }
	        if (!$indexOf(_observableKeys, prop)) {
	            $warn('Property "' + prop + '" has not been observed')
	            // return false means sync prop fail
	            return false
	        }

	        var pv = _props[prop] // old value
	        var isArrayChange
	        var piv
	        $keypath.set(_props, kp, value, function (tar, key, v) {
	            v = $util.copyValue(value)

	            if (instanceOf(tar, Mux)) {
	                if ($hasOwn(tar, key)) {
	                    tar.$set(key, v)
	                } else {
	                    tar.$add(key, v)
	                }
	                return
	            } else if (_isDeep && $type(tar) == ARRAY && key.match(/^\d+$/)) {
	                isArrayChange = true
	                piv = tar[key]
	            }
	            tar[key] = v
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
	        if (_destroy) return _destroyNotice()

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
	        if (_destroy) return _destroyNotice()

	        if (!keyMap || $type(keyMap) != OBJECT) return
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
	        _emitChange(prop, value)
	    }

	    /**
	     *  define computed prop/props of this model
	     *  @param propname <String> property name
	     *  @param deps <Array> computed property dependencies
	     *  @param fn <Function> computed property getter
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
	    proto.$add = function(/* [propname [, defaultValue]] | propnameArray | propsObj */) {
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
	    proto.$computed = function (propname, deps, getFn, setFn, enumerable/* | [propsObj]*/) {
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
	        if (len >= 2 || (len == 1 && $type(args[0]) == STRING)) {
	            _$set(args[0], args[1])
	        } else if (len == 1 && $type(args[0]) == OBJECT) {
	            _$setMulti(args[0])
	        } else {
	            $warn('Unexpect $set params')
	        }

	        return this
	    }

	    /**
	     *  Get property value by name, using for get value of computed property without cached
	     *  change prop/props value, it will be trigger change event
	     *  @param kp <String> keyPath
	     */
	    proto.$get = function(kp) {
	        if ($indexOf(_observableKeys, kp)) 
	            return _props[kp]
	        else if ($indexOf(_computedKeys, kp)) {
	            return (_computedProps[kp].get || NOOP).call(model, model)
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
	            key = 'change:' + $normalize($join(_rootPath(), first))
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
	            case (len == 0):
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
	        // return emitter instance if args is empty, 
	        // for share some emitter with other instance
	        if (arguments.length == 0) return emitter
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
	        instanceOf(em, $Message) && (_emitter = em)
	    }
	    proto.$destroy = function () {
	        // clean up all proto methods
	        $util.objEach(proto, function (k, v) {
	            if ($type(v) == FUNCTION && k != '$destroyed') proto[k] = _destroyNotice
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
	    }
	    proto.$destroyed = function () {
	        return _destroy
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
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 *  Simple Pub/Sub module
	 *  @author switer <guankaishe@gmail.com>
	 **/
	'use strict';

	var $util = __webpack_require__(6)
	var _patch = $util.patch
	var _type = $util.type
	var _scopeDefault = '__default_scope__'

	function Message(context) {
	    this._obs = {}
	    this._context = context
	}

	Message.prototype.on = function(sub, cb, scope) {
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
	Message.prototype.off = function( /*subject, cb, scope*/ ) {
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
	Message.prototype.emit = function(sub) {
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
/* 3 */
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
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var $util = __webpack_require__(6)
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
/* 5 */
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
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	function hasOwn (obj, prop) {
	    return obj && obj.hasOwnProperty(prop)
	}
	module.exports = {
	    type: function (obj) {
	        return /\[object (\w+)\]/.exec(Object.prototype.toString.call(obj))[1].toLowerCase()
	    },
	    objEach: function (obj, fn) {
	        if (!obj) return
	        for(var key in obj) {
	            if (hasOwn(obj, key)) {
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
