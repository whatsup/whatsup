const path = require('path')
const isDev = process.env.NODE_ENV === 'development'
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    entry: './src/bundle.tsx',

    output: {
        path: path.resolve('./dist'),
        filename: 'bundle.js',
        chunkFilename: 'chunk.[chunkhash].js',
        publicPath: '/',
    },

    devtool: isDev ? 'inline-source-map' : 'source-map',

    mode: process.env.NODE_ENV,

    resolve: {
        modules: [path.resolve('./src'), path.resolve('node_modules')],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },

    resolveLoader: {
        modules: [path.resolve('node_modules')],
    },

    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            inject: 'body',
            title: '<% projectName %>',
            hash: true,
            cache: true,
        }),
    ],

    module: {
        rules: [
            {
                test: /\.(js|jsx|ts|tsx)?$/,
                use: 'babel-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(jpg|jpeg|png|svg)$/,
                type: 'asset/resource',
            },
            {
                test: /\.(css|scss|sass)$/i,
                use: ['style-loader', '@whatsup/webpack-loader-css-components'],
            },
        ],
    },

    devServer: {
        port: 3000,
        historyApiFallback: true,
        headers: { 'Access-Control-Allow-Origin': '*' },
        hot: true,
        open: true,
    },
}
