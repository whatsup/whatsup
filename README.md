![](https://hsto.org/webt/rz/9j/mo/rz9jmotxqpxb01rvhwnnjpipxbk.png)

# What is it?

Whats Up is a reactive framework. It is very easy to learn and powerful to work with. It has only a few components, but enough to build complex applications.

## Install

```bash
npm i whatsup
# or
yarn add whatsup
```

## Components

### `Observable`

Creates a trackable field. Has `.get` and `.set` methods

```ts
import { observable } from 'whatsup'

const name = observable('Natali')

name.get() // 'Natali'
name.set('Aria')
name.get() // 'Aria'
```

### `Computed`

Creates a derived field. Accepts a function or generator as an argument.

```ts
import { computed } from 'whatsup'

const firstName = observable('John')
const lastName = observale('Lennon')

const fullName = computed(() => {
    return `${firstName.get()} ${lastName.get()}`
})
```

### `Actions`

Allows multiple updates in one operation

```ts
import { observable, computed, action, runInAction } from 'whatsup'

class User {
    @observable
    firstName = 'John'

    @observable
    lastName = 'Lennon'

    @action
    setName(firstName: string, lastName: string) {
        this.firstName = firstName
        this.lastName = lastName
    }
}

const user = new User()

user.setName('Barry', 'Baker')

// or as wrapped action callback

const setUserName = action((firstName: string, lastName: string) => {
    user.firstName = firstName
    user.lastName = lastName
})

setUserName('Barry', 'Baker')

// or run in action

runInAction(() => {
    user.firstName = 'Barry'
    user.lastName = 'Baker'
})
```

### `Reaction`

```ts
import { reaction } from 'whatsup'

const name = observable('Natali')
const dispose = reaction(
    () => name.get(),
    (name) => console.log(name)
)

//> 'Natali'

name.set('Aria')

//> 'Aria'

dispose() // to stop watching
```

### `Autorun`

```ts
import { observable, autorun } from 'whatsup'

const name = observable('Natali')
const dispose = autorun(() => console.log(name.get()))

//> 'Natali'

name.set('Aria')

//> 'Aria'

dispose() // to stop watching
```

### `Observable Array`

```ts
import { array, autorun } from 'whatsup'

const arr = array([1, 2])
const dispose = autorun(() => console.log(`Joined: ${arr.join()}`))

//> 'Joined: 1,2'

arr.push(3)

//> 'Joined: 1,2,3'

dispose() // to stop watching
```

### `Observable Set`

```ts
import { set, autorun } from 'whatsup'

const mySet = set([1, 2])
const dispose = autorun(() => console.log(`My set has 3: ${mySet.has(3)}`))

//> 'My set has 3: false'

mySet.add(3)

//> 'My set has 3: true'

dispose() // to stop watching
```

### `Observable Map`

```ts
import { map, autorun } from 'whatsup'

const myMap = set([
    [1, 'John'],
    [2, 'Barry'],
])
const dispose = autorun(() => {
    console.log(`My map has 3: ${myMap.has(3)}`)
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

dispose() // to stop watching
```

## Use of generators

```ts
import { computed } from 'whatsup'

const firstName = observable('John')
const lastName = observale('Lennon')

const fullName = computed(function* () {
    while (true) {
        yield `${firstName.get()} ${lastName.get()}`
    }
})
```

Inside the generator, the keyword `yield` push data.

The life cycle consists of three steps:

1. create a new iterator using a generator
2. the iterator starts executing and stops after `yield` or `return`, during this operation, all `.get()` calls automatically establish the observed dependencies
3. when changing dependencies, if in the previous step the data was obtained using `yield`, the work continues from the second step; if there was a `return`, the work continues from the first step

The `return` statement does the same as the `yield` statement, but it does the iterator reset.

## Local-scoped variables & auto-dispose unnecessary dependencies

You can store ancillary data available from calculation to calculation directly in the generator body and you can react to disposing with the native language capabilities

```ts
import { observable, computed, autorun } from 'whatsup'

const timer = computed(function* () {
    // local scoped variables, they is alive while the timer is alive
    let timeoutId: number
    const value = observable(0)

    try {
        while (true) {
            const val = value.get()

            timeoutId = setTimeout(() => value.set(val + 1), 1000)

            yield val
        }
    } finally {
        // This block will always be executed when unsubscribing
        clearTimeout(timeoutId)
        console.log('Timer destroed')
    }
})

const useTimer = observable(true)

const app = computed(() => {
    if (useTimer.get()) {
        return timer.get()
    }
    return 'App: timer is not used'
})

autorun(() => console.log(app.get()))
//> 0
//> 1
//> 2
useTimer.set(false)
//> Timer destroed
//> App: timer is not used
useTimer.set(true) // the timer starts from the beginning
//> 0
//> 1
//> ...
```

## Mutators

Allows you to create new data based on previous. You need just to implement the mutate method.

```ts
import { observable, computed, mutator } from 'whatsup'

const concat = (letter: string) => {
    return mutator((prev = '') => prev + letter)
}

const output = computed(function* () {
    const input = observable('')

    window.addEventListener('keypress', (e) => input.set(e.key))

    while (true) {
        yield concat(input.get())
    }
})

autorun(() => console.log(output.get()))

// bress 'a' > 'a'
// press 'b' > 'ab'
// press 'c' > 'abc'
```

## Mutators as filters

Mutators can be used to write filters.

```ts
import { computed, reaction, Mutator } from 'whatsup'

const evenOnly = (next: number) => {
    // We allow the new value only if it is even,
    // otherwise we return the old value
    return mutator((prev = 0) => (next % 2 === 0 ? next : prev))
}

const app = computed(() => {
    return evenOnly(timer.get())
})

reaction(app, (data) => console.log(data))
//> 0
//> 2
//> 4
//> ...
```

You can create custom equality filters. For example, we want the computer to not run recalculations if the new list is shallow equal to the previous one.

If we use `mobx` we will do it like this:

<!-- prettier-ignore -->
```ts
const users = observable.array<User>([/*...*/])
const list = computed(() => users.filter(/*...*/), { equals: comparer.shallow })
```

Here is `whatsup` way:

<!-- prettier-ignore -->
```ts
const users = array<User>([/*...*/])
const list = computed(() => shallow(users.filter(/*...*/)))
```

And somewhere in the utilities

```ts
// ./utuls.ts

const shallow = <T>(arr: T[]) => {
    /*
    We have to compare the old and new value and 
    if they are equivalent return the old one, 
    otherwise return the new one.
    */
    return mutator((prev?: T[]) => {
        if (Array.isArray(prev) && prev.lenght === arr.length && prev.every((item, i) => item === arr[i])) {
            return prev
        }

        return arr
    })
}
```

Later we will collect the most necessary filters in a separate package.

## Mutators & JSX

WhatsUp has its own plugin that converts jsx-tags into mutators calls. You can read the installation details here [whatsup/babel-plugin-transform-jsx](https://github.com/whatsup/babel-plugin-transform-jsx) and [whatsup/jsx](https://github.com/whatsup/jsx)

```tsx
import { observable } from 'whatsup'
import { render } from '@whatsup/jsx'

function* Clicker() {
    const counter = observable(0)

    while (true) {
        const count = counter.get()

        yield (
            <div>
                <div>{count}</div>
                <button onClick={() => counter.set(count + 1)}>Click me</button>
            </div>
        )
    }
}

render(<Clicker />)
// Yes, we can render without a container, directly to the body
```

The mutator gets the old DOMNode and mutates it into a new DOMNode the shortest way.

## Incremental & glitch-free computing

All dependencies are updated synchronously in a topological sequence without unnecessary calculations.

```ts
import { observable, computed, reaction } from 'whatsup'

const num = observable(1)
const evenOrOdd = computed(() => (num.get() % 2 === 0 ? 'even' : 'odd'))
const numInfo = computed(() => `${num.get()} is ${evenOrOdd.get()}`)

reaction(numInfo, (data) => console.log(data))
//> 1 is odd
num.set(2)
//> 2 is even
num.set(3)
//> 3 is odd
```
