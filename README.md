![](https://hsto.org/webt/7u/82/rc/7u82rcfrurytc0gvyels2j9ut_u.png)

<div align="center">
<img src="https://img.shields.io/travis/fract/core/master" alt="travis" />
<img src="https://img.shields.io/codecov/c/github/fract/core/master" alt="codecov" />
<img src="https://img.shields.io/bundlephobia/min/@fract/core" alt="size" />
<img src="https://img.shields.io/github/languages/top/fract/core" alt="language" />
<img src="https://img.shields.io/npm/l/@fract/core" alt="npm" /> 
<a href="https://twitter.com/intent/tweet?url=https%3A%2F%2Fgithub.com%2Ffract%2Fcore">
<img src="https://img.shields.io/twitter/url?url=https%3A%2F%2Fgithub.com%2Ffract%2Fcore" alt="tweet">
</a> 
</div>

## Install

```bash
npm i @fract/core
```

## Streams

### `Observable`

```ts
import { observable } from '@fract/core'

const name = observable('Natali')
```

### `Computed`

```ts
import { computed } from '@fract/core'

const user = computed(function* () {
    while (true) {
        yield {
            name: yield* name,
        }
    }
})
```

### `Fractal` & `Fraction`

These are the cherries on the cake. We will cover this below :)

## Watching

```ts
import { watch } from '@fract/core'

const onData = (data) => console.log(data)
const onError = (err) => console.error(err)

const dispose = watch(user, onData, onError)
//> {name: 'Natali'}

name.set('Aria')
//> {name: 'Aria'}

dispose() // to stop watching
```

## Incremental & glitch-free computing

All dependencies are updated synchronously in a topological sequence without unnecessary calculations.

```ts
import { observable, computed, watch } from '@fract/core'

const num = observable(1)
const evenOrOdd = computed(function* () {
    while (true) {
        yield (yield* a) % 2 === 0 ? 'even' : 'odd'
    }
})
const isEven = computed(function* () {
    while (true) {
        yield `${yield* num} is ${yield* evenOrOdd}`
    }
})
const isZero = computed(function* () {
    while (true) {
        yield (yield* num) === 0 ? 'zero' : 'not zero'
    }
})

watch(isEven, (data) => console.log(data))
watch(isZero, (data) => console.log(data))
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

## Extended example

You can extend base classes, but you need to implement the `stream` method

```ts
import { Observable, Computed, watch } from '@fract/core'

interface UserData {
    name: string
}

class Name extends Observable<string> {}

class User extends Computed<UserData> {
    readonly name: Name

    constructor(name: string) {
        super()
        this.name = new Name(name)
    }

    protected *stream() {
        while (true) {
            yield {
                name: yield* this.name,
            }
        }
    }
}

const user = new User('Natali')

watch(user, (data) => console.log(data))
//> {name: 'Natali'}

name.set('Aria')
//> {name: 'Aria'}
```

## Single argument of `stream` method - `context: Context`

The context has several useful methods for controlling flow, such as `update`

```ts
import { Computed, watch } from '@fract/core'

class Timer extends Computed<number> {
    constructor(readonly delay: number) {
        super()
    }

    protected *stream(ctx: Context) {
        let i = 0

        while (true) {
            setTimeout(() => ctx.update(), this.delay)
            //     kickstart ^^^^^^^^^^^^ updating loop
            yield i++
        }
    }
}

const timer = new Timer(1000)

watch(timer, (data) => console.log(data))
//> 0
//> 1
//> 2 ...
```

## Local-scoped variables & auto-dispose unnecessary dependencies

You can store ancillary data available from calculation to calculation directly in the generator body and you can react to disposing with the native language capabilities

```ts
import { observable, Computed, watch } from '@fract/core'

class Timer extends Computed<number> {
    constructor(readonly delay: number) {
        super()
    }

    *stream(ctx: Context) {
        let i = 0
        let timeoutId: number

        try {
            while (true) {
                timeoutId = setTimeout(() => ctx.update(), this.delay)
                yield i++
            }
        } finally {
            // This block will always be executed when unsubscribing from a stream.
            clearTimeout(timeoutId)
            console.log('Timer destroed')
        }
    }
}

