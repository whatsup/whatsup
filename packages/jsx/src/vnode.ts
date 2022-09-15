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

        const dom = this.processor.getDOM()

        this.attachMountingCallbacks(dom)
        this.updateRef(dom)

        return dom
    }

    private updateRef(target: N) {
        if (this.ref) {
            this.ref.current = target
        }
    }

    private attachMountingCallbacks(dom: N) {
        const { onMount, onUnmount } = this

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
    protected createProcessor(): HTMLElementProcessor {
        return new HTMLElementProcessor(this)
    }
}

export class SVGElementVNode extends VNode<WhatsJSX.TagName, SVGElement> {
    protected createProcessor(): SVGElementProcessor {
        return new SVGElementProcessor(this)
    }
}

export class FnComponentVNode extends VNode<WhatsJSX.FnComponentProducer, Node | Node[]> {
    protected createProcessor(): FnComponentProcessor {
        return new FnComponentProcessor(this)
    }
}

export class GnComponentVNode extends VNode<WhatsJSX.GnComponentProducer, Node | Node[]> {
    protected createProcessor(): GnComponentProcessor {
        return new GnComponentProcessor(this)
    }
}
