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
import { Context } from './context'

export interface Props {
    style?: WhatsJSX.CSSProperties
    children?: WhatsJSX.Child
    ref?: WhatsJSX.Ref
    onMount?: (el: Node | Node[]) => void
    onUnmount?: (el: Node | Node[]) => void
    [k: string]: Atomic<any>
}

type Type = WhatsJSX.TagName | WhatsJSX.ComponentProducer

type Node = HTMLElement | SVGElement | Text

const JSX_MOUNT_OBSERVER = Symbol('JSX onMount observer')
const JSX_UNMOUNT_OBSERVER = Symbol('JSX onUnmount observer')

export abstract class VNode<T extends Type, N extends Node | Node[]> {
    protected abstract createProcessor(context: Context): Processor<T, N>

    readonly key: string
    readonly type: T
    readonly props: Props

    processor?: Processor<T, N>

    constructor(type: T, key: string, props?: Props) {
        this.key = key
        this.type = type
        this.props = props || EMPTY_OBJ
        this.processor = undefined
    }

    mutate(prev: VNode<T, N> | undefined, context: Context) {
        this.processor = prev ? prev.processor! : this.createProcessor(context)

        const dom = this.processor.getDOM(this)

        this.attachMountingCallbacks(dom)
        this.updateRef(dom)

        return dom
    }

    private updateRef(dom: N) {
        if (this.props.ref) {
            this.props.ref.current = dom
        }
    }

    private attachMountingCallbacks(dom: N) {
        const { onMount, onUnmount } = this.props

        if (onMount || onUnmount) {
            const target: Node = Array.isArray(dom) ? dom[0] : dom

            if (target) {
                if (onMount && !Reflect.has(target, JSX_MOUNT_OBSERVER)) {
                    const observer = createMountObserver(target, () => onMount(dom))
                    Reflect.set(target, JSX_MOUNT_OBSERVER, observer)
                }
                if (onUnmount && !Reflect.has(target, JSX_MOUNT_OBSERVER)) {
                    const observer = createUnmountObserver(target, () => onUnmount(dom))
                    Reflect.set(target, JSX_UNMOUNT_OBSERVER, observer)
                }
            }
        }
    }
}

export class HTMLElementVNode extends VNode<WhatsJSX.TagName, HTMLElement> {
    protected createProcessor(context: Context): HTMLElementProcessor {
        return new HTMLElementProcessor(context)
    }
}

export class SVGElementVNode extends VNode<WhatsJSX.TagName, SVGElement> {
    protected createProcessor(context: Context): SVGElementProcessor {
        return new SVGElementProcessor(context)
    }
}

export class FnComponentVNode extends VNode<WhatsJSX.FnComponentProducer, Node | Node[]> {
    protected createProcessor(context: Context): FnComponentProcessor {
        const newContext = new Context(context, this.type.name)

        return new FnComponentProcessor(newContext)
    }
}

export class GnComponentVNode extends VNode<WhatsJSX.GnComponentProducer, Node | Node[]> {
    protected createProcessor(context: Context): GnComponentProcessor {
        const newContext = new Context(context, this.type.name)

        return new GnComponentProcessor(newContext)
    }
}
