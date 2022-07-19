/// <reference path="./@types/postcss-icss-selectors.d.ts" />

import { resolve, dirname } from 'path'
import { NodePath, PluginPass } from '@babel/core'
import {
    Node,
    isImportSpecifier,
    isImportDefaultSpecifier,
    variableDeclaration,
    importDeclaration,
    callExpression,
    identifier,
    variableDeclarator,
    ImportDeclaration,
    objectExpression,
    objectProperty,
    stringLiteral,
    importSpecifier,
} from '@babel/types'
import { compile } from 'sass'
import postcss from 'postcss'
import postcssIcssSelectors from 'postcss-icss-selectors'
import { generateScopedName } from './utils'
import { IS_TESTING } from './constants'

const processor = postcss(postcssIcssSelectors({ generateScopedName }))

export default function () {
    return {
        visitor: {
            ImportDeclaration(path: NodePath<ImportDeclaration>, pass: PluginPass) {
                const { source, specifiers } = path.node

                if (/\.(css|scss|sass)$/.test(source.value) && specifiers.length) {
                    const from = resolve(dirname(pass.file.opts.filename!), source.value)
                    const classnamesMap = getClassnamesMap(from)
                    const classnamesMapName = `styles_${generateUid()}`
                    const replacers = [
                        importDeclaration([], source),
                        importDeclaration(
                            [importSpecifier(identifier('createComponent'), identifier('createComponent'))],
                            stringLiteral('@whatsup/cssx')
                        ),
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
                    ] as Node[]

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
                                        callExpression(identifier('createComponent'), [
                                            stringLiteral(specifier.local.name.toLowerCase()),
                                            identifier(classnamesMapName),
                                        ])
                                    ),
                                ])
                            )
                        }
                    }

                    path.replaceWithMultiple(replacers as any)
                }
            },
        },
    }
}

const getClassnamesMap = (from: string): { [k: string]: string } => {
    const map = {} as { [k: string]: string }

    try {
        const { css } = compile(from, {})
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
