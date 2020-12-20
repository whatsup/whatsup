import { Delegation } from './stream'
import { Context } from './context'

export interface DeferActor<A> {
    (arg: A): void
    break(): void
}

export type DefGenerator<T, A> = (context: Context, arg: A) => Generator<T>
export type Resolver<T, A> = (arg: A) => T | Delegation<T>

export class Defer<T, A> {
    private readonly resolver: Resolver<T, A>
    private result!: T | Delegation<T>
    private resolved = false
    private breaked = false

    constructor(resolver: Resolver<T, A>) {
        this.resolver = resolver
    }

    actor() {
        const fn = (arg: A) => this.resolve(arg)

        Object.defineProperties(fn, {
            break: {
                value: () => this.break(),
            },
        })

        return (fn as any) as DeferActor<A>
    }

    resolve(arg: A) {
        if (this.resolved || this.breaked) {
            return this.result
        }

        this.resolved = true

        return (this.result = this.resolver(arg))
    }

    break() {
        if (this.breaked) {
            throw 'Already'
        }

        this.breaked = true
    }
}
