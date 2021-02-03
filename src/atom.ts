import { StreamIterator, Stream, StreamGeneratorFunc } from './stream'
import { Context } from './context'
import { Dependencies } from './dependencies'
import { Command, InitCommand } from './command'
import { Mutator } from './mutator'
import { SCHEDULER } from './scheduler'
import { Err, Data } from './result'
import { Stack } from './stack'
import { Delegation } from './delegation'

export class Atom<T = unknown> {
    readonly stream: Stream<T>
    readonly context: Context
    private readonly stack: Stack<StreamIterator<T>>
    private readonly atomizer: Atomizer
    private readonly consumers: Set<Atom>
    private readonly dependencies: Dependencies
    private cache: Err | Data<T> | undefined

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

    exec<U extends T>(generator: StreamGeneratorFunc<U>): Data<U> | Err {
        return this.do(generator, { ignoreCache: true })
    }

    build(): Err | Data<T> {
        return this.do(this.stream.whatsUp, {
            useSelfStack: true,
            useDependencies: true,
            ignoreCacheOnce: true,
        })
    }

    do<U extends T>(generator: StreamGeneratorFunc<U>, options: DoOptions = {}): Err | Data<U> {
        const { useSelfStack = false, useDependencies = false, ignoreCacheOnce = false, ignoreCache = false } = options

        if (ignoreCacheOnce) {
            options.ignoreCacheOnce = false
        } else if (!ignoreCache && this.cache) {
            return this.cache as Err | Data<U>
        }

        const { context, stream } = this
        const stack = useSelfStack ? this.stack : new Stack<StreamIterator<U>>()
        const dependencies = useDependencies ? this.dependencies : null

        dependencies && dependencies.swap()

        if (stack.empty) {
            stack.push(generator.call(stream, context) as StreamIterator<U>)
        }

        let input: unknown

        while (true) {
            let done: boolean
            let error: boolean
            let value: U | Command | Delegation<U> | Mutator<U>

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

                const result = error ? new Err(value as Error) : new Data(this.prepareNewData(value as U))

                if (!stack.empty) {
                    input = result
                    continue
                }

                return (this.cache = result)
            }
            if (value instanceof InitCommand) {
                const { stream, multi } = value
                const atom = this.atomizer.get(stream, multi)

                dependencies && dependencies.add(atom)
                atom.addConsumer(this)

                input = atom.do(atom.stream.whatsUp, options)

                if (input instanceof Data && input.value instanceof Delegation) {
                    stack.push(input.value.stream[Symbol.iterator]())
                    input = undefined
                }
                continue
            }

            dependencies && dependencies.disposeUnused()

            const data = this.prepareNewData(value as U)
            const result = new Data(data)

            return (this.cache = result)
        }
    }

    private prepareNewData<U extends T>(value: U | Mutator<U>): U {
        if (value instanceof Mutator) {
            const oldValue = this.cache && this.cache.value
            const newValue = value.mutate(oldValue as U) as U
            return newValue
        }

        return value
    }
}

type DoOptions = {
    useSelfStack?: boolean
    useDependencies?: boolean
    ignoreCache?: boolean
    ignoreCacheOnce?: boolean
}

// class AtomMap {
//     readonly key = Symbol()

//     has<T>(stream: Stream<T>) {
//         return Reflect.has(stream, this.key)
//     }

//     get<T>(stream: Stream<T>) {
//         return Reflect.get(stream, this.key)
//     }

//     set<T>(stream: Stream<T>, atom: Atom<T>) {
//         return Reflect.set(stream, this.key, atom)
//     }
// }

class Atomizer {
    static readonly map = new WeakMap<Stream, Atom>()

    private readonly root: Atom
    private readonly map: WeakMap<Stream, Atom>

    constructor(root: Atom) {
        this.root = root
        this.map = new WeakMap()
    }

    get<T>(stream: Stream<T>, multi: boolean): Atom<T> {
        if (multi) {
            if (!this.map.has(stream)) {
                const atom = new Atom(stream, this.root)
                this.map.set(stream, atom)
            }

            return this.map.get(stream) as Atom<T>
        }

        if (!Atomizer.map.has(stream)) {
            Atomizer.map.set(stream, new Atom(stream, null))
        }

        return Atomizer.map.get(stream) as Atom<T>
    }
}
