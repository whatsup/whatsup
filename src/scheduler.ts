import { Delegation } from './delegation'
import { Mutator } from './mutator'
import { Atom } from './atom'
import { Command, Handshake } from './command'
import { Err, Data, Result } from './result'
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

    include(atom: Atom) {
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

    run() {
        this.initializing = false

        const { queue } = this

        let i = 0

        while (i < queue.length) {
            const atom = queue[i++]
            const consumers = atom.consumers
            const oldCache = atom.cache

            build.call(atom, memory.call(atom, relations.call(atom, source.call(atom))), [memory, relations]).next()

            const newCache = atom.cache!

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

function* build<T, U extends T>(this: Atom, iterator: Generator<unknown, Err | Data<U>>, layers: any[]): any {
    const stack = new Stack<Generator<unknown, Err | Data<U>>>()

    main: while (true) {
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
                iterator = layers.reduceRight((acc, layer) => layer.call(value, acc), source.call(value))
                //iterator = memory.call(value, relations.call(value, source.call(value, value)))
                continue main
            }

            throw 'What`s up? It shouldn`t have happened'
        }
    }
}

export function once(atom: Atom) {
    return build.call(atom, clean.call(atom, source.call(atom)), [clean]).next()
}

export function* clean<T>(this: Atom, iterator: StreamIterator<T>): any {
    let input: unknown

    while (true) {
        const { done, value } = iterator.next(input)

        if (value instanceof Mutator) {
            input = value.mutate()
            continue
        }
        if (value instanceof Handshake) {
            const { stream, multi } = value
            const subAtom = this.atomizer.get(stream, multi)

            input = yield subAtom
            continue
        }

        if (done) {
            return value
        }

        input = yield value
    }
}

export function* memory<T>(this: Atom, iterator: StreamIterator<T>): any {
    let input: unknown

    while (true) {
        const { done, value } = iterator.next(input)

        if (value instanceof Result) {
            this.setCache(value)
        }

        if (value instanceof Mutator) {
            input = value.mutate(this.cache?.value as T | undefined)
            continue
        }

        if (value instanceof Atom && value.cache) {
            input = value.cache
            continue
        }

        if (done) {
            return value
        }

        input = yield value
    }
}

export function* relations<T>(this: Atom, iterator: StreamIterator<T>): any {
    let input: unknown

    this.dependencies.swap()

    while (true) {
        const { done, value } = iterator.next(input)

        if (done) {
            this.dependencies.disposeUnused()
            return value
        }

        if (value instanceof Handshake) {
            const { stream, multi } = value
            const subAtom = this.atomizer.get(stream, multi)

            this.dependencies.add(subAtom)
            subAtom.consumers.add(this)

            input = yield subAtom
            continue
        }

        input = yield value
    }
}

function* source<T, U extends T>(this: Atom<T>): Generator<unknown, Err | Data<U>> {
    const { context, stream, stack } = this

    if (stack.empty) {
        stack.push(stream.whatsUp!.call(stream, context) as StreamIterator<U>)
    }

    let input: unknown

    while (true) {
        if (input instanceof Data && input.value instanceof Delegation) {
            stack.push(input.value.stream[Symbol.iterator]())
            input = undefined
        }

        let done: boolean
        let error: boolean
        let value: U | Command | Delegation<U> | Mutator<U>

        try {
            const result = stack.peek().next(input)

            value = result.value!
            done = result.done!
            error = false
        } catch (e) {
            value = e
            done = true
            error = true
        }

        if (done) {
            stack.pop()
        }

        if (value instanceof Handshake) {
            input = yield value
            continue
        }

        if (error) {
            input = new Err(value as Error)
        } else if (value instanceof Mutator) {
            input = new Data(yield value)
        } else {
            input = new Data(value)
        }

        if (done && !stack.empty) {
            continue
        }

        return input as any
    }
}

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
