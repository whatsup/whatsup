---
sidebar_position: 1
---

# Observables

### Observable

Creates a trackable field. Works as a getter when called with no arguments and as a setter when called with arguments.

```tsx
import { observable, autorun } from 'whatsup'

const name = observable('John')

autorun(() => console.log(name()))
//> 'John'

name('Barry')
//> 'Barry'
```

### Observable Array

```tsx
import { array, autorun } from 'whatsup'

const arr = array([1, 2])

autorun(() => console.log(`Joined: ${arr.join()}`))
//> 'Joined: 1,2'

arr.push(3)
//> 'Joined: 1,2,3'
```

### Observable Set

```tsx
import { set, autorun } from 'whatsup'

const mySet = set([1, 2])

autorun(() => console.log(`My set has 3: ${mySet.has(3)}`))
//> 'My set has 3: false'

mySet.add(3)
//> 'My set has 3: true'

mySet.delete(3)
//> 'My set has 3: false'
```

### Observable Map

```tsx
import { map, autorun } from 'whatsup'

const myMap = map([
    [1, 'John'],
    [2, 'Barry'],
])

autorun(() => {
    console.log(`My map has key 3: ${myMap.has(3)}`)
    console.log(`Value of key 3: ${myMap.get(3)}`)
})
//> 'My map has 3: false'
//> 'Value of key 3: undefined'

myMap.set(3, 'Jessy')
//> 'My map has 3: true'
//> 'Value of key 3: Jessy'

myMap.set(3, 'Bob')
//> 'My map has 3: true'
//> 'Value of key 3: Bob'

myMap.delete(3)
//> 'My map has 3: false'
//> 'Value of key 3: undefined'
```
