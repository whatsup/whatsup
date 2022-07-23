import tss from 'typescript/lib/tsserverlibrary'
import path from 'path'
import postcss from 'postcss'
import postcssIcssSelectors from 'postcss-icss-selectors'
import { htmlTags, htmlComponents } from './tags'
import sass from 'sass'

const SIGN = '// cssx'

const processor = postcss(postcssIcssSelectors())

const isStyle = (fileName: string) => /\.(css|scss|sass)$/.test(fileName)

const isRelative = (fileName: string) => /^\.\.?($|[\\/])/.test(fileName)

function init({ typescript: ts }: { typescript: typeof tss }): ts.server.PluginModule {
    const create = (info: ts.server.PluginCreateInfo) => {
        // prettier-ignore

        const { createLanguageServiceSourceFile } = ts

        ts.createLanguageServiceSourceFile = (fileName, scriptSnapshot, ...rest): ts.SourceFile => {
            if (isStyle(fileName)) {
                scriptSnapshot = createDtsSnapshot(ts, scriptSnapshot, fileName)
            }

            const sourceFile = createLanguageServiceSourceFile(fileName, scriptSnapshot, ...rest)

            if (isStyle(fileName)) {
                sourceFile.isDeclarationFile = true
            }

            return sourceFile
        }

        const { updateLanguageServiceSourceFile } = ts

        ts.updateLanguageServiceSourceFile = (sourceFile, scriptSnapshot, ...rest): ts.SourceFile => {
            const { fileName } = sourceFile

            if (isStyle(fileName)) {
                scriptSnapshot = createDtsSnapshot(ts, scriptSnapshot, fileName)
            }

            sourceFile = updateLanguageServiceSourceFile(sourceFile, scriptSnapshot, ...rest)

            if (isStyle(fileName)) {
                sourceFile.isDeclarationFile = true
            }

            return sourceFile
        }

        if (info.languageServiceHost.resolveModuleNames) {
            const { resolveModuleNames } = info.languageServiceHost

            info.languageServiceHost.resolveModuleNames = (moduleNames, containingFile, ...rest) => {
                const resolvedModules = resolveModuleNames.call(
                    info.languageServiceHost,
                    moduleNames,
                    containingFile,
                    ...rest
                )

                return moduleNames.map((moduleName, index) => {
                    if (isStyle(moduleName) && isRelative(moduleName)) {
                        const fileName = path.resolve(path.dirname(containingFile), moduleName)

                        return {
                            extension: ts.Extension.Dts,
                            isExternalLibraryImport: false,
                            resolvedFileName: fileName,
                        }
                    } else {
                        return resolvedModules[index]
                    }
                })
            }
        }

        return info.languageService
    }

    const getExternalFiles = (project: ts.server.ConfiguredProject) => {
        return project.getFileNames().filter((name) => isStyle(name))
    }

    return { create, getExternalFiles }
}

const createDtsSnapshot = (ts: typeof tss, scriptSnapshot: ts.IScriptSnapshot, fileName: string) => {
    const source = scriptSnapshot.getText(0, scriptSnapshot.getLength())

    if (source.startsWith(SIGN)) {
        return scriptSnapshot
    }

    const classnames = getClassnames(fileName)
    const dts = [] as string[]

    dts.push(SIGN)
    dts.push(`type Props = {`)
    dts.push('[k: `css:$${string}`]: string | number')

    if (classnames.length) {
        for (const classname of classnames) {
            dts.push(`"css:${classname}"?: boolean`)
        }
    } else {
        dts.push(`[k: string]?: any`)
    }

    dts.push(`}`)
    dts.push(
        `type Component<T extends keyof JSX.IntrinsicElements> = (props: JSX.IntrinsicElements[T] & Props) => JSX.Element`
    )

    for (let i = 0; i < htmlTags.length; i++) {
        const tag = htmlTags[i]
        const component = htmlComponents[i]

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

const getClassnames = (from: string) => {
    const classnames = [] as string[]

    try {
        const { css } = sass.compile(from)
        const compiled = processor.process(css, { from })

        for (const { name, value } of compiled.messages) {
            classnames.push(name)
        }
    } catch (e) {
        console.log(e)
    }

    return classnames
}

export = init
