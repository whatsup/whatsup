import { Factor } from './factor'
import { Event, EventCtor, EventListener } from './event'
import { Atom } from './atom'
import { Err } from './result'
import { StreamLike } from './stream'
import { once, transaction } from './scheduler'

type Ctor<T> = Function | (new (...args: unknown[]) => T)

export class Context {
    /**@internal */
    readonly parent: Context | null

    private readonly atom: Atom
    private shared: WeakMap<Factor<unknown> | Ctor<unknown>, unknown> | undefined
    private listeners: WeakMap<EventCtor<any>, Set<EventListener<any>>> | undefined

    constructor(atom: Atom, parent: Context | null) {
        this.atom = atom
        this.parent = parent
    }

    /**@internal */
    getShared() {
        return this.shared
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
            this.shared = new WeakMap()
        }

        this.shared.set(key, value)
    }

    find<T>(key: Factor<T>): T | undefined
    find<T>(key: Ctor<T>): T | undefined
    find<T>(key: Factor<T> | Ctor<T>): T | undefined {
        let parent = this.parent as Context | null

        while (parent) {
            const shared = parent.getShared()

            if (shared && shared.has(key)) {
                return shared.get(key) as T
            }

            parent = parent.parent
        }

        if (key instanceof Factor) {
            return key.defaultValue
        }

        return undefined
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

    dispath<T extends Event>(event: T) {
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
            this.parent.dispath(event)
        }
    }

    actor<T, A extends unknown[]>(generator: (this: StreamLike<T>, context: Context, ...args: A) => Generator<T, T>) {
        return (...args: A) => {
            const self = this.atom.stream as StreamLike<T>
            const source = {
                whatsUp(context: Context) {
                    return generator.call(self, context, ...args)
                },
            } as StreamLike<T>
            const atom = new Atom(source, null)
            const result = once(atom).value

            if (result instanceof Err) {
                throw result.value
            }

            return result.value
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
        transaction((task) => task.take(this.atom))
    }

    dispose() {
        this.shared = undefined
        this.listeners = undefined
    }
}
