import { Mutator } from '@whatsup/core'
import { createComponent, Component } from './component'
import { Reconciler } from './reconciler'
import { EMPTY_OBJ, SVG_NAMESPACE } from './constants'
import { placeNodes, mutateProps, createMountObserver, createUnmountObserver } from './dom'
import { WhatsJSX } from './types'

export interface Props {
    children?: WhatsJSX.Child
    [k: string]: any
}

type Type = WhatsJSX.TagName | WhatsJSX.ComponentProducer

type Node = HTMLElement | SVGElement | Text

interface JsxMutatorLike {}

interface ElementMutatorLike extends JsxMutatorLike {
    node?: Exclude<Node, Text>
    reconciler?: Reconciler
    props?: Props
}

interface ComponentMutatorLike extends JsxMutatorLike {
    component?: Component
}

export function Fragment(props: Props) {
    return props.children ?? null
}

const JSX_MOUNT_OBSERVER = Symbol('Jsx onMount observer')
const JSX_UNMOUNT_OBSERVER = Symbol('Jsx onUnmount observer')

const FAKE_JSX_COMPONENT_MUTATOR: ComponentMutatorLike = {}
const FAKE_JSX_ELEMENT_MUTATOR: ElementMutatorLike = {}

const NS = {
    isSvg: false,
    toggle(type: WhatsJSX.TagName) {
        if (type === 'svg') {
            this.isSvg = true
        } else if (this.isSvg && type === 'foreignObject') {
            this.isSvg = false
        }
    },
    untoggle(type: WhatsJSX.TagName) {
        if (type === 'svg') {
            this.isSvg = false
        } else if (!this.isSvg && type === 'foreignObject') {
            this.isSvg = true
        }
    },
}

export abstract class JsxMutator<T extends Type, R extends Node | Node[]> extends Mutator<R> implements JsxMutatorLike {
    abstract doMutation(oldMutator: JsxMutatorLike | void): R

    readonly key: string
    readonly attachKey: symbol
    readonly type: T
    readonly props?: Props
    readonly ref?: WhatsJSX.Ref
    readonly onMount?: (el: R) => void
    readonly onUnmount?: (el: R) => void

    constructor(
        type: T,
        key: string,
        props?: Props,
        ref?: WhatsJSX.Ref,
        onMount?: (el: R) => void,
        onUnmount?: (el: R) => void
    ) {
        super()

        this.key = key
        this.attachKey = Symbol.for(key)
        this.type = type

        if (props) this.props = props
        if (ref) this.ref = ref
        if (onMount) this.onMount = onMount
        if (onUnmount) this.onUnmount = onUnmount
    }

    mutate(prev?: R) {
        const oldMutator = this.extractFrom(prev)
        const next = this.doMutation(oldMutator)

        this.attachSelfTo(next)
        this.attachMountingCallbacks(next)
        this.updateRef(next)

        return next
    }

    private updateRef(target: R) {
        if (this.ref) {
            this.ref.current = target
        }
    }

    private extractFrom(target: any): JsxMutator<T, R> | void {
        if (target != null && typeof target === 'object' && Reflect.has(target, this.attachKey)) {
            return Reflect.get(target, this.attachKey) as JsxMutator<T, R>
        }
    }

    private attachSelfTo(target: R) {
        Reflect.set(target, this.attachKey, this)
    }

    private attachMountingCallbacks(result: R) {
        const node: Node = Array.isArray(result) ? result[0] : result

        if (node) {
            if (this.onMount && !Reflect.has(node, JSX_MOUNT_OBSERVER)) {
                const observer = createMountObserver(node, () => this.onMount!(result))
                Reflect.set(node, JSX_MOUNT_OBSERVER, observer)
            }
            if (this.onUnmount && !Reflect.has(node, JSX_MOUNT_OBSERVER)) {
                const observer = createUnmountObserver(node, () => this.onUnmount!(result))
                Reflect.set(node, JSX_UNMOUNT_OBSERVER, observer)
            }
        }
    }
}

export class ElementMutator extends JsxMutator<WhatsJSX.TagName, Exclude<Node, Text>> implements ElementMutatorLike {
    node?: Exclude<Node, Text>
    reconciler?: Reconciler

    doMutation({ props: oldProps, node, reconciler } = FAKE_JSX_ELEMENT_MUTATOR) {
        const { props } = this

        NS.toggle(this.type)

        this.node = node || this.createElement()

        mutateProps(this.node!, props || EMPTY_OBJ, oldProps || EMPTY_OBJ)

        if (props?.children !== undefined || reconciler) {
            this.reconciler = reconciler || new Reconciler()

            const childNodes = this.reconciler.reconcile(props?.children ?? null)

            placeNodes(this.node!, childNodes)
        }

        NS.untoggle(this.type)

        return this.node!
    }

    createElement(): HTMLElement | SVGElement {
        if (NS.isSvg) {
            return document.createElementNS(SVG_NAMESPACE, this.type)
        }

        return document.createElement(this.type)
    }
}

export class ComponentMutator
    extends JsxMutator<WhatsJSX.ComponentProducer, Node | Node[]>
    implements ComponentMutatorLike
{
    component?: Component

    doMutation({ component } = FAKE_JSX_COMPONENT_MUTATOR) {
        const { type, props } = this

        if (!component) {
            this.component = createComponent(type, props)
        } else {
            this.component = component
            this.component!.setProps(props || EMPTY_OBJ)
        }

        return this.component!.getNodes()
    }
}

export const jsx = <P extends Props>(
    type: Type,
    key: string,
    props?: P,
    ref?: WhatsJSX.Ref,
    onMount?: (el: Node | Node[]) => void,
    onUnmount?: (el: Node | Node[]) => void
) => {
    if (typeof type === 'string') {
        return new ElementMutator(type, key, props, ref, onMount, onUnmount)
    }
    return new ComponentMutator(type, key, props, ref, onMount, onUnmount)
}
