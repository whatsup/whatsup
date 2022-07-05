import tss from 'typescript/lib/tsserverlibrary'
import path from 'path'
import postcss from 'postcss'
import postcssImportSync from 'postcss-import-sync2'
import postcssIcssSelectors from 'postcss-icss-selectors'
import { getDtsSnapshot, isStyle, isRelative } from './utils'

function init({ typescript: ts }: { typescript: typeof tss }): ts.server.PluginModule {
    const create = (info: ts.server.PluginCreateInfo) => {
        // prettier-ignore
        const processor = postcss()
            .use(postcssImportSync())
            .use(postcssIcssSelectors())

        const { createLanguageServiceSourceFile } = ts

        ts.createLanguageServiceSourceFile = (fileName, scriptSnapshot, ...rest): ts.SourceFile => {
            if (isStyle(fileName)) {
                scriptSnapshot = getDtsSnapshot(ts, scriptSnapshot, fileName, processor)
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
                scriptSnapshot = getDtsSnapshot(ts, scriptSnapshot, fileName, processor)
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

export = init
