'use strict';

window.tools = {
	checkInstance: function (inst) {
		// element
	    assert(inst.$el.nodeType == 1 || inst.$el.nodeType == 11)
	    // instance properties
	    expect(inst.$refs).to.be.an('object')
	    expect(inst.$methods).to.be.an('object')
	    // instance methods
	    expect(inst.$set).to.be.a('function')
	    expect(inst.$get).to.be.a('function')
	    expect(inst.$watch).to.be.a('function')
	    expect(inst.$unwatch).to.be.a('function')
	    expect(inst.$compile).to.be.a('function')
	    expect(inst.$component).to.be.a('function')
	    expect(inst.$destroy).to.be.a('function')
	},
	template: function (fn) {
		return fn.toString().replace(/^function\s*\(\s*\)\s*\{\s*\/\*|\*\/\s*\}$/g, '')
	}
}