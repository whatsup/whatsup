# Fractal JSX Babel plugin

<div align="center">
<img src="https://img.shields.io/travis/fract/babel-plugin-transform-jsx" alt="travis" />
<img src="https://img.shields.io/codecov/c/github/fract/babel-plugin-transform-jsx" alt="codecov" />
<img src="https://img.shields.io/bundlephobia/min/@fract/babel-plugin-transform-jsx" alt="size" />
<img src="https://img.shields.io/github/languages/top/fract/babel-plugin-transform-jsx" alt="language" />
<img src="https://img.shields.io/npm/l/@fract/babel-plugin-transform-jsx" alt="npm" />  
</div>

This plugin transforms JSX code to Fractal compatible mutator factories. It is recommended to use this plugin for compiling JSX for Fractal apps.

## Install

```bash
npm i -D @fract/babel-plugin-transform-jsx
```

## Usage

Add the plugin to your package.json and update the plugin section in your `.babelrc` file.

```json
{
    "plugins": ["@fract/transform-jsx"]
}
```
