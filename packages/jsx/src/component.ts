import { createAtom, observable, mutator, Atom, Observable } from 'whatsup'
import { EMPTY_OBJ } from './constants'
import { Context, createContext, addContextToStack, popContextFromStack } from './context'
import { removeElements } from './dom'
//import { JsxMutator } from './mutator'
import { ReconcileMap } from './reconcile_map'
import { WhatsJSX } from './types'
import { isGenerator } from './utils'

abstract class Component<P extends WhatsJSX.ComponentProps> {
    protected abstract produce(ctx: Context): WhatsJSX.Child

    private atom: Atom<(HTMLElement | SVGElement | Text)[]>
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

        let oldReconcileMap = new ReconcileMap()

        try {
            while (true) {
                yield mutator((prev?: (HTMLElement | SVGElement | Text)[]) => {
                    const reconcileMap = new ReconcileMap()

                    addContextToStack(context)

                    const child = this.produce(context)
                    const next = reconcileMap.reconcile(oldReconcileMap, child)

                    removeElements(oldReconcileMap.elements())
                    popContextFromStack()

                    oldReconcileMap = reconcileMap

                    if (
                        prev &&
                        prev.length === next.length &&
                        prev.every((item, i) => item === (next as (Element | Text)[])[i])
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
