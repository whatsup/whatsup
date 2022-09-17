import { Context } from './context'
import { VNode, Props } from './vnode'
import { WhatsJSX } from './types'
import { Reconciler } from './reconciler'
import { Atom, CacheState, createAtom } from '@whatsup/core'
import { EMPTY_OBJ, SVG_NAMESPACE } from './constants'
import { mutateProps, placeNodes } from './dom'

type Type = WhatsJSX.TagName | WhatsJSX.ComponentProducer
type Node = HTMLElement | SVGElement | Text

export abstract class Processor<T extends Type, N extends Node | Node[]> {
    private readonly atom: Atom<N>
    protected readonly context: Context
    protected vnode: VNode<T, N>

    constructor(context: Context, vnode: VNode<T, N>, producer: () => Generator<N, void, unknown>) {
        this.context = context
        this.vnode = vnode
        this.atom = createAtom(producer, this)
    }

    setVNode(vnode: VNode<T, N>) {
        if (!isEqualVNodes(this.vnode, vnode)) {
            this.atom.setCacheState(CacheState.Dirty)
        }

        this.vnode = vnode
    }

    getDOM() {
        return this.atom.get()
    }
}

export abstract class ElementProcessor<N extends Exclude<Node, Text>> extends Processor<WhatsJSX.TagName, N> {
    abstract createElement(): N
    abstract mutateProps(node: N, prev: Props | undefined, next: Props): Props | undefined

    constructor(vnode: VNode<WhatsJSX.TagName, N>, context: Context) {
        super(context, vnode, elementProducer)
    }
}

export abstract class ComponentProcessor<T extends WhatsJSX.ComponentProducer> extends Processor<T, Node | Node[]> {
    abstract produce(): WhatsJSX.Child
    abstract handleError(e: Error): WhatsJSX.Child
    abstract dispose(): void

    constructor(vnode: VNode<T, Node | Node[]>, context: Context) {
        const newContext = new Context(context, vnode.type.name)

        super(newContext, vnode, componentProducer)
    }
}

function* elementProducer<N extends Exclude<Node, Text>>(this: ElementProcessor<N>) {
    const { context } = this
    const node = this.createElement()

    let reconciler: Reconciler | undefined
    let prevProps: Props | undefined

    while (true) {
        const nextProps = this.vnode.props

        prevProps = this.mutateProps(node, prevProps, nextProps)

        if (nextProps.children !== undefined || !!reconciler) {
            if (!reconciler) {
                reconciler = new Reconciler()
            }

            const childNodes = reconciler.reconcile(nextProps.children ?? null, context)

            placeNodes(node, childNodes)
        }

        yield node
    }
}

function* componentProducer<T extends WhatsJSX.ComponentProducer>(this: ComponentProcessor<T>) {
    const { context } = this
    const reconciler = new Reconciler()

    let prev: Node | Node[] | undefined = undefined
    let prevIsArray = false

    try {
        while (true) {
            let next: Node | Node[] | undefined
            let nextIsArray = false
            let isEqual = true

            try {
                let child = this.produce()

                while (true) {
                    try {
                        let i = 0

                        const nodes = reconciler.reconcile(child, context)

                        for (const node of nodes) {
                            if (prevIsArray) {
                                if ((prev! as Node[])[i] !== node) {
                                    isEqual = false
                                }
                            } else if (i !== 0) {
                                isEqual = false
                            } else if (prev !== node) {
                                isEqual = false
                            }

                            /* short equality condition

                                if(prevIsArray && prev[i] !== node || !prevIsArray && (i !== 0 || prev !== node)){
                                    isEqual = false
                                }

                            */

                            if (next) {
                                if (nextIsArray) {
                                    ;(next as Node[]).push(node)
                                } else {
                                    nextIsArray = true
                                    next = [next as Node, node]
                                }
                            } else {
                                next = node
                            }

                            i++
                        }

                        if (!prevIsArray || !nextIsArray) {
                            isEqual = false
                        }

                        break
                    } catch (e) {
                        child = this.handleError(e as Error)
                        next = undefined
                        nextIsArray = false
                        isEqual = false

                        continue
                    }
                }
            } catch (e) {
                throw e
            }

            if (isEqual) {
                yield prev!
            } else if (next) {
                prevIsArray = nextIsArray

                yield (prev = next)
            } else {
                prevIsArray = true

                yield (prev = [])
            }
        }
    } finally {
        this.dispose()
    }
}

