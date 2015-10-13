describe('#Global API', function () {
	it('Zect()', function () {
		var app = new Zect({
			el: '#app'
		})
		tools.checkInstance(app)
    })
    it('Zect.extend()', function () {
		var Comp = Zect.extend({
			template: '<div class="tpl">template</div>'
		})
		var app = new Comp({
			el: document.createElement('div')
		})
		tools.checkInstance(app)
		assert(app.$el.querySelector('.tpl'))
    })
    it('Zect.component()', function () {
    	var Comp = Zect.component('c-comp', {
    		template: '<div class="c-comp"></div>'
    	})
		var app = new Zect({
			template: tools.template(function () {/*
				<div class="tpl">
					<c-comp></c-comp>
					<div z-component="c-comp"></div>
				</div>
			*/})
		})
		tools.checkInstance(app)
		tools.checkInstance(new Comp())
		assert(app.$el.querySelectorAll('.c-comp').length == 2)
    })
    it('Zect.namespace()', function () {
    	Zect.namespace('r')
		var app = new Zect({
			el: document.createElement('div'),
			template: '<div class="tpl" r-class="{tpl: true}"></div>'
		})
    	Zect.namespace('z')
		tools.checkInstance(app)
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
		tools.checkInstance(app)
		expect(app.$el.querySelector('.tpl').dataset.tpl).to.equal('test')
    })
})

describe('#Instance Options', function () {
	it('el', function () {
		var app = new Zect({
			el: '#app'
		})
		tools.checkInstance(app)
		assert(app.$el === document.querySelector('#app'))

		var el = document.createElement('div')
		app = new Zect({
			el: el
		})
		tools.checkInstance(app)
		assert(app.$el === el)

		app = new Zect({
			el: '#app',
			template: '<div class="tpl"></div>'
		})
		tools.checkInstance(app)
		assert(app.$el.querySelector('.tpl'))
	})
})





