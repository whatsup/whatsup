# Route stream for organizing routing in a Whats Up application

<div align="center">
<img src="https://img.shields.io/github/workflow/status/whatsup/route/Node.js%20CI/master" alt="GitHub Workflow Status (branch)" /> 
<img src="https://img.shields.io/codecov/c/github/whatsup/route" alt="codecov" />
<img src="https://img.shields.io/github/languages/top/whatsup/route" alt="language" />
<img src="https://img.shields.io/npm/l/@whatsup/route" alt="license" />  
</div>

## Install

```bash
npm i @whatsup/route

// or

yarn add @whatsup/route
```

## Usage

Using the whatsup route is very simple. See this example:

```tsx
import { fractal, Context, Cause } from 'whatsup'
import { render } from '@whatsup/jsx'
import { redirect } from '@whatsup/browser-pathname'
import { route } from '@whatsup/route'

const app = fractal(function* () {
    const aboutRoute = route('/about', aboutPage)
    // pattern must be string ↑↑↑↑↑↑ ↓↓↓↓↓↓ or RegExp
    const userRoute = route(/\/user([0-9]+)/, function* (ctx: Context, id: Cause<string>) {
        //               this match ^^^^^^ - will be available here  - ^^^^^^^^^^^^^^^^^^^^
        while (true) {
            yield (
                <div>
                    <p>This is info about user with id={yield* id}</p>
                    <a onClick={() => redirect('/about')}>Go to about page</a>
                </div>
            )
        }
    })

    while (true) {
        yield (
            <div>
                {yield* aboutRoute}
                {yield* userRoute}
            </div>
        )
    }
})

const aboutPage = fractal(function* () {
    while (true) {
        yield (
            <div>
                <p>About company info</p>
                <a onClick={() => redirect('/user25')}>Go to user page</a>
            </div>
        )
    }
})

render(app)
```

## Exact path

The whatsup route path is worked over regular expression. To have exact paths, insert the `$` at the end of the inserted string or regular expression. Here's an example:

```tsx
import { fractal, Context, Cause } from 'whatsup'
import { render } from '@whatsup/jsx'
import { redirect } from '@whatsup/browser-pathname'
import { route } from '@whatsup/route'

const app = fractal(function* () {
    const homeRoute = route('/$', homePage)
    const aboutRoute = route('/about$', aboutPage)

    while (true) {
        yield (
            <div>
                {yield* homeRoute}
                {yield* aboutRoute}
            </div>
        )
    }
})

const homePage = fractal(function* () {
    while (true) {
        yield (
            <div>
                <p>Home</p>
                <a onClick={() => redirect('/about')}>Go to about page</a>
            </div>
        )
    }
})

const aboutPage = fractal(function* () {
    while (true) {
        yield (
            <div>
                <p>About company info</p>
                <a onClick={() => redirect('/')}>Go to home page</a>
            </div>
        )
    }
})

render(app)
```
