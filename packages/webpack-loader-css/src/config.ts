import { cosmiconfig } from 'cosmiconfig'
import { ProcessOptions, PluginCreator, Plugin } from 'postcss'
import { LoaderContext } from './index'

type PluginsConfig = { [k: string]: boolean | PluginOptions } | (string | [string, PluginOptions])[]

type PluginOptions = {
    [k: string]: any
}

type Config = {
    plugins?: PluginsConfig
    processOptions?: ProcessOptions
}

const loadRawConfig = async (loaderContext: LoaderContext) => {
    const explorer = cosmiconfig('postcss')

    try {
        const found = await explorer.search()

        if (found === null || found.isEmpty) {
            throw 'Config is empty'
        }

        const { config, filepath } = found

        loaderContext.addBuildDependency(filepath)
        loaderContext.addDependency(filepath)

        if (typeof config === 'function') {
            const ctx = {
                env: loaderContext.mode,
                mode: loaderContext.mode,
                file: loaderContext.resourcePath,
                webpackLoaderContext: loaderContext,
                options: {},
            }

            return config(ctx) as Config
        }

        return config as Config
    } catch (e) {
        return {} as Config
    }
}

function* readPlugins(plugins: PluginsConfig): Generator<[string, PluginOptions], void, unknown> {
    if (Array.isArray(plugins)) {
        for (const item of plugins) {
            if (Array.isArray(item)) {
                const [plugin, options = {}] = item

                yield [plugin, options]
            } else {
                const plugin = item
                const options = {} as PluginOptions

                yield [plugin, options]
            }
        }
    } else {
        for (const [plugin, val] of Object.entries(plugins)) {
            if (!!val) {
                const options = typeof val === 'object' ? val : {}

                yield [plugin, options]
            }
        }
    }
}

const ignorePlugins = ['postcss-import', 'postcss-url', 'postcss-modules']

const preparePlugins = (plugins: PluginsConfig) => {
    const result = [] as Plugin[]

    for (const [plugin, options] of readPlugins(plugins)) {
        if (!ignorePlugins.includes(plugin)) {
            const module = require(plugin) as PluginCreator<PluginOptions>

            result.push(module(options) as Plugin)
        }
    }

    return result
}

const prepareProcessOptions = (options: ProcessOptions, loaderContext: LoaderContext) => {
    options.from = loaderContext.resourcePath
    options.to = undefined

    return options
}

export const loadConfig = async (loaderContext: LoaderContext) => {
    const raw = await loadRawConfig(loaderContext)
    const plugins = preparePlugins(raw.plugins || [])
    const processOptions = prepareProcessOptions(raw.processOptions || {}, loaderContext)

    return { plugins, processOptions }
}
