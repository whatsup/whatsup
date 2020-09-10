# Welcome to Fractal

![Travis (.org) branch](https://img.shields.io/travis/fract/core?style=flat-square)
![Codecov](https://img.shields.io/codecov/c/github/fract/core?style=flat-square)
![npm bundle size (scoped)](https://img.shields.io/bundlephobia/min/@fract/core?style=flat-square)
![GitHub top language](https://img.shields.io/github/languages/top/fract/core?style=flat-square)
![NPM](https://img.shields.io/npm/l/@fract/core?style=flat-square)

## Idea

The idea is to divide the application not horizontally into models, views, controllers, etc., but deeper into a fractal-tree structure, where each node is an independent complete application. The result of the work of each such application is a flow of information reflecting its internal state.

![](https://hsto.org/webt/zw/yu/4c/zwyu4cb736of4iyuvslgzcplgxg.jpeg)

## Install

```bash
npm i @fract/core
```

```ts
import { fractal, fraction } from '@fract/core'
```

## Two key components

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

![](https://hsto.org/webt/pv/tm/gz/pvtmgzvnerzt4sns6nuha-fmkgy.jpeg)

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

A very useful mechanism. It allows you to organize the background execution of work while the superior fractal is content with a temporary result. Temporary projections are created using the `tmp(data)` function, and returned as normal using `yield`.

One use case is for organizing loaders.

```ts
import { fractal, tmp, live } from '@fract/core'

const User = fractal(async function* () {
    yield tmp('Loading...')

    const data = await loadUserDataFromServer() // do something for a long time

    yield `User ${data.name}`
})

/*...*/

const frame = await live(User)

frame.data // 'Loading...'

const nextFrame = await frame.next

nextFrame.data // 'User John'
```

Here the `User` fractal is "slow", before giving its projection it needs to go to the server. And someone from above is waiting for his projection at this time. So, in order not to keep itself waiting, `User` gives the time projection `'Loading ...'` and continues to generate the main one, which it will give as soon as it is ready, i.e. the generator code after `yield tmp(...)` continues to execute, but in the background.

This is how you can make a fractal timer

```ts
import { fractal, tmp } from '@fract/core'

const Timer = fractal(async function* () {
    let i = 0

    while (true) {
        yield tmp(i++)
        await new Promise((r) => setTimeout(r, 1000))
    }
})

const App = fractal(async function* () {
    while (true) {
        console.log(yield* Timer)
        yield
    }
})

live(App)

//> 0
//> 1
//> 2
//> ...
```

Here, the `Timer` fractal gives the current value of the variable `i` as its time projection and continues calculating the next one, during which it increments `i`, waits for the end of the 1 second delay and the cycle repeats.

## Delegation

A useful mechanism thanks to which a fractal can delegate work on its projection to another fractal. All that is needed for this is to return the performer as his projection.

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

Let's say we have a `newEditor` factory that creates a fractal responsible for editing a user profile. We also have a `Manager` fractal that switches the edited profile depending on the `ProfileId` fraction.

```ts
function newEditor(id) {
    return fractal(async function* () {
        const { name } = await loadUserInfo(id)
        const Name = fraction(name)

        while (true) {
            yield <input placeholder="Input name" value={yield* Name} onChange={(e) => Name.use(e.target.value)} />
        }
    })
}

const ProfileId = fraction(1)

const Manager = fractal(async function* () {
    while (true) {
        const id = yield* ProfileId
        const Editor = newEditor(id)
        yield Editor // <-- delegating the work to the Editor fractal
    }
})

const App = fractal(async function* () {
    while (true) {
        yield yield* Manager
    }
})
```

The fractal tree will reassemble the projections from the inside-out every time, when somewhere in its depth during editing, changes occur, in this example, in the Name fraction. Rebuilding will inevitably restart the while (true) loops at all levels up to the root of the `App`, except for the `Manager` fractal. The latter delegates the work on its projection to the `Editor` fractal, and is, as it were, pushed out of the regeneration chain.

![](https://hsto.org/webt/6x/kh/o6/6xkho6gu0j-hiqzk9objvttdt5k.jpeg)

Only the `ProfileId` faction can affect the `Manager`. As soon as it changes, `Manager` will start a rebuild cycle, in which it will create a new `Editor` fractal and delegate further work to it again.

Without the delegation mechanism, we would have to manually determine what has changed - the `ProfileId` fraction or something else deep in the fractal, because we do not need to create a new `Editor` if the id of the edited profile has not changed. Such code would look rather verbose and not very pretty.

```ts
const ProfileId = fraction(1)

const Manager = fractal(async function* () {
    let lastProfileId
    let Editor

    while (true) {
        const id = yield* ProfileId

        if (id !== lastProfileId) {
            lastProfileId = id
            Editor = newEditor(id)
        }

        yield yield* Editor
    }
})
```

In the following example, you can see what happens if a fractal is passed to the fraction as a new projection.

```ts
const BarryName = fractal(async function* () {
    while (true) yield 'Barry'
})

const Name = fraction('John')

const App = fractal(async function* () {
    while (true) {
        console.log(yield* Name)
        yield
    }
})

live(App)

//> 'John'
Name.use(BarryName)
//> 'Barry'
```

Again, delegation will happen, since a fraction is a regular fractal and a `yield BarryName` occurs inside its generator.

## Factors

Factors allow you to define the conditions available for child fractals to work.

One of the options for using factors is to indicate the mode of operation, depending on which the fractal generates a projection of a certain type. Let's say we need to build an application that can display information on the screen, simultaneously save its state to local storage, and restore from the last saved state when the page is refreshed.

```ts
const APP_STORE = 'APP'

 interface AppData {
     name: string
 }

function newApp({ name = 'Hello world' } as AppData) {
    const Name = fraction(name)

    return fractal(async function* App() {
        while (true) {
            switch (yield* MODE) {
                case 'asString':
                    yield `App ${yield* Name}`
                    continue
                case 'asData':
                    yield { name: yield* Name } as AppData
                    continue
            }
        }
    })
}

const Dispatcher = fractal(async function* () {
    // we take the saved state from localStorage
    const data = JSON.parse(localStorage.getItem(APP_STORE) || '{}') as AppData

    // create a fractal of our application
    const App = newApp(data)

    // create a fractal with a predefined operating mode 'asString'
    const AsString = fractal(async function* () {
        yield* MODE('asString')
        while (true) yield yield* App
    })

    // create a fractal with a predefined operating mode 'asData'
    const AsData = fractal(async function* () {
        yield* MODE('asData')
        while (true) yield yield* App
    })

    while (true) {
        const asString = yield* AsString // we will display this on the screen
        const asData = yield* AsData     // and save this to the storage
        // output to the console
        console.log(asString)
        // save to localStorage
        localStorage.setItem(APP_STORE, JSON.stringify(asData))
        yield
    }
})
```

What happens here: the same `App` fractal generates its projections in different ways depending on the `MODE` factor, knowing this we connect it to the `AsString` and `AsData` fractals, which in turn connect to the `Dispatcher`. As a result, we get two different projections belonging to the same fractal - one in text form, the other in data form.

![](https://hsto.org/webt/tu/pa/wi/tupawikvb5r-6qgvysb4b0oyxi0.jpeg)

## Asynchrony & code splitting

![](https://hsto.org/webt/kw/29/cl/kw29cl0notoc0aduloiyoxyb4a4.jpeg)

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

## Examples

-   [Todos](https://fract.github.io/todos) - fractal-like realization of TodoMVC, [source](https://github.com/fract/fract.github.io/tree/master/src/todos)
-   [Loadable](https://fract.github.io/loadable) - an example showing the work of time projections, in the [source](https://github.com/fract/fract.github.io/tree/master/src/loadable) you can see how using `yield tmp(...)` the display of loaders is organized while loading in the background, I specifically added small delays there in order to slow down the processes
-   [Factors](https://fract.github.io/factors) - work in different conditions. One and the same fractal, depending on the factor set in the context, gives three different projections, and also maintains their relevance. Try editing the name and age, [source](https://github.com/fract/fract.github.io/tree/master/src/factors)
-   [Antistress](https://fract.github.io/antistress) - just a toy, click the balls, paint them in different colors and get cool pictures. In fact, this is a fractal that shows a circle inside itself, or three of the same fractals inscribed in the perimeter of the circle. Click - paint, long click - crush, long click in the center of the crushed circle - return to its original state. If you crush the circles to a sufficiently deep level, you can see the [Sierpinski triangle](https://en.wikipedia.org/wiki/Sierpi%C5%84ski_triangle), [source](https://github.com/fract/fract.github.io/tree/master/src/antistress)
