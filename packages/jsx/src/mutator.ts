import { Atom, Mutator, createAtom, observable, Observable, mutator } from 'whatsup'
import { EMPTY_OBJ, NON_DIMENSIONAL_STYLE_PROP, SVG_NAMESPACE } from './constants'
import { addContextToStack, Context, createContext, popContextFromStack } from './context'
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

    mutate(data?: R) {
        const oldMutator = this.extractFrom(data)

        if (oldMutator === this) {
            return data!
        }

        let newData = this.doMutation(oldMutator)

        if (
            Array.isArray(data) &&
            Array.isArray(newData) &&
            data.length === newData.length &&
            data.every((item, i) => item === (newData as (Element | Text)[])[i])
        ) {
            /*
                reuse old data container
                to prevent recalculation of top-level atom
            */
            newData = data
        }

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

    readonly children: ComponentMutator<WhatsJSX.Component>

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

export class ComponentMutator<T extends WhatsJSX.Component>
    extends JsxMutator<T, (HTMLElement | SVGElement | Text)[]>
    implements WhatsJSX.ComponentMutatorLike<(HTMLElement | SVGElement | Text)[]> {
    readonly reconcileMap = new ReconcileMap()
    atom?: Atom<WhatsJSX.Child>
    atomProps?: Observable<WhatsJSX.ComponentProps>

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
        const { reconcileMap: oldReconcileMap } = oldMutator
        const { reconcileMap, type, atom, atomProps, props } = this

        this.atomProps = atomProps || observable<WhatsJSX.ComponentProps>()
        this.atomProps.set(props)

        const amProps = this.atomProps!

        this.atom =
            atom ||
            createAtom(function* () {
                let context: Context
                let iterator: Iterator<WhatsJSX.Child | never, WhatsJSX.Child | unknown, unknown> | undefined

                try {
                    while (true) {
                        yield mutator((prev?: WhatsJSX.Child) => {
                            const props = amProps.get()

                            context = context || createContext(type.name)

                            addContextToStack(context)

                            let result: WhatsJSX.Child

                            if (isGeneratorComponent<WhatsJSX.Child | never, WhatsJSX.Child | unknown, unknown>(type)) {
                                iterator = iterator || type.call(context, props)

                                const { done, value } = iterator.next(props)

                                if (done) {
                                    iterator = undefined
                                }

                                result = value instanceof Mutator ? value.mutate(prev) : value
                            } else {
                                const value = type.call(context, props)

                                result = value instanceof Mutator ? value.mutate(prev) : value
                            }

                            popContextFromStack()

                            return result as WhatsJSX.Child
                        })
                    }
                } finally {
                    if (iterator) {
                        iterator.return!()
                    }
                }
            })

        const value = this.atom.get()
        const mutators = Array.isArray(value) ? value : [value]
        const elements = [] as (HTMLElement | Text)[]

        reconcile(reconcileMap, elements, mutators, oldReconcileMap)
        removeUnreconciledElements(oldReconcileMap)

        return elements
    }
}

export const isGeneratorComponent = <T, TR, TN>(
    target: Function
): target is (...args: any[]) => Generator<T, TR, TN> => {
    return target.constructor.name === 'GeneratorFunction'
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

function createMountObserver<T extends Element | Text>(element: T, callback: (el: T) => void) {
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

function createUnmountObserver<T extends Element | Text>(element: T, callback: (el: T) => void) {
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
