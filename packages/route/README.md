# Route stream for organize routing in fractal app

<div align="center">
<img src="https://img.shields.io/travis/fract/route" alt="travis" />
<img src="https://img.shields.io/codecov/c/github/fract/route" alt="codecov" />
<img src="https://img.shields.io/github/languages/top/fract/route" alt="language" />
<img src="https://img.shields.io/npm/l/@fract/route" alt="license" />  
</div>

## Install

```bash
npm i @fract/route
```

## Usage

```tsx
import { fractal } from '@fract/core'
import { render } from '@fract/jsx'
import { redirect } from '@fract/browser-pathname'
import { route } from '@fract/route'

const app = fractal(function* () {
    const aboutRoute = route(/\/about/, aboutPage)
    const userRoute = route(/\/user([0-9]+)/, function* (ctx: Context, id: Computed<string>) {
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
                <a onClick={() => redirect('/user25')}>Go to used page</a>
            </div>
        )
    }
})

render(app)
```
