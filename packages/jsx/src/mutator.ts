import { Mutator } from '@whatsup/core'
import { createComponent } from './component'
import { EMPTY_OBJ, SVG_NAMESPACE } from './constants'
import { placeNodes, mutateProps, createMountObserver, createUnmountObserver } from './dom'
import { WhatsJSX } from './types'

export const Fragment = (props: WhatsJSX.ComponentProps) => {
    return props.children!
}

const JSX_MUTATOR_ATTACH_KEY = Symbol('Jsx mutator attach key')
const JSX_MOUNT_OBSERVER = Symbol('Jsx onMount observer')
const JSX_UNMOUNT_OBSERVER = Symbol('Jsx onUnmount observer')

const FAKE_JSX_COMPONENT_MUTATOR: WhatsJSX.ComponentMutatorLike = {}

const FAKE_JSX_ELEMENT_MUTATOR: WhatsJSX.ElementMutatorLike = {
    props: {} as WhatsJSX.ElementProps,
    children: FAKE_JSX_COMPONENT_MUTATOR,
}

export abstract class JsxMutator<T extends WhatsJSX.Type, R extends (Element | Text) | (Element | Text)[]>
    extends Mutator<R>
    implements WhatsJSX.JsxMutatorLike
{
    abstract doMutation(oldMutator: WhatsJSX.JsxMutatorLike | void): R

    readonly id: string
    readonly type: T
    readonly ref: WhatsJSX.Ref | undefined
    readonly props: WhatsJSX.ElementProps
    readonly onMount: ((el: Element | Text | (Element | Text)[]) => void) | undefined
    readonly onUnmount: ((el: Element | Text | (Element | Text)[]) => void) | undefined

    constructor(
        type: T,
        uid: WhatsJSX.Uid,
        key: WhatsJSX.Key | undefined,
        ref: WhatsJSX.Ref | undefined,
        props: WhatsJSX.ElementProps
    ) {
        super()

        const { onMount, onUnmount, ...other } = props

        this.id = key ? `${uid}|${key}` : uid
        this.type = type
        this.ref = ref
        this.props = other
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
            const { type, id } = this

            if (mutator.id === id && mutator.type === type) {
                return mutator
            }
        }
    }

    private attachSelfTo(target: R) {
        Reflect.set(target, JSX_MUTATOR_ATTACH_KEY, this)
    }

    private attachMountingCallbacks(result: R) {
        const node: Element | Text = Array.isArray(result) ? result[0] : result

        if (node) {
            const target = Array.isArray(result) && result.length === 1 ? result[0] : result

            if (this.onMount && !Reflect.has(node, JSX_MOUNT_OBSERVER)) {
                const observer = createMountObserver(node, () => this.onMount!(target))
                Reflect.set(node, JSX_MOUNT_OBSERVER, observer)
            }
            if (this.onUnmount && !Reflect.has(node, JSX_MOUNT_OBSERVER)) {
                const observer = createUnmountObserver(node, () => this.onUnmount!(target))
                Reflect.set(node, JSX_UNMOUNT_OBSERVER, observer)
            }
        }
    }
}

export abstract class ElementMutator
    extends JsxMutator<WhatsJSX.TagName, HTMLElement | SVGElement>
    implements WhatsJSX.ElementMutatorLike
{
    protected abstract createElement(): HTMLElement | SVGElement

    readonly children: ComponentMutator<WhatsJSX.ComponentProducer>
    node?: HTMLElement | SVGElement

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

    doMutation({ props: oldProps, children: oldChildren, node } = FAKE_JSX_ELEMENT_MUTATOR) {
        const { props, children } = this
        const childNodes = children.doMutation(oldChildren)

        this.node = node || this.createElement()

        mutateProps(this.node!, props, oldProps)
        placeNodes(this.node!, childNodes)

        return this.node!
    }
}

export class SVGElementMutator extends ElementMutator {
    protected createElement(): SVGElement {
        return document.createElementNS(SVG_NAMESPACE, this.type)
    }
}

export class HTMLElementMutator extends ElementMutator {
    protected createElement(): HTMLElement {
        return document.createElement(this.type)
    }
}

export class ComponentMutator<T extends WhatsJSX.ComponentProducer>
    extends JsxMutator<T, (HTMLElement | SVGElement | Text)[]>
    implements WhatsJSX.ComponentMutatorLike
{
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

        return this.component!.getNodes()
    }
}
