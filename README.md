Zect
====

Lightweight Web components and MVVM framework.
**Zect**'s state observer is power by [muxjs](https://github.com/switer/muxjs)

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
    * [methods]()
    * [template]()
    * [computed]()
    * [directives]()
    * [components]()

- Instance Methods
    * [$set]()
    * [$get]()

- Template Syntax
    * [if]()
    * [repeat]()
    * [{expression}]()

- Direcitves
    * [on]()
    * [show]()
    * [attr]()
    * [class]()
    * [style]()
    * [component]() // TBD

- Other
    * [escape for {expression}]() // TBD
    * [unescape for {- expression}]() // TBD

## Guide
- **Custom directive**

Options's Methods: `bind`, `update`, `unbind`. `update`, `unbind` is optional. 
Directive instance property:
* **$vm** Mounted VM of the directive
* **$el**   Mounted target Node of the directive
* **$id**   Current directive instance id

Example below:

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

- **Two way binding**

```html
<div id="con">
    <input type="text" 
        id="con"
        z-on="{change: onChange}"  
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
            this.$data.search // input value
        }
    }
})
```

-  **Use filter**

```html
<ul id="con">
    <z-repeat items="{lessThanFour(items)}">
        <li>{- value}</li>
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

Render result:

```html
<ul id="con">
    <li>1</li>
    <li>2</li>
    <li>3</li>
</ul>
```

- **Template syntax**

```html
<!-- escaped HTML value -->
<p>{title}</p>

<!-- unescaped HTML value -->
<p>{$ title}</p>

<!-- if -->
<z-if is="{title}">
    <div>{title}</div>
</z-if>

<!-- repeat -->
<z-repeat items="{items}">
    <div>{- value}</div>
</z-repeat>

```

## License

MIT
