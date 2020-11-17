import { Mutator } from '@fract/core'
import { EMPTY_OBJ, NON_DIMENSIONAL_STYLE_PROP, SVG_NAMESPACE } from './constants'
import { ReconcileMap } from './reconcile_map'
import {
    Type,
    Component,
    TagName,
    Key,
    Uid,
    Child,
    ElementProps,
    ComponentProps,
    JsxMutatorLike,
    ElementMutatorLike,
    ComponentMutatorLike,
} from './types'

export function Fragment(props: ComponentProps) {
    return props.children
}

const JSX_MUTATOR_ATTACH_KEY = Symbol('Jsx mutator attach key')

const FAKE_JSX_ELEMENT_MUTATOR: ElementMutatorLike<HTMLElement | SVGElement> = {
    props: {} as ElementProps,
    children: {
        reconcileMap: new ReconcileMap(),
    },
}

const FAKE_JSX_COMPONENT_MUTATOR: ComponentMutatorLike<(HTMLElement | SVGElement | Text)[]> = {
    reconcileMap: new ReconcileMap(),
}

export abstract class JsxMutator<T extends Type, R> extends Mutator<R> implements JsxMutatorLike<R> {
    abstract doMutation(oldMutator: JsxMutatorLike<R> | void): R

    readonly type: T
    readonly uid: Uid
    readonly key: Key
    readonly reconcileId: string
    result!: R

    constructor(type: T, uid: Uid, key: Key) {
        super()
        this.type = type
        this.uid = uid
        this.key = key
        this.reconcileId = key != null ? `${uid}|${key}` : uid
    }

    mutate(data?: R) {
        const oldMutator = this.extractFrom(data)

        if (oldMutator === this) {
            return data!
        }

        this.result = this.doMutation(oldMutator)

        this.attachTo(this.result)

        return this.result
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

    private attachTo(target: R) {
        ;(target as any)[JSX_MUTATOR_ATTACH_KEY] = this
    }
}

export abstract class JsxElementMutator extends JsxMutator<TagName, HTMLElement | SVGElement>
    implements ElementMutatorLike<HTMLElement | SVGElement> {
    protected abstract createElement(): HTMLElement | SVGElement

    readonly props: ElementProps
    readonly children: ComponentMutator

    constructor(type: TagName, uid: Uid, key: Key, props: ElementProps, children: Child[]) {
        super(type, uid, key)
        this.props = props
        this.children = new ComponentMutator(Fragment, uid, void 0, EMPTY_OBJ, children)
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

export class ComponentMutator extends JsxMutator<Component, (HTMLElement | SVGElement | Text)[]>
    implements ComponentMutatorLike<(HTMLElement | SVGElement | Text)[]> {
    readonly children: Child[]
    readonly reconcileMap = new ReconcileMap()

    constructor(type: Component, uid: Uid, key: Key, props: ComponentProps, children: Child[]) {
        super(type, uid, key)
        const childs = type.call(void 0, { ...props, children })
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
            node.insertBefore(element, childNodes[i])
        }
    }
}

export function reconcile(
    reconcileMap: ReconcileMap,
    elements: (HTMLElement | SVGElement | Text)[],
    children: Child[],
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
    }
}

function mutateProps<T extends ElementProps>(node: HTMLElement | SVGElement, props: T, oldProps: T) {
    for (const prop in oldProps) {
        if (!(prop in props)) {
            mutateProp(node, prop, void 0, oldProps[prop])
        }
    }
    for (const prop in props) {
        if (props[prop] !== oldProps[prop]) {
            mutateProp(node, prop, props[prop], oldProps[prop])
        }
    }
}

function mutateProp<T extends ElementProps, K extends keyof T & string>(
    node: HTMLElement | SVGElement,
    prop: K,
    value: T[K] | undefined,
    oldValue: T[K] | undefined
) {
    switch (true) {
        case isChildrenProp(prop):
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

function mutateEventListener<T extends ElementProps, K extends keyof T & string>(
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

function mutateStyle<T extends CSSStyleDeclaration | ElementProps>(
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

function mutateStyleProp<T extends ElementProps, K extends keyof T & string>(
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
    prop: keyof ElementProps & string,
    value: ElementProps[keyof ElementProps]
) {
    if (value == null) {
        node.removeAttribute(prop)
    } else {
        node.setAttribute(prop, value)
    }
}

function mutatePropThroughUsualWay<T extends HTMLElement | SVGElement>(
    node: T,
    prop: keyof ElementProps,
    value: ElementProps[keyof ElementProps]
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

function isChildrenProp(prop: string) {
    return prop === 'children'
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
