import { removeNodes } from './dom'
import { WhatsJSX } from './types'
import { VNode } from './vnode'

type Node = HTMLElement | SVGElement | Text

const TEXT_NODE_RECONCILE_KEY = '__TEXT_NODE_RECONCILE_KEY__'
const RENDERED_NODE_RECONCILE_KEY = '__RENDERED_NODE_RECONCILE_KEY__'

export class Reconciler {
    private tracker = new Map<Node | Node[], string>()
    private oldTracker = new Map<Node | Node[], string>()
    private reconcileVNodesMap = new Map<Node | Node[], VNode<any, any>>()
    private oldReconcileVNodesMap = new Map<Node | Node[], VNode<any, any>>()
    private index?: Map<string, Node | Node[]>
    private trackerator?: IterableIterator<[Node | Node[], string]>
    private isTrackeratorDone?: true;

    *reconcile(child: WhatsJSX.Child | WhatsJSX.Child[]) {
        const { tracker, oldTracker, reconcileVNodesMap, oldReconcileVNodesMap } = this

        this.tracker = oldTracker
        this.oldTracker = tracker
        this.reconcileVNodesMap = oldReconcileVNodesMap
        this.oldReconcileVNodesMap = reconcileVNodesMap

        yield* this.doReconcile(child)

        this.removeOldElements()
        this.oldTracker.clear()
        this.oldReconcileVNodesMap.clear()
        this.index?.clear()
        this.trackerator = undefined
        this.isTrackeratorDone = undefined
    }

    private findVNode(node: Node | Node[]) {
        if (this.oldReconcileVNodesMap.has(node)) {
            return this.oldReconcileVNodesMap.get(node)
        }

        return
    }

    private bindVNode(node: Node | Node[], vnode: VNode<any, any>) {
        this.reconcileVNodesMap.set(node, vnode)
    }

    private find(key: string) {
        if (this.index && this.index.has(key)) {
            const item = this.index.get(key)!

            this.index.delete(key)
            this.oldTracker.delete(item)

            return item
        }

        if (this.isTrackeratorDone) {
            return
        }

        if (!this.trackerator) {
            this.trackerator = this.oldTracker.entries()
        }

        for (const [item, itemKey] of this.trackerator) {
            if (key === itemKey) {
                this.oldTracker.delete(item)

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

    private *doReconcile(child: WhatsJSX.Child): Generator<Node, undefined, undefined> {
        if (Array.isArray(child)) {
            for (let i = 0; i < child.length; i++) {
                yield* this.doReconcile(child[i])
            }

            return
        }

        if (child instanceof VNode) {
            const candidate = this.find(child.key)
            const vnode = candidate ? this.findVNode(candidate) : undefined
            const result = child.mutate(vnode) as Exclude<Node, Text> | Node[]

            this.tracker.set(result, child.key)
            this.bindVNode(result, child)

            if (Array.isArray(result)) {
                yield* result
            } else {
                yield result
            }

            return
        }

        if (typeof child === 'string' || typeof child === 'number') {
            const value = child.toString()

            let node = this.find(TEXT_NODE_RECONCILE_KEY) as Text | undefined

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
            this.oldTracker.delete(child)
            this.tracker.set(child, RENDERED_NODE_RECONCILE_KEY)

            yield child

            return
        }

        throw new InvalidJSXChildError(child)
    }

    private removeOldElements() {
        removeNodes(this.oldTrackableNodes())
    }

    private *oldTrackableNodes() {
        for (const item of this.oldTracker.keys()) {
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
