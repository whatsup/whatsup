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
    NullLiteral,
    StringLiteral,
    SpreadElement,
    ObjectProperty,
} from '@babel/types'
import { SVG_TAG_NAMES, JSX_LIBRARY_NAME, JSX_LIBRARY_FACTORIES, IS_TESTING } from './constants'

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

                replaceJSXAstToMutatorFactoryCallExpression(path, name.name, attributes, children)
            },
            JSXFragment(path: NodePath<JSXFragment>) {
                const { node } = path
                const { children } = node

                replaceJSXAstToMutatorFactoryCallExpression(path, 'Fragment', [], children)
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
    const callee = createCallee(path, factory)
    const type = createType(name)
    const uid = createUid()
    const { key, props } = parseAttributes(attributes)
    const childs = parseChildren(children)
    const expression = callExpression(callee, [type, uid, key, props, childs])

    path.replaceWith(expression)
}

function getFactory(name: string) {
    const { HTML, SVG, Component } = JSX_LIBRARY_FACTORIES
    return isComponent(name) ? Component : isSVG(name) ? SVG : HTML
}

function createCallee<T extends Node>(path: NodePath<T>, factory: string) {
    return createImport(path, JSX_LIBRARY_NAME, factory)
}

function createImport<T extends Node>(path: NodePath<T>, importSource: string, method: string) {
    return addNamed(path, method, importSource, { importedType: 'es6' })
}

function createType(name: string) {
    return isComponent(name) ? identifier(name) : stringLiteral(name)
}

function createUid() {
    return stringLiteral(generateUid())
}

function parseAttributes(attributes: (JSXAttribute | JSXSpreadAttribute)[]) {
    let key: Expression = VOID
    const members = [] as (SpreadElement | ObjectProperty)[]

    for (const attr of attributes) {
        if (isJSXSpreadAttribute(attr)) {
            const member = spreadElement(attr.argument)
            members.push(member)
            continue
        }

        if (isJSXNamespacedName(attr.name)) {
            throw new Error('Namespaced attribute name is not supported')
        }

        const { name } = attr.name
        const value = parseAttrValue(attr.value)

        if (name === 'key') {
            key = value
        } else {
            const prop = identifier(name)
            const member = objectProperty(prop, value)
            members.push(member)
        }
    }

    const props = members.length ? objectExpression(members) : VOID

    return { key, props }
}

function parseAttrValue(value: JSXElement | StringLiteral | JSXFragment | JSXExpressionContainer | null) {
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

function parseChildren(children: (JSXText | JSXElement | JSXFragment | JSXExpressionContainer | JSXSpreadChild)[]) {
    const members = [] as (NullLiteral | Expression | SpreadElement)[]

    for (const child of children) {
        if (isJSXText(child)) {
            const value = child.value.replace(/\s+/g, ' ').trim()

            if (value !== '') {
                members.push(stringLiteral(value))
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

    return members.length ? arrayExpression(members) : VOID
}

function generateUid() {
    return IS_TESTING ? 'UniqueId' : (~~(Math.random() * 1e8)).toString(16)
}

function isComponent(name: string) {
    const firstLetter = name.charAt(0)
    return firstLetter.toUpperCase() === firstLetter
}

function isSVG(name: string) {
    return SVG_TAG_NAMES.some((tagName) => name === tagName)
}
