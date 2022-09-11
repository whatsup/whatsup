import { EMPTY_OBJ, NON_DIMENSIONAL_STYLE_PROP, SVG_DASHED_PROPS } from './constants'
import { WhatsJSX } from './types'

export interface Props {
    [k: string]: any
}

export const placeNodes = (container: HTMLElement | SVGElement, nodes: Iterable<HTMLElement | SVGElement | Text>) => {
    const { childNodes } = container

    let i = 0

    for (const node of nodes as Iterable<Node>) {
        if (childNodes[i] !== node) {
            if (node.parentNode === container) {
                // swap nodes
                container.insertBefore(childNodes[i], node)
            }

            container.insertBefore(node, childNodes[i])
        }

        i++
    }
}

export const removeNodes = (nodes: Iterable<HTMLElement | SVGElement | Text>) => {
    for (const node of nodes) {
        node.remove()
    }
}

export const mutateAttrs = <T extends Props>(node: HTMLElement | SVGElement, prev: T, next: T, isSvg: boolean) => {
    for (const attr in prev) {
        if (!(attr in next)) {
            mutateAttr(node, attr, prev[attr], undefined, isSvg)
        }
    }

    for (const attr in next) {
        if (next[attr] !== prev[attr]) {
            mutateAttr(node, attr, prev[attr], next[attr], isSvg)
        }
    }
}

const mutateAttr = <T extends Props, K extends keyof T & string>(
    node: HTMLElement | SVGElement,
    attr: K,
    prevValue: T[K] | undefined,
    nextValue: T[K] | undefined,
    isSvg: boolean
) => {
    if (isSvg) {
        // Normalize incorrect prop usage for SVG
        // Thanks preact team
        attr = (attr as string).replace(/xlink[H:h]/, 'h').replace(/sName$/, 's') as K

        if (SVG_DASHED_PROPS.test(attr)) {
            attr = attr.replace(/([A-Z0-9])/g, '-$&').toLowerCase() as K
        }
    }

    switch (true) {
        case isIgnorableProp(attr):
            break
        case isEventListener(attr):
            mutateEventListener(node, attr, prevValue, nextValue)
            break
        case isStyleProp(attr):
            mutateStyle(node, prevValue, nextValue)
            break
        case isReadonlyProp(attr) || isSvg:
            mutateThroughAttributeApi(node, attr, nextValue)
            break
        default:
            mutateThroughAssignWay(node, attr, nextValue)
            break
    }
}

const mutateEventListener = <T extends Props, K extends keyof T & string>(
    node: HTMLElement | SVGElement,
    prop: K,
    prevListener: T[K] | undefined,
    nextListener: T[K] | undefined
) => {
    const capture = isEventCaptureListener(prop)
    const event = getEventName(prop, capture)

    if (typeof prevListener === 'function') {
        node.removeEventListener(event, prevListener, capture)
    }

    if (typeof nextListener === 'function') {
        node.addEventListener(event, nextListener, capture)
    }
}

const mutateStyle = <T extends Partial<WhatsJSX.CSSProperties>>(
    node: HTMLElement | SVGElement,
    prevValue: T = EMPTY_OBJ as T,
    nextValue: T = EMPTY_OBJ as T
) => {
    for (const prop in prevValue) {
        if (!(prop in nextValue)) {
            mutateStyleProp<T, keyof T & string>(node.style, prop, '' as any)
        }
    }

    for (const prop in nextValue) {
        if (nextValue[prop] !== prevValue[prop]) {
            mutateStyleProp<T, keyof T & string>(node.style, prop, nextValue[prop])
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

const mutateThroughAttributeApi = <T extends HTMLElement | SVGElement>(
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

const mutateThroughAssignWay = <T extends HTMLElement | SVGElement>(
    node: T,
    prop: keyof Props,
    value: Props[keyof Props]
) => {
    node[prop as keyof T] = value == null ? '' : value
}

const getEventName = (prop: string, capture: boolean) => {
    return prop.slice(2, capture ? -7 : Infinity).toLowerCase()
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

export const createMountObserver = <T extends HTMLElement | SVGElement | Text>(
    target: T,
    callback: (el: T) => void
) => {
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

export const createUnmountObserver = <T extends HTMLElement | SVGElement | Text>(
    target: T,
    callback: (el: T) => void
) => {
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
