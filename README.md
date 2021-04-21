![](https://hsto.org/webt/9u/xg/1b/9uxg1b_uh8t7f91aj91evmfosuc.png)

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

Whats Up is a front-end framework based on the ideas of streams and fractals. It is very easy to learn and powerful to work with. It has only a few components, but enough to build complex applications.

## Install

Use the [WhatsUp CLI](https://github.com/whatsup/cli) to generate whatsup projects quickly. See below for the necessary steps:

1. Install the WhatsUp CLI globally:

```bash
npm i -g @whatsup/cli
# or
yarn global add @whatsup/cli
```

2. Create a project:

```bash
whatsup project
```

3. Run the application:

```bash
npm start
# or
yarn start
```

## Streams

### `Conse`

it's like a observable

```ts
import { conse } from 'whatsup'

const name = conse('Natali')
```

### `Cause`

it's like a computed

```ts
import { cause } from 'whatsup'

const user = cause(function* () {
    while (true) {
        yield {
            name: yield* name,
        }
    }
})
```

### `Fractal`

This is the cherry on the cake. We'll tell you about it below :)

## Simple rules

`yield` - send to stream

`yield*` - read from stream

## Watching

```ts
import { whatsUp } from 'whatsup'

const onData = (data) => console.log(data)
const onError = (err) => console.error(err)

const dispose = whatsUp(user, onData, onError)
//> {name: 'Natali'}

name.set('Aria')
//> {name: 'Aria'}

dispose() // to stop whatsUping
```

## Extended example

You can extend base classes, but you need to implement the `whatsUp` method

```ts
import { conse, cause, whatsUp } from 'whatsup'

interface UserData {
    name: string
}

class Name extends Conse<string> {}

class User extends Cause<UserData> {
    readonly name: Name

    constructor(name: string) {
        super()
        this.name = new Name(name)
    }

    *whatsUp() {
        while (true) {
            yield {
                name: yield* this.name,
            }
        }
    }
}

const user = new User('Natali')

whatsUp(user, (data) => console.log(data))
//> {name: 'Natali'}

user.name.set('Aria')
//> {name: 'Aria'}
```

## Single argument of `whatsUp` method - `context: Context`

The context has several useful methods for controlling flow, such as `update`

```ts
import { cause, whatsUp } from 'whatsup'

class Timer extends Cause<number> {
    constructor(readonly delay: number) {
        super()
    }

    *whatsUp(ctx: Context) {
        let i = 0

        while (true) {
            setTimeout(() => ctx.update(), this.delay)
            //     kickstart ^^^^^^^^^^^^ updating loop
            yield i++
        }
    }
}

const timer = new Timer(1000)

whatsUp(timer, (data) => console.log(data))
//> 0
//> 1
//> 2 ...
```

## Local-scoped variables & auto-dispose unnecessary dependencies

You can store ancillary data available from calculation to calculation directly in the generator body and you can react to disposing with the native language capabilities

```ts
import { conse, cause, whatsUp } from 'whatsup'

class Timer extends Cause<number> {
    constructor(readonly delay: number) {
        super()
    }

    *whatsUp(ctx: Context) {
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

class App extends Cause<number> {
    readonly showTimer = conse(true);

    *whatsUp() {
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

whatsUp(app, (data) => console.log(data))
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
import { cause, Mutator } from 'whatsup'

class Increment extends Mutator<number> {
    mutate(prev: number | undefined = 0) {
        return prev + 1
    }
}

class Timer extends Cause<number> {
    constructor(readonly delay: number) {
        super()
    }

    *whatsUp(ctx: Context) {
        while (true) {
            setTimeout(() => ctx.update(), this.delay)
            yield new Increment()
            // we no longer need to store a local counter "i"
        }
    }
}
```

## Mutator shorthand

You can create a mutator using shorthand

```ts
import { cause, mutator } from 'whatsup'

const increment = mutator<number>((n = 0) => n + 1)

class Timer extends Cause<number> {
    constructor(readonly delay: number) {
        super()
    }

    *whatsUp(ctx: Context) {
        while (true) {
            setTimeout(() => ctx.update(), this.delay)
            yield increment
        }
    }
}
```

## Mutators & filters

Mutators can be used to write filters.

```ts
import { whatsUp, cause, Mutator } from 'whatsup'

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
        // the App will stop updates propagation
    }
}

class App extends Cause<number> {
    *whatsUp() {
        const timer = new Timer()

        while (true) {
            yield new EvenOnly(yield* timer)
        }
    }
}

const app = new App()

whatsUp(app, (data) => console.log(data))
//> 0
//> 2
//> 4
//> ...
```

You can create custom equal filters

```ts
import { whatsUp, cause, Mutator } from 'whatsup'

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
then in whatsUp generator - yield new EqualArr([...])
*/
```

## Mutators & JSX

Fractal has its own plugin that converts jsx-tags into mutators calls. You can read the installation details here [whatsup/babel-plugin-transform-jsx](https://github.com/whatsup/babel-plugin-transform-jsx) and [whatsup/jsx](https://github.com/whatsup/jsx)

```tsx
import { conse, Cause } from 'whatsup'
import { render } from '@whatsup-js/jsx'

class User extends Cause<JSX.Element> {
    readonly name = conse('John')
    readonly age = conse(33);

    *whatsUp() {
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

It looks like a cause, but for each consumer, the fractal creates a new iterator and context. Contexts bind to the consumer context like a parent-child relation and form a context tree. This allows you to organize the transfer of factors down the tree, as well as the bubbling of events up. A cause, unlike a fractal, creates one iterator for all consumers, and one context without a reference to the parent (root context).

```tsx
import { Fractal, Event, Context, factor } from 'whatsup'
import { render } from '@whatsup-js/jsx'

const Theme = factor<'light' | 'dark'>('light')
// factor determining color scheme

// сustom event for remove Todo
class RemoveEvent extends Event {
    constructor(readonly todo: Todo) {
        super()
    }
}

class Todo extends Fractal<JSX.Element> {
    readonly name: Conse<string>

    constructor(name: string) {
        this.name = conse(name)
    }

    *whatsUp(ctx: Context) {
        const theme = ctx.find(Theme)
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

    *whatsUp(ctx: Context) {
        ctx.share(Theme, 'dark')
        //  ^^^ define value of Theme factor for children contexts
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

## Sharing

This mechanism allows you to make any object publicly available to all children.

```ts
import { Fractal, whatsUp } from 'whatsup'

class Session {
    constructor(readonly token: string) {}
}

class App extends Fractal<string> {
    *whatsUp(ctx: Context) {
        const session = new Session('Secret token')
        const page = new Page()

        ctx.share(this.session) // share Session instance

        while (true) {
            yield `App ${yield* page}`
        }
    }
}

class Page extends Fractal<string> {
    *whatsUp(ctx: Context) {
        const session = ctx.get(Session) // get Session instance

        while (true) {
            yield `Page ${session.token}`
        }
    }
}

whatsUp(new App(), (d) => console.log(d))
//> App Page Secret token
```

There is also a `find` method. It looks for objects with `instanceof`.

## Sharing with factors

The `share` method can take a factor as a share-key.

```ts
import { Fractal, whatsUp, factor } from 'whatsup'

const Theme = factor<string>('light')
//             default value ^^^^^^^

class App extends Fractal<string> {
    *whatsUp(ctx: Context) {
        const page = new Page()

        ctx.share(Theme, 'dark') // share theme value for children contexts

        while (true) {
            yield `App ${yield* page}`
        }
    }
}

class Page extends Fractal<string> {
    *whatsUp(ctx: Context) {
        const theme = ctx.get(Theme) // get Theme shared value
        // when no factor is found (not shared in parents)
        // the default value is returned - 'light'

        while (true) {
            yield `Page. Theme is ${theme}.`
        }
    }
}

whatsUp(new App(), (d) => console.log(d))
//> Page. Theme is dark.
```

## Asynchrony (deferred job)

The context has a `defer` method. This method allows you to start the execution of asynchronous code, after the execution of which `ctx.update()` will be automatically called. Defer returns an object like `{done: boolean, value: T}`.

```ts
import { Cause, whatsUp } from 'whatsup'

// welcome.ts
export class Welcome extends Cause<string> {
    *whatsUp() {
        while (true) {
            yield 'Hello world'
        }
    }
}

// app.ts
class App extends Cause<string> {
    *whatsUp(ctx) {
        const deferred = ctx.defer(async function () {
            const { Welcome } = await import('./welcome')
            return new Welcome()
        })

        // deferred is {done: false}

        yield 'Loading...'

        // deferred is {done: true, value: Welcome}

        const welcome = deferred.value

        while (true) {
            yield `App: ${yield* welcome}`
        }
    }
}

whatsUp(new App(), (d) => console.log(d))
//> Loading...
//> App: Hello world
```

## Delegation

A useful mechanism by which a stream can delegate its work to another stream.

```ts
import { fractal, conse, whatsUp, delegate } from 'whatsup'

const Name = conse('John')

const User = fractal(function* () {
    while (true) {
        yield `User ${yield* Name}`
    }
})

const Guest = fractal(function* () {
    while (true) {
        yield delegate(User) // delegate work to User
    }
})

const guest = new Guest()

whatsUp(guest, (data) => console.log(data))
//> User John
```

In the following example, you can see what happens if a delegation is passed to the conse.

```ts
import { cause, conse, whatsUp, delegate } from 'whatsup'

const BarryName = cause(function* () {
    while (true) yield 'Barry'
})

const Name = conse('John')

whatsUp(Name, (data) => console.log(data))
//> John
Name.set(delegate(BarryName))
//> Barry
```

## Incremental & glitch-free computing

All dependencies are updated synchronously in a topological sequence without unnecessary calculations.

```ts
import { conse, cause, whatsUp } from 'whatsup'

const num = conse(1)
const evenOrOdd = cause(function* () {
    while (true) {
        yield (yield* num) % 2 === 0 ? 'even' : 'odd'
    }
})
const isEven = cause(function* () {
    while (true) {
        yield `${yield* num} is ${yield* evenOrOdd}`
    }
})
const isZero = cause(function* () {
    while (true) {
        yield (yield* num) === 0 ? 'zero' : 'not zero'
    }
})

whatsUp(isEven, (data) => console.log(data))
whatsUp(isZero, (data) => console.log(data))
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

## Lifecycle

Inside the generator, the keyword `yield` push data to stream, and `yield*` pull data from stream.

![](https://hsto.org/webt/pv/tm/gz/pvtmgzvnerzt4sns6nuha-fmkgy.jpeg)

The life cycle consists of three steps:

1. create a new iterator using a generator
2. the iterator starts executing and stops after `yield` or `return`, during this operation, all calls to `yield*` automatically establish the observed dependencies; as soon as a new data is generated, the stream reports this to the parent and goes into standby mode for updates
3. having received the update message, the stream clears the list of dependencies and, if in the previous step the data was obtained using `yield`, the stream continues its work from the second step; if there was a `return`, the work continues from the first step

The `return` statement does the same as the `yield` statement, but it does the iterator reset, and the stream starts its life anew.

## Examples

-   [Sierpinski](https://whatsup.github.io/sierpinski) - perfomance test like React sierpinski triangle. [[source](https://github.com/whatsup/whatsup.github.io/tree/master/src/root/sierpinski)]
-   [Todos](https://whatsup.github.io/todos) - WhatsUp realization of TodoMVC. [[source](https://github.com/whatsup/whatsup.github.io/tree/master/src/root/todos)]
-   [Loadable](https://whatsup.github.io/loadable) - an example showing how you can organize the display of loaders during background loading. I specifically added small delays there in order to slow down the processes. [[source](https://github.com/whatsup/whatsup.github.io/tree/master/src/root/loadable)]
-   [Factors](https://whatsup.github.io/factors) - work in different conditions. One and the same fractal, depending on the factor set in the context, gives three different results, and also maintains their relevance. Try editing the name and age. [[source](https://github.com/whatsup/whatsup.github.io/tree/master/src/root/factors)]
-   [Antistress](https://whatsup.github.io/antistress) - just a toy, click the balls, paint them in different colors and get cool pictures. In fact, this is a fractal that shows a circle inside itself, or three of the same fractals inscribed in the perimeter of the circle. Click - paint, long click - crush, long click in the center of the crushed circle - return to its original state. If you crush the circles to a sufficiently deep level, you can see the [Sierpinski triangle](https://en.wikipedia.org/wiki/Sierpi%C5%84ski_triangle). [[source](https://github.com/whatsup/whatsup.github.io/tree/master/src/root/antistress)]
