import { createAtom, Atom, rebuild, Mutator } from '@whatsup/core'
import { EMPTY_OBJ } from './constants'
import { Context, createContext, addContextToStack, popContextFromStack } from './context'
import { removeNodes } from './dom'
import { JsxMutator, Props } from './mutator'
import { WhatsJSX } from './types'
import { isGenerator } from './utils'

const TEXT_NODE_RECONCILE_KEY = '__TEXT_NODE_RECONCILE_ID__'

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
    private reconsileTracker = new Set<Node | Node[]>()
    private reconsileQueueMap = new Map<string, ReconcileQueue<Node | Node[]>>()
    private oldReconsileTracker = new Set<Node | Node[]>()
    private oldReconsileQueueMap = new Map<string, ReconcileQueue<Node | Node[]>>()

    constructor(component: Component) {
        super()
        this.component = component
    }

    mutate(prev?: Node | Node[]): Node | Node[] {
        let next: Node | Node[]

        try {
            addContextToStack(this.component.context)

            let child = this.component.produce()

            while (true) {
                try {
                    next = this.reconcile(child)
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

    private reconcile(child: WhatsJSX.Child | WhatsJSX.Child[]) {
        const { reconsileTracker, oldReconsileTracker, reconsileQueueMap, oldReconsileQueueMap } = this

        this.reconsileTracker = oldReconsileTracker
        this.reconsileQueueMap = oldReconsileQueueMap
        this.oldReconsileTracker = reconsileTracker
        this.oldReconsileQueueMap = reconsileQueueMap

        const result = this.doReconcile(child)

        this.removeOldElements()
        this.oldReconsileTracker.clear()
        this.oldReconsileQueueMap.clear()

        return result
    }

    private doReconcile(child: WhatsJSX.Child, nodes?: Node[]) {
        if (Array.isArray(child)) {
            if (!nodes) {
                nodes = []
            }

            for (let i = 0; i < child.length; i++) {
                this.doReconcile(child[i], nodes)
            }

            return nodes
        }

        if (child instanceof HTMLElement || child instanceof SVGElement || child instanceof Text) {
            this.oldReconsileTracker.delete(child)
            this.reconsileTracker.add(child)

            if (nodes) {
                nodes.push(child)

                return nodes
            }

            return child
        }

        if (child instanceof JsxMutator) {
            const candidate = this.getReconcileNode(child.key)
            const result = child.mutate(candidate) as Exclude<Node, Text> | Node[]

            this.addReconcileNode(child.key, result)

            if (nodes) {
                if (Array.isArray(result)) {
                    nodes.push(...result)
                } else {
                    nodes.push(result)
                }

                return nodes
            }

            return result
        }

        if (typeof child === 'string' || typeof child === 'number') {
            const value = child.toString()

            let candidate = this.getReconcileNode(TEXT_NODE_RECONCILE_KEY) as Text | undefined

            if (!candidate) {
                candidate = document.createTextNode(value)
            } else if (candidate.nodeValue !== value) {
                candidate.nodeValue = value
            }

            this.addReconcileNode(TEXT_NODE_RECONCILE_KEY, candidate)

            if (nodes) {
                nodes.push(candidate)

                return nodes
            }

            return candidate
        }

        if (child === null || child === true || child === false) {
            // Ignore null & booleans
            if (nodes) {
                return nodes
            }

            return []
        }

        throw new InvalidJSXChildError(child)
    }

    private addReconcileNode(reconcileKey: string, node: Node | Node[]) {
        if (!this.reconsileQueueMap.has(reconcileKey)) {
            this.reconsileQueueMap.set(reconcileKey, new ReconcileQueue())
        }

        const queue = this.reconsileQueueMap.get(reconcileKey)!

        queue.enqueue(node)

        this.reconsileTracker.add(node)
    }

    private getReconcileNode(reconcileKey: string): Node | Node[] | void {
        if (this.oldReconsileQueueMap.has(reconcileKey)) {
            const queue = this.oldReconsileQueueMap.get(reconcileKey)!
            const node = queue.dequeue()

            if (node) {
                this.oldReconsileTracker.delete(node)
            }

            return node
        }
    }

    private removeOldElements() {
        removeNodes(this.oldTrackableNodes())
    }

    private *oldTrackableNodes() {
        for (const item of this.oldReconsileTracker) {
            if (Array.isArray(item)) {
                yield* item
            } else {
                yield item
            }
        }
    }
}

class InvalidJSXChildError extends Error {
    constructor(readonly child: any) {
        super('Invalid JSX Child')
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

class ReconcileQueue<T> {
    private readonly items = [] as T[]
    private cursor = 0

    enqueue(item: T) {
        this.items.push(item)
    }

    dequeue() {
        if (this.cursor < this.items.length) {
            return this.items[this.cursor++]
        }
        return
    }
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
