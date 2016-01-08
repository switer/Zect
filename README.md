![logo](http://switer.qiniudn.com/zect.png?imageView2/0/w/160/) 
Zect , component & mvvm
====
[![Build Status](https://travis-ci.org/switer/Zect.svg)](https://travis-ci.org/switer/Zect)
[![npm version](https://badge.fury.io/js/zect.svg)](https://badge.fury.io/js/zect)

A lightweight Web components and MVVM framework.
**Zect**'s state observer is power by [muxjs](https://github.com/switer/muxjs)

## Examples

* Todo MVC: http://zectjs.github.io/zect-todo
* Production: 
    - http://corner.ucweb.com
    - http://m.v.qq.com/gift/bigbang/

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
    * [Zect()](https://github.com/switer/Zect/wiki/Global-API#zectoptions)
    * [Zect.extend()](https://github.com/switer/Zect/wiki/Global-API#zectextendoptions)
    * [Zect.component()](https://github.com/switer/Zect/wiki/Global-API#zectcomponentid-definition)
    * [Zect.namespace(namespace)](https://github.com/switer/Zect/wiki/Global-API#zectnamespacenamespace)
    * [Zect.directive(id, definition)](https://github.com/switer/Zect/wiki/Global-API#zectdirectiveid-definition)

- Instance Options
    * [el](https://github.com/switer/Zect/wiki/Instance-Options#el)
    * [data](https://github.com/switer/Zect/wiki/Instance-Options#data)
    * [mixins](https://github.com/switer/Zect/wiki/Instance-Options#mixins)
    * [replace](https://github.com/switer/Zect/wiki/Instance-Options#replace)
    * [methods](https://github.com/switer/Zect/wiki/Instance-Options#methods)
    * [template](https://github.com/switer/Zect/wiki/Instance-Options#template)
    * [computed](https://github.com/switer/Zect/wiki/Instance-Options#computed)
    * [directives](https://github.com/switer/Zect/wiki/Instance-Options#directives)
    * [components](https://github.com/switer/Zect/wiki/Instance-Options#components)

- Lifecyle Methods
    * [created](https://github.com/switer/Zect/wiki/Lifecyle-Methods#created)
    * [ready](https://github.com/switer/Zect/wiki/Lifecyle-Methods#ready)
    * [destroy](https://github.com/switer/Zect/wiki/Lifecyle-Methods#destroy)

- Instance Methods
    * [$set](https://github.com/switer/Zect/wiki/Instance-Methods#setkeypath-value)
    * [$get](https://github.com/switer/Zect/wiki/Instance-Methods#getkeypath)
    * [$watch](https://github.com/switer/Zect/wiki/Instance-Methods#watchkeypath-callback)
    * [$unwatch](https://github.com/switer/Zect/wiki/Instance-Methods#unwatchcallback)
    * [$compile](https://github.com/switer/Zect/wiki/Instance-Methods#compileel-scope)
    * [$component](https://github.com/switer/Zect/wiki/Instance-Methods#componentid)
    * [$destroy](https://github.com/switer/Zect/wiki/Instance-Methods#destroy)

- Instance Properties
    * [$el](https://github.com/switer/Zect/wiki/Instance-Properties#el)
    * [$refs](https://github.com/switer/Zect/wiki/Instance-Properties#refs)
    * [$methods](https://github.com/switer/Zect/wiki/Instance-Properties#methods)
    * [$destroyed](https://github.com/switer/Zect/wiki/Instance-Properties#destroyed)

- Template Syntax
    * [if](https://github.com/switer/Zect/wiki/Template-Syntax#if)
    * [repeat](https://github.com/switer/Zect/wiki/Template-Syntax#repeat)
    * [template](https://github.com/switer/Zect/wiki/Template-Syntax#template)
    * [{expression}](https://github.com/switer/Zect/wiki/Template-Syntax#expression)
    * [{- expression}](https://github.com/switer/Zect/wiki/Template-Syntax#--expression)

- Direcitves
    * [on](https://github.com/switer/Zect/wiki/Directives#z-on)
    * [show](https://github.com/switer/Zect/wiki/Directives#z-show)
    * [html](https://github.com/switer/Zect/wiki/Directives#z-html)
    * [attr](https://github.com/switer/Zect/wiki/Directives#z-attr)
    * [class](https://github.com/switer/Zect/wiki/Directives#z-class)
    * [style](https://github.com/switer/Zect/wiki/Directives#z-style)
    * [component](https://github.com/switer/Zect/wiki/Directives#z-component)
    * [static](https://github.com/switer/Zect/wiki/Directives#z-static)

## Guide
### Custom directive

Options's Methods: 
* **bind**    Call only once when directive is binding.
* **update**  Call every time when expression's value has been changed.
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
    bind: function (result, expression) {
        // do something when init
    },
    update: function (result) {
        // do something when state change or after init
    },
    unbind: function () {
        // do something before destroy the directive instance
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

### Filter Expression
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

## Component Template

Zect will copy all attributes for "template" element to instance component element.

Component's HTML template:

```html
<script type="text/zect" id="tpl-header">
    <z-template class="c-header" data-title="{title}">
        <button>Back</button>
        <div>{title}</div>
    </z-template>
</script>
```

Define component:
```javascript
Zect.component('c-header', {
    template: document.querySelector('#tpl-header').innerHTML
})
```


## Component Attributes

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
This option is used to save ref to parent ViewModel, so that access it's instance with the specified name by "$refs".

```html
<div id="app">
    <my-component z-ref="header"></my-component>
</div>
```

```js
this.$refs.header // access child component instance.
```

* **replace**
This option is uesed to reduce one level document structure. if attribute value equal "true",
will replace component's element with it's main child element.

Component template:
```html
<div class="header" data-title="header">
    <h1>Header</h1>
</div>
```

Usage:
```html
<div id="app">
    <my-component z-replace="true" class="app-header"></my-component>
</div>
```

Render result:
```html
<div id="app">
    <div class="app-header header" data-title="header">
        <h1>Header</h1>
    </div>
</div>
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
## List operate

- **Display List**

Use `z-repeat` block element to repeat display template.

```html
<div id="list">
    <ul>
        <z-repeat items="{items}">
            <li>{$value}</li>
        </z-repeat>
    </ul>
</div>
```
```js
new Zect({
    data: {
        items: ["Switer", "Zect", "Xiaokai"]
    }
})
```
Result:
```
* Switer
* Zect
* Xiaokai
```

- **Append More**

```js
vm.$data.items.$concat(['Web Component'])
```
Will delta update:
```
* Switer
* Zect
* Xiaokai
+ Web Component
```

- **Append Before**

```js
vm.$data.items.splice(0, 0, 'Web Component', 'MVVM')
```
Result:
```
+ Web Component
+ MVVM
* Switer
* Zect
* Xiaokai
```

- **Remove**

```js
vm.$data.items.splice(1, 1)
```
Result:
```
+ Web Component
- MVVM
* Switer
* Zect
* Xiaokai
```

- **Push**

```js
vm.$data.items.push('Web Component')
```
Result:
```
* Switer
* Zect
* Xiaokai
+ Web Component
```

and `shift`, `unshift`, `sort`, `reverse`, `pop`. `shift`, `unshift`, `pop` whill be Update in delta (includes `splice` and `concat`).


![Footer](http://switer.qiniudn.com/red-brick.jpg)

## License

MIT
