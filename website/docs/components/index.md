---
sidebar_position: 3
---

# Components

Whatsup components use regular functions for stateless components and generators for stateful components.

Each component is an atom of a reactive system, automatically keeping track of its dependencies and applying changes in the most evvective way.

## Your first stateless component

```tsx
import { render } from 'whatsup/jsx'

function App() {
    return <div>Hello World</div>
}

render(<App />)
```

Yes, we can render without a container, directly to the body

## Your first stateful component

```tsx
import { render } from 'whatsup/jsx'

function* App() {
    const counter = observable(0)

    while (true) {
        const count = counter()
        const onClick = () => counter(count + 1)

        yield (
            <div>
                <p>You click {count} times</p>
                <button onClick={onClick}>Click me</button>
            </div>
        )
    }
}

render(<App />)
```

Yes, we use generators to store local state
