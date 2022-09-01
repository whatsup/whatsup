import { createAtom, Atom, Mutator, CacheState } from '@whatsup/core'
import { EMPTY_OBJ } from './constants'
import { Context, createContext, addContextToStack, popContextFromStack } from './context'
import { JsxMutator, Props } from './mutator'
import { WhatsJSX } from './types'
import { Reconciler } from './reconciler'
import { isGenerator } from './utils'

type Node = HTMLElement | SVGElement | Text

export abstract class Component {
    abstract produce(): WhatsJSX.Child
    abstract handleError(e: Error): WhatsJSX.Child
    abstract dispose(): void

    readonly context: Context

    protected producer: WhatsJSX.ComponentProducer
    protected props: Props

    private readonly nodes: Atom<Node | Node[]>

    constructor(producer: WhatsJSX.ComponentProducer, props: Props) {
        this.producer = producer
        this.context = createContext(producer.name)
        this.nodes = createAtom(nodesProducer, this)
        this.props = props
    }

    setProps(props: Props) {
        if (!isEqualProps(this.props, props)) {
            this.props = props
            this.nodes.setCacheState(CacheState.Dirty)
        }
    }

    getNodes() {
        return this.nodes.get()
    }
}

function* nodesProducer(this: Component) {
    try {
        const mutator = new NodesMutator(this)

        while (true) {
            yield mutator
        }
    } finally {
        this.dispose()
    }
}

class NodesMutator extends Mutator<Node | Node[]> {
    private readonly component: Component
    private readonly reconciler: Reconciler

    constructor(component: Component) {
        super()
        this.component = component
        this.reconciler = new Reconciler()
    }

    mutate(prev?: Node | Node[]): Node | Node[] {
        try {
            addContextToStack(this.component.context)

            const prevIsArray = Array.isArray(prev)

            let child = this.component.produce()
            let next: Node | Node[] | undefined
            let isEqual = true

            while (true) {
                try {
                    let i = 0
                    let nextIsArray = false

                    const nodes = this.reconciler.reconcile(child)

                    for (const node of nodes) {
                        if (prevIsArray) {
                            if (prev[i] !== node) {
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
                    child = this.component.handleError(e as Error)
                    next = undefined
                    isEqual = false

                    continue
                }
            }

            if (isEqual) {
                return prev!
            }

            return next ?? []
        } catch (e) {
            throw e
        } finally {
            popContextFromStack()
        }
    }
}

class FnComponent extends Component {
    protected producer!: WhatsJSX.FnComponentProducer

    produce() {
        const { producer, context, props } = this

        return producer.call(context, props, context)
    }

    handleError(e: Error): WhatsJSX.Child {
        throw e
    }

    dispose() {}
}

class GnComponent extends Component {
    protected producer!: WhatsJSX.GnComponentProducer
    private iterator?: Iterator<WhatsJSX.Child | never, WhatsJSX.Child | unknown, unknown> | undefined

    produce() {
        const { producer, context, props } = this

        if (!this.iterator) {
            this.iterator = producer.call(context, props, context)
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

export const createComponent = (producer: WhatsJSX.ComponentProducer, props: Props = EMPTY_OBJ): Component => {
    if (isGenerator(producer)) {
        return new GnComponent(producer, props)
    }

    return new FnComponent(producer, props)
}

const isEqualProps = <P extends Props>(prev: P, next: P) => {
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

const isEqualStyle = <S extends { [k: string]: string }>(prev: S, next: S) => {
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

const isEqualChildren = (prev: WhatsJSX.Child | undefined, next: WhatsJSX.Child | undefined) => {
    const prevIsArray = Array.isArray(prev)
    const nextIsArray = Array.isArray(next)

    if (prevIsArray && nextIsArray) {
        if (prev.length !== next.length) {
            return false
        }

        for (let i = 0; i < prev.length; i++) {
            if (!isEqualChildren(prev[i], next[i])) {
                return false
            }
        }

        return true
    }

    if (prevIsArray || nextIsArray) {
        return false
    }

    const prevIsMutator = prev instanceof JsxMutator
    const nextIsMutator = next instanceof JsxMutator

    if (prevIsMutator && nextIsMutator) {
        return (
            prev.key === next.key &&
            prev.type === next.type &&
            prev.ref === next.ref &&
            prev.onMount === next.onMount &&
            prev.onUnmount === next.onUnmount &&
            isEqualProps(prev.props || EMPTY_OBJ, next.props || EMPTY_OBJ)
        )
    }

    if (prevIsMutator || nextIsMutator) {
        return false
    }

    return prev === next
}
