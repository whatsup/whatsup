import { Delegation } from './stream'
import { Context } from './context'

export type DeferActor<T, A> = ((arg: A) => T) & { dispose(): void }
export type DeferGenerator<T, A> = (context: Context, arg: A) => Generator<T, T>
export type DeferResolver<T, A> = (arg: A) => T | Delegation<T>

export class Defer<T, A> {
    private readonly resolver: DeferResolver<T, A>
    private readonly onDispose: () => void
    private disposed = false

    constructor(resolver: DeferResolver<T, A>, onDispose: () => void) {
        this.resolver = resolver
        this.onDispose = onDispose
    }

    actor() {
        const actor = (arg: A) => this.resolve(arg)

        return Object.defineProperties(actor, {
            dispose: {
                value: () => this.dispose(),
            },
        }) as DeferActor<T, A>
    }

    resolve(arg: A) {
        if (this.disposed) {
            throw 'Already breaked'
        }

        return this.resolver(arg)
    }

    dispose() {
        this.disposed = true
        this.onDispose()
    }
}
