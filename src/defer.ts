import { Delegation } from './stream'
import { Context } from './context'

export type DeferActor<T, A> = ((arg: A) => T) & { break(): void }
export type DeferGenerator<T, A> = (context: Context, arg: A) => Generator<T, T>
export type DeferResolver<T, A> = (arg: A) => T | Delegation<T>

export class Defer<T, A> {
    private readonly resolver: DeferResolver<T, A>
    private readonly onBreak: () => void
    private breaked = false

    constructor(resolver: DeferResolver<T, A>, onBreak: () => void) {
        this.resolver = resolver
        this.onBreak = onBreak
    }

    actor() {
        const fn = (arg: A) => this.resolve(arg)

        Object.defineProperties(fn, {
            break: {
                value: () => this.break(),
            },
        })

        return (fn as any) as DeferActor<T, A>
    }

    resolve(arg: A) {
        if (this.breaked) {
            throw 'Already breaked'
        }

        return this.resolver(arg)
    }

    /* @internal */
    break() {
        this.breaked = true
        this.onBreak()
    }
}
