import tss from 'typescript/lib/tsserverlibrary'
import { Processor } from 'postcss'
import { extractICSS } from 'icss-utils'
import { tags, components } from './tags'
import sass from 'sass'
import stylus from 'stylus'
import less from 'less'

const CANDY_SIGN = '// Candy'

export const isCss = (fileName: string) => fileName.endsWith('.css')

export const isSass = (fileName: string) => fileName.endsWith('.scss') || fileName.endsWith('.sass')

export const isLess = (fileName: string) => fileName.endsWith('.less')

export const isStyl = (fileName: string) => fileName.endsWith('.styl')

export const isStyle = (fileName: string) => isCss(fileName) || isSass(fileName) || isLess(fileName) || isStyl(fileName)

export const isRelative = (fileName: string) => /^\.\.?($|[\\/])/.test(fileName)

export const getDtsSnapshot = (
    ts: typeof tss,
    scriptSnapshot: ts.IScriptSnapshot,
    fileName: string,
    processor: Processor
) => {
    const source = scriptSnapshot.getText(0, scriptSnapshot.getLength())

    if (source.startsWith(CANDY_SIGN)) {
        return scriptSnapshot
    }

    const css = transformSourceToCss(fileName, source)
    const classnames = getClassnames(fileName, css, processor)
    const dts = [] as string[]

    dts.push(CANDY_SIGN)
    dts.push(`import type { ComponentProps } from 'react'`)
    dts.push(`type Props = {`)
    dts.push('[k: `__${string}`]: string | number')

    if (classnames.length) {
        for (const classname of classnames) {
            dts.push(`${classname}?: boolean`)
        }
    } else {
        dts.push(`[k: string]?: any`)
    }

    dts.push(`}`)
    dts.push(
        `type Component<T extends keyof JSX.IntrinsicElements> = (props: ComponentProps<T> & Props) => JSX.IntrinsicElements<T>`
    )

    for (let i = 0; i < tags.length; i++) {
        const tag = tags[i]
        const component = components[i]

        dts.push(`export const ${component}: Component<'${tag}'>`)
    }

    dts.push(`declare const styles: {`)

    for (const classname of classnames) {
        dts.push(`${classname}: string`)
    }

    dts.push(`}`)

    dts.push(`export default styles`)

    return ts.ScriptSnapshot.fromString(dts.join(`\n`))
}

const transformSourceToCss = (fileName: string, source: string) => {
    if (isSass(fileName)) {
        const { css } = sass.compile(fileName)

        return css
    }
    if (isLess(fileName)) {
        let css: string

        less.render(
            source,
            {
                syncImport: true,
                filename: fileName,
            },
            (error, output) => {
                if (error) throw error

                css = output ? output.css.toString() : ''
            }
        )

        return css!
    }
    if (isStyl(fileName)) {
        const css = stylus(source, {
            filename: fileName,
        }).render()

        return css
    }
    if (isCss(fileName)) {
        return source
    }

    throw new Error('Unkown file type')
}

const getClassnames = (fileName: string, css: string, processor: Processor): string[] => {
    const compiled = processor.process(css, {
        from: fileName,
    })

    if (compiled.root) {
        const extracted = extractICSS(compiled.root)

        return Object.keys(extracted.icssExports)
    }

    return []
}
