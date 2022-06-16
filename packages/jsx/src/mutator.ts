import { Mutator, createAtom, observable, mutator, Atom, Observable } from 'whatsup'
import { EMPTY_OBJ, NON_DIMENSIONAL_STYLE_PROP, SVG_NAMESPACE } from './constants'
import { addContextToStack, Context, createContext, popContextFromStack } from './context'
import { ReconcileMap } from './reconcile_map'
import { WhatsJSX } from './types'
import { isGenerator } from './utils'

export const Fragment = (props: WhatsJSX.ComponentProps) => {
    return props.children!
}

const JSX_MUTATOR_ATTACH_KEY = Symbol('Jsx mutator attach key')
const JSX_MOUNT_OBSERVER = Symbol('Jsx onMount observer')
const JSX_UNMOUNT_OBSERVER = Symbol('Jsx onUnmount observer')

const FAKE_JSX_ELEMENT_MUTATOR: WhatsJSX.ElementMutatorLike<HTMLElement | SVGElement> = {
    props: {} as WhatsJSX.ElementProps,
    children: {},
}

const FAKE_JSX_COMPONENT_MUTATOR: WhatsJSX.ComponentMutatorLike<(HTMLElement | SVGElement | Text)[]> = {}

export abstract class JsxMutator<T extends WhatsJSX.Type, R extends (Element | Text) | (Element | Text)[]>
    extends Mutator<R>
    implements WhatsJSX.JsxMutatorLike<R> {
    abstract doMutation(oldMutator: WhatsJSX.JsxMutatorLike<R> | void): R

    readonly type: T
    readonly uid: WhatsJSX.Uid
    readonly key: WhatsJSX.Key | undefined
    readonly ref: WhatsJSX.Ref | undefined
    readonly reconcileId: string
    readonly props: WhatsJSX.ElementProps
    readonly onMount: ((el: Element) => void) | undefined
    readonly onUnmount: ((el: Element) => void) | undefined
    result!: R

    constructor(
        type: T,
        uid: WhatsJSX.Uid,
        key: WhatsJSX.Key | undefined,
        ref: WhatsJSX.Ref | undefined,
        props: WhatsJSX.ElementProps
    ) {
        super()

        const { onMount, onUnmount, ...other } = props

        this.type = type
        this.uid = uid
        this.key = key
        this.ref = ref
        this.reconcileId = key != null ? `${uid}|${key}` : uid
        this.props = other
        this.onMount = onMount
        this.onUnmount = onUnmount
    }

    mutate(prev?: R) {
        const oldMutator = this.extractFrom(prev)

        if (oldMutator === this) {
            return prev!
        }

        const next = this.doMutation(oldMutator)

        this.attachSelfTo(next)
        this.attachMountingCallbacks(next)
        this.updateRef(next)

        return (this.result = next)
    }

    private updateRef(target: R) {
        if (this.ref) {
            this.ref.current = Array.isArray(target) && target.length === 1 ? target[0] : target
        }
    }

    private extractFrom(target: any): JsxMutator<T, R> | void {
        if (target != null && typeof target === 'object' && Reflect.has(target, JSX_MUTATOR_ATTACH_KEY)) {
            const mutator = Reflect.get(target, JSX_MUTATOR_ATTACH_KEY) as JsxMutator<T, R>
            const { type, reconcileId } = this

            if (mutator.reconcileId === reconcileId && mutator.type === type) {
                return mutator
            }
        }
    }

    private attachSelfTo(target: R) {
        Reflect.set(target, JSX_MUTATOR_ATTACH_KEY, this)
    }

    private attachMountingCallbacks(target: R) {
        const element: Element | null = !Array.isArray(target)
            ? (target as Element)
            : target.length === 1
            ? (target[0] as Element)
            : null

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

    readonly children: ComponentMutator<WhatsJSX.ComponentProducer>

    constructor(
        type: WhatsJSX.TagName,
        uid: WhatsJSX.Uid,
        key: WhatsJSX.Key | undefined,
        ref: WhatsJSX.Ref | undefined,
        props: WhatsJSX.ElementProps,
        children: WhatsJSX.Child[]
    ) {
        super(type, uid, key, ref, props)

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

export class ComponentMutator<T extends WhatsJSX.ComponentProducer>
    extends JsxMutator<T, (HTMLElement | SVGElement | Text)[]>
    implements WhatsJSX.ComponentMutatorLike<(HTMLElement | SVGElement | Text)[]> {
    readonly reconcileMap = new ReconcileMap()
    component?: WhatsJSX.Component

    constructor(
        type: T,
        uid: WhatsJSX.Uid,
        key: WhatsJSX.Key | undefined,
        ref: WhatsJSX.Ref | undefined,
        props: WhatsJSX.ComponentProps,
        children: WhatsJSX.Child[]
    ) {
        super(type, uid, key, ref, { ...props, children })
    }

    doMutation(oldMutator = FAKE_JSX_COMPONENT_MUTATOR) {
        const { component } = oldMutator
        const { type, props } = this

        this.component = component || createComponent(type, props)
        this.component!.setProps(props)

        return this.component!.getElements()
    }
}

abstract class Component<P extends WhatsJSX.ComponentProps> {
    protected abstract produce(ctx: Context): WhatsJSX.Child

    private atom: Atom<(HTMLElement | Text)[]>
    protected producer: WhatsJSX.ComponentProducer<P>
    protected props: Observable<P>

    constructor(producer: WhatsJSX.ComponentProducer<P>, props: P) {
        this.atom = createAtom(this.whatsup, this)
        this.producer = producer
        this.props = observable(props)
    }

    setProps(props: P) {
        this.props.set(props)
    }

    getElements() {
        return this.atom.get()
    }

    private *whatsup() {
        let context: Context
        let oldReconcileMap = new ReconcileMap()

        try {
            while (true) {
                yield mutator((prev?: (HTMLElement | Text)[]) => {
                    const reconcileMap = new ReconcileMap()

                    context = context || createContext(this.producer.name)

                    addContextToStack(context)

                    const result = this.produce(context)
                    const childs = Array.isArray(result) ? result : [result]
                    const next = [] as (HTMLElement | Text)[]

                    reconcile(reconcileMap, next, childs, oldReconcileMap)
                    removeUnreconciledElements(oldReconcileMap)
                    popContextFromStack()

                    oldReconcileMap = reconcileMap

                    if (
                        prev &&
                        prev.length === next.length &&
                        prev.every((item, i) => item === (next as (Element | Text)[])[i])
                    ) {
                        /*
                            reuse old elements container
                            to prevent recalculation of top-level atom
                        */
                        return prev
                    }

                    return next
                })
            }
        } finally {
            this.dispose()
        }
    }

    protected dispose() {}
}

class FnComponent<P extends WhatsJSX.ComponentProps> extends Component<P> {
    protected producer!: WhatsJSX.FnComponentProducer<P>

    produce(context: Context) {
        const props = this.props.get()
        return this.producer.call(context, props)
    }
}

class GnComponent<P extends WhatsJSX.ComponentProps> extends Component<P> {
    protected producer!: WhatsJSX.GnComponentProducer<P>
    private iterator?: Iterator<WhatsJSX.Child | never, WhatsJSX.Child | unknown, unknown> | undefined

    produce(context: Context) {
        const props = this.props.get()

        if (!this.iterator) {
            this.iterator = this.producer.call(context, props)
        }

        const { done, value } = this.iterator.next(props)

        if (done) {
            this.iterator = undefined
        }

        return value as WhatsJSX.Child
    }

    protected dispose() {
        super.dispose()

        if (this.iterator) {
            this.iterator.return!()
            this.iterator = undefined
        }
    }
}

const createComponent = (producer: WhatsJSX.ComponentProducer, props: WhatsJSX.ComponentProps): WhatsJSX.Component => {
    if (isGenerator(producer)) {
        return new GnComponent(producer, props)
    }
    return new FnComponent(producer, props)
}

export const removeUnreconciledElements = (reconcileMap: ReconcileMap) => {
    for (const element of reconcileMap.elements()) {
        element.remove()
    }
}

export const placeElements = (node: HTMLElement | SVGElement, elements: (HTMLElement | SVGElement | Text)[]) => {
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

export const reconcile = (
    reconcileMap: ReconcileMap,
    elements: (HTMLElement | SVGElement | Text)[],
    children: WhatsJSX.Child[],
    oldReconcileMap: ReconcileMap
) => {
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

const mutateProps = <T extends WhatsJSX.ElementProps>(node: HTMLElement | SVGElement, props: T, oldProps: T) => {
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

const mutateProp = <T extends WhatsJSX.ElementProps, K extends keyof T & string>(
    node: HTMLElement | SVGElement,
    prop: K,
    value: T[K] | undefined,
    oldValue: T[K] | undefined
) => {
    if (isSVG(node)) {
        // Normalize incorrect prop usage for SVG
        // Thanks prettier team
        // https://github.com/preactjs/preact/blob/master/src/diff/props.js#L106
        prop = (prop as string).replace(/xlink[H:h]/, 'h').replace(/sName$/, 's') as K
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

const mutateEventListener = <T extends WhatsJSX.ElementProps, K extends keyof T & string>(
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

const mutateStyle = <T extends CSSStyleDeclaration | WhatsJSX.ElementProps>(
    node: HTMLElement | SVGElement,
    value: T = EMPTY_OBJ as T,
    oldValue: T = EMPTY_OBJ as T
) => {
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

const mutateStyleProp = <T extends WhatsJSX.ElementProps, K extends keyof T & string>(
    style: CSSStyleDeclaration,
    prop: K,
    value: T[K]
) => {
    if (typeof value !== 'number' || NON_DIMENSIONAL_STYLE_PROP.test(prop)) {
        style[prop as any] = value
    } else {
        style[prop as any] = ((value + 'px') as unknown) as T[K]
    }
}

const mutatePropThroughAttributeApi = <T extends HTMLElement | SVGElement>(
    node: T,
    prop: keyof WhatsJSX.ElementProps & string,
    value: WhatsJSX.ElementProps[keyof WhatsJSX.ElementProps]
) => {
    if (value == null) {
        node.removeAttribute(prop)
    } else {
        node.setAttribute(prop, value)
    }
}

const mutatePropThroughUsualWay = <T extends HTMLElement | SVGElement>(
    node: T,
    prop: keyof WhatsJSX.ElementProps,
    value: WhatsJSX.ElementProps[keyof WhatsJSX.ElementProps]
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

const createMountObserver = <T extends Element | Text>(element: T, callback: (el: T) => void) => {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node === element || node.contains(element)) {
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

const createUnmountObserver = <T extends Element | Text>(element: T, callback: (el: T) => void) => {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.removedNodes) {
                if (node === element || node.contains(element)) {
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
