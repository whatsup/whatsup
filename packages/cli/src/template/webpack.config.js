const path = require('path')
const { merge } = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const {
    getCssLoaderOptions,
} = require('@whatsup/babel-plugin-transform-cssx/compat')

const common = {
    entry: './src/bundle.tsx',
    output: {
        path: path.resolve('./dist'),
        filename: 'bundle.js',
        chunkFilename: 'chunk.[chunkhash].js',
        publicPath: '/',
    },
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
            title: 'examples',
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
        ],
    },
}

const development = {
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.(css|scss|sass)$/i,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: getCssLoaderOptions(),
                    },
                    'sass-loader',
                ],
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

const production = {
    devtool: 'source-map',
    plugins: [new MiniCssExtractPlugin()],
    module: {
        rules: [
            {
                test: /\.(css|scss|sass)$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: getCssLoaderOptions(),
                    },
                    'sass-loader',
                ],
            },
        ],
    },
}

module.exports = (_, args) => {
    switch (args.mode) {
        case 'development':
            return merge(common, development)
        case 'production':
            return merge(common, production)
        default:
            throw new Error('No matching webpack configuration was found!')
    }
}
