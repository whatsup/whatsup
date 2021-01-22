# Whats Up JSX Babel plugin

<div align="center">
<img src="https://img.shields.io/github/workflow/status/whatsup/babel-plugin-transform-jsx/Node.js%20CI/master" alt="GitHub Workflow Status (branch)" /> 
<img src="https://img.shields.io/codecov/c/github/whatsup/babel-plugin-transform-jsx" alt="codecov" />
<img src="https://img.shields.io/github/languages/top/whatsup/babel-plugin-transform-jsx" alt="language" />
<img src="https://img.shields.io/npm/l/@whatsup/babel-plugin-transform-jsx" alt="license" />  
</div>

This plugin transforms JSX code to WhatsUp compatible mutator factories. It is recommended to use this plugin for compiling JSX for WhatsUp apps.

## Install

```bash
npm i -D @whatsup/babel-plugin-transform-jsx
# or
yarn add -D @whatsup/babel-plugin-transform-jsx
```

## Usage

Add the plugin to your package.json and update the plugin section in your `.babelrc` file.

```json
{
    "plugins": ["@whatsup/transform-jsx"]
}
```
