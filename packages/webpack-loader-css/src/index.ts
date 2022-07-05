import postcss from 'postcss'
import postcssImport from 'postcss-import'
import postcssUrl from 'postcss-url'
import postcssModules from 'postcss-modules'
import { htmlTags, htmlComponents } from './tags'
import { loadConfig } from './config'

export interface LoaderContext {
    mode: 'production' | 'development' | 'none'
    context: string
    resourcePath: string
    async(): (err: Error | null, content: string | Buffer, sourceMap?: any, meta?: any) => void
    addDependency(path: string): void
    addBuildDependency(path: string): void
    importModule(path: string): any
    utils: {
        contextify(ctx: string, path: string): string
        absolutify(ctx: string, path: string): string
    }
}

type PostcssUrlAsset = {
    absolutePath: string
    originUrl: string
}

export default async function loader(this: LoaderContext, source: string) {
    const { plugins, processOptions } = await loadConfig(this)

    const out = [`import { createComponent } from '@whatsup/webpack-loader-css/factory'`]

    const { css } = await postcss([
        postcssImport({
            // hack, used only for add dependency
            filter: (path) => {
                const absolutePath = this.utils.absolutify(this.context, path)

                this.addDependency(absolutePath)

                return true
            },
        }),
        postcssUrl({
            url: (async (asset: PostcssUrlAsset) => {
                try {
                    this.addDependency(asset.absolutePath)

                    const module = await this.importModule(asset.absolutePath)

                    return module.default
                } catch (e) {
                    return asset.originUrl
                }
            }) as any,
        }),
        postcssModules({
            getJSON: (_, json) => {
                out.push(`const styles = ${JSON.stringify(json)}`)

                for (let i = 0; i < htmlTags.length; i++) {
                    const tag = htmlTags[i]
                    const component = htmlComponents[i]

                    out.push(`export const ${component} = createComponent('${tag}', styles)`)
                }
            },
        }),
        ...plugins,
    ]).process(source, processOptions)

    out.push(`const result = []`)
    out.push(`result.push([module.id, \`${css}\`])`)
    out.push(`result.locals = styles`)
    out.push(`export default result`)

    return out.join('\n')
}
