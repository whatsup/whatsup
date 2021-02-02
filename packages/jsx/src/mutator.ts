import { Mutator } from 'whatsup'
import { EMPTY_OBJ, NON_DIMENSIONAL_STYLE_PROP, SVG_NAMESPACE } from './constants'
import { ReconcileMap } from './reconcile_map'
import { WhatsJSX } from './types'

export function Fragment(props: WhatsJSX.ComponentProps) {
    return props.children!
}

const JSX_MUTATOR_ATTACH_KEY = Symbol('Jsx mutator attach key')
const JSX_MOUNT_OBSERVER = Symbol('Jsx onMount observer')
const JSX_UNMOUNT_OBSERVER = Symbol('Jsx onUnmount observer')

const FAKE_JSX_ELEMENT_MUTATOR: WhatsJSX.ElementMutatorLike<HTMLElement | SVGElement> = {
    props: {} as WhatsJSX.ElementProps,
    children: {
        reconcileMap: new ReconcileMap(),
    },
}

const FAKE_JSX_COMPONENT_MUTATOR: WhatsJSX.ComponentMutatorLike<(HTMLElement | SVGElement | Text)[]> = {
    reconcileMap: new ReconcileMap(),
}

export abstract class JsxMutator<T extends WhatsJSX.Type, R extends (Element | Text) | (Element | Text)[]>
    extends Mutator<R>
    implements WhatsJSX.JsxMutatorLike<R> {
    abstract doMutation(oldMutator: WhatsJSX.JsxMutatorLike<R> | void): R

    readonly type: T
    readonly uid: WhatsJSX.Uid
    readonly key: WhatsJSX.Key | undefined
    readonly ref: WhatsJSX.Ref | undefined
    readonly onMount: ((el: Element) => void) | undefined
    readonly onUnmount: ((el: Element) => void) | undefined
    readonly reconcileId: string
    result!: R

    constructor(
        type: T,
        uid: WhatsJSX.Uid,
        key: WhatsJSX.Key | undefined,
        ref: WhatsJSX.Ref | undefined,
        onMount?: ((el: Element) => void) | undefined,
        onUnmount?: ((el: Element) => void) | undefined
    ) {
        super()
        this.type = type
        this.uid = uid
        this.key = key
        this.ref = ref
        this.onMount = onMount
        this.onUnmount = onUnmount
        this.reconcileId = key != null ? `${uid}|${key}` : uid
    }

    mutate(data?: R) {
        const oldMutator = this.extractFrom(data)

        if (oldMutator === this) {
            return data!
        }

        const newData = this.doMutation(oldMutator)

        this.attachSelfTo(newData)
        this.attachMountingCallbacks(newData)
        this.updateRef(newData)

        return (this.result = newData)
    }

    private updateRef(target: R) {
        if (this.ref) {
            this.ref.current = Array.isArray(target) && target.length === 1 ? target[0] : target
        }
    }

    private extractFrom(target: any): JsxMutator<T, R> | void {
        if (target != null && typeof target === 'object' && JSX_MUTATOR_ATTACH_KEY in target) {
            const { type, reconcileId } = this
            const mutator = target[JSX_MUTATOR_ATTACH_KEY] as JsxMutator<T, R>

            if (mutator.reconcileId === reconcileId && mutator.type === type) {
                return mutator
            }
        }
    }

    private attachSelfTo(target: R) {
        Reflect.set(target, JSX_MUTATOR_ATTACH_KEY, this)
    }

    private attachMountingCallbacks(target: R) {
        const element: Element = !Array.isArray(target) ? target : target.length === 1 ? target[0] : null

        if (element) {
            if (this.onMount && !Reflect.has(element, JSX_MOUNT_OBSERVER)) {
                const observer = createMountObserver(element, this.onMount)
                Reflect.set(element, JSX_MOUNT_OBSERVER, observer)
            }
            if (this.onUnmount && !Reflect.has(element, JSX_MOUNT_OBSERVER)) {
                const observer = createUnmountObserver(element, this.onUnmount)
                Reflect.set(element, JSX_UNMOUNT_OBSERVER, observer)
            }
        }
    }
}