export class HTMLElementProcessor extends ElementProcessor<HTMLElement> {
    createElement(): HTMLElement {
        return document.createElement(this.vnode.type)
    }

    mutateProps(node: HTMLElement, prev: Props | undefined, next: Props) {
        return mutateProps(node, prev, next, false)
    }
}

export class SVGElementProcessor extends ElementProcessor<SVGElement> {
    createElement(): SVGElement {
        return document.createElementNS(SVG_NAMESPACE, this.vnode.type)
    }

    mutateProps(node: SVGElement, prev: Props | undefined, next: Props) {
        return mutateProps(node, prev, next, true)
    }
}

export class FnComponentProcessor extends ComponentProcessor<WhatsJSX.FnComponentProducer> {
    produce() {
        const { context, vnode } = this
        const { type, props } = vnode

        return type.call(context, props, context)
    }

    handleError(e: Error): WhatsJSX.Child {
        throw e
    }

    dispose() {}
}

export class GnComponentProcessor extends ComponentProcessor<WhatsJSX.GnComponentProducer> {
    private iterator?: Iterator<WhatsJSX.Child | never, WhatsJSX.Child | unknown, unknown> | undefined

    produce() {
        const { context, vnode } = this
        const { type, props } = vnode

        if (!this.iterator) {
            this.iterator = type.call(context, props, context)
        }

        const { done, value } = this.iterator.next(props)

        if (done) {
            this.iterator = undefined
        }

        return value as WhatsJSX.Child
    }

    handleError(e: Error): WhatsJSX.Child {
        if (this.iterator) {
            const { done, value } = this.iterator.throw!(e)

            if (done) {
                this.iterator = undefined
            }

            return value as WhatsJSX.Child
        }

        throw e
    }

    dispose() {
        if (this.iterator) {
            this.iterator.return!()
            this.iterator = undefined
        }
    }
}

const isEqualVNodes = <T extends VNode<any, any>>(prev: T, next: T) => {
    if (prev === next) {
        return true
    }

    return (
        prev.key === next.key &&
        prev.type === next.type &&
        prev.ref === next.ref &&
        prev.onMount === next.onMount &&
        prev.onUnmount === next.onUnmount &&
        isEqualProps(prev.props, next.props)
    )
}

const isEqualProps = <T extends Props>(prev: T, next: T) => {
    if (prev === next) {
        return true
    }

    const prevKeys = Object.keys(prev)
    const nextKeys = Object.keys(next)

    if (prevKeys.length !== nextKeys.length) {
        return false
    }

    for (const key of prevKeys) {
        if (key === 'style') {
            if (!isEqualStyle(prev.style || EMPTY_OBJ, next.style || EMPTY_OBJ)) {
                return false
            }

            continue
        }

        if (key === 'children') {
            if (!isEqualChildren(prev.children, next.children)) {
                return false
            }

            continue
        }

        if (prev[key] !== next[key]) {
            return false
        }
    }

    return true
}

const isEqualStyle = <T extends { [k: string]: string }>(prev: T, next: T) => {
    const prevKeys = Object.keys(prev)
    const nextKeys = Object.keys(next)

    if (prevKeys.length !== nextKeys.length) {
        return false
    }

    for (const key of prevKeys) {
        if (prev[key] !== next[key]) {
            return false
        }
    }

    return true
}

const isEqualChildren = <T extends WhatsJSX.Child | undefined>(prev: T, next: T) => {
    if (prev === next) {
        return true
    }

    const prevIsArray = Array.isArray(prev)
    const nextIsArray = Array.isArray(next)

    if (prevIsArray && nextIsArray) {
        if (prev.length !== next.length) {
            return false
        }

        for (let i = 0; i < prev.length; i++) {
            if (isEqualChildren(prev[i], next[i])) {
                prev[i] === next[i]
                continue
            }

            return false
        }

        return true
    }

    if (prevIsArray || nextIsArray) {
        return false
    }

    const prevIsVNode = prev instanceof VNode
    const nextIsVNode = next instanceof VNode

    if (prevIsVNode && nextIsVNode) {
        return isEqualVNodes(prev, next)
    }

    return false
}
