## Install

```bash
npm i @fract/core
```

```ts
import { fractal, fraction } from '@fract/core'
```

## What is it?

Fractal is a pattern for building asynchronous applications.
It has two key components.

#### `fractal<T>(generator: AsyncGenerator<T>): Fractal<T>`

This is a fractal factory, it takes an asynchronous generator and returns a new fractal

```ts
const User = fractal(async function* () {
    while (true) {
        yield 'User John'
    }
})
```

`'User John'` - is a projection of fractal `User`

#### `fraction<T>(initial: T): Fraction<T>`

This is a fraction factory, it takes an initial value and returns a new fraction, fraction is also a fractal.

The fraction has one method `.use(projection)` that determines the value to use as a projection.

```ts
const Name = fraction('John')

Name.use('Barry')
```

## Lifecycle

Inside the generator, the keyword `yield` defines, and `yield*` retrieves the current projection of the fractal, in other words, if we present everything in the form of a tree, where fractals are nodes and the flow of information is directed to the root, then `yield*` is to raise from the bottom, and `yield` send up.

The life cycle consists of three steps:

1. fractal creates a new iterator using a generator
2. the iterator is executed before the first `yield` or `return`, during this operation, all calls to `yield*` automatically establish the observed dependencies; as soon as a new projection is generated, the fractal reports this to the parent and goes into standby mode for updates
3. having received the update message, the fractal clears the list of dependencies and, if in the previous step the projection was obtained using `yield`, the fractal continues its work from the second step; if there was a `return`, the work continues from the first step

The `return` statement does the same as the`yield` statement, but it does the iterator reset, and the fractal starts its life anew.

## Runners

Fractal has two ways to run - `exec` and `live`.

```ts
import { exec, live } from '@fract/core'
```

#### `exec<T>(target: Fractal<T> | AsyncGenerator<T>): Promise<Frame<T>>`

Returns a promise of simple frame with current projection

```ts
interface Frame<T> {
    data: T
}
```

#### `live<T>(target: Fractal<T> | AsyncGenerator<T>): Promise<LiveFrame<T>>`

Returns a promise of a sequence of live frames, each frame has the current projection and the promise of the next frame

```ts
interface LiveFrame<T> {
    data: T
    next: Promise<LiveFrame<T>>
}
```

Changes inside the fractal tree start generating a new frame

## Simple example

```ts
const Name = fraction('John')

const User = fractal(async function* () {
    while (true) {
        yield `User ${yield* Name}`
    }
})
```

```ts
const frame = await exec(User)

frame.data // > 'User John'
```

```ts
const frame = await live(User)

frame.data // > 'User John'

Name.use('Barry')

const nextFrame = await frame.next

nextFrame.data // > 'User Barry'
```

## Temporary projections

The fractal has the ability to display temporary projection while the main projection is being calculated. The helper is intended for this - `tmp`. This functionality allows you to organize a simple system for displaying loaders.

```ts
import { fractal, tmp, live } from '@fract/core'

const User = fractal(async function* () {
    yield tmp('Loading...')

    const data = await loadUserDataFromServer()

    yield `User ${data.name}`
})

/*...*/

const frame = await live(User)

frame.data // 'Loading...'

const nextFrame = await frame.next

nextFrame.data // 'User John'
```

## Delegation

A fractal can delegate the calculation of its projection to another fractal, for this it must return the fractal as its projection.

```ts
import { fractal, live } from '@fract/core'

const Name = fraction('John')

const User = fractal(async function* () {
    while (true) {
        yield `User ${yield* Name}`
    }
})

const Guest = fractal(async function* () {
    while (true) {
        yield User
    }
})

/*...*/

const frame = await live(Guest)

frame.data // 'User John'
```

## Factors

Factors allow you to define the conditions available for child fractals to work.

```ts
import { fractal, factor, exec } from '@fract/core'

enum Mode {
    Data,
    String,
}

const MODE = factor<Mode>()

const User = fractal(async function* () {
    const mode = yield* MODE // extract MODE value

    while (true) {
        switch (mode) {
            case Mode.Data:
                yield { name: 'John' }
                continue
            case Mode.String:
                yield 'Name - John'
                continue
        }
    }
})

const AsData = fractal(async function* () {
    yield* MODE(Mode.Data) // define factor for child fractals

    while (true) {
        yield User
    }
})

const AsString = fractal(async function* () {
    yield* MODE(Mode.String) // define factor for child fractals

    while (true) {
        yield User
    }
})

/*...*/

const dataFrame = await exec(AsData)

dataFrame.data // {name: 'John'}

const strFrame = await exec(AsString)

strFrame.data // 'Name - John'
```

## Asynchrony & code splitting

Under the hood, all the work of the fractal occurs asynchronously, however, inside the generator this asynchrony is quite simple to control using the usual `await`. Dependencies can be imported directly from the generator body, which allows collectors, such as webpack, to easily break the code into small chunks

```ts
// ./user.ts
export const User = fractal(async function* () {
    while (true) {
        yield `User John`
    }
})

// ./app.ts
export const App = fractal(async function* () {
    // import dependency when you really need it
    const { User } = await import('./user')

    while (true) {
        yield `User ${yield* User}`
    }
})
```

No hidden magic, special downloaders and other things, everything is solved by native means, with IntelliSense saved in the editor.
