import { StreamIterator, Stream, StreamGeneratorFunc } from './stream'
import { Context } from './context'
import { Dependencies } from './dependencies'
import { Command, InitCommand } from './query'
import { Mutator } from './mutator'
import { SCHEDULER } from './scheduler'
import { Err, Data } from './result'
import { Stack } from './stack'
import { ActorGenerator } from './actor'
import { Atomizer } from './atomizer'
import { Delegation } from './delegation'

export class Atom<T = any> {
    readonly stream: Stream<T>
    readonly context: Context
    private readonly stack: Stack<StreamIterator<T>>
    private readonly atomizer: Atomizer<T>
    private readonly consumers: Set<Atom>
    private readonly dependencies: Dependencies
    private cache: Err | Data<T | Delegation<T>> | undefined

    constructor(stream: Stream<T>, parent: Atom | null) {
        this.stack = new Stack()
        this.stream = stream
        this.context = new Context(this, parent && parent.context)
        this.atomizer = new Atomizer(this)
        this.consumers = new Set()
        this.dependencies = new Dependencies(this)
    }

    addConsumer(consumer: Atom) {
        this.consumers.add(consumer)
    }

    getConsumers() {
        return this.consumers
    }

    getCache() {
        return this.cache
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
            let done: boolean
            let error: boolean
            let value: U | Command | Atom<any>

            try {
                const result = stack.last.next(input)

                done = result.done!
                error = false
                value = result.value!
            } catch (e) {
                done = false
                error = true
                value = e
            }

            if (done || error) {
                stack.pop()

                const result = error ? new Err(value as any) : new Data(this.prepareNewData(value as T))

                if (!stack.empty) {
                    input = result
                    continue
                }

                return result as any
            }
            if (value instanceof InitCommand) {
                const { stream, multi } = value
                const atom = this.atomizer.get(stream, multi)

                input = atom.exec(function (this: Stream<any>, ctx: Context) {
                    return this.whatsUp(ctx)
                }, null)

                if (input instanceof Data && input.value instanceof Delegation) {
                    stack.push(input.value.stream[Symbol.iterator](null as any))
                    input = undefined
                }
                continue
            }

            const data = this.prepareNewData(value as T)
            const result = new Data(data)

            return result as any
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

        while (true) {
            let done: boolean
            let error: boolean
            let value: any

            try {
                const result = stack.last.next(input)

                done = result.done!
                error = false
                value = result.value!
            } catch (e) {
                done = false
                error = true
                value = e
            }

            if (done || error) {
                stack.pop()

                const result = error ? new Err(value as any) : new Data(this.prepareNewData(value as T))

                if (!stack.empty) {
                    input = result
                    continue
                }

                return result as any
            }
            if (value instanceof InitCommand) {
                const { stream, multi } = value
                const atom = this.atomizer.get(stream, multi)

                dependencies.add(atom)
                atom.addConsumer(this)

                input = atom.lazyBuild()

                if (input instanceof Data && input.value instanceof Delegation) {
                    stack.push(input.value.stream[Symbol.iterator](null as any))
                    input = undefined
                }
                continue
            }

            dependencies.disposeUnused()

            const data = this.prepareNewData(value as T)
            const result = new Data(data)

            return result
        }
    }

    private prepareNewData(value: T): T | Delegation<T> {
        if (value instanceof Mutator) {
            const oldValue = this.cache && this.cache.value
            const newValue = value.mutate(oldValue) as T
            return newValue
        }

        return value
    }
}
