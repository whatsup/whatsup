/// <reference path="./@types/index.d.ts" />

import { resolve, dirname } from 'path'
import { Node, NodePath, PluginPass } from '@babel/core'
import {
    isImportSpecifier,
    isImportDefaultSpecifier,
    variableDeclaration,
    callExpression,
    identifier,
    variableDeclarator,
    ImportDeclaration,
    objectExpression,
    objectProperty,
    stringLiteral,
} from '@babel/types'
import { compile } from 'sass'
import postcss from 'postcss'
import postcssIcssSelectors from 'postcss-icss-selectors'
import { addNamed, addSideEffect } from '@babel/helper-module-imports'
import { generateScopedName } from './utils'
import { IS_TESTING, JSX_FACTORY_NAME, JSX_LIBRARY_NAME } from './constants'

const processor = postcss(postcssIcssSelectors({ generateScopedName }))

export default function () {
    return {
        visitor: {
            ImportDeclaration(path: NodePath<ImportDeclaration>, pass: PluginPass) {
                const { source, specifiers } = path.node

                if (/\.(css|scss|sass)$/.test(source.value) && specifiers.length) {
                    // Node from @babel/core & from @babel/types incompatible
                    createStyleImport(path as any, source.value)

                    // Node from @babel/core & from @babel/types incompatible
                    const factory = createFactoryImport(path as any)
                    const from = resolve(dirname(pass.file.opts.filename!), source.value)
                    const classnamesMap = getClassnamesMap(from)
                    const classnamesMapName = `styles_${generateUid()}`
                    const replacers = [
                        variableDeclaration('const', [
                            variableDeclarator(
                                identifier(classnamesMapName),
                                objectExpression(
                                    Object.keys(classnamesMap).map((classname) =>
                                        objectProperty(
                                            stringLiteral(classname),
                                            stringLiteral(classnamesMap[classname])
                                        )
                                    )
                                )
                            ),
                        ]),
                    ] //as any as Node[]

                    for (const specifier of specifiers) {
                        if (isImportDefaultSpecifier(specifier)) {
                            replacers.push(
                                variableDeclaration('const', [
                                    variableDeclarator(identifier(specifier.local.name), identifier(classnamesMapName)),
                                ])
                            )
                        }
                        if (isImportSpecifier(specifier)) {
                            replacers.push(
                                variableDeclaration('const', [
                                    variableDeclarator(
                                        identifier(specifier.local.name),
                                        callExpression(factory, [
                                            stringLiteral(specifier.local.name.toLowerCase()),
                                            identifier(classnamesMapName),
                                        ])
                                    ),
                                ])
                            )
                        }
                    }

                    // Node from @babel/core & from @babel/types incompatible
                    path.replaceWithMultiple(replacers as any)
                }
            },
        },
    }
}

const createStyleImport = <T extends Node>(path: NodePath<T>, importSource: string) => {
    return addSideEffect(path, importSource, { importedType: 'es6' })
}

const createFactoryImport = <T extends Node>(path: NodePath<T>) => {
    return addNamed(path, JSX_FACTORY_NAME, JSX_LIBRARY_NAME, { importedType: 'es6' })
}

const getClassnamesMap = (from: string): { [k: string]: string } => {
    const map = {} as { [k: string]: string }

    try {
        const { css } = compile(from)
        const compiled = processor.process(css, { from })

        for (const { name, value } of compiled.messages) {
            map[name] = value
        }
    } catch (e) {
        console.log(e)
    }

    return map
}

function generateUid() {
    return IS_TESTING ? 'UniqueId' : (~~(Math.random() * 1e8)).toString(16)
}
