import { EMPTY_ARR } from './constants'
import { removeNodes } from './dom'
import { JsxMutator } from './mutator'
import { WhatsJSX } from './types'

type Node = HTMLElement | SVGElement | Text

const TEXT_NODE_RECONCILE_KEY = '__TEXT_NODE_RECONCILE_KEY__'
const RENDERED_NODE_RECONCILE_KEY = '__RENDERED_NODE_RECONCILE_KEY__'

export class Reconciler {
    private tracker = new Map<Node | Node[], string>()
    private oldTracker = new Map<Node | Node[], string>()
    private index?: Map<string, Node | Node[]>
    private trackerator?: IterableIterator<[Node | Node[], string]>
    private isTrackeratorDone?: true

    find(key: string) {
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

    reconcile(child: WhatsJSX.Child | WhatsJSX.Child[]) {
        const { tracker, oldTracker } = this

        this.tracker = oldTracker
        this.oldTracker = tracker

        const result = this.doReconcile(child)

        this.removeOldElements()
        this.oldTracker.clear()
        this.index?.clear()
        this.trackerator = undefined
        this.isTrackeratorDone = undefined

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
            this.oldTracker.delete(child)
            this.tracker.set(child, RENDERED_NODE_RECONCILE_KEY)

            if (nodes) {
                nodes.push(child)

                return nodes
            }

            return child
        }

        if (child instanceof JsxMutator) {
            const candidate = this.find(child.key)
            const result = child.mutate(candidate) as Exclude<Node, Text> | Node[]

            this.tracker.set(result, child.key)

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

            let candidate = this.find(TEXT_NODE_RECONCILE_KEY) as Text | undefined

            if (!candidate) {
                candidate = document.createTextNode(value)
            } else if (candidate.nodeValue !== value) {
                candidate.nodeValue = value
            }

            this.tracker.set(candidate, TEXT_NODE_RECONCILE_KEY)

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

            return EMPTY_ARR
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
