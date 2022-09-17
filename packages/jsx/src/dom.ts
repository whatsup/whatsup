import { extractAtomicValue } from './utils'
import { NON_DIMENSIONAL_STYLE_PROP, SVG_DASHED_PROPS } from './constants'
import { WhatsJSX } from './types'
import { Props } from './vnode'

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

/*
function* keys<T extends { [k: string]: any }>(obj: T) {
    for (const key of obj) {
        yield key
    }
}

function syncRemoveOldAndUpdateProps<T extends Props>(prev: T, next: T) {
    const prevIterator = keys(prev)
    const nextIterator = keys(next)

    while (true) {
        const { done: isPrevDone, value: prevKey } = prevIterator.next()
        const { done: isNextDone, value: nextKey } = nextIterator.next()

        if (!(prevKey in next)) {
            // remove prop
        }

        if (prev[prevKey] !== next[nextKey]) {
            // update prop
        }

        if (isPrevDone && isNextDone) {
            break
        }
    }
}
*/

export const mutateProps = <T extends Props>(
    node: HTMLElement | SVGElement,
    prev: T | undefined,
    next: T,
    isSvg: boolean
) => {
    if (prev) {
        for (const prop in prev) {
            if (!(prop in next)) {
                mutateProp(node, prop, prev[prop], undefined, isSvg)
                delete prev[prop]
            }
        }
    }

    for (const prop in next) {
        if (isChildrenProp(prop)) {
            continue
        }

        if (!prev) {
            prev = {} as T
        }

        const nextValue = extractAtomicValue(next[prop])

        if (isStyleProp(prop)) {
            if (!prev.style) {
                prev.style = {}
            }

            mutateStyle(node, prev.style, nextValue)
            continue
        }

        const prevValue = prev[prop]

        if (prevValue !== nextValue) {
            mutateProp(node, prop, prevValue, nextValue, isSvg)

            prev[prop] = nextValue
        }
    }

    return prev
}

const mutateProp = <T extends Props, K extends keyof T & string>(
    node: HTMLElement | SVGElement,
    prop: K,
    prevValue: T[K] | undefined,
    nextValue: T[K] | undefined,
    isSvg: boolean
) => {
    if (isSvg) {
        // Normalize incorrect prop usage for SVG
        // Thanks preact team
        prop = (prop as string).replace(/xlink[H:h]/, 'h').replace(/sName$/, 's') as K

        if (SVG_DASHED_PROPS.test(prop)) {
            prop = prop.replace(/([A-Z0-9])/g, '-$&').toLowerCase() as K
        }
    }

    if (isEventListener(prop)) {
        mutateEventListener(node, prop, prevValue, nextValue)
        return
    }

    if (isReadonlyProp(prop) || isSvg) {
        mutateThroughAttributeApi(node, prop, nextValue)
        return
    }

    mutateThroughAssignWay(node, prop, nextValue)
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

const mutateStyle = <T extends WhatsJSX.CSSProperties>(node: HTMLElement | SVGElement, prev: T, next: T) => {
    for (const prop in prev) {
        if (!(prop in next)) {
            mutateStyleProp<T, keyof T & string>(node.style, prop, '' as any)
            delete prev[prop]
        }
    }

    for (const prop in next) {
        const prevValue = prev[prop]
        const nextValue = extractAtomicValue(next[prop])

        if (prevValue !== nextValue) {
            mutateStyleProp<T, keyof T & string>(node.style, prop, nextValue)

            prev[prop] = nextValue
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

const isChildrenProp = (prop: string) => {
    return prop === 'children'
}

const isStyleProp = (prop: string) => {
    return prop === 'style'
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

export const createMountObserver = <T extends HTMLElement | SVGElement | Text>(target: T, callback: () => void) => {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node === target || node.contains(target)) {
                    callback()
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

export const createUnmountObserver = <T extends HTMLElement | SVGElement | Text>(target: T, callback: () => void) => {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.removedNodes) {
                if (node === target || node.contains(target)) {
                    callback()
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
