# Whats Up Jsx mutator and renderer

<div align="center">
<img src="https://img.shields.io/github/workflow/status/whatsup/jsx/Node.js%20CI/master" alt="GitHub Workflow Status (branch)" />
<img src="https://img.shields.io/codecov/c/github/whatsup/jsx" alt="codecov" />
<img src="https://img.shields.io/github/languages/top/whatsup/jsx" alt="language" />
<img src="https://img.shields.io/npm/l/@whatsup/jsx" alt="license" />  
</div>

## Install

```bash
npm i @whatsup/jsx @whatsup/babel-plugin-transform-jsx
```

## Settings

Update the plugin section in your `.babelrc` file.

```json
{
    "plugins": ["@whatsup/transform-jsx"]
}
```

## Usage

### Simple stateless component

```tsx
import { render } from '@whatsup/jsx'

function App() {
    return <div>Hello world</div>
}

render(App)
// Yes, we can render without a container, directly to the body
// but optionally you can use a container
render(App, document.getElementById('app'))
```

### Generator component

```tsx
import { observable } from 'whatsup'
import { render } from '@whatsup/jsx'

function* Clicker() {
    /*
        Here you can define local variables
        They will be available from render to render.
    */
    const counter = observable(0)

    while (true) {
        // Lifecicle loop
        const count = counter.get()
        const onClick = () => counter.set(count + 1)

        yield <div onClick={onClick}>Clicked: {count}</div>
    }
}

render(App, document.getElementById('app'))
```

### Handle destroying component

```tsx
import { observable } from 'whatsup'
import { render } from '@whatsup/jsx'

function* Timer() {
    const counter = observable(0)
    const intervalId = setInterval(() => {
        const count = counter.get()
        counter.set(count + 1)
    }, 1000)

    try {
        while (true) {
            yield <div>Timer: {counter.get()}</div>
        }
    } finally {
        // This code will be called when the component is destroyed
        clearInterval(intervalId)
    }
}

render(App, document.getElementById('app'))
```

### Error catching

```tsx
import { render } from '@whatsup/jsx'

function* Timer() {
    while (true) {
        try {
            yield <div>/* children components */</div>
        } catch (e) {
            // this block will be rendered if an error occurs in any of the child components
            yield <div>Error</div>
        }
    }
}

render(App, document.getElementById('app'))
```

## Handling mount events

```tsx
function* App() {
    const onMount = (el) => console.log('Mounted', el)
    const onUnmount = (el) => console.log('Unmounted', el)

    while (true) {
        yield (
            <div onMount={onMount} onUnmount={onUnmount}>
                Hello world
            </div>
        )
    }
}
```

## Valid JSX elements

WhatsUp can render almost everything! This means that your components can return strings, numbers, booleans, jsx-components, as well as any arrays.

```tsx
function App() {
    return null // valid
    return true // valid
    return false // valid
    return 'str' // valid
    return 1 // valid
    return <div /> // valid
    return ['str', 'str'] // valid
    return [1, 1, 1] // valid
    return [<div key={1} />, <div key={2} />] // valid
    // just remember to use keys in arrays.
}
```

## Context

Inside the components, this is a built-in object - the Сontext.

```tsx
import { Context } from '@whatsup/jsx'

function App(this: Context) {
    //
}
```

It has several useful methods.

### `share(key, value)` or `share(instance)`

Allows data to be pushed down the context for child components

```tsx
import { Context } from '@whatsup/jsx'

const STORE_KEY = Symbol('Store key')

function* Parent(this: Context) {
    this.share(STORE_KEY, storeInstance)

    while (true) {
        yield <Child />
    }
}
```

### find(key)

Gets to find data shared by parents in the context

```tsx
import { Context } from '@whatsup/jsx'

function* Child(this: Context) {
    const storeInstance = this.find(STORE_KEY)

    while (true) {
        yield /*...*/
    }
}
```

### Sharing with ContextKey

ContextKey is an alternative to a symbol key. It allows you to specify a default value.

```tsx
import { Context, createKey } from '@whatsup/jsx'

const THEME = createKey('dark')

function* Child(this: Context) {
    /*
        If THEME key is not found in the context, 
        then the default value will be returned.
    */

    const theme = this.find(THEME)
}
```

### Sharing with constructor

We can share instances of any class and find them by constructor.

```tsx
import { Context } from '@whatsup/jsx'

class Store {}

function* Parent(this: Context) {
    const store = new Store()

    this.share(store)

    while (true) {
        yield <Child />
    }
}

function Child(this: Context) {
    const store = this.find(Store)

    return <div>/*...*/</div>
}
```

### on(EventCtor, callback)

The context also provides us with a bubbling event system.

```tsx
import { Context, Event } from '@whatsup/jsx'

class ClickEvent extends Event {}

function* Parent(this: Context) {
    this.on(ClickEvent, () => console.log('clicked'))

    while (true) {
        yield <Child />
    }
}

function Child(this: Context) {
    const onClick = () => this.dispatch(new ClickEvent())

    return <div onClick={onClick}>/*...*/</div>
}
```

### off(EventCtor, callback?)

Allows you to remove an event handler

### dispatch(event)

Triggers the bubbling of an event and the execution of its handlers

### defer(()=> Promise)

Executes an asynchronous method and then starts a re-render

```tsx
import { Context } from '@whatsup/jsx'

function* AsyncComponent(this: Context) {
    const result = this.defer(() => getDataFromServer())
    // here result is { done: false }
    yield <Loader /> // render loader until promise is fulfilled
    // here result is { done: true, value: sometimeData }
    while (true) {
        yield <div>{result.value}</div>
    }
}
```
