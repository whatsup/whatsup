# Whats Up Jsx mutator and renderer

<div align="center">
<img src="https://img.shields.io/travis/whatsup/jsx" alt="travis" />
<img src="https://img.shields.io/codecov/c/github/whatsup/jsx" alt="codecov" />
<img src="https://img.shields.io/github/languages/top/whatsup/jsx" alt="language" />
<img src="https://img.shields.io/npm/l/@whatsup-js/jsx" alt="license" />  
</div>

## Install

```bash
npm i @whatsup-js/jsx @whatsup-js/babel-plugin-transform-jsx
```

## Settings

Update the plugin section in your `.babelrc` file.

```json
{
    "plugins": ["@whatsup-js/transform-jsx"]
}
```

## Usage

```tsx
import { render } from '@whatsup-js/jsx'

const App = fractal(async function* () {
    while (true) {
        yield <div>Hello world</div>
    }
})

render(App, document.getElementById('app'))
```