export abstract class JsxElementMutator
    extends JsxMutator<WhatsJSX.TagName, HTMLElement | SVGElement>
    implements WhatsJSX.ElementMutatorLike<HTMLElement | SVGElement> {
    protected abstract createElement(): HTMLElement | SVGElement

    readonly props: WhatsJSX.ElementProps
    readonly children: ComponentMutator

    constructor(
        type: WhatsJSX.TagName,
        uid: WhatsJSX.Uid,
        key: WhatsJSX.Key | undefined,
        ref: WhatsJSX.Ref | undefined,
        props: WhatsJSX.ElementProps,
        children: WhatsJSX.Child[]
    ) {
        super(type, uid, key, ref, props.onMount, props.onUnmount)

        this.props = props
        this.children = new ComponentMutator(Fragment, uid, undefined, undefined, EMPTY_OBJ, children)
    }

    doMutation({
        props: oldProps,
        children: oldChildren,
        result: node = this.createElement(),
    } = FAKE_JSX_ELEMENT_MUTATOR) {
        const { props, children } = this
        const childNodes = children.doMutation(oldChildren)

        mutateProps(node, props, oldProps)
        placeElements(node, childNodes)

        return node
    }
}

export class SVGElementMutator extends JsxElementMutator {
    protected createElement(): SVGElement {
        return document.createElementNS(SVG_NAMESPACE, this.type)
    }
}

export class HTMLElementMutator extends JsxElementMutator {
    protected createElement(): HTMLElement {
        return document.createElement(this.type)
    }
}

export class ComponentMutator
    extends JsxMutator<WhatsJSX.Component, (HTMLElement | SVGElement | Text)[]>
    implements WhatsJSX.ComponentMutatorLike<(HTMLElement | SVGElement | Text)[]> {
    readonly children: WhatsJSX.Child[]
    readonly reconcileMap = new ReconcileMap()

    constructor(
        type: WhatsJSX.Component,
        uid: WhatsJSX.Uid,
        key: WhatsJSX.Key | undefined,
        ref: WhatsJSX.Ref | undefined,
        props: WhatsJSX.ComponentProps,
        children: WhatsJSX.Child[]
    ) {
        super(type, uid, key, ref, props.onMount, props.onUnmount)

        const childs = type.call(undefined, { ...props, children })

        this.children = Array.isArray(childs) ? childs : [childs]
    }

    doMutation({ reconcileMap: oldReconcileMap } = FAKE_JSX_COMPONENT_MUTATOR) {
        const { reconcileMap, children } = this
        const elements = [] as (HTMLElement | Text)[]

        reconcile(reconcileMap, elements, children, oldReconcileMap)
        removeUnreconciledElements(oldReconcileMap)

        return elements
    }
}

export function removeUnreconciledElements(reconcileMap: ReconcileMap) {
    for (const element of reconcileMap) {
        element.remove()
    }
}

export function placeElements(node: HTMLElement | SVGElement, elements: (HTMLElement | SVGElement | Text)[]) {
    const { childNodes } = node
    const { length } = elements

    for (let i = 0; i < length; i++) {
        const element = elements[i]

        if (childNodes[i] !== element) {
            if (element.parentNode === node) {
                // swap nodes
                node.insertBefore(childNodes[i], element)
            }

            node.insertBefore(element, childNodes[i])
        }
    }
}

export function reconcile(
    reconcileMap: ReconcileMap,
    elements: (HTMLElement | SVGElement | Text)[],
    children: WhatsJSX.Child[],
    oldReconcileMap: ReconcileMap
) {
    for (let i = 0; i < children.length; i++) {
        const child = children[i]

        if (Array.isArray(child)) {
            reconcile(reconcileMap, elements, child, oldReconcileMap)
            continue
        }

        if (child instanceof HTMLElement || child instanceof SVGElement || child instanceof Text) {
            oldReconcileMap.deleteRendered(child)
            reconcileMap.addRendered(child)
            elements.push(child)

            continue
        }

        if (child instanceof JsxMutator) {
            const candidate = oldReconcileMap.nextReconcilable(child.reconcileId)
            const result = child.mutate(candidate) as HTMLElement | (HTMLElement | Text)[]

            reconcileMap.addReconcilable(child.reconcileId, result)

            if (Array.isArray(result)) {
                elements.push(...result)
            } else {
                elements.push(result)
            }

            continue
        }

        if (typeof child === 'string' || typeof child === 'number') {
            const value = child.toString()

            let candidate = oldReconcileMap.nextReconcilableTextNode()

            if (!candidate) {
                candidate = document.createTextNode(value)
            } else if (candidate.nodeValue !== value) {
                candidate.nodeValue = value
            }

            reconcileMap.addReconcilableTextNode(candidate)
            elements.push(candidate)

            continue
        }

        if (child === null || child === true || child === false) {
            // Ignore null & booleans
            continue
        }

        throw new InvalidJSXChildError(child)
    }
}

