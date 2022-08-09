/// <reference path="./@types/index.d.ts" />

import JsxSyntax from '@babel/plugin-syntax-jsx'
import { addNamed } from '@babel/helper-module-imports'
import { Node, NodePath } from '@babel/core'
import {
    identifier,
    nullLiteral,
    stringLiteral,
    booleanLiteral,
    spreadElement,
    callExpression,
    arrayExpression,
    objectExpression,
    objectProperty,
    isJSXElement,
    isJSXFragment,
    isJSXText,
    isJSXSpreadChild,
    isJSXSpreadAttribute,
    isJSXExpressionContainer,
    isJSXEmptyExpression,
    isJSXMemberExpression,
    isJSXNamespacedName,
    JSXElement,
    JSXFragment,
    JSXExpressionContainer,
    JSXSpreadChild,
    JSXText,
    JSXAttribute,
    JSXSpreadAttribute,
    Expression,
    StringLiteral,
    SpreadElement,
    ObjectProperty,
    ArrayExpression,
    binaryExpression,
    Identifier,
    ObjectExpression,
    isSpreadElement,
    JSXIdentifier,
    JSXNamespacedName,
} from '@babel/types'
import { IS_TESTING, JSX_LIBRARY_NAME, FRAGMENT_COMPONENT_NAME, JSX_LIBRARY_FACTORIES, IS_SVG_REGEX } from './constants'

const VOID = identifier('undefined')

export default function () {
    return {
        inherits: JsxSyntax,
        visitor: {
            JSXElement(path: NodePath<JSXElement>) {
                const { node } = path
                const { openingElement, children } = node
                const { name, attributes } = openingElement

                if (isJSXNamespacedName(name)) {
                    throw new Error('Namespaced openingElement name is not supported')
                }

                if (isJSXMemberExpression(name)) {
                    throw new Error('OpeningElement name as member expression is not supported')
                }

                // Node from @babel/core & from @babel/types incompatible
                replaceJSXAstToMutatorFactoryCallExpression(path as any, name.name, attributes, children)
            },
            JSXFragment(path: NodePath<JSXFragment>) {
                const { node } = path
                const { children } = node

                // Node from @babel/core & from @babel/types incompatible
                replaceJSXAstToMutatorFactoryCallExpression(path as any, FRAGMENT_COMPONENT_NAME, [], children)
            },
        },
    }
}

function replaceJSXAstToMutatorFactoryCallExpression<T extends Node>(
    path: NodePath<T>,
    name: string,
    attributes: (JSXAttribute | JSXSpreadAttribute)[],
    children: (JSXElement | JSXText | JSXExpressionContainer | JSXSpreadChild | JSXFragment)[]
) {
    const factory = getFactory(name)
    const callee = createCalleeImport(path, factory)
    const type = createType(path, name)
    const { key, props, ref, onMount, onUnmount } = parseAttributes(attributes, parseChildren(children))
    const args = createCalleeArgs(type, key, props, ref, onMount, onUnmount)
    const expression = callExpression(callee, args)

    // Node from @babel/core & from @babel/types incompatible
    path.replaceWith(expression as any)
}

function createCalleeImport<T extends Node>(path: NodePath<T>, factory: string) {
    return createImport(path, JSX_LIBRARY_NAME, factory)
}

function createCalleeArgs(
    type: Identifier | StringLiteral,
    key: Expression | undefined,
    props: ObjectExpression | undefined,
    ref: Expression | undefined,
    onMount: Expression | undefined,
    onUnmount: Expression | undefined
): Expression[] {
    const salt = createSalt()
    const args = [type, key ? binaryExpression('+', salt, key) : salt, props, ref, onMount, onUnmount]

    let popping = true

    for (let i = args.length; i > 0; i--) {
        if (args[i - 1]) {
            popping = false
        } else if (popping) {
            args.pop()
        } else {
            args[i - 1] = VOID
        }
    }

    return args as Expression[]
}

function getFactory(name: string) {
    const { HTML, SVG, Component } = JSX_LIBRARY_FACTORIES
    return isComponent(name) ? Component : isSVG(name) ? SVG : HTML
}

function createFragmentImport<T extends Node>(path: NodePath<T>) {
    return createImport(path, JSX_LIBRARY_NAME, FRAGMENT_COMPONENT_NAME)
}

