import { Mutator } from '@whatsup/core'
import { createComponent, Component } from './component'
import { EMPTY_OBJ, SVG_NAMESPACE } from './constants'
import { placeNodes, mutateProps, createMountObserver, createUnmountObserver } from './dom'
import { WhatsJSX } from './types'

export interface Props {
    children?: WhatsJSX.Child
    [k: string]: any
}

export type Type = WhatsJSX.TagName | WhatsJSX.ComponentProducer

export interface JsxMutatorLike {}

export interface ElementMutatorLike extends JsxMutatorLike {
    children: ComponentMutatorLike
    node?: HTMLElement | SVGElement
    props?: Props
}

export interface ComponentMutatorLike extends JsxMutatorLike {
    component?: Component
}

export const Fragment = (props: Props) => {
    return props.children!
}

export const Children = (props: Props) => {
    return props.children ?? null
}

const JSX_MUTATOR_ATTACH_KEY = Symbol('Jsx mutator attach key')
const JSX_MOUNT_OBSERVER = Symbol('Jsx onMount observer')
const JSX_UNMOUNT_OBSERVER = Symbol('Jsx onUnmount observer')

const FAKE_JSX_COMPONENT_MUTATOR: ComponentMutatorLike = {}

const FAKE_JSX_ELEMENT_MUTATOR: ElementMutatorLike = {
    children: FAKE_JSX_COMPONENT_MUTATOR,
}

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

export abstract class JsxMutator<
        T extends Type,
        R extends HTMLElement | SVGElement | Text | (HTMLElement | SVGElement | Text)[]
    >
    extends Mutator<R>
    implements JsxMutatorLike
{
    abstract doMutation(oldMutator: JsxMutatorLike | void): R

    readonly key: string
    readonly type: T
    readonly props: Props | undefined
    readonly ref: WhatsJSX.Ref | undefined
    readonly onMount: ((el: R) => void) | undefined
    readonly onUnmount: ((el: R) => void) | undefined

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
        this.type = type
        this.props = props
        this.ref = ref
        this.onMount = onMount
        this.onUnmount = onUnmount
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
            this.ref.current = Array.isArray(target) && target.length === 1 ? target[0] : target
        }
    }

    private extractFrom(target: any): JsxMutator<T, R> | void {
        if (target != null && typeof target === 'object' && Reflect.has(target, JSX_MUTATOR_ATTACH_KEY)) {
            const mutator = Reflect.get(target, JSX_MUTATOR_ATTACH_KEY) as JsxMutator<T, R>
            const { type, key: id } = this

            if (mutator.key === id && mutator.type === type) {
                return mutator
            }
        }
    }

    private attachSelfTo(target: R) {
        Reflect.set(target, JSX_MUTATOR_ATTACH_KEY, this)
    }

    private attachMountingCallbacks(result: R) {
        const node: HTMLElement | SVGElement | Text = Array.isArray(result) ? result[0] : result

        if (node) {
            const target = Array.isArray(result) && result.length === 1 ? result[0] : result

            if (this.onMount && !Reflect.has(node, JSX_MOUNT_OBSERVER)) {
                const observer = createMountObserver(node, () => this.onMount!(target as R))
                Reflect.set(node, JSX_MOUNT_OBSERVER, observer)
            }
            if (this.onUnmount && !Reflect.has(node, JSX_MOUNT_OBSERVER)) {
                const observer = createUnmountObserver(node, () => this.onUnmount!(target as R))
                Reflect.set(node, JSX_UNMOUNT_OBSERVER, observer)
            }
        }
    }
}

export class ElementMutator
    extends JsxMutator<WhatsJSX.TagName, HTMLElement | SVGElement>
    implements ElementMutatorLike
{
    readonly children: ComponentMutator

    node?: HTMLElement | SVGElement

    constructor(
        type: WhatsJSX.TagName,
        key: string,
        props?: Props,
        ref?: WhatsJSX.Ref,
        onMount?: (el: HTMLElement | SVGElement) => void,
        onUnmount?: (el: HTMLElement | SVGElement) => void
    ) {
        super(type, key, props, ref, onMount, onUnmount)

        this.children = new ComponentMutator(Children, key, props && { children: props.children })
    }

    doMutation({ props: oldProps, children: oldChildren, node } = FAKE_JSX_ELEMENT_MUTATOR) {
        const { props, children } = this

        NS.toggle(this.type)

        this.node = node || this.createElement()

        const childNodes = children.doMutation(oldChildren)

        NS.untoggle(this.type)

        mutateProps(this.node!, props || EMPTY_OBJ, oldProps || EMPTY_OBJ)
        placeNodes(this.node!, childNodes)

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
    extends JsxMutator<WhatsJSX.ComponentProducer, (HTMLElement | SVGElement | Text)[]>
    implements ComponentMutatorLike
{
    component?: Component

    constructor(
        type: WhatsJSX.ComponentProducer,
        key: string,
        props?: Props,
        ref?: WhatsJSX.Ref,
        onMount?: (el: (HTMLElement | SVGElement | Text)[]) => void,
        onUnmount?: (el: (HTMLElement | SVGElement | Text)[]) => void
    ) {
        super(type, key, props, ref, onMount, onUnmount)
    }

    doMutation(oldMutator = FAKE_JSX_COMPONENT_MUTATOR) {
        const { component } = oldMutator
        const { type, props } = this

        this.component = component || createComponent(type, props)
        this.component!.setProps(props || EMPTY_OBJ)

        return this.component!.getNodes()
    }
}

export const jsx = <P extends Props>(
    type: Type,
    key: string,
    props?: P,
    ref?: WhatsJSX.Ref,
    onMount?: (el: HTMLElement | SVGElement | Text | (HTMLElement | SVGElement | Text)[]) => void,
    onUnmount?: (el: HTMLElement | SVGElement | Text | (HTMLElement | SVGElement | Text)[]) => void
) => {
    if (typeof type === 'string') {
        return new ElementMutator(type, key, props, ref, onMount, onUnmount)
    }
    return new ComponentMutator(type, key, props, ref, onMount, onUnmount)
}
