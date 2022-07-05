# Typescript Plugin Css Compoentns

A TypeScript language service plugin providing support for [Whatsup CSS Componetns](https://github.com/whatsup/whatsup/tree/master/packages/webpack-loader-css-components)

## Install

```bash
npm i -D typescript-plugin-candy
```

Once installed, add this plugin to your `tsconfig.json`:

```json
{
    "compilerOptions": {
        "plugins": [{ "name": "@whatsup/typescript-plugin-css-components" }]
    }
}
```

Use workspace typescript version

![](https://habrastorage.org/webt/hn/zr/_k/hnzr_kimoimx66k_t_xxhkrkkkg.png)

## Features

Auto-support intellisense for `.css`, `.scss`, `.sass`, `.styl` modules

## Thanks

Brody McKee for [typescript-plugin-css-modules](https://github.com/mrmckeb/typescript-plugin-css-modules)
