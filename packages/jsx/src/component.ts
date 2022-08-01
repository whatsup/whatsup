import { createAtom, Atom, rebuild, Mutator } from '@whatsup/core'
import { EMPTY_OBJ } from './constants'
import { Context, createContext, addContextToStack, popContextFromStack } from './context'
import { Props } from './mutator'
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
            rebuild(this.nodes)
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
        let next: Node | Node[]

        try {
            addContextToStack(this.component.context)

            let child = this.component.produce()

            while (true) {
                try {
                    next = this.reconciler.reconcile(child)
                } catch (e) {
                    child = this.component.handleError(e as Error)
                    continue
                }
                break
            }
        } catch (e) {
            throw e
        } finally {
            popContextFromStack()
        }

        /*
            reuse old elements container
            to prevent recalculation of top-level atom
        */

        if (!prev) {
            return next
        }

        if (prev === next) {
            return prev
        }

        if (Array.isArray(prev) && Array.isArray(next)) {
            if (prev.length !== next.length) {
                return next
            }

            for (let i = 0; i < prev.length; i++) {
                if (prev[i] !== next[i]) {
                    return next
                }
            }

            return prev
        }

        return next
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
        if (key !== 'children' && prev[key] !== next[key]) {
            return false
        }
    }

    if (Array.isArray(prev.children) && Array.isArray(next.children)) {
        if (prev.children.length !== next.children.length) {
            return false
        }

        for (let i = 0; i < prev.children.length; i++) {
            if (prev.children[i] !== next.children[i]) {
                return false
            }
        }
    }

    if (prev.children !== next.children) {
        return false
    }

    return true
}
