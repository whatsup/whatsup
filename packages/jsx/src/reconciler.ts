import { Context } from './context'
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
    private tracker!: Tracker
    private vnodesMap!: VNodesMap
    private oldTracker?: Tracker
    private oldVNodesMap?: VNodesMap
    private index?: Index
    private trackerator?: IterableIterator<[Node | Node[], string]>
    private isTrackeratorDone?: true;

    *reconcile(child: WhatsJSX.Child | WhatsJSX.Child[], context: Context) {
        this.oldTracker = this.tracker
        this.oldVNodesMap = this.vnodesMap
        this.tracker = new Map()
        this.vnodesMap = new Map()

        yield* this.doReconcile(child, context)

        this.removeOldElements()

        this.index = undefined
        this.trackerator = undefined
        this.isTrackeratorDone = undefined
    }

    private find(key: string) {
        if (!this.oldTracker) {
            return
        }

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

    private findOldVNode(key: string) {
        const dom = this.find(key)

        if (!dom || !this.oldVNodesMap || !this.oldVNodesMap.has(dom)) {
            return
        }

        return this.oldVNodesMap.get(dom)
    }

    private *doReconcile(child: WhatsJSX.Child, context: Context): Generator<Node, undefined, undefined> {
        if (child === null || child === true || child === false) {
            return
        }

        if (Array.isArray(child)) {
            for (let i = 0; i < child.length; i++) {
                yield* this.doReconcile(child[i], context)
            }

            return
        }

        if (child instanceof VNode) {
            const vnode = this.findOldVNode(child.key)
            const result = child.mutate(vnode, context) as Exclude<Node, Text> | Node[]

            this.tracker.set(result, child.key)
            this.vnodesMap.set(result, child)

            if (Array.isArray(result)) {
                yield* result
            } else {
                yield result
            }

            return
        }

        if (typeof child === 'string' || typeof child === 'number' || typeof child === 'bigint') {
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

        if (child instanceof HTMLElement || child instanceof SVGElement || child instanceof Text) {
            this.tracker.set(child, RENDERED_NODE_RECONCILE_KEY)

            if (this.oldTracker) {
                this.oldTracker.delete(child)
            }

            yield child

            return
        }

        throw new InvalidJSXChildError(child)
    }

    private removeOldElements() {
        if (this.oldTracker) {
            removeNodes(this.oldTrackableNodes())
        }
    }

    private *oldTrackableNodes() {
        for (const item of this.oldTracker!.keys()) {
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