class App extends Computed<number> {
    readonly showTimer = observable(true);

    *stream() {
        // local scoped Timer instance, she is alive while the stream App is alive
        const timer = new Timer()

        while (true) {
            if (yield* this.showTimer) {
                const time = yield* timer
                yield time
            } else {
                yield 'App timer is hidden'
            }
        }
    }
}

const app = new App()

watch(app, (data) => console.log(data))
//> 0
//> 1
//> 2
app.showTimer.set(false)
//> Timer destroed
//> App timer is hidden
app.showTimer.set(true) // the timer starts from the beginning
//> 0
//> 1
//> ...
```

## Mutators

Allows you to create new data based on previous. You need just to implement the mutate method.

```ts
import { Computed, Mutator } from '@fract/core'

class Increment extends Mutator<number> {
    mutate(prev: number | undefined = 0) {
        return prev + 1
    }
}

class Timer extends Computed<number> {
    constructor(readonly delay: number) {
        super()
    }

    *stream(ctx: Context) {
        while (true) {
            setTimeout(() => ctx.update(), this.delay)
            yield new Increment()
            // we no longer need to store a local counter "i"
        }
    }
}
```

Mutators can be used to write filters.

```ts
import { watch, Computed, Mutator } from '@fract/core'

class EvenOnly extends Mutator<number> {
    readonly next: number

    constructor(next: number) {
        super()
        this.next = next
    }

    mutate(prev = 0) {
        return this.next % 2 === 0 ? this.next : prev
        // We skip the new value only if it is even,
        // otherwise we return the old one
        // Having received the previous value,
        // the App will stop updates propagation
    }
}

class App extends Computed<number> {
    *stream() {
        const timer = new Timer()

        while (true) {
            yield new EvenOnly(yield* timer)
        }
    }
}

const app = new App()

watch(app, (data) => console.log(data))
//> 0
//> 2
//> 4
//> ...
```

## Mutators & JSX

Fractal has its own plugin that converts jsx-tags into mutators calls. You can read the installation details here [fract/babel-plugin-transform-jsx](https://github.com/fract/babel-plugin-transform-jsx) and [fract/jsx](https://github.com/fract/jsx)

```tsx
import { observable, Computed } from '@fract/core'
import { render } from '@fract/jsx'

class User extends Computed<JSX.Element> {
    readonly name = observable('John')
    readonly age = observable(33);

    *stream() {
        while (true) {
            yield (
                <Container>
                    <Name>{yield* this.name}</Name>
                    <Age>{yield* this.age}</Age>
                </Container>
            )
        }
    }
}

const user = new User()

render(user)
// Yes, we can render without a container, directly to the body
```

The mutator gets the old DOMNode and mutates it into a new DOMNode the shortest way.

## Fractal

It looks like a computed, but for each consumer, the fractal creates a new iterator and context. Contexts bind to the consumer context like a parent-child relation and form a context tree. This allows you to organize the transfer of factors down the tree, as well as the bubbling of events up. A computed, unlike a fractal, creates one iterator for all consumers, and one context without a reference to the parent (root context).

```tsx
import { Fractal, Event, Context, factor } from '@fract/core'
import { render } from '@fract/jsx'

const Theme = factor<'light' | 'dark'>('light')
// factor determining color scheme

// сustom event for remove Todo
class RemoveEvent extends Event {
    constructor(readonly todo: Todo) {
        super()
    }
}

class Todo extends Fractal<JSX.Element> {
    readonly name: Observable<string>

    constructor(name: string) {
        tihs.name = observable(name)
    }

    *stream(ctx: Context) {
        const theme = ctx.get(Theme)
        //   get value of ^^^ Theme factor
        const onClick = () => ctx.dispatch(new RemoveEvent(this))
        //   start event bubbling ^^^^^^^^

        while (true) {
            yield (
                <Container theme={theme}>
                    <Name>{yield* this.name}</Name>
                    <RemoveButton onClick={onClick} />
                </Container>
            )
        }
    }
}

class Todos extends Fractal<JSX.Element> {
    readonly list: List<Todo> = list()

    create(name: string) {
        const todo = new Todo(name)
        this.list.insert(todo)
    }

