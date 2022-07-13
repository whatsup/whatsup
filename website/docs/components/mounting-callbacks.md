---
sidebar_position: 2
---

# Mounting callbacks

### Single element

You can always access DOM elements after mounting them using the `onMount` and `onUnmount` properties.

```tsx
function* App() {
    const onMount = (el) => el as HTMLDivElement
    const onUnmount = (el) => el as HTMLDivElement

    while (true) {
        yield (
            <div onMount={onMount} onUnmount={onUnmount}>
                Hello world
            </div>
        )
    }
}
```

### Multiple elements

If the component returns a fragment or an array of components, then using the `onMount` and `onUnmount` properties you will get a list of rendered DOM elements.

```tsx
function List() {
    return (
        <>
            <div>One</div>
            <div>Two</div>
            <div>Thr</div>
        </>
    )
}

function* App() {
    const onMount = (el) => el as HTMLDivElement[] // Array of <div /> elements
    const onUnmount = (el) => el as HTMLDivElement[]

    while (true) {
        yield <List onMount={onMount} onUnmount={onUnmount} />
    }
}
```
