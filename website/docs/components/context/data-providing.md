---
sidebar_position: 1
---

# Data providing

The context provides a way to exchange data from top to bottom (from parent to child elements) to any depth of nesting.

### Context Access

The context can be accessed via the `this` keyword or via the second argument (React-like way)

```tsx
import type { Context } from 'whatsup/jsx'

function App(this: Context) {}

// or

function App(props: {}, ctx: Context) {}
```

### Sharing with symbols

To make data available to child components, you need a key and, of course, data :) This method uses symbols as the key.

```tsx
import type { Context } from 'whatsup/jsx'

const THEME = Symbol('Access key')

function* Parent(this: Context) {
    this.share(THEME, 'dark')

    while (true) {
        yield <Child />
    }
}

function Child(this: Context) {
    const theme = this.find(THEME)

    return <div>Theme is {theme}</div>
}
```

We specifically made the parent component using a generator - most often we only need to share the data once in the component's initialization phase. The functional component would do this on every update.

It would be correct to make a child component on the generator as well, so as not to access the context on each update to get the theme value.

```tsx
function* Child(this: Context) {
    const theme = this.find(THEME)

    while (true) {
        yield <div>Theme is {theme}</div>
    }
}
```

Excellent! But it's not reactive! Let's fix this

```tsx
import type { Context } from 'whatsup/jsx'

const THEME = Symbol('Access key')

function* Parent(this: Context) {
    const theme = observable('dark')
    const toggleTheme = () => theme(theme() === 'dark' ? 'light' : 'dark')

    this.share(THEME, theme)

    while (true) {
        yield (
            <>
                <Child />
                <button onClick={toggleTheme}>Toggle theme</button>
            </>
        )
    }
}

function* Child(this: Context) {
    const theme = this.find(THEME)

    while (true) {
        yield <div>Theme is {theme()}</div>
    }
}
```

And now it's reactive :)

### Sharing with Context key

Context key is an alternative to a symbol key. It allows you to specify a default value.

```tsx
import { Context, createKey } from 'whatsup/jsx'

const THEME = createKey('dark')

function* Parent(this: Context) {
    //...
    this.share(THEME, 'light')
    //...
}

function* Child(this: Context) {
    /*
        If THEME key is not found in the context, 
        then the default value will be returned.
    */
    const theme = this.find(THEME)
    // ...
}
```

### Sharing with constructor

We can share instances of any class and find them by constructor.

```tsx
import { Context } from 'whatsup/jsx'

class Store {}

function* Parent(this: Context) {
    const store = new Store()

    this.share(store)

    while (true) {
        yield <Child />
    }
}

function* Child(this: Context) {
    const store = this.find(Store)

    while (true) {
        // ...
    }
}
```