    remove(todo: Todo) {
        this.list.delete(todo)
    }

    *stream(ctx: Context) {
        ctx.set(Theme, 'dark')
        //  ^^^ set value of Theme factor for children contexts
        ctx.on(RemoveEvent, (e) => this.remove(e.todo))
        //  ^^ start event listening

        while (true) {
            const acc = []

            for (const todo of yield* this.list) {
                acc.push(yield* todo)
            }

            yield <Container>{acc}</Container>
        }
    }
}

const todos = new Todos()

render(todos)
```

## Fraction

A fraction is a fractal arranged like a observable. It also has a set method and allows you to set values.

```ts
import { fraction, watch } from '@fract/core'

const title = fraction('Hello')

watch(title, (data) => console.log(data))
//> 'Hello'
title.set('World')
//> 'World'
```

## Delegation

A useful mechanism thanks to which a fractal can delegate self work to another fractal. For this, the performer must be returned as a result of his work. Delegation is available only in fractals.

```ts
import { fractal, fraction, watch } from '@fract/core'

const Name = fraction('John')

const User = fractal(function* () {
    while (true) {
        yield `User ${yield* Name}`
    }
})

const Guest = fractal(function* () {
    while (true) {
        yield User // delegate work to User
    }
})

const guest = new Guest()

watch(guest, (data) => console.log(data))
//> 'User John'
```

In the following example, you can see what happens if a fractal is passed to the fraction.

```ts
import { fractal, fraction, watch } from '@fract/core'

const BarryName = fractal(function* () {
    while (true) yield 'Barry'
})

const Name = fraction('John')

watch(Name, (data) => console.log(data))
//> 'John'
Name.set(BarryName)
//> 'Barry'
```

Again, delegation will happen, since a fraction is a regular fractal and a `yield BarryName` occurs inside its generator.

## Lifecycle

Inside the generator, the keyword `yield` push data to stream, and `yield*` pull data from stream.

![](https://hsto.org/webt/pv/tm/gz/pvtmgzvnerzt4sns6nuha-fmkgy.jpeg)

The life cycle consists of three steps:

1. create a new iterator using a generator
2. the iterator starts executing and stops after `yield` or `return`, during this operation, all calls to `yield*` automatically establish the observed dependencies; as soon as a new data is generated, the stream reports this to the parent and goes into standby mode for updates
3. having received the update message, the stream clears the list of dependencies and, if in the previous step the data was obtained using `yield`, the stream continues its work from the second step; if there was a `return`, the work continues from the first step

The `return` statement does the same as the `yield` statement, but it does the iterator reset, and the stream starts its life anew.

## Asynchrony

Asynchronous support in development, we will definitely come up with something fresh and incredibly tasty :)

## Examples

-   [Sierpinski](https://fract.github.io/sierpinski) - perfomance test like React sierpinski triangle [source](https://github.com/fract/fract.github.io/tree/master/src/sierpinski)
-   [Todos](https://fract.github.io/todos) - fractal-like realization of TodoMVC, [source](https://github.com/fract/fract.github.io/tree/master/src/todos)
-   [Loadable](https://fract.github.io/loadable) - an example showing how you can organize the display of loaders during background loading [source](https://github.com/fract/fract.github.io/tree/master/src/loadable) I specifically added small delays there in order to slow down the processes
-   [Factors](https://fract.github.io/factors) - work in different conditions. One and the same fractal, depending on the factor set in the context, gives three different results, and also maintains their relevance. Try editing the name and age, [source](https://github.com/fract/fract.github.io/tree/master/src/factors)
-   [Antistress](https://fract.github.io/antistress) - just a toy, click the balls, paint them in different colors and get cool pictures. In fact, this is a fractal that shows a circle inside itself, or three of the same fractals inscribed in the perimeter of the circle. Click - paint, long click - crush, long click in the center of the crushed circle - return to its original state. If you crush the circles to a sufficiently deep level, you can see the [Sierpinski triangle](https://en.wikipedia.org/wiki/Sierpi%C5%84ski_triangle), [source](https://github.com/fract/fract.github.io/tree/master/src/antistress)
