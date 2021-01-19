# Route stream for organizing routing in a Whats Up application

<div align="center">
<img src="https://img.shields.io/travis/whatsup/route" alt="travis" />
<img src="https://img.shields.io/codecov/c/github/whatsup/route" alt="codecov" />
<img src="https://img.shields.io/github/languages/top/whatsup/route" alt="language" />
<img src="https://img.shields.io/npm/l/@whatsup/route" alt="license" />  
</div>

## Install

```bash
npm i @whatsup/route
```

## Usage

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
