import { removeNodes } from './dom'
import { JsxMutator } from './mutator'
import { WhatsJSX } from './types'

type Node = HTMLElement | SVGElement | Text
type Tracker = Map<Node | Node[], string>
type Index = Map<string, Node | Node[]>

const TEXT_NODE_RECONCILE_KEY = '__TEXT_NODE_RECONCILE_KEY__'
const RENDERED_NODE_RECONCILE_KEY = '__RENDERED_NODE_RECONCILE_KEY__'

export class Reconciler {
    private tracker!: Tracker
    private oldTracker?: Tracker
    private index?: Index
    private trackerator?: IterableIterator<[Node | Node[], string]>
    private isTrackeratorDone?: true;

    *reconcile(child: WhatsJSX.Child | WhatsJSX.Child[]) {
        this.oldTracker = this.tracker
        this.tracker = new Map()

        yield* this.doReconcile(child)

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

    private *doReconcile(child: WhatsJSX.Child): Generator<Node, undefined, undefined> {
        if (Array.isArray(child)) {
            for (let i = 0; i < child.length; i++) {
                yield* this.doReconcile(child[i])
            }

            return
        }

        if (child instanceof JsxMutator) {
            const candidate = this.find(child.key)
            const result = child.mutate(candidate) as Exclude<Node, Text> | Node[]

            this.tracker.set(result, child.key)

            if (Array.isArray(result)) {
                yield* result
            } else {
                yield result
            }

            return
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

            yield candidate

            return
        }

        if (child === null || child === true || child === false) {
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
