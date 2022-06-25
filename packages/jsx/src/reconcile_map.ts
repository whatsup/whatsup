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
}
