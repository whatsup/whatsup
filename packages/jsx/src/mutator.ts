import { Mutator } from '@whatsup/core'
import { EMPTY_OBJ } from './constants'
import { placeNodes, mutateProps, createMountObserver, createUnmountObserver } from './dom'
import { WhatsJSX } from './types'
import {
    Controller,
    ElementController,
    HTMLElementController,
    SVGElementController,
    ComponentController,
    FnComponentController,
    GnComponentController,
} from './controller'
import { addContextToStack, popContextFromStack } from './context'

export interface Props {
    children?: WhatsJSX.Child
    style?: { [k: string]: string | number }
    [k: string]: any
}

type Type = WhatsJSX.TagName | WhatsJSX.ComponentProducer

type Node = HTMLElement | SVGElement | Text

const JSX_MOUNT_OBSERVER = Symbol('JSX onMount observer')
const JSX_UNMOUNT_OBSERVER = Symbol('JSX onUnmount observer')

export abstract class JsxMutator<T extends Type, N extends Node | Node[]> extends Mutator<N> {
    abstract mutate(prev: N | undefined): N
    abstract controller?: Controller<T, N>
    protected abstract createController(): Controller<T, N>

    readonly key: string
    readonly type: T
    readonly props: Props
    readonly ref?: WhatsJSX.Ref
    readonly onMount?: (el: N) => void
    readonly onUnmount?: (el: N) => void

    constructor(
        type: T,
        key: string,
        props?: Props,
        ref?: WhatsJSX.Ref,
        onMount?: (el: N) => void,
        onUnmount?: (el: N) => void
    ) {
        super()

        this.key = key
        this.type = type
        this.props = props || EMPTY_OBJ

        if (ref) this.ref = ref
        if (onMount) this.onMount = onMount
        if (onUnmount) this.onUnmount = onUnmount
    }

    doMutation(prev?: N) {
        const { controller } = this.extractFrom(prev) || (EMPTY_OBJ as JsxMutator<T, N>)

        if (controller) {
            this.controller = controller
            this.controller.setMutator(this)
        } else {
            this.controller = this.createController()
        }

        const next = this.controller.getNodes()

        this.attachSelfTo(next)
        this.attachMountingCallbacks(next)
        this.updateRef(next)

        return next
    }

    private attachSelfTo(target: N) {
        Reflect.set(target, this.key, this)
    }

    private extractFrom(target: any): JsxMutator<T, N> | void {
        if (target != null && typeof target === 'object' && Reflect.has(target, this.key)) {
            return Reflect.get(target, this.key) as JsxMutator<T, N>
        }
    }

    private updateRef(target: N) {
        if (this.ref) {
            this.ref.current = target
        }
    }

    private attachMountingCallbacks(target: N) {
        const node: Node = Array.isArray(target) ? target[0] : target

        if (node) {
            if (this.onMount && !Reflect.has(node, JSX_MOUNT_OBSERVER)) {
                const observer = createMountObserver(node, () => this.onMount!(target))
                Reflect.set(node, JSX_MOUNT_OBSERVER, observer)
            }
            if (this.onUnmount && !Reflect.has(node, JSX_MOUNT_OBSERVER)) {
                const observer = createUnmountObserver(node, () => this.onUnmount!(target))
                Reflect.set(node, JSX_UNMOUNT_OBSERVER, observer)
            }
        }
    }
}

export abstract class ElementMutator<N extends Exclude<Node, Text>> extends JsxMutator<WhatsJSX.TagName, N> {
    protected abstract mutateProps<T extends Props>(node: HTMLElement | SVGElement, props: T, oldProps: T): void

    controller?: ElementController<N>

    mutate(node?: N): N {
        const { controller, props } = this

        if (!node) {
            node = controller!.createElement()
        }

        const oldProps = controller!.getOldProps() || EMPTY_OBJ

        this.mutateProps(node, props, oldProps)

        controller!.setOldProps(props)

        if (props?.children !== undefined || controller!.hasReconciler()) {
            const childNodes = controller!.reconcile(props?.children ?? null)

            placeNodes(node!, childNodes)
        }

        return node
    }
}

export class HTMLElementMutator extends ElementMutator<HTMLElement> {
    protected createController(): HTMLElementController {
        return new HTMLElementController(this)
    }

    protected mutateProps<T extends Props>(node: HTMLElement | SVGElement, props: T, oldProps: T) {
        mutateProps(node, props, oldProps, false)
    }
}

export class SVGElementMutator extends ElementMutator<SVGElement> {
    protected createController(): SVGElementController {
        return new SVGElementController(this)
    }

    protected mutateProps<T extends Props>(node: HTMLElement | SVGElement, props: T, oldProps: T) {
        mutateProps(node, props, oldProps, true)
    }
}

export abstract class ComponentMutator<T extends WhatsJSX.ComponentProducer> extends JsxMutator<T, Node | Node[]> {
    controller?: ComponentController<T>

    mutate(prev?: Node | Node[]): Node | Node[] {
        try {
            addContextToStack(this.controller!.context)

            const prevIsArray = Array.isArray(prev)

            let child = this.controller!.produce()
            let next: Node | Node[] | undefined
            let isEqual = true

            while (true) {
                try {
                    let i = 0
                    let nextIsArray = false

                    const nodes = this.controller!.reconcile(child)

                    for (const node of nodes) {
                        if (prevIsArray) {
                            if (prev[i] !== node) {
                                isEqual = false
                            }
                        } else if (i !== 0) {
                            isEqual = false
                        } else if (prev !== node) {
                            isEqual = false
                        }

                        /* short equality condition

                            if(prevIsArray && prev[i] !== node || !prevIsArray && (i !== 0 || prev !== node)){
                                isEqual = false
                            }

                        */

                        if (next) {
                            if (nextIsArray) {
                                ;(next as Node[]).push(node)
                            } else {
                                nextIsArray = true
                                next = [next as Node, node]
                            }
                        } else {
                            next = node
                        }

                        i++
                    }

                    if (!prevIsArray || !nextIsArray) {
                        isEqual = false
                    }

                    break
                } catch (e) {
                    child = this.controller!.handleError(e as Error)
                    next = undefined
                    isEqual = false

                    continue
                }
            }

            if (isEqual) {
                return prev!
            }

            return next ?? []
        } catch (e) {
            throw e
        } finally {
            popContextFromStack()
        }
    }
}

export class FnComponentMutator extends ComponentMutator<WhatsJSX.FnComponentProducer> {
    protected createController(): FnComponentController {
        return new FnComponentController(this)
    }
}

export class GnComponentMutator extends ComponentMutator<WhatsJSX.GnComponentProducer> {
    protected createController(): GnComponentController {
        return new GnComponentController(this)
    }
}