class InvalidJSXChildError extends Error {
    constructor(readonly child: any) {
        super('Invalid JSX Child')
    }
}

function mutateProps<T extends WhatsJSX.ElementProps>(node: HTMLElement | SVGElement, props: T, oldProps: T) {
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

function mutateProp<T extends WhatsJSX.ElementProps, K extends keyof T & string>(
    node: HTMLElement | SVGElement,
    prop: K,
    value: T[K] | undefined,
    oldValue: T[K] | undefined
) {
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

function mutateEventListener<T extends WhatsJSX.ElementProps, K extends keyof T & string>(
    node: HTMLElement | SVGElement,
    prop: K,
    listener: T[K] | undefined,
    oldListener: T[K] | undefined
) {
    const capture = isEventCaptureListener(prop)
    const event = getEventName(prop, capture)

    if (typeof oldListener === 'function') {
        node.removeEventListener(event, oldListener, capture)
    }
    if (typeof listener === 'function') {
        node.addEventListener(event, listener, capture)
    }
}

function mutateStyle<T extends CSSStyleDeclaration | WhatsJSX.ElementProps>(
    node: HTMLElement | SVGElement,
    value: T = EMPTY_OBJ as T,
    oldValue: T = EMPTY_OBJ as T
) {
    if (value instanceof CSSStyleDeclaration) {
        node.style.cssText = value.cssText
    } else {
        for (const prop in oldValue) {
            if (!(prop in value)) {
                mutateStyleProp(node.style, prop, '')
            }
        }

        for (const prop in value) {
            if (value[prop] !== oldValue[prop]) {
                mutateStyleProp(node.style, prop, value[prop])
            }
        }
    }
}

function mutateStyleProp<T extends WhatsJSX.ElementProps, K extends keyof T & string>(
    style: CSSStyleDeclaration,
    prop: K,
    value: T[K]
) {
    if (typeof value !== 'number' || NON_DIMENSIONAL_STYLE_PROP.test(prop)) {
        style[prop as any] = value
    } else {
        style[prop as any] = ((value + 'px') as unknown) as T[K]
    }
}

function mutatePropThroughAttributeApi<T extends HTMLElement | SVGElement>(
    node: T,
    prop: keyof WhatsJSX.ElementProps & string,
    value: WhatsJSX.ElementProps[keyof WhatsJSX.ElementProps]
) {
    if (value == null) {
        node.removeAttribute(prop)
    } else {
        node.setAttribute(prop, value)
    }
}

function mutatePropThroughUsualWay<T extends HTMLElement | SVGElement>(
    node: T,
    prop: keyof WhatsJSX.ElementProps,
    value: WhatsJSX.ElementProps[keyof WhatsJSX.ElementProps]
) {
    node[prop as keyof T] = value == null ? '' : value
}

function getEventName(prop: string, capture: boolean) {
    return prop.slice(2, capture ? -7 : Infinity).toLowerCase()
}

function isSVG(node: HTMLElement | SVGElement) {
    return node.namespaceURI === SVG_NAMESPACE
}

function isEventListener(prop: string) {
    return prop.startsWith('on')
}

function isEventCaptureListener(prop: string) {
    return (prop as string).endsWith('Capture')
}

function isStyleProp(prop: string) {
    return prop === 'style'
}

function isIgnorableProp(prop: string) {
    return prop === 'key' || prop === 'ref' || prop === 'children' || prop === 'onMount' || prop === 'onUnmount'
}

function isReadonlyProp(prop: string) {
    return (
        prop === 'list' ||
        prop === 'form' ||
        prop === 'type' ||
        prop === 'size' ||
        prop === 'download' ||
        prop === 'href'
    )
}

function createMountObserver<T extends Element>(element: T, callback: (el: T) => void) {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            const { addedNodes } = mutation

            for (let i = 0; i < addedNodes.length; i++) {
                const node = addedNodes.item(i)

                if (node === element) {
                    callback(element)
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

function createUnmountObserver<T extends Element>(element: T, callback: (el: T) => void) {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            const { removedNodes } = mutation

            for (let i = 0; i < removedNodes.length; i++) {
                const node = removedNodes.item(i)

                if (node === element) {
                    callback(element)
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
