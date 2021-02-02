# Whats Up Jsx mutator and renderer

<div align="center">
<img src="https://img.shields.io/github/workflow/status/whatsup/jsx/Node.js%20CI/master" alt="GitHub Workflow Status (branch)" />
<img src="https://img.shields.io/codecov/c/github/whatsup/jsx" alt="codecov" />
<img src="https://img.shields.io/github/languages/top/whatsup/jsx" alt="language" />
<img src="https://img.shields.io/npm/l/@whatsup/jsx" alt="license" />  
</div>

## Install

```bash
npm i @whatsup/jsx @whatsup/babel-plugin-transform-jsx
# or
yarn add @whatsup/jsx @whatsup/babel-plugin-transform-jsx
```

## Settings

Update the plugin section in your `.babelrc` file.

```json
{
    "plugins": ["@whatsup/transform-jsx"]
}
```

## Usage

```tsx
import { render } from '@whatsup/jsx'

const App = fractal(function* () {
    while (true) {
        yield <div>Hello world</div>
    }
})

render(App, document.getElementById('app'))
```
