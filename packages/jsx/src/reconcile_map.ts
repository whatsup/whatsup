import { JsxMutator } from './mutator'
import { WhatsJSX } from './types'

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

const TEXT_NODE_RECONCILE_ID = '__TEXT_NODE_RECONCILE_ID__'

type Item = Text | HTMLElement | SVGElement

export class ReconcileMap {
    private readonly tracker = new Set<Item | Item[]>()
    private readonly queueMap = new Map<string, ReconcileQueue<Item | Item[]>>()

    addReconcilable(reconcileId: string, item: Item | Item[]) {
        if (!this.queueMap.has(reconcileId)) {
            this.queueMap.set(reconcileId, new ReconcileQueue())
        }

        const queue = this.queueMap.get(reconcileId)!

        queue.enqueue(item)

        this.tracker.add(item)
    }

    nextReconcilable(reconcileId: string): Item | Item[] | void {
        if (this.queueMap.has(reconcileId)) {
            const queue = this.queueMap.get(reconcileId)!
            const item = queue.dequeue()

            if (item) {
                this.tracker.delete(item)
            }

            return item
        }
    }

    addReconcilableTextNode(item: Text) {
        this.addReconcilable(TEXT_NODE_RECONCILE_ID, item)
    }

    nextReconcilableTextNode() {
        return this.nextReconcilable(TEXT_NODE_RECONCILE_ID) as Text | void
    }

    addRendered(item: Item) {
        this.tracker.add(item)
    }

    deleteRendered(item: Item) {
        this.tracker.delete(item)
    }

    *elements() {
        for (const item of this.tracker) {
            if (Array.isArray(item)) {
                yield* item
            } else {
                yield item
            }
        }
    }

    reconcile(
        oldReconcileMap: ReconcileMap,
        child: WhatsJSX.Child | WhatsJSX.Child[],
        elements: (HTMLElement | SVGElement | Text)[] = []
    ) {
        if (Array.isArray(child)) {
            for (let i = 0; i < child.length; i++) {
                this.reconcileChild(oldReconcileMap, child[i], elements)
            }
        } else {
            this.reconcileChild(oldReconcileMap, child, elements)
        }

        return elements
    }

    private reconcileChild(
        oldReconcileMap: ReconcileMap,
        child: WhatsJSX.Child,
        elements: (HTMLElement | SVGElement | Text)[]
    ) {
        if (Array.isArray(child)) {
            this.reconcile(oldReconcileMap, child, elements)
            return
        }

        if (child instanceof HTMLElement || child instanceof SVGElement || child instanceof Text) {
            oldReconcileMap.deleteRendered(child)
            this.addRendered(child)
            elements.push(child)

            return
        }

        if (child instanceof JsxMutator) {
            const candidate = oldReconcileMap.nextReconcilable(child.id)
            const result = child.mutate(candidate) as HTMLElement | (HTMLElement | Text)[]

            this.addReconcilable(child.id, result)

            if (Array.isArray(result)) {
                elements.push(...result)
            } else {
                elements.push(result)
            }

            return
        }

        if (typeof child === 'string' || typeof child === 'number') {
            const value = child.toString()

            let candidate = oldReconcileMap.nextReconcilableTextNode()

            if (!candidate) {
                candidate = document.createTextNode(value)
            } else if (candidate.nodeValue !== value) {
                candidate.nodeValue = value
            }

            this.addReconcilableTextNode(candidate)
            elements.push(candidate)

            return
        }

        if (child === null || child === true || child === false) {
            // Ignore null & booleans
            return
        }

        throw new InvalidJSXChildError(child)
    }
}

class InvalidJSXChildError extends Error {
    constructor(readonly child: any) {
        super('Invalid JSX Child')
    }
}