function createImport<T extends Node>(path: NodePath<T>, importSource: string, method: string) {
    return addNamed(path, method, importSource, { importedType: 'es6' })
}

function createType<T extends Node>(path: NodePath<T>, name: string) {
    if (isFragment(name)) {
        return createFragmentImport(path)
    }
    if (isComponent(name)) {
        return identifier(name)
    }

    return stringLiteral(name)
}

function createSalt() {
    return stringLiteral(generateUid() + '_')
}

function parseAttributes(
    attributes: (JSXAttribute | JSXSpreadAttribute)[],
    children?: Expression | ArrayExpression | undefined
) {
    let key: Expression | undefined = undefined
    let ref: Expression | undefined = undefined
    let onMount: Expression | undefined = undefined
    let onUnmount: Expression | undefined = undefined

    const members = [] as (SpreadElement | ObjectProperty)[]

    if (children) {
        const member = objectProperty(identifier('children'), children)

        members.push(member)
    }

    for (const attr of attributes) {
        if (isJSXSpreadAttribute(attr)) {
            const member = spreadElement(attr.argument)
            members.push(member)
            continue
        }

        const name = parseAttrName(attr.name)
        const value = parseAttrValue(attr.value)

        if (value !== undefined) {
            if (name === 'key') {
                key = value
            } else if (name === 'ref') {
                ref = value
            } else if (name === 'onMount') {
                onMount = value
            } else if (name === 'onUnmount') {
                onUnmount = value
            } else {
                const prop = isJSXNamespacedName(attr.name) ? stringLiteral(name) : identifier(name)
                const member = objectProperty(prop, value)

                members.push(member)
            }
        }
    }

    const props = members.length ? objectExpression(members) : undefined

    return { key, props, ref, onMount, onUnmount }
}

function parseAttrName(name: JSXIdentifier | JSXNamespacedName) {
    if (isJSXNamespacedName(name)) {
        return name.namespace.name + ':' + name.name.name
    }
    return name.name
}

function parseAttrValue(value: JSXElement | StringLiteral | JSXFragment | JSXExpressionContainer | null | undefined) {
    if (isJSXExpressionContainer(value)) {
        if (isJSXEmptyExpression(value.expression)) {
            // Uncoveraged. JSX attributes must only be assigned a non-empty expression
            return nullLiteral()
        }
        return value.expression
    }
    if (value === null) {
        return booleanLiteral(true)
    }
    return value
}

function parseChildren(
    children: (JSXText | JSXElement | JSXFragment | JSXExpressionContainer | JSXSpreadChild)[]
): Expression | ArrayExpression | undefined {
    const members = [] as (Expression | SpreadElement)[]
    const { length } = children

    for (let i = 0; i < length; i++) {
        const child = children[i]

        if (isJSXText(child)) {
            let value = child.value.replace(/ +/g, ' ').replace(/ ?\n ?/g, '\n')

            if (i === 0) {
                value = value.trimStart()
            }
            if (i === length - 1) {
                value = value.trimEnd()
            }
            if (value !== '' && value !== '\n') {
                members.push(stringLiteral(value.replace(/\n+/g, ' ')))
            }

            continue
        }

        if (isJSXElement(child) || isJSXFragment(child)) {
            members.push(child)
            continue
        }

        if (isJSXExpressionContainer(child) && !isJSXEmptyExpression(child.expression)) {
            members.push(child.expression)
            continue
        }

        if (isJSXSpreadChild(child)) {
            members.push(spreadElement(child.expression))
            continue
        }
    }

    if (!members.length) {
        return undefined
    }
    if (members.length === 1 && !isSpreadElement(members[0])) {
        return members[0]
    }

    return arrayExpression(members)
}

function generateUid() {
    return IS_TESTING ? 'UniqueId' : Math.random().toString(36).slice(-5)
}

function isComponent(name: string) {
    const firstLetter = name.charAt(0)
    return firstLetter.toUpperCase() === firstLetter
}

function isFragment(name: string) {
    return name === FRAGMENT_COMPONENT_NAME
}

function isSVG(name: string) {
    return IS_SVG_REGEX.test(name)
}
