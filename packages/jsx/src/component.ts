import { createAtom, observable, mutator, Atom, Observable } from 'whatsup'
import { EMPTY_OBJ } from './constants'
import { Context, createContext, addContextToStack, popContextFromStack } from './context'
import { removeElements } from './dom'
import { JsxMutator } from './mutator'
import { WhatsJSX } from './types'
import { isGenerator } from './utils'

const TEXT_NODE_RECONCILE_ID = '__TEXT_NODE_RECONCILE_ID__'

type ReconcileNode = Text | HTMLElement | SVGElement

abstract class Component<P extends WhatsJSX.ComponentProps> {
    protected abstract produce(ctx: Context): WhatsJSX.Child

    private readonly atom: Atom<(HTMLElement | SVGElement | Text)[]>
    private reconsileTracker = new Set<ReconcileNode | ReconcileNode[]>()
    private reconsileQueueMap = new Map<string, ReconcileQueue<ReconcileNode | ReconcileNode[]>>()
    private oldReconsileTracker = new Set<ReconcileNode | ReconcileNode[]>()
    private oldReconsileQueueMap = new Map<string, ReconcileQueue<ReconcileNode | ReconcileNode[]>>()
    protected producer: WhatsJSX.ComponentProducer<P>
    protected props: Observable<P>

    constructor(producer: WhatsJSX.ComponentProducer<P>, props: P) {
        this.atom = createAtom(this.whatsup, this)
        this.producer = producer
        this.props = observable(props)
    }

    setProps(props: P) {
        this.props.set(uniqPropsFilter(props))
    }

    getElements() {
        return this.atom.get()
    }

    private *whatsup() {
        const context: Context = createContext(this.producer.name)

        try {
            while (true) {
                yield mutator((prev?: (HTMLElement | SVGElement | Text)[]) => {
                    addContextToStack(context)

                    const child = this.produce(context)
                    const next = this.reconcile(child)

                    popContextFromStack()

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
        const elements: (HTMLElement | SVGElement | Text)[] = []
        const { reconsileTracker, oldReconsileTracker, reconsileQueueMap, oldReconsileQueueMap } = this

        this.reconsileTracker = oldReconsileTracker
        this.reconsileQueueMap = oldReconsileQueueMap
        this.oldReconsileTracker = reconsileTracker
        this.oldReconsileQueueMap = reconsileQueueMap
        this.doReconcile(child, elements)
        this.removeOldElements()
        this.oldReconsileTracker.clear()
        this.oldReconsileQueueMap.clear()

        return elements
    }

    private doReconcile(child: WhatsJSX.Child | WhatsJSX.Child[], elements: (HTMLElement | SVGElement | Text)[] = []) {
        if (Array.isArray(child)) {
            for (let i = 0; i < child.length; i++) {
                this.reconcileChild(child[i], elements)
            }
        } else {
            this.reconcileChild(child, elements)
        }

        return elements
    }

    private reconcileChild(child: WhatsJSX.Child, elements: (HTMLElement | SVGElement | Text)[]) {
        if (Array.isArray(child)) {
            this.doReconcile(child, elements)
            return
        }

        if (child instanceof HTMLElement || child instanceof SVGElement || child instanceof Text) {
            this.oldReconsileTracker.delete(child)
            this.reconsileTracker.add(child)
            elements.push(child)

            return
        }

        if (child instanceof JsxMutator) {
            const candidate = this.getReconcileNode(child.id)
            const result = child.mutate(candidate) as HTMLElement | SVGElement | (HTMLElement | SVGElement | Text)[]

            this.addReconcileNode(child.id, result)

            if (Array.isArray(result)) {
                elements.push(...result)
            } else {
                elements.push(result)
            }

            return
        }

        if (typeof child === 'string' || typeof child === 'number') {
            const value = child.toString()

            let candidate = this.getReconcileNode(TEXT_NODE_RECONCILE_ID) as Text | undefined

            if (!candidate) {
                candidate = document.createTextNode(value)
            } else if (candidate.nodeValue !== value) {
                candidate.nodeValue = value
            }

            this.addReconcileNode(TEXT_NODE_RECONCILE_ID, candidate)

            elements.push(candidate)

            return
        }

        if (child === null || child === true || child === false) {
            // Ignore null & booleans
            return
        }

        throw new InvalidJSXChildError(child)
    }

    private addReconcileNode(reconcileId: string, node: ReconcileNode | ReconcileNode[]) {
        if (!this.reconsileQueueMap.has(reconcileId)) {
            this.reconsileQueueMap.set(reconcileId, new ReconcileQueue())
        }

        const queue = this.reconsileQueueMap.get(reconcileId)!

        queue.enqueue(node)

        this.reconsileTracker.add(node)
    }

    private getReconcileNode(reconcileId: string): ReconcileNode | ReconcileNode[] | void {
        if (this.oldReconsileQueueMap.has(reconcileId)) {
            const queue = this.oldReconsileQueueMap.get(reconcileId)!
            const node = queue.dequeue()

            if (node) {
                this.oldReconsileTracker.delete(node)
            }

            return node
        }
    }

    private removeOldElements() {
        removeElements(this.oldTrackableNodes())
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

class FnComponent<P extends WhatsJSX.ComponentProps> extends Component<P> {
    protected producer!: WhatsJSX.FnComponentProducer<P>

    produce(context: Context) {
        const props = this.props.get()
        return this.producer.call(context, props)
    }
}

class GnComponent<P extends WhatsJSX.ComponentProps> extends Component<P> {
    protected producer!: WhatsJSX.GnComponentProducer<P>
    private iterator?: Iterator<WhatsJSX.Child | never, WhatsJSX.Child | unknown, unknown> | undefined

    produce(context: Context) {
        const props = this.props.get()

        if (!this.iterator) {
            this.iterator = this.producer.call(context, props)
        }

        const { done, value } = this.iterator.next(props)

        if (done) {
            this.iterator = undefined
        }

        return value as WhatsJSX.Child
    }

    protected dispose() {
        super.dispose()

        if (this.iterator) {
            this.iterator.return!()
            this.iterator = undefined
        }
    }
}

export const createComponent = (
    producer: WhatsJSX.ComponentProducer,
    props: WhatsJSX.ComponentProps = EMPTY_OBJ
): WhatsJSX.Component => {
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

const uniqPropsFilter = <P extends WhatsJSX.ComponentProps>(next: P) => {
    return mutator((prev?: P) => {
        if (!prev) {
            return next
        }

        const prevKeys = Object.keys(prev)
        const nextKeys = Object.keys(next)

        if (prevKeys.length !== nextKeys.length) {
            return next
        }

        for (const key of prevKeys) {
            if (key !== 'children' && prev[key] !== next[key]) {
                return next
            }
        }

        if (Array.isArray(prev.children) && Array.isArray(next.children)) {
            if (prev.children.length !== next.children.length) {
                return next
            }

            for (let i = 0; i < prev.children.length; i++) {
                if (prev.children[i] !== next.children[i]) {
                    return next
                }
            }
        }

        return prev
    })
}
