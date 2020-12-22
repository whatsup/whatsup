import { Factor } from './factor'
import { Event, EventCtor, EventListener } from './event'
import { Atom } from './atom'
import { ActorGenerator } from './actor'

export class Context {
    /**@internal */
    readonly parent: Context | null

    private readonly atom: Atom
    private factors!: WeakMap<Factor<any>, any>
    private listeners!: WeakMap<EventCtor, Set<EventListener>>

    constructor(atom: Atom, parent: Context | null) {
        this.atom = atom
        this.parent = parent
    }

    /**@internal */
    getFactors() {
        return this.factors
    }

    get<T>(factor: Factor<T>): T | undefined {
        let parent = this.parent as Context | null

        while (parent) {
            const factors = parent.getFactors()

            if (factors && factors.has(factor)) {
                return factors.get(factor)
            }

            parent = parent.parent
        }

        return factor.defaultValue
    }

    set<T>(factor: Factor<T>, value: T) {
        if (!this.factors) {
            this.factors = new WeakMap()
        }
        this.factors.set(factor, value)
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
        if (this.listeners) {
            if (this.listeners.has(ctor)) {
                if (listener) {
                    this.listeners.get(ctor)!.delete(listener)
                } else {
                    this.listeners.delete(ctor)
                }
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

    actor<T, A>(generator: ActorGenerator<T, A>) {
        return this.atom.actor(generator)
    }

    /* 
                    здесь 
    ctx.defer(()=>                          а здесь 
                    будет идти
    ctx.defer(()=>                          пойдет
                    ветка синхронного
    ctx.defer(()=>                          ветка 
                    кода
    ctx.defer(()=>                          асинхронного кода)
                    все
    ctx.defer(()=>                          контексты )
                    будут в правильном
    ctx.defer(()=>                          порядке)
    */

    // TODO rename to defer

    private asyncCurrent: Promise<any> | null = null

    async<T>(deffered: () => Promise<T>) {
        const promise = this.asyncCurrent ? this.asyncCurrent.then(deffered) : deffered()
        const result = { value: undefined } as { value: T | undefined }

        promise.then((r) => {
            result.value = r

            if (this.asyncCurrent === promise) {
                this.asyncCurrent = null
                this.update()
            }
        })

        this.asyncCurrent = promise

        return result
    }

    update() {
        this.atom.update()
    }

    dispose() {
        this.factors = undefined!
        this.listeners = undefined!
    }
}
