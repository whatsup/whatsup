import { Delegation } from './stream'
import { Context } from './context'

export type ActorController<T, A> = ((arg: A) => T) & { dispose(): void }
export type ActorGenerator<T, A> = (context: Context, arg: A) => Generator<T, T>
export type ActorResolver<T, A> = (arg: A) => T | Delegation<T>

function createController<T, A>(actor: Actor<T, A>) {
    const controller = (arg: A) => actor.resolve(arg)

    return Object.defineProperties(controller, {
        dispose: {
            value: () => actor.dispose(),
        },
    }) as ActorController<T, A>
}

export class Actor<T, A> {
    readonly controller: ActorController<T, A>
    private readonly resolver: ActorResolver<T, A>
    private readonly onDispose: () => void
    private disposed = false

    constructor(resolver: ActorResolver<T, A>, onDispose: () => void) {
        this.resolver = resolver
        this.onDispose = onDispose
        this.controller = createController(this)
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
