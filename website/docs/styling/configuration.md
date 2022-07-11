---
sidebar_position: 2
---

# Configuration

### Autoprefixer, Source maps i.e....

Whatsup style-system is based on `postcss`, so you can use the standard config file for further customization.

```js
// .postcssrc.js

module.exports = {
    plugins: {
        autoprefixer: isProduction,
    },
    processOptions: {
        map: isDevelopment,
    },
}
```

### Preprocessors

Whatsup application based on webpack. So you can use any preprocessor as `sass`, `scss`, `less`. Just add the appropriate loader to the webpack config file.

```js
module.exports = {
    module: {
        rules: [
            {
                test: /\.(css|scss|sass)$/i,
                use: [
                    'style-loader',
                    '@whatsup/webpack-loader-css-components',
                    'sass-loader',
                ],
            },
        ],
    },
}
```
