import { Delegation } from './delegation'
import { Mutator } from './mutator'
import { Atom } from './atom'
import { build } from './builder'
import { Command, InitCommand } from './command'
import { Err, Data } from './result'
import { Stack } from './stack'
import { StreamIterator } from './stream'

class Transaction {
    initializing = true
    readonly key: symbol
    private readonly queue = [] as Atom[]
    private readonly queueCandidates = new Set<Atom>()
    private readonly counters = new Map<Atom, number>()

    constructor() {
        this.key = Symbol('Transaction key')
    }

    take(atom: Atom) {
        if (!this.queue.includes(atom)) {
            this.queue.push(atom)

            const stack = new Stack<Iterator<Atom>>()

            main: while (true) {
                stack.push(atom.consumers[Symbol.iterator]())

                while (true) {
                    const { done, value } = stack.peek().next()

                    if (done) {
                        stack.pop()

                        if (!stack.empty) {
                            continue
                        }

                        return value
                    }

                    const counter = this.incrementCounter(value)

                    if (counter > 1) {
                        continue
                    }

                    atom = value
                    continue main
                }
            }
        }
    }

    build<T, U extends T>(atom: Atom<T>, useCache = true): Err | Data<U> {
        const stack = new Stack<Generator<unknown, Err | Data<U>>>()

        //let isRoot = true

        // options.ignoreCacheOnce = true

        main: while (true) {
            // if (isRoot) {
            //     options = { ...options, ignoreCache: true }
            //     isRoot = false
            // }
            // TODO here we can control dependencies
            const iterator = liveBuilder<T, U>(atom)

            stack.push(iterator)

            let input = undefined

            while (true) {
                const { done, value } = stack.peek().next(input)

                if (done) {
                    stack.pop()

                    if (!stack.empty) {
                        input = value
                        continue
                    }

                    return value as Err | Data<U>
                }

                if (value instanceof Atom) {
                    if (useCache && value.cache) {
                        input = value.cache
                        continue
                    }

                    atom = value
                    continue main
                }

                throw 'What`s up? It shouldn`t have happened'
            }
        }
    }

    run() {
        this.initializing = false

        const { queue } = this

        let i = 0

        while (i < queue.length) {
            const atom = queue[i++]
            const consumers = atom.consumers
            const oldCache = atom.cache
            const newCache = build(atom, null, {
                useSelfStack: true,
                useDependencies: true,
                useCache: true,
            })

            if (!newCache.equal(oldCache)) {
                for (const consumer of consumers) {
                    this.queueCandidates.add(consumer)
                }
            }

            this.updateQueue(consumers)
        }
    }

    private updateQueue(consumers: Iterable<Atom>) {
        for (const consumer of consumers) {
            const counter = this.decrementCounter(consumer)

            if (counter === 0) {
                if (this.queueCandidates.has(consumer)) {
                    this.queueCandidates.delete(consumer)
                    this.queue.push(consumer)
                    continue
                }

                this.updateQueue(consumer.consumers)
            }
        }
    }

    private incrementCounter(consumer: Atom) {
        const counter = this.counters.has(consumer) ? this.counters.get(consumer)! + 1 : 1

        this.counters.set(consumer, counter)

        return counter
    }

    private decrementCounter(consumer: Atom) {
        const counter = this.counters.get(consumer)! - 1

        this.counters.set(consumer, counter)

        return counter
    }
}

export function* liveBuilder<T, U extends T>(atom: Atom<T>): Generator<unknown, Err | Data<U>> {
    const { context, stream, stack } = atom

    atom.dependencies.swap()

    if (stack.empty) {
        stack.push(stream.whatsUp!.call(stream, context) as StreamIterator<U>)
    }

    let input: unknown

    while (true) {
        let done: boolean
        let error: boolean
        let value: U | Command | Delegation<U> | Mutator<U>

        try {
            const result = stack.peek().next(input)

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

            const result = error ? new Err(value as Error) : new Data(prepareNewData(atom, value as U))

            if (!stack.empty) {
                input = result
                continue
            }

            atom.dependencies.disposeUnused()

            atom.setCache(result)

            return result
        }
        if (value instanceof InitCommand) {
            const { stream, multi } = value
            const subAtom = atom.atomizer.get(stream, multi)

            atom.dependencies.add(subAtom)
            subAtom.consumers.add(atom)

            input = yield subAtom

            if (input instanceof Data && input.value instanceof Delegation) {
                stack.push(input.value.stream[Symbol.iterator]())
                input = undefined
            }
            continue
        }

        const data = prepareNewData(atom, value as U)
        const result = new Data(data)

        atom.dependencies.disposeUnused()

        atom.setCache(result)

        return result
    }
}

function prepareNewData<T, U extends T>(atom: Atom<T>, value: U | Mutator<U>): U {
    if (value instanceof Mutator) {
        const oldValue = atom.cache && atom.cache.value
        const newValue = value.mutate(oldValue as U) as U
        return newValue
    }

    return value
}

// function* liveBuilder1<T>(atom: Atom<T>) {
//     return yield* memory(atom)
// }

// function* memory<T>(atom: Atom<T>) {}

let master: Transaction | null = null
let slave: Transaction | null = null

export function transaction<T>(cb: (transaction: Transaction) => T): T {
    let key: symbol
    let transaction: Transaction

    if (master === null) {
        transaction = master = new Transaction()
        key = transaction.key
    } else if (master.initializing) {
        transaction = master
    } else if (slave === null) {
        transaction = slave = new Transaction()
        key = transaction.key
    } else if (slave.initializing) {
        transaction = slave
    } else {
        throw 'Task error'
    }

    const result = cb(transaction)

    while (transaction === master && transaction.key === key!) {
        transaction.run()

        master = slave
        slave = null

        if (master !== null) {
            transaction = master
            key = transaction.key
            continue
        }

        break
    }

    return result
}

export function action<T>(cb: () => T) {
    return transaction(() => cb())
}
