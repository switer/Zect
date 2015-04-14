![logo](http://switer.qiniudn.com/zect.png?imageView2/0/w/160/) 
Zect , component & mvvm
====

A lightweight Web components and MVVM framework.
**Zect**'s state observer is power by [muxjs](https://github.com/switer/muxjs)

## Example

* Todo MVC: http://zectjs.github.io/zect-todo

## Downloads
- [zect.js](https://raw.githubusercontent.com/switer/zect/master/dist/zect.js)
- [zect.min.js](https://raw.githubusercontent.com/switer/zect/master/dist/zect.min.js)

## Usage

```html
<script src="dist/zect.js"></script>
<!-- mounted element -->
<div id="app">
    <span>{title}</span>
    <input type="text" z-model="title">
</div>
```
Define and instance

```js
var app = new Zect({
    el: '#app',
    data: function () {
        return {
            title: 'Hello, Zect'
        }
    }
})
```

## API Reference
- Global API
    * [Zect()]()
    * [Zect.extend()]()
    * [Zect.component()]()
    * [Zect.namespace(namespace)]()
    * [Zect.directive(id, definition)]()

- Instance Options
    * [el]()
    * [data]()
    * [mixins]()
    * [methods]()
    * [template]()
    * [computed]()
    * [directives]()
    * [components]()

- Lifecyle Methods
    * [created]()
    * [ready]()
    * [destroy]()

- Instance Methods
    * [$set]()
    * [$get]()
    * [$watch]()
    * [$unwatch]()
    * [$compile]()
    * [$component]()
    * [$destroy]()

- Instance Properties
    * [$el]()
    * [$refs]()
    * [$methods]()
    * [$children]()
    * [$destroyed]()

- Template Syntax
    * [if]()
    * [repeat]()
    * [template]()
    * [{expression}]()
    * [{- expression}]()

- Direcitves
    * [on]()
    * [show]()
    * [attr]()
    * [class]()
    * [style]()
    * [component]()

## Guide
### Custom directive

Options's Methods: 
* **bind**    Call only once when directive is binding.
* **update**  Call every time when express's value has been changed.
* **unbind**  Call only once when directive is unbinded.

Directive instance properties:
* **$vm**     Mounted VM of the directive
* **$el**     Mounted target Node of the directive
* **$id**     Current directive instance id
* **$scope**  Repeat directive will create a scope for each item when compiling, 
              so your can access "$index", "$value" through "$scope". 

**Example below:**

```html
<div z-tap="{onClick}"></div>
```

```js
Zect.directive('tap', {
    bind: function (fn, expr) {
        // do something when init bind
    },
    update: function (fn) {
        // do some with state change or init
    }
})
```

### Two way binding

```html
<div id="con">
    <input type="text" z-model="search" />
    <input type="submit" z-on="{onSubmit}" value="submit">
</div>
```

```js
new Zect({
    el: '#con',
    data: {
        search: 'Please input'
    },
    methods: {
        onSubmit: function () {
            this.$data.search // input-value
        }
    }
})
```

### Use filter
Filters actually are function call using in template's expression.

```html
<ul id="con">
    <z-repeat items="{lessThanFour(items)}">
        <li data-index="{$index}">{$value}</li>
    </z-repeat>
</ul>
```

```js
new Zect({
    el: '#con',
    data: function () {
        return [1,2,3,4,5]
    },
    methods: {
        lessThanFour: function (items) {
            return items.filter(function (item) {
                if (item < 4) return true
            })
        }
    }
})
```

* **Render result:**

```html
<ul id="con">
    <li data-index="0">1</li>
    <li data-index="1">2</li>
    <li data-index="2">3</li>
</ul>
```

### Template syntax

* **Content Render:**

```html
<!-- escaped HTML value -->
<p>{title}</p>

<!-- unescaped HTML value -->
<p>{- title}</p>
```

* **Javascript Syntax In Expression:**

```html
<!-- escaped HTML value -->
<p>{'Current time is: ' + new Date()}</p>

<!-- unescaped HTML value -->
<p>{- 'Current Page: ' + page}</p>
```

* **Condition Statements:**
`"is"` is a keyword-attribute for the "if" directive.
If value is truly, the template that is included by "if" directive element will be compiled and insert into to parent's DOM tree.
Otherwise template will be removed from parent's DOM tree.

```html
<!-- if -->
<z-if is="{title}">
    <div>{title}</div>
</z-if>
```

* **Array Iterator:**
`"items"` is a keyword-attribute for the "repeat" directive.
The value of items's expression should be an Array object.

```html
<!-- repeat -->
<z-repeat items="{items}">
    <div data-row="{$index}">{- $value}</div>
</z-repeat>
```

### Reusable Component

Zect support reusable component that are conceptually similar to Web Components.

* **define:**

```html
<script type="text/zect" id="tpl-header">
    <z-template class="header">
        <div class="title">{title}</div>
    </z-template>
</script>
```

```js
Zect.component('c-header', {
    template: document.querySelector('#tpl-header').innerHTML,
    data: {
        title: 'index'
    },
    ready: function () {

    }
})
```
* **use:**

```html
<body>
    <div id="app">
        <c-header title="header of page"></c-header>
        <div title="another header" z-component="c-header" class="another"></div>
    </div>
    <script>
        new Zect({
            el: '#app'
        })
    </script>
</body>
```

* **render result:**

```html
<div id="app">
    <c-header title="header of page" class="header">
        <div class="title">index</div>
    </c-header>
    <div title="another header" class="header another">
        <div class="title">index</div>
    </div>
</div>
```

## Component Atrributes

* **data**
"data" property is used to declare binding data from the parent ViewModel. 
Just like your instance a component and pass data option. When those binding variables of expression change, 
`Zect` will be re-excute the expression and call component instance's "$set" method automatically for updating child component.

```html
<div id="app">
    <my-component
        z-data="{
            title: 'child ' + title;
            content: content
        }"
    >
    </my-component>
</div>
```

* **methods**
Just like your instance a component and pass method option. Methods only set once, so when those binding variables of expression change, it will do nothing. 

```html
<div id="app">
    <my-component
        z-methods="{
            onClick: onClickItem
        }"
    ></my-component>
</div>
```

* **ref**
This property is used to save ref to parent ViewModel, so that access it's instance with the specified name by "$refs".

```html
<div id="app">
    <my-component z-ref="header"></my-component>
</div>
```

```js
this.$refs.header // access child component instance.
```


## Computed Properties
For those complicated logic, you should use computed properties to replace inline expressions.

```js
var demo = new Zect({
    data: {
        host: 'https://github.com',
        user: 'switer',
        repos: 'zect'
    },
    computed: {
        link: {
            // property dependencies of getter
            deps: ['host', 'user', 'repos'],
            // property getter
            get: function () {
                var $data = this.$data
                return [$data.host, $data.user, $data.repos].join('/') // https://github.com/switer/zect
            },
            // setter is optional
            set: function (link) {
                // input: https://github.com/zectjs/zect.github.io
                var $data = this.$data
                var parts = link.replace(/\/$/, '').split('\/')
                $data.repos = parts.pop()
                $data.user = parts.pop()
                $data.host = parts.join('/')
            }
        }
    }
})

```

## License

MIT
