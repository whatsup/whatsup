# Whats Up JSX Babel plugin

<div align="center">
<img src="https://img.shields.io/travis/whatsup/babel-plugin-transform-jsx" alt="travis" />
<img src="https://img.shields.io/codecov/c/github/whatsup/babel-plugin-transform-jsx" alt="codecov" />
<img src="https://img.shields.io/github/languages/top/whatsup/babel-plugin-transform-jsx" alt="language" />
<img src="https://img.shields.io/npm/l/@whatsup-js/babel-plugin-transform-jsx" alt="license" />  
</div>

This plugin transforms JSX code to whatsup compatible mutator factories. It is recommended to use this plugin for compiling JSX for WhatsUp apps.

## Install

```bash
npm i -D @whatsup-js/babel-plugin-transform-jsx
```

## Usage

Add the plugin to your package.json and update the plugin section in your `.babelrc` file.

```json
{
    "plugins": ["@whatsup-js/transform-jsx"]
}
```