import { Context, createContext } from './context'
import { JsxMutator } from './mutator'
import { WhatsJSX } from './types'
import { Reconciler } from './reconciler'
import { Atom, CacheState, createAtom } from '@whatsup/core'
import { EMPTY_OBJ, SVG_NAMESPACE } from './constants'
import { Props } from './dom'

type Type = WhatsJSX.TagName | WhatsJSX.ComponentProducer
type Node = HTMLElement | SVGElement | Text

export abstract class Controller<T extends Type, N extends Node | Node[]> {
    abstract dispose(): void

    protected mutator: JsxMutator<T, N>
    private readonly atom: Atom<N>
    private reconciler?: Reconciler

    constructor(mutator: JsxMutator<T, N>) {
        this.mutator = mutator
        this.atom = createAtom<N>(controller, this)
        this.reconciler = new Reconciler()
    }

    setMutator(mutator: JsxMutator<T, N>) {
        if (!isEqualMutators(this.mutator, mutator)) {
            this.mutator = mutator
            this.atom.setCacheState(CacheState.Dirty)
        }
    }

    getNodes() {
        return this.atom.get()
    }

    reconcile(child: WhatsJSX.Child | WhatsJSX.Child[]) {
        if (!this.reconciler) {
            this.reconciler = new Reconciler()
        }

        return this.reconciler.reconcile(child)
    }

    hasReconciler() {
        return !!this.reconciler
    }
}

function* controller<T extends Type, N extends Node | Node[]>(this: Controller<T, N>) {
    try {
        while (true) {
            yield this.mutator
        }
    } finally {
        this.dispose()
    }
}

export abstract class ElementController<N extends Exclude<Node, Text>> extends Controller<WhatsJSX.TagName, N> {
    abstract createElement(): N

    private oldProps?: Props

    getOldProps() {
        return this.oldProps
    }

    setOldProps(oldProps: Props | undefined) {
        this.oldProps = oldProps
    }

    hasOldProps() {
        return !!this.oldProps
    }
}

export class HTMLElementController extends ElementController<HTMLElement> {
    createElement(): HTMLElement {
        return document.createElement(this.mutator.type)
    }

    dispose() {}
}

export class SVGElementController extends ElementController<SVGElement> {
    createElement(): SVGElement {
        return document.createElementNS(SVG_NAMESPACE, this.mutator.type)
    }

    dispose() {}
}

export abstract class ComponentController<T extends WhatsJSX.ComponentProducer> extends Controller<T, Node | Node[]> {
    abstract produce(): WhatsJSX.Child
    abstract handleError(e: Error): WhatsJSX.Child
    abstract dispose(): void

    readonly context: Context

    constructor(mutator: JsxMutator<T, Node | Node[]>) {
        super(mutator)
        this.context = createContext(mutator.type.name)
    }
}

export class FnComponentController extends ComponentController<WhatsJSX.FnComponentProducer> {
    produce() {
        const { type, props } = this.mutator
        const { context } = this

        return type.call(context, props, context)
    }

    handleError(e: Error): WhatsJSX.Child {
        throw e
    }

    dispose() {}
}

export class GnComponentController extends ComponentController<WhatsJSX.GnComponentProducer> {
    private iterator?: Iterator<WhatsJSX.Child | never, WhatsJSX.Child | unknown, unknown> | undefined

    produce() {
        const { type, props } = this.mutator
        const { context } = this

        if (!this.iterator) {
            this.iterator = type.call(context, props, context)
        }

        const { done, value } = this.iterator.next(props)

        if (done) {
            this.iterator = undefined
        }

        return value as WhatsJSX.Child
    }

    handleError(e: Error): WhatsJSX.Child {
        if (this.iterator) {
            const { done, value } = this.iterator.throw!(e)

            if (done) {
                this.iterator = undefined
            }

            return value as WhatsJSX.Child
        }

        throw e
    }

    dispose() {
        if (this.iterator) {
            this.iterator.return!()
            this.iterator = undefined
        }
    }
}

const isEqualMutators = <T extends JsxMutator<any, any>>(prev: T, next: T) => {
    if (prev === next) {
        return true
    }

    return (
        prev.key === next.key &&
        prev.type === next.type &&
        prev.ref === next.ref &&
        prev.onMount === next.onMount &&
        prev.onUnmount === next.onUnmount &&
        isEqualProps(prev.props, next.props)
    )
}

const isEqualProps = <T extends Props>(prev: T, next: T) => {
    if (prev === next) {
        return true
    }

    const prevKeys = Object.keys(prev)
    const nextKeys = Object.keys(next)

    if (prevKeys.length !== nextKeys.length) {
        return false
    }

    for (const key of prevKeys) {
        if (key === 'style') {
            if (!isEqualStyle(prev.style || EMPTY_OBJ, next.style || EMPTY_OBJ)) {
                return false
            }

            continue
        }

        if (key === 'children') {
            if (!isEqualChildren(prev.children, next.children)) {
                return false
            }

            continue
        }

        if (prev[key] !== next[key]) {
            return false
        }
    }

    return true
}

const isEqualStyle = <T extends { [k: string]: string }>(prev: T, next: T) => {
    const prevKeys = Object.keys(prev)
    const nextKeys = Object.keys(next)

    if (prevKeys.length !== nextKeys.length) {
        return false
    }

    for (const key of prevKeys) {
        if (prev[key] !== next[key]) {
            return false
        }
    }

    return true
}

const isEqualChildren = <T extends WhatsJSX.Child | undefined>(prev: T, next: T) => {
    if (prev === next) {
        return true
    }

    const prevIsArray = Array.isArray(prev)
    const nextIsArray = Array.isArray(next)

    if (prevIsArray && nextIsArray) {
        if (prev.length !== next.length) {
            return false
        }

        for (let i = 0; i < prev.length; i++) {
            if (isEqualChildren(prev[i], next[i])) {
                prev[i] === next[i]
                continue
            }

            return false
        }

        return true
    }

    if (prevIsArray || nextIsArray) {
        return false
    }

    const prevIsMutator = prev instanceof JsxMutator
    const nextIsMutator = next instanceof JsxMutator

    if (prevIsMutator && nextIsMutator) {
        return isEqualMutators(prev, next)
    }

    return false

    // if (prevIsMutator || nextIsMutator) {
    //     return false
    // }

    // return prev === next
}
