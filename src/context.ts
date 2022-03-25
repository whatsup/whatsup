import { Factor } from './factor'
import { Event, EventCtor, EventListener } from './event'
import { Atom } from './atom'
import { transaction } from './scheduler'

type Ctor<T> = Function | (new (...args: unknown[]) => T)

export class Context implements Context {
    /** @internal */
    readonly parent: Context | null

    /** @internal */
    shared: Map<Factor<unknown> | Ctor<unknown>, unknown> | undefined

    /** @internal */
    listeners: WeakMap<EventCtor<any>, Set<EventListener<any>>> | undefined

    /** @internal */
    private atom!: Atom

    constructor(parent: Context | null, atom: Atom) {
        this.atom = atom
        this.parent = parent
    }

    share<T>(key: Factor<T>, value: T): void
    share<T>(instance: T & { constructor: Ctor<T> }): void
    share<T>(...args: unknown[]) {
        let key: Factor<T> | Ctor<T>
        let value: T

        if (args.length === 2) {
            key = args[0] as Factor<T>
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

    get<T>(key: Factor<T>): T
    get<T>(key: Ctor<T>): T
    get<T>(key: Factor<T> | Ctor<T>): T {
        let { parent } = this

        while (parent) {
            const { shared } = parent

            if (shared && shared.has(key)) {
                return shared.get(key) as T
            }

            parent = parent.parent
        }

        if (key instanceof Factor && key.hasDefaultValue) {
            return key.defaultValue!
        }

        throw `${key} not found in context`
    }

    find<T>(ctor: Ctor<T>): T {
        let { parent } = this

        while (parent) {
            const { shared } = parent

            if (shared) {
                for (const item of shared.values()) {
                    if (item instanceof ctor) {
                        return item as T
                    }
                }
            }

            parent = parent.parent
        }

        throw `Instance of ${ctor} not found in context`
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

    /** @internal */
    private deferred: Promise<unknown> | null = null

    defer<T>(deffered: () => Promise<T>) {
        const promise = this.deferred ? this.deferred.then(deffered) : deffered()
        const result = { done: false } as { done: boolean; value?: T }

        promise.then((r) => {
            result.done = true
            result.value = r

            if (this.deferred === promise) {
                this.deferred = null
                this.update()
            }
        })

        this.deferred = promise

        return result
    }

    update() {
        transaction((t) => t.include(this.atom))
    }

    /** @internal */
    dispose() {
        this.shared = undefined
        this.listeners = undefined
    }
}
