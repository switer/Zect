'use strict';

function checkInstance(inst) {
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
}

function template(fn) {
	return fn.toString().replace(/^function\s*\(\s*\)\s*\{\s*\/\*|\*\/\s*\}$/, '')
}

describe('#Global API', function () {
	it('Zect()', function () {
		var app = new Zect({
			el: '#app'
		})
		checkInstance(app)
    })
    it('Zect.extend()', function () {
		var Comp = Zect.extend({
			template: '<div class="tpl">template</div>'
		})
		var app = new Comp({
			el: document.createElement('div')
		})
		checkInstance(app)
		assert(app.$el.querySelector('.tpl'))
    })
    it('Zect.component()', function () {
    	var Comp = Zect.component('c-comp', {
    		template: '<div class="c-comp"></div>'
    	})
		var app = new Zect({
			template: template(function () {/*
				<div class="tpl">
					<c-comp></c-comp>
					<div z-component="c-comp"></div>
				</div>
			*/})
		})
		checkInstance(app)
		checkInstance(new Comp())
		assert(app.$el.querySelectorAll('.c-comp').length == 2)
    })
    it('Zect.namespace()', function () {
    	Zect.namespace('r')
		var app = new Zect({
			el: document.createElement('div'),
			template: '<div class="tpl" r-class="{tpl: true}"></div>'
		})
    	Zect.namespace('z')
		checkInstance(app)
		assert(app.$el.querySelector('.tpl'))
    })
    it('Zect.directive()', function () {
		/**
		 * Add data-set attribute
		 * @multiple
		 */
    	Zect.directive('dataset', {
    		multi: true,
    		bind: function (key, value, expr) {
    			expect(key).to.be.a('string')
    			expect(expr).to.be.a('string')
    			this.key = key
    		},
    		update: function (value) {
    			this.$el.dataset[this.key] = value
    		}
    	})
    	/**
		 * Check value is number
		 * @multiple
		 */
    	Zect.directive('number', {
    		bind: function (value, expr) {
    			expect(expr).to.be.a('string')
    			expect(value).to.be.a('number')
    		},
    		update: function (value) {
    			expect(value).to.be.a('number')
    		}
    	})
		var app = new Zect({
			el: document.createElement('div'),
			data: function () {
				return {
					num: 123
				}
			},
			template: '<div class="tpl" z-dataset="{tpl: \'test\'}"><div z-number="{num}"></div></div>'
		})
		checkInstance(app)
		expect(app.$el.querySelector('.tpl').dataset.tpl).to.equal('test')
    })
})








