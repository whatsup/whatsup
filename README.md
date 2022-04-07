![](https://hsto.org/webt/61/ec/pn/61ecpnmixdh_iaan9gth35clj8e.png)

<div align="center">
<img src="https://img.shields.io/github/workflow/status/whatsup/whatsup/Node.js%20CI/master" alt="GitHub Workflow Status (branch)" />  
<img src="https://img.shields.io/codecov/c/github/whatsup/whatsup/master" alt="codecov" />
<img src="https://img.shields.io/bundlephobia/minzip/whatsup" alt="npm bundle size" />
<img src="https://img.shields.io/github/languages/top/whatsup/whatsup" alt="language" />
<img src="https://img.shields.io/npm/l/whatsup" alt="npm" /> 
<a href="https://twitter.com/intent/tweet?url=https%3A%2F%2Fgithub.com%2Fwhatsup%2Fwhatsup">
<img src="https://img.shields.io/twitter/url?url=https%3A%2F%2Fgithub.com%2Fwhatsup%2Fwhatsup" alt="tweet" />
</a> 
</div>

# What is it?

Whats Up is a reactive framework based on the ideas of streams and fractals. It is very easy to learn and powerful to work with. It has only a few components, but enough to build complex applications.

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

const user = cause(() => {
    return {
        name: name.get(),
    }
})
```

With generator

```ts
import { cause } from 'whatsup'

const user = cause(function* () {
    while (true) {
        yield {
            name: name.get(),
        }
    }
})
```

Inside the generator, the keyword `yield` push data.

The life cycle consists of three steps:

1. create a new iterator using a generator
2. the iterator starts executing and stops after `yield` or `return`, during this operation, all `.get()` calls automatically establish the observed dependencies
3. when changing dependencies, if in the previous step the data was obtained using `yield`, the work continues from the second step; if there was a `return`, the work continues from the first step

The `return` statement does the same as the `yield` statement, but it does the iterator reset.

## Reactions

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

### Autorun

```ts
import { reaction } from 'whatsup'

const name = observable('Natali')
const dispose = autorun(() => console.log(name.get()))

//> 'Natali'

name.set('Aria')

//> 'Aria'

dispose() // to stop watching
```

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

const increment = mutator<number>((n = -1) => n + 1))

const name = observable('John')

const counter = computed(()=>{
    name.get()
    return increment
    // we no need to store a local counter "i"
})

autorun(() => {
    const count = counter.get()
    console.log(`Name was changed ${count} times`)
})

//> Name was changed 0 times

name.set('Barry')

//> Name was changed 1 times
```

## Mutators as filters

Mutators can be used to write filters.

```ts
import { computed, reaction, Mutator } from 'whatsup'

class EvenOnly extends Mutator<number> {
    readonly next: number

    constructor(next: number) {
        super()
        this.next = next
    }

    mutate(prev = 0) {
        return this.next % 2 === 0 ? this.next : prev
        // We allow the new value only if it is even,
        // otherwise we return the old value
        // if the new value is strictly equal (===) to the old value,
        // the app will stop updates propagation
    }
}

const app = computed(() => {
    return new EvenOnly(timer.get())
})

reaction(app, (data) => console.log(data))
//> 0
//> 2
//> 4
//> ...
```

You can create custom equal filters

```ts
import { Mutator } from 'whatsup'

class EqualArr<T> extends Mutator<T[]> {
    readonly arr: T[]

    constructor(arr: T[]) {
        super()
        this.arr = arr
    }

    mutate(prev) {
        const { arr } = this

        if (Array.isArray(prev) && prev.lenght === arr.length && prev.every((item, i) => item === arr[i])) {
            return prev
        }

        return arr
    }
}

/*
then return new EqualArr([...])
*/
```

## Mutators & JSX

WhatsUp has its own plugin that converts jsx-tags into mutators calls. You can read the installation details here [whatsup/babel-plugin-transform-jsx](https://github.com/whatsup/babel-plugin-transform-jsx) and [whatsup/jsx](https://github.com/whatsup/jsx)

```tsx
import { observable } from 'whatsup'
import { render } from '@whatsup-js/jsx'

function* Clicker() {
    const counter = observable(0)

    while (true) {
        const count = counter.get()

        yield (
            <div>
                <div>{count}</div>
                <button onClick={() => counter.set(count + 1)}>Clcik me</button>
            </div>
        )
    }
}

render(<Clicker />)
// Yes, we can render without a container, directly to the body
```

The mutator gets the old DOMNode and mutates it into a new DOMNode the shortest way.

## Delegation

A useful mechanism by which a stream can delegate its work to another stream.

```ts
import { computed, observable, reaction, delegate } from 'whatsup'

const name = observable('John')

const user = computed(function* () {
    while (true) {
        yield `User ${name.get()}`
    }
})

const guest = computed(function* () {
    while (true) {
        yield delegate(user) // delegate work to user
    }
})

reaction(guest, (data) => console.log(data))
//> User John
```

## Incremental & glitch-free computing

All dependencies are updated synchronously in a topological sequence without unnecessary calculations.

```ts
import { observable, compiuted, reaction } from 'whatsup'

const num = observable(1)
const evenOrOdd = computed(() => (num.get() % 2 === 0 ? 'even' : 'odd'))
const isEven = computed(() => `${num.get()} is ${yield * evenOrOdd}`)
const isZero = computed(() => (num.get() === 0 ? 'zero' : 'not zero'))

reaction(isEven, (data) => console.log(data))
reaction(isZero, (data) => console.log(data))
//> 1 is odd
//> not zero
num.set(2)
//> 2 is even
num.set(3)
//> 3 is odd
num.set(0)
//> 0 is even
//> zero
```
