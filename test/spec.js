'use strict';

function type (obj) {
    return /\[object (\w+)\]/.exec(Object.prototype.toString.call(obj))[1].toLowerCase()
}
function isObj(o) {
	return type(o) == 'object'
}
function isFun(o) {
	return type(o) == 'function'
}
function isStr(o) {
	return type(o) == 'string'
}
function isArr(o) {
	return type(o) == 'array'
}

function checkInstance(inst) {
	// element
    expect(inst.$el.nodeType == 1 || inst.$el.nodeType == 11)
    // instance properties
    expect(isObj(inst.$refs) && isObj(inst.$methods))
    // instance methods
    expect(isFun(inst.$set) && isFun(inst.$get) && isFun(inst.$watch) && isFun(inst.$unwatch) 
    	&& isFun(inst.$compile) && isFun(inst.$component) && isFun(inst.$destroy))
}

describe('#Global API', function () {
	it('Zect()', function () {
		var app = new Zect({
			el: '#app'
		})
		checkInstance(app)
    })
})