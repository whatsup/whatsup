---
sidebar_position: 2
---

# Mounting callbacks

You can always access DOM elements after mounting them using the `onMount` and `onUnmount` properties.

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

If the component returns a fragment or an array of components, then using the `onMount` and `onUnmount` properties you will get a list of rendered DOM elements.

```tsx
function* App() {
    const onMount = (el) => console.log('Mounted', el)
    const onUnmount = (el) => console.log('Unmounted', el)

    while (true) {
        yield (
            <>
                <div>One</div>
            </>
        )
    }
}
```
