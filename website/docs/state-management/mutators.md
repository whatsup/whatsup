---
sidebar_position: 5
---

# Mutators

### Mutate previos value

Allows you to create new data based on previous.

```tsx
import { observable, computed, mutator, autorun } from 'whatsup'

const increment = mutator((prev = 0) => prev + 1)

const timer = computed(function*(){
    const counter = observable(0)

    setInterval(()=> counter(increment), 1000)

    while(true){
        yiled counter()
    }
})

autorun(() => console.log(output()))

// 0
// 1
// 2
```

### Mutators as filters

Mutators can be used to control how updates are propagated. Whatsup under the hood compares the previous and new value by reference using the `===` operator. When values are equal, update propagation stops.

```tsx
import { observable, computed, mutator, autorun } from 'whatsup'

const timer = computed(function* () {
    const counter = observable(0)
    const timerId = setInterval(() => counter(counter() + 1), 1000)

    while (true) {
        yield counter()
    }
})

// Define a mutator that returns the new value
// if it is even, otherwise the old value
const evenOnly = (next: number) => {
    return mutator((prev = 0) => (next % 2 === 0 ? next : prev))
}

const evenOnlyTimer = computed(() => {
    return evenOnly(timer())
})

autorun(() => console.log(evenOnlyTimer()))
//> 0
//> 2
//> 4
//> ...
```

### Equality filters

You can create custom equality filters. For example, we want the computed to not run recalculations if the new filtered users list is shallow equal to the previous one.

If we use `mobx` we will do it like this:

```tsx
const users = observable.array<User>([])
const admins = computed(() => users.filter((u) => u.isAdmin), {
    equals: comparer.shallow,
})
```

Here is `whatsup` way:

```tsx
const users = array<User>([])
const admins = computed(() => shallow(users.filter((u) => u.isAdmin)))
```

And somewhere in the utilities

```tsx
// ./utuls.ts

const shallow<T> = (next: T[]) => {
    /*
    We have to compare the old and new value and
    if they are equivalent return the old one,
    otherwise return the new one.
    */
    return mutator((prev?: T[]) => {
        if (
            Array.isArray(prev) &&
            prev.lenght === next.length &&
            prev.every((item, i) => item === next[i])
        ) {
            return prev
        }

        return next
    })
}
```

Later we will collect the most necessary filters in a separate package.
