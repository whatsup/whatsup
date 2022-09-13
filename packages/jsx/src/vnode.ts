import { EMPTY_OBJ } from './constants'
import { createMountObserver, createUnmountObserver } from './dom'
import { WhatsJSX, Atomic } from './types'
import {
    Processor,
    HTMLElementProcessor,
    SVGElementProcessor,
    FnComponentProcessor,
    GnComponentProcessor,
} from './processor'

export interface Props {
    style?: WhatsJSX.CSSProperties
    children?: WhatsJSX.Child
    [k: string]: Atomic<any>
}

type Type = WhatsJSX.TagName | WhatsJSX.ComponentProducer

type Node = HTMLElement | SVGElement | Text

const JSX_MOUNT_OBSERVER = Symbol('JSX onMount observer')
const JSX_UNMOUNT_OBSERVER = Symbol('JSX onUnmount observer')

export abstract class VNode<T extends Type, N extends Node | Node[]> {
    protected abstract createProcessor(): Processor<T, N>

    readonly key: string
    readonly type: T
    readonly props: Props
    readonly ref?: WhatsJSX.Ref
    readonly onMount?: (el: N) => void
    readonly onUnmount?: (el: N) => void

    processor!: Processor<T, N>

    constructor(
        type: T,
        key: string,
        props?: Props,
        ref?: WhatsJSX.Ref,
        onMount?: (el: N) => void,
        onUnmount?: (el: N) => void
    ) {
        this.key = key
        this.type = type
        this.props = props || EMPTY_OBJ

        if (ref) this.ref = ref
        if (onMount) this.onMount = onMount
        if (onUnmount) this.onUnmount = onUnmount
    }

    mutate(prev?: VNode<T, N>) {
        if (prev) {
            this.processor = prev.processor
            this.processor.setVNode(this)
        } else {
            this.processor = this.createProcessor()
        }

        const next = this.processor.getNodes()

        this.attachMountingCallbacks(next)
        this.updateRef(next)

        return next
    }

    private updateRef(target: N) {
        if (this.ref) {
            this.ref.current = target
        }
    }

    private attachMountingCallbacks(target: N) {
        const node: Node = Array.isArray(target) ? target[0] : target

        if (node) {
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

export abstract class ElementVNode<N extends Exclude<Node, Text>> extends VNode<WhatsJSX.TagName, N> {}

export abstract class ComponentVNode<T extends WhatsJSX.ComponentProducer> extends VNode<T, Node | Node[]> {}

export class HTMLElementVNode extends ElementVNode<HTMLElement> {
    protected createProcessor(): HTMLElementProcessor {
        return new HTMLElementProcessor(this)
    }
}

export class SVGElementVNode extends ElementVNode<SVGElement> {
    protected createProcessor(): SVGElementProcessor {
        return new SVGElementProcessor(this)
    }
}

export class FnComponentVNode extends ComponentVNode<WhatsJSX.FnComponentProducer> {
    protected createProcessor(): FnComponentProcessor {
        return new FnComponentProcessor(this)
    }
}

export class GnComponentVNode extends ComponentVNode<WhatsJSX.GnComponentProducer> {
    protected createProcessor(): GnComponentProcessor {
        return new GnComponentProcessor(this)
    }
}
