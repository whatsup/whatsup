import { Atom } from './atom'
import { Stack } from './stack'

class Transaction {
    initializing = true
    readonly key = Symbol('Transaction key')
    private readonly queue = [] as Atom[]
    private readonly queueCandidates = new Set<Atom>()
    private readonly counters = new Map<Atom, number>()

    include(atom: Atom) {
        if (!this.queue.includes(atom)) {
            this.queue.push(atom)
        }
    }

    run() {
        this.initializing = false

        const { queue } = this

        this.incrementCounters()

        let i = 0

        while (i < queue.length) {
            const atom = queue[i++]
            const consumers = atom.consumers
            const oldCache = atom.getCache()
            const newCache = atom.builder.build()

            if (!newCache.equal(oldCache)) {
                atom.setCache(newCache)

                for (const consumer of consumers) {
                    this.queueCandidates.add(consumer)
                }
            }

            this.updateQueue(consumers)
        }
    }

    private incrementCounters() {
        root: for (let atom of this.queue) {
            const stack = new Stack<Iterator<Atom>>()

            loop: while (true) {
                stack.push(atom.consumers[Symbol.iterator]())

                while (true) {
                    const { done, value } = stack.peek().next()

                    if (done) {
                        stack.pop()

                        if (!stack.empty) {
                            continue
                        }

                        continue root
                    }

                    const counter = this.incrementCounter(value)

                    if (counter > 1 || value.consumers.size === 0) {
                        continue
                    }

                    atom = value

                    continue loop
                }
            }
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
    return transaction(cb)
}
