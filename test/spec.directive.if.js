describe('#Directives/if', function () {
	it('without else', function () {
		var app = new Zect({
	      data: function () {
	        return {
	        	status: 0
	        }
	      },
	      template: tools.template(function () {/*
	        <z-if is="{!status}"><div class="cnd1"></div></z-if>
	        <z-if is="{status}"><div class="cnd2"></div></z-if>
	      */})
	    })
	    assert(!!app.$el.querySelector('.cnd1'))
	    assert(!app.$el.querySelector('.cnd2'))
	    app.$data.status = 1
	    assert(!app.$el.querySelector('.cnd1'))
	    assert(!!app.$el.querySelector('.cnd2'))
	})

	it('with else-if and without else', function () {
		var app = new Zect({
	      data: function () {
	        return {
	        	status: 0
	        }
	      },
	      template: tools.template(function () {/*
	        <z-if is="{!status}">
	        	<div class="cnd1"></div>
	        <br z-else="{status == 1}">
	        	<div class="cnd2"></div>
	        </z-if>
	      */})
	    })
	    assert(!!app.$el.querySelector('.cnd1'))
	    assert(!app.$el.querySelector('.cnd2'))
	    app.$data.status = 1
	    assert(!app.$el.querySelector('.cnd1'))
	    assert(!!app.$el.querySelector('.cnd2'))
	    app.$data.status = 2
	    assert(!app.$el.querySelector('.cnd1'))
	    assert(!app.$el.querySelector('.cnd2'))
	    app.$data.status = 0
	    assert(!!app.$el.querySelector('.cnd1'))
	    assert(!app.$el.querySelector('.cnd2'))
	    app.$data.status = 1
	    assert(!app.$el.querySelector('.cnd1'))
	    assert(!!app.$el.querySelector('.cnd2'))
	})

	it('with else and without else-if', function () {
		var app = new Zect({
	      data: function () {
	        return {
	        	status: 0
	        }
	      },
	      template: tools.template(function () {/*
	        <z-if is="{!status}">
	        	<div class="cnd1"></div>
	        <br z-else>
	        	<div class="cnd2"></div>
	        </z-if>
	      */})
	    })
	    assert(!!app.$el.querySelector('.cnd1'))
	    assert(!app.$el.querySelector('.cnd2'))
	    app.$data.status = 10
	    assert(!app.$el.querySelector('.cnd1'))
	    assert(!!app.$el.querySelector('.cnd2'))
	})
	it('with else and with else-if', function () {
		var app = new Zect({
	      data: function () {
	        return {
	        	status: 0
	        }
	      },
	      template: tools.template(function () {/*
	        <z-if is="{!status}">
	        	<div class="cnd1"></div>
	        <br z-else="{status == 1}">
	        	<div class="cnd2"></div>
	        <br z-else>
	        	<div class="cnd3"></div>
	        </z-if>
	      */})
	    })
	    assert(!!app.$el.querySelector('.cnd1'))
	    assert(!app.$el.querySelector('.cnd2'))
	    assert(!app.$el.querySelector('.cnd3'))
	    app.$data.status = 1
	    assert(!app.$el.querySelector('.cnd1'))
	    assert(!!app.$el.querySelector('.cnd2'))
	    assert(!app.$el.querySelector('.cnd3'))
	    app.$data.status = 2
	    assert(!app.$el.querySelector('.cnd1'))
	    assert(!app.$el.querySelector('.cnd2'))
	    assert(!!app.$el.querySelector('.cnd3'))
	})
})