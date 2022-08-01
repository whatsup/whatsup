import { removeNodes } from './dom'
import { JsxMutator } from './mutator'
import { WhatsJSX } from './types'

type Node = HTMLElement | SVGElement | Text

const TEXT_NODE_RECONCILE_KEY = '__TEXT_NODE_RECONCILE_ID__'

export class Reconciler {
    private reconsileTracker = new Set<Node | Node[]>()
    private reconsileQueueMap = new Map<string, ReconcileQueue<Node | Node[]>>()
    private oldReconsileTracker = new Set<Node | Node[]>()
    private oldReconsileQueueMap = new Map<string, ReconcileQueue<Node | Node[]>>()

    reconcile(child: WhatsJSX.Child | WhatsJSX.Child[]) {
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

    private doReconcile(child: WhatsJSX.Child, nodes?: Node[]): Node | Node[] {
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
