import { createAtom, mutator, Atom, rebuild } from '@whatsup/core'
import { EMPTY_OBJ } from './constants'
import { Context, createContext, addContextToStack, popContextFromStack } from './context'
import { removeNodes } from './dom'
import { JsxMutator, Props } from './mutator'
import { WhatsJSX } from './types'
import { isGenerator } from './utils'

export type FnComponentProducer = (props: Props, ctx?: Context) => WhatsJSX.Child

export type GnComponentProducer = (
    props: Props,
    ctx?: Context
) => Iterator<WhatsJSX.Child | never, WhatsJSX.Child | unknown, Props>

export type ComponentProducer = FnComponentProducer | GnComponentProducer

const TEXT_NODE_RECONCILE_KEY = '__TEXT_NODE_RECONCILE_ID__'

type ReconcileNode = Text | HTMLElement | SVGElement

export abstract class Component {
    protected abstract produce(ctx: Context): WhatsJSX.Child
    protected abstract handleError(e: Error): WhatsJSX.Child
    protected producer: ComponentProducer
    protected props: Props

    private readonly nodes: Atom<(HTMLElement | SVGElement | Text)[]>
    private reconsileTracker = new Set<ReconcileNode | ReconcileNode[]>()
    private reconsileQueueMap = new Map<string, ReconcileQueue<ReconcileNode | ReconcileNode[]>>()
    private oldReconsileTracker = new Set<ReconcileNode | ReconcileNode[]>()
    private oldReconsileQueueMap = new Map<string, ReconcileQueue<ReconcileNode | ReconcileNode[]>>()

    constructor(producer: ComponentProducer, props: Props) {
        this.producer = producer
        this.nodes = createAtom(this.whatsup, this)
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

    private *whatsup() {
        const context: Context = createContext(this.producer.name)

        try {
            while (true) {
                yield mutator((prev?: (HTMLElement | SVGElement | Text)[]) => {
                    addContextToStack(context)

                    let child = this.produce(context)
                    let next: (HTMLElement | SVGElement | Text)[]

                    try {
                        while (true) {
                            try {
                                next = this.reconcile(child)
                            } catch (e) {
                                child = this.handleError(e as Error)
                                continue
                            }
                            break
                        }
                    } catch (e) {
                        throw e
                    } finally {
                        popContextFromStack()
                    }

                    if (
                        prev &&
                        prev.length === next.length &&
                        prev.every((item, i) => item === (next as (HTMLElement | SVGElement | Text)[])[i])
                    ) {
                        /*
                            reuse old elements container
                            to prevent recalculation of top-level atom
                        */
                        return prev
                    }

                    return next
                })
            }
        } finally {
            this.dispose()
        }
    }

    protected dispose() {}

    private reconcile(child: WhatsJSX.Child | WhatsJSX.Child[]) {
        const nodes: (HTMLElement | SVGElement | Text)[] = []
        const { reconsileTracker, oldReconsileTracker, reconsileQueueMap, oldReconsileQueueMap } = this

        this.reconsileTracker = oldReconsileTracker
        this.reconsileQueueMap = oldReconsileQueueMap
        this.oldReconsileTracker = reconsileTracker
        this.oldReconsileQueueMap = reconsileQueueMap
        this.doReconcile(child, nodes)
        this.removeOldElements()
        this.oldReconsileTracker.clear()
        this.oldReconsileQueueMap.clear()

        return nodes
    }

    private doReconcile(child: WhatsJSX.Child | WhatsJSX.Child[], nodes: (HTMLElement | SVGElement | Text)[] = []) {
        if (Array.isArray(child)) {
            for (let i = 0; i < child.length; i++) {
                this.reconcileChild(child[i], nodes)
            }
        } else {
            this.reconcileChild(child, nodes)
        }

        return nodes
    }

    private reconcileChild(child: WhatsJSX.Child, nodes: (HTMLElement | SVGElement | Text)[]) {
        if (Array.isArray(child)) {
            this.doReconcile(child, nodes)
            return
        }

        if (child instanceof HTMLElement || child instanceof SVGElement || child instanceof Text) {
            this.oldReconsileTracker.delete(child)
            this.reconsileTracker.add(child)
            nodes.push(child)

            return
        }

        if (child instanceof JsxMutator) {
            const candidate = this.getReconcileNode(child.key)
            const result = child.mutate(candidate) as HTMLElement | SVGElement | (HTMLElement | SVGElement | Text)[]

            this.addReconcileNode(child.key, result)

            if (Array.isArray(result)) {
                nodes.push(...result)
            } else {
                nodes.push(result)
            }

            return
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

            nodes.push(candidate)

            return
        }

        if (child === null || child === true || child === false) {
            // Ignore null & booleans
            return
        }

        throw new InvalidJSXChildError(child)
    }

    private addReconcileNode(reconcileKey: string, node: ReconcileNode | ReconcileNode[]) {
        if (!this.reconsileQueueMap.has(reconcileKey)) {
            this.reconsileQueueMap.set(reconcileKey, new ReconcileQueue())
        }

        const queue = this.reconsileQueueMap.get(reconcileKey)!

        queue.enqueue(node)

        this.reconsileTracker.add(node)
    }

    private getReconcileNode(reconcileKey: string): ReconcileNode | ReconcileNode[] | void {
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
    protected producer!: FnComponentProducer

    produce(context: Context) {
        const { producer, props } = this
        return producer.call(context, props, context)
    }

    handleError(e: Error): WhatsJSX.Child {
        throw e
    }
}

class GnComponent extends Component {
    protected producer!: GnComponentProducer
    private iterator?: Iterator<WhatsJSX.Child | never, WhatsJSX.Child | unknown, unknown> | undefined

    produce(context: Context) {
        const { producer, props } = this

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

    protected dispose() {
        super.dispose()

        if (this.iterator) {
            this.iterator.return!()
            this.iterator = undefined
        }
    }
}

export const createComponent = (producer: ComponentProducer, props: Props = EMPTY_OBJ): Component => {
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
