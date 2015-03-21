Zect
====

Lightweight Web components and MVVM framework.
**Zect**'s state observer is power by [muxjs](https://github.com/switer/muxjs)

## Example

* Todo MVC: http://xiaokaike.github.io/zect-todo

## Usage
- [zect.js](https://raw.githubusercontent.com/switer/zect/master/dist/zect.js)
- [zect.min.js](https://raw.githubusercontent.com/switer/zect/master/dist/zect.min.js)

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
* **$vm**   Mounted VM of the directive
* **$el**   Mounted target Node of the directive
* **$id**   Current directive instance id

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
    <input type="text" 
        id="con"
        z-model="search" 
    />
    <input type="submit" z-on="onSubmit" value="submit">
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

```html
<ul id="con">
    <z-repeat items="{lessThanFour(items)}">
        <li>{$value}</li>
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

**Render result:**

```html
<ul id="con">
    <li>1</li>
    <li>2</li>
    <li>3</li>
</ul>
```

### Template syntax

Variables
```html
<!-- escaped HTML value -->
<p>{title}</p>

<!-- unescaped HTML value -->
<p>{- title}</p>
```
Condition Statement
```html
<!-- if -->
<z-if is="{title}">
    <div>{title}</div>
</z-if>
```
Iterator
```html
<!-- repeat -->
<z-repeat items="{items}">
    <div data-row="{$index}">{- $value}</div>
</z-repeat>
```

### Custom Component

Define a custom component.

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
**Use component:**

```html
<body>
    <div id="app">
        <c-header title="header component"></c-header>
        <div title="header component2" z-component="c-header"></div>
    </div>
    <script>
        new Zect({
            el: '#app'
        })
    </script>
</body>
```

**render result:**

```html
<div id="app">
    <c-header title="header component" class="header">
        <div class="title">index</div>
    </c-header>
    <div title="header component2" class="header">
        <div class="title">index</div>
    </div>
</div>
```

## License

MIT
