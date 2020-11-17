# Fractal JSX Mutator and Renderer

<div align="center">
<img src="https://img.shields.io/travis/fract/jsx" alt="travis" />
<img src="https://img.shields.io/codecov/c/github/fract/jsx" alt="codecov" />
<img src="https://img.shields.io/github/languages/top/fract/jsx" alt="language" />
<img src="https://img.shields.io/npm/l/@fract/jsx" alt="license" />  
</div>

## Install

```bash
npm i @fract/jsx @fract/babel-plugin-transform-jsx
```

## Settings

Update the plugin section in your `.babelrc` file.

```json
{
    "plugins": ["@fract/transform-jsx"]
}
```

## Usage

```tsx
import { render } from '@fract/jsx'

const App = fractal(async function* () {
    while (true) {
        yield <div>Hello world</div>
    }
})

render(App, document.getElementById('app'))
```
