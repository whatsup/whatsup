import { Observable, observable } from '@whatsup/core'
import { Event, EventCtor, EventListener } from './event'

type Ctor<T> = Function | (new (...args: unknown[]) => T)

export class Context {
    /** @internal */
    readonly parent: Context | null

    /** @internal */
    readonly name: string

    /** @internal */
    private shared?: Map<symbol | ContextKey<unknown> | Ctor<unknown>, unknown>

    /** @internal */
    private listeners?: WeakMap<EventCtor<any>, Set<EventListener<any>>>

    /** @internal */
    private deferred?: Promise<unknown>

    /** @internal */
    private deferredTrigger?: Observable<boolean>

    constructor(parent: Context | null, name: string) {
        this.parent = parent
        this.name = name
    }

    share<T>(key: symbol, value: T): void
    share<T>(key: ContextKey<T>, value: T): void
    share<T>(instance: T & { constructor: Ctor<T> }): void
    share<T>(...args: unknown[]) {
        let key: symbol | ContextKey<T> | Ctor<T>
        let value: T

        if (args.length === 2) {
            key = args[0] as symbol | ContextKey<T>
            value = args[1] as T
        } else {
            key = (args[0] as T & { constructor: Ctor<T> }).constructor
            value = args[0] as T
        }

        if (!this.shared) {
            this.shared = new Map()
        }

        this.shared.set(key, value)
    }

    find<T>(key: symbol): T
    find<T>(key: ContextKey<T>): T
    find<T>(key: Ctor<T>): T
    find<T>(key: symbol | ContextKey<T> | Ctor<T>): T {
        let { parent } = this

        while (parent) {
            const { shared } = parent

            if (shared) {
                if (typeof key === 'symbol' || key instanceof ContextKey) {
                    if (shared.has(key)) {
                        return shared.get(key) as T
                    }
                } else {
                    for (const item of shared.values()) {
                        if (item instanceof key) {
                            return item as T
                        }
                    }
                }
            }

            parent = parent.parent
        }

        if (key instanceof ContextKey && key.hasDefaultValue) {
            return key.defaultValue!
        }

        throw new Error(`${key.toString()} not found in context`)
    }

    on<T extends Event>(ctor: EventCtor<T>, listener: EventListener<T>) {
        if (!this.listeners) {
            this.listeners = new WeakMap()
        }
        if (!this.listeners.has(ctor)) {
            this.listeners.set(ctor, new Set())
        }

        this.listeners.get(ctor)!.add(listener)

        return () => this.off(ctor, listener)
    }

    off<T extends Event>(ctor: EventCtor<T>, listener?: EventListener<T>) {
        if (this.listeners && this.listeners.has(ctor)) {
            if (listener) {
                this.listeners.get(ctor)!.delete(listener)
            } else {
                this.listeners.delete(ctor)
            }
        }
    }

    dispatch<T extends Event>(event: T) {
        const ctor = event.constructor as EventCtor<T>

        if (this.listeners && this.listeners.has(ctor)) {
            const listeners = this.listeners.get(ctor)!

            for (const listener of listeners) {
                listener(event)

                if (event.isPropagationImmediateStopped()) {
                    break
                }
            }
        }

        if (this.parent instanceof Context && !event.isPropagationStopped()) {
            this.parent.dispatch(event)
        }
    }

    /*
                    здесь
    ctx.defer(()=>                          а здесь
                    будет идти
    ctx.defer(()=>                          пойдет
                    ветка синхронного
    ctx.defer(()=>                          ветка
                    кода
    ctx.defer(()=>                          асинхронного кода )
                    все
    ctx.defer(()=>                          будут в правильном
                    контексты
    ctx.defer(()=>                          порядке )
    */

    defer<T>(deffered: () => Promise<T>) {
        const promise = this.deferred ? this.deferred.then(deffered) : deffered()
        const result = { done: false } as { done: boolean; value?: T }

        if (!this.deferredTrigger) {
            this.deferredTrigger = observable(false)
            this.deferredTrigger.get()
        }

        promise.then((r) => {
            result.done = true
            result.value = r

            if (this.deferred === promise) {
                this.deferredTrigger!.set(true)
                this.deferred = undefined
                this.deferredTrigger = undefined
            }
        })

        this.deferred = promise

        return result
    }
}

export class ContextKey<T = unknown> {
    readonly defaultValue?: T
    readonly hasDefaultValue: boolean

    constructor(defaultValue?: T) {
        this.defaultValue = defaultValue
        this.hasDefaultValue = !!arguments.length
    }
}

interface ContextKeyFactory {
    <T>(defaultValue?: T): ContextKey<T>
}

export const createKey: ContextKeyFactory = <T>(...args: [T?]) => {
    return new ContextKey(...args)
}

const CTX_STACK = [] as Context[]

export const createContext = (name: string) => {
    const parent = CTX_STACK.length === 0 ? null : CTX_STACK[CTX_STACK.length - 1]

    return new Context(parent, name)
}

export const addContextToStack = (ctx: Context) => {
    CTX_STACK.push(ctx)
}

export const popContextFromStack = () => {
    CTX_STACK.pop()
}
