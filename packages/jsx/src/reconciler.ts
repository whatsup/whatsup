import { removeNodes } from './dom'
import { WhatsJSX } from './types'
import { VNode } from './vnode'

type Node = HTMLElement | SVGElement | Text
type Tracker = Map<Node | Node[], string>
type VNodesMap = Map<Node | Node[], VNode<any, any>>
type Index = Map<string, Node | Node[]>

const TEXT_NODE_RECONCILE_KEY = '__TEXT_NODE_RECONCILE_KEY__'
const RENDERED_NODE_RECONCILE_KEY = '__RENDERED_NODE_RECONCILE_KEY__'

export class Reconciler {
    private tracker: Tracker
    private vnodesMap: VNodesMap
    private index?: Index
    private trackerator?: IterableIterator<[Node | Node[], string]>
    private isTrackeratorDone?: true

    constructor() {
        this.tracker = new Map()
        this.vnodesMap = new Map()
    }

    *reconcile(child: WhatsJSX.Child | WhatsJSX.Child[]) {
        const { tracker: oldTracker, vnodesMap: oldVNodesMap } = this

        this.tracker = new Map()
        this.vnodesMap = new Map()

        yield* this.doReconcile(child, oldTracker, oldVNodesMap)

        this.removeOldElements(oldTracker)
        this.index?.clear()
        this.trackerator = undefined
        this.isTrackeratorDone = undefined
    }

    private find(key: string, tracker: Tracker) {
        if (this.index && this.index.has(key)) {
            const item = this.index.get(key)!

            this.index.delete(key)
            tracker.delete(item)

            return item
        }

        if (this.isTrackeratorDone) {
            return
        }

        if (!this.trackerator) {
            this.trackerator = tracker.entries()
        }

        for (const [item, itemKey] of this.trackerator) {
            if (key === itemKey) {
                tracker.delete(item)

                return item
            }

            if (!this.index) {
                this.index = new Map()
            }

            this.index.set(itemKey, item)
        }

        this.isTrackeratorDone = true

        return
    }

    private *doReconcile(
        child: WhatsJSX.Child,
        oldTracker: Tracker,
        oldVNodesMap: VNodesMap
    ): Generator<Node, undefined, undefined> {
        if (Array.isArray(child)) {
            for (let i = 0; i < child.length; i++) {
                yield* this.doReconcile(child[i], oldTracker, oldVNodesMap)
            }

            return
        }

        if (child instanceof VNode) {
            const candidate = this.find(child.key, oldTracker)
            const vnode = candidate && oldVNodesMap.has(candidate) ? oldVNodesMap.get(candidate) : undefined
            const result = child.mutate(vnode) as Exclude<Node, Text> | Node[]

            this.tracker.set(result, child.key)
            this.vnodesMap.set(result, child)

            if (Array.isArray(result)) {
                yield* result
            } else {
                yield result
            }

            return
        }

        if (typeof child === 'string' || typeof child === 'number') {
            const value = child.toString()

            let node = this.find(TEXT_NODE_RECONCILE_KEY, oldTracker) as Text | undefined

            if (!node) {
                node = document.createTextNode(value)
            } else if (node.nodeValue !== value) {
                node.nodeValue = value
            }

            this.tracker.set(node, TEXT_NODE_RECONCILE_KEY)

            yield node

            return
        }

        if (child === null || child === true || child === false) {
            return
        }

        if (child instanceof HTMLElement || child instanceof SVGElement || child instanceof Text) {
            this.tracker.set(child, RENDERED_NODE_RECONCILE_KEY)
            oldTracker.delete(child)

            yield child

            return
        }

        throw new InvalidJSXChildError(child)
    }

    private removeOldElements(oldTracker: Tracker) {
        removeNodes(this.oldTrackableNodes(oldTracker))
    }

    private *oldTrackableNodes(oldTracker: Tracker) {
        for (const item of oldTracker.keys()) {
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
