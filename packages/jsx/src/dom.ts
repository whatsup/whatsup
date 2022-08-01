import { EMPTY_OBJ, NON_DIMENSIONAL_STYLE_PROP, SVG_NAMESPACE, SVG_DASHED_PROPS } from './constants'
import { WhatsJSX } from './types'

export interface Props {
    [k: string]: any
}

export const placeNodes = (
    container: HTMLElement | SVGElement,
    nodes: HTMLElement | SVGElement | Text | (HTMLElement | SVGElement | Text)[]
) => {
    const { childNodes } = container

    if (Array.isArray(nodes)) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i]

            if (childNodes[i] !== node) {
                if (node.parentNode === container) {
                    // swap nodes
                    container.insertBefore(childNodes[i], node)
                }

                container.insertBefore(node, childNodes[i])
            }
        }
    } else {
        container.insertBefore(nodes, childNodes[0])
    }
}

export const removeNodes = (nodes: Iterable<Text | Element>) => {
    for (const node of nodes) {
        node.remove()
    }
}

export const mutateProps = <T extends Props>(node: HTMLElement | SVGElement, props: T, oldProps: T) => {
    for (const prop in oldProps) {
        if (!(prop in props)) {
            mutateProp(node, prop, undefined, oldProps[prop])
        }
    }

    for (const prop in props) {
        if (props[prop] !== oldProps[prop]) {
            mutateProp(node, prop, props[prop], oldProps[prop])
        }
    }
}

const mutateProp = <T extends Props, K extends keyof T & string>(
    node: HTMLElement | SVGElement,
    prop: K,
    value: T[K] | undefined,
    oldValue: T[K] | undefined
) => {
    if (isSVG(node)) {
        // Normalize incorrect prop usage for SVG
        // Thanks preact team
        prop = (prop as string).replace(/xlink[H:h]/, 'h').replace(/sName$/, 's') as K

        if (SVG_DASHED_PROPS.test(prop)) {
            prop = prop.replace(/([A-Z0-9])/g, '-$&').toLowerCase() as K
        }
    }

    switch (true) {
        case isIgnorableProp(prop):
            break
        case isEventListener(prop):
            mutateEventListener(node, prop, value, oldValue)
            break
        case isStyleProp(prop):
            mutateStyle(node, value, oldValue)
            break
        case isReadonlyProp(prop) || isSVG(node):
            mutatePropThroughAttributeApi(node, prop, value)
            break
        default:
            mutatePropThroughUsualWay(node, prop, value)
            break
    }
}

const mutateEventListener = <T extends Props, K extends keyof T & string>(
    node: HTMLElement | SVGElement,
    prop: K,
    listener: T[K] | undefined,
    oldListener: T[K] | undefined
) => {
    const capture = isEventCaptureListener(prop)
    const event = getEventName(prop, capture)

    if (typeof oldListener === 'function') {
        node.removeEventListener(event, oldListener, capture)
    }
    if (typeof listener === 'function') {
        node.addEventListener(event, listener, capture)
    }
}

const mutateStyle = <T extends Partial<WhatsJSX.CSSProperties>>(
    node: HTMLElement | SVGElement,
    value: CSSStyleDeclaration | T = EMPTY_OBJ as T,
    oldValue: T = EMPTY_OBJ as T
) => {
    if (value instanceof CSSStyleDeclaration) {
        node.style.cssText = value.cssText
    } else {
        for (const prop in oldValue) {
            if (!(prop in value)) {
                mutateStyleProp<T, keyof T & string>(node.style, prop, '' as any)
            }
        }

        for (const prop in value) {
            if (value[prop] !== oldValue[prop]) {
                mutateStyleProp<T, keyof T & string>(node.style, prop, value[prop])
            }
        }
    }
}

const mutateStyleProp = <T extends Partial<WhatsJSX.CSSProperties>, K extends keyof T & string>(
    style: CSSStyleDeclaration,
    prop: K,
    value: T[K]
) => {
    if (typeof value !== 'number' || NON_DIMENSIONAL_STYLE_PROP.test(prop)) {
        if (prop.startsWith('--')) {
            style.setProperty(prop, value as unknown as string)
        } else {
            style[prop as any] = value as unknown as string
        }
    } else {
        style[prop as any] = value + 'px'
    }
}

const mutatePropThroughAttributeApi = <T extends HTMLElement | SVGElement>(
    node: T,
    prop: keyof Props & string,
    value: Props[keyof Props]
) => {
    if (value == null) {
        node.removeAttribute(prop)
    } else {
        node.setAttribute(prop, value)
    }
}

const mutatePropThroughUsualWay = <T extends HTMLElement | SVGElement>(
    node: T,
    prop: keyof Props,
    value: Props[keyof Props]
) => {
    node[prop as keyof T] = value == null ? '' : value
}

const getEventName = (prop: string, capture: boolean) => {
    return prop.slice(2, capture ? -7 : Infinity).toLowerCase()
}

const isSVG = (node: HTMLElement | SVGElement) => {
    return node.namespaceURI === SVG_NAMESPACE
}

const isEventListener = (prop: string) => {
    return prop.startsWith('on')
}

const isEventCaptureListener = (prop: string) => {
    return (prop as string).endsWith('Capture')
}

const isStyleProp = (prop: string) => {
    return prop === 'style'
}

const isIgnorableProp = (prop: string) => {
    return prop === 'key' || prop === 'ref' || prop === 'children' || prop === 'onMount' || prop === 'onUnmount'
}

const isReadonlyProp = (prop: string) => {
    return (
        prop === 'list' ||
        prop === 'form' ||
        prop === 'type' ||
        prop === 'size' ||
        prop === 'download' ||
        prop === 'href'
    )
}

export const createMountObserver = <T extends Element | Text>(target: T, callback: (el: T) => void) => {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node === target || node.contains(target)) {
                    callback(target)
                    observer.disconnect()
                    return
                }
            }
        }
    })

    observer.observe(document, {
        childList: true,
        subtree: true,
    })

    return observer
}

export const createUnmountObserver = <T extends Element | Text>(target: T, callback: (el: T) => void) => {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.removedNodes) {
                if (node === target || node.contains(target)) {
                    callback(target)
                    observer.disconnect()
                    return
                }
            }
        }
    })

    observer.observe(document, {
        childList: true,
        subtree: true,
    })

    return observer
}
