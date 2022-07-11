---
sidebar_position: 2
---

# Event system

The context provides the ability to exchange messages that bubble up from child elements to parent elements.

### Define event

Events are created by inheriting from the special class Event

```tsx
import { Event } from 'whatsup/jsx'

class ToggleThemeEvent extends Event {}
```

### Define event listener

Listeners are bound to events using constructors.

```tsx
function* Parent(this: Context) {
    const theme = observable('dark')
    const handleToggleTheme = (e: ToggleThemeEvent) => {
        theme(theme() === 'dark' ? 'light' : 'dark')
    }

    this.on(ToggleThemeEvent, handleToggleTheme)

    while (true) {
        yield <Child />
    }
}
```

### Dispatch event

Events are dispatched using the `dispatch` method.

```tsx
function Child(this: Context) {
    const onClick = () => {
        const event = new ToggleThemeEvent()
        this.dispatch(event)
    }
    return <button onClick={onClick}>Toggle theme</button>
}
```

### Removing a listener

Removing a specific listener

```tsx
this.off(ToggleThemeEvent, handleToggleTheme)
```

Removing all listeners

```tsx
this.off(ToggleThemeEvent)
```

### Stop propagation

To stop event propagation, there are `stopPropagation` and stop `stopImmediatePropagation`

```tsx
event.stopPropagation()
//or
event.stopImmediatePropagation()
```
