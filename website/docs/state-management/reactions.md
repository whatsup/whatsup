---
sidebar_position: 4
---

# Reactions

Reactions trigger side effects when observed values change.

### Autorun

`autorun` takes a function and executes it every time the dependent observables change.

```tsx
import { observable, autorun } from 'whatsup'

const name = observable('John')

autorun(() => console.log(name()))
//> 'John'

name('Barry')
//> 'Barry'
```

### Reaction

`reaction` takes two functions and each time the dependent observables of the first function change, it calls the second function.

```tsx
import { observable, reaction } from 'whatsup'

const name = observable('John')

reaction(
    () => name(),
    (v) => console.log(v)
)
//> 'John'

name('Barry')
//> 'Barry'
```

### Disposing

`autorun` and `reaction` return a dispose function that must be called to stop tracking and release resources

```tsx
import { observable, autorun } from 'whatsup'

const name = observable('John')

const dispose = autorun(() => console.log(name()))
//> 'John'

dispose() // stop watching

name('Barry')
//> ... no reaction
```
