import { StreamIterator, Stream, Delegation, StreamGeneratorFunc } from './stream'
import { Context } from './context'
import { Dependencies } from './dependencies'
import { InitCommand } from './query'
import { Mutator } from './mutator'
import { SCHEDULER } from './scheduler'
import { Err, Data } from './result'
import { Stack } from './stack'
import { ActorGenerator } from './actor'
import { Atomizer } from './atomizer'

export class Atom<T = any> {
    readonly stream: Stream<T>
    readonly context: Context
    private readonly stack: Stack<StreamIterator<T>>
    private readonly atomizer: Atomizer
    private readonly consumers: Set<Atom>
    private readonly dependencies: Dependencies
    // private readonly delegations: WeakMap<Stream<any>, Delegation<T>>
    private cache: Err | Data<T | Delegation<T>> | undefined

    constructor(stream: Stream<T>, parentContext: Context | null = null) {
        this.stream = stream
        this.context = new Context(this, parentContext)
        this.consumers = new Set()
        this.stack = new Stack()
        this.dependencies = new Dependencies(this)
        //this.delegations = new WeakMap()
        this.atomizer = new Atomizer(this)
    }

    addConsumer(consumer: Atom) {
        this.consumers.add(consumer)
    }

    getConsumers() {
        return this.consumers
    }

    getContext() {
        return this.context
    }

    getCache() {
        return this.cache
    }

    getCacheValue() {
        return this.cache && this.cache.value
    }

    update() {
        SCHEDULER.run((transaction) => transaction.add(this))
    }

    dispose(initiator?: Atom) {
        if (initiator) {
            this.consumers.delete(initiator)
        }
        if (this.consumers.size === 0) {
            this.cache = undefined
            this.context.dispose()
            this.dependencies.dispose()

            while (!this.stack.empty) {
                this.stack.pop()!.return!()
            }
        }
    }

    exec<U, A>(generator: ActorGenerator<U, A>, arg: A): Data<U | Delegation<U>> | Err {
        const { context, stream } = this
        const stack = new Stack<StreamIterator<U>>()

        stack.push(generator.call(stream, context, arg))

        let input: any

        while (true) {
            try {
                const { done, value } = stack.last.next(input)

                if (done) {
                    stack.pop()

                    if (!stack.empty) {
                        input = value
                        continue
                    }
                } else if (value instanceof InitCommand) {
                    const { stream, multi } = value
                    const atom = this.atomizer.get(stream, multi)

                    input = atom.exec(function (ctx: Context) {
                        return atom.stream.whatsUp(ctx)
                    }, null)
                    continue
                }

                const data = this.prepareNewData(value as any)

                return new Data(data as any)
            } catch (error) {
                return new Err(error)
            }
        }
    }

    lazyBuild() {
        if (!this.cache) {
            this.rebuild()
        }
        return this.cache
    }

    rebuild() {
        this.cache = this.build(function (this: Stream<any>, ctx: Context) {
            return this.whatsUp(ctx)
        })
    }

    build(generator: StreamGeneratorFunc<T>): Err | Data<T | Delegation<T>> {
        const { stack, dependencies, context, stream } = this

        dependencies.swap()

        if (stack.empty) {
            stack.push(generator.call(stream, context) as StreamIterator<T>)
        }

        let input: any
        let result: Err | Data<T | Delegation<T>>

        while (true) {
            try {
                const { done, value } = stack.last.next(input)

                if (done) {
                    stack.pop()

                    if (!stack.empty) {
                        input = value
                        continue
                    }
                } else if (value instanceof InitCommand) {
                    const { stream, multi } = value
                    const atom = this.atomizer.get(stream, multi)

                    dependencies.add(atom)
                    atom.addConsumer(this)

                    input = atom.lazyBuild()
                    continue
                }

                const data = this.prepareNewData(value as T)
                result = new Data(data)
            } catch (error) {
                stack.pop()
                result = new Err(error)
            }

            dependencies.disposeUnused()

            return result
        }
    }

    private prepareNewData(value: T): T | Delegation<T> {
        if (value instanceof Mutator) {
            const oldValue = this.getCacheValue()
            const newValue = value.mutate(oldValue) as T
            return newValue
        }

        // if (value instanceof Stream && this.stream instanceof DelegatingStream) {
        //     return this.getDelegation(value)
        // }

        return value
    }

    // private getDelegation(stream: Stream<any>) {
    //     if (!this.delegations.has(stream)) {
    //         const delegation = new Delegation(stream, this.context)
    //         this.delegations.set(stream, delegation)
    //     }
    //     return this.delegations.get(stream)!
    // }
}
