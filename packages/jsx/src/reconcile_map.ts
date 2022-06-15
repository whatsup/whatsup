class Queue<T> extends Array<T> {
    private cursor = 0

    next() {
        if (this.cursor < this.length) {
            return this[this.cursor++]
        }
        return
    }
}

const TEXT_NODE_RECONCILE_ID = (Symbol('TextNode reconcile id') as unknown) as string

type Item = Text | HTMLElement | SVGElement

export class ReconcileMap {
    private readonly tracker = new Set<Item | Item[]>()
    private readonly queueMap = {} as {
        [k: string]: Queue<Item | Item[]>
    }

    addReconcilable(reconcileId: string, item: Item | Item[]) {
        if (!(reconcileId in this.queueMap)) {
            this.queueMap[reconcileId] = new Queue()
        }
        this.queueMap[reconcileId].push(item)
        this.tracker.add(item)
    }

    nextReconcilable(reconcileId: string): Item | Item[] | void {
        if (reconcileId in this.queueMap) {
            const item = this.queueMap[reconcileId].next()

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
