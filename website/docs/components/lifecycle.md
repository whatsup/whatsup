---
sidebar_position: 1
---

# Lifecycle

Whatsup uses generator functions for stateful components. The life cycle of the generator is ideal for organizing the life cycle of the component.

```tsx
function* App(props) {
    // componentWillMount

    try {
        // run render cycle
        while (true) {
            const newProps = yield <div>Hello</div>

            // componentWillReceiveProps

            props = newProps
        }
    } catch (e) {
        // componentDidCatch
    } finally {
        // componentDidUnmount
    }
}
```

### componentWillMount

Here we can define the local state of the component. It will be available from render to render.

### componentWillReceiveProps

Here we can compare old and new properties to update state and invoke side effects

### componentDidCatch

Here we can handle the error that occurred while rendering the component or its children

### componentDidUnmount

Here we can define the code that will be called after the component is unmounted
