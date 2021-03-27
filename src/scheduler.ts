import { Delegation } from './delegation'
import { Mutator } from './mutator'
import { Atom } from './atom'
import { Command, Handshake } from './command'
import { Err, Data, Cache } from './cache'
import { Stack } from './stack'
import { Payload, StreamIterator } from './stream'

class Transaction {
    initializing = true
    readonly key = Symbol('Transaction key')
    private readonly queue = [] as Atom[]
    private readonly queueCandidates = new Set<Atom>()
    private readonly counters = new Map<Atom, number>()

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
            const oldCache = atom.getCache()
            const newCache = build(atom, cache, relations)

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

type Layer<T> = (this: Atom<T>, iterator: StreamIterator<T>) => StreamIterator<T>

function build<T>(atom: Atom<T>, ...layers: Layer<T>[]): Err | Data<T> {
    const stack = new Stack<StreamIterator<T>>()

    main: while (true) {
        const iterator = layers.reduceRight((it, layer) => layer.call(atom, it), source.call(atom) as StreamIterator<T>)

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

                return value as Err | Data<T>
            }

            if (value instanceof Atom) {
                atom = value
                continue main
            }

            throw 'What`s up? It shouldn`t have happened'
        }
    }
}

export function once(atom: Atom) {
    return build(atom, clean)
}

export function* clean<T>(this: Atom, iterator: StreamIterator<T>): StreamIterator<T> {
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
            return value as Payload<T>
        }

        input = yield value
    }
}

export function* cache<T>(this: Atom, iterator: StreamIterator<T>): StreamIterator<T> {
    let input: unknown

    while (true) {
        const { done, value } = iterator.next(input)

        if (value instanceof Cache) {
            this.setCache(value)
        }

        if (value instanceof Mutator) {
            const prevValue = this.hasCache() ? this.getCache()!.value : undefined
            input = value.mutate(prevValue as T | undefined)
            continue
        }

        if (value instanceof Atom && value.hasCache()) {
            input = value.getCache()
            continue
        }

        if (done) {
            return value as Payload<T>
        }

        input = yield value
    }
}

export function* relations<T>(this: Atom, iterator: StreamIterator<T>): StreamIterator<T> {
    let input: unknown

    this.dependencies.swap()

    while (true) {
        const { done, value } = iterator.next(input)

        if (done) {
            this.dependencies.disposeUnused()
            return value as Payload<T>
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

function* source<T>(this: Atom<T>): StreamIterator<T> {
    const { context, stream, stack } = this

    if (stack.empty) {
        stack.push(stream.whatsUp.call(stream, context) as StreamIterator<T>)
    }

    let input: unknown

    while (true) {
        if (input instanceof Data && input.value instanceof Delegation) {
            stack.push(input.value.stream[Symbol.iterator]())
            input = undefined
        }

        let done: boolean
        let error: boolean
        let value: Command | Payload<T> | Error

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

        if (value instanceof Command) {
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

        return input as Payload<T>
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
