import { Atom } from './atom'

let CURRENT_TRANSACTION: Transaction | null = null

export function createTransactionKey() {
    return Symbol('Transaction key')
}

export function initTransaction(key: symbol) {
    if (!CURRENT_TRANSACTION) {
        CURRENT_TRANSACTION = new Transaction(key)
    } else if (CURRENT_TRANSACTION.isRunned()) {
        throw 'Do not start a new transaction inside a transaction'
    }

    return CURRENT_TRANSACTION
}

export function transaction<T>(cb: () => T) {
    const key = createTransactionKey()
    const transaction = initTransaction(key)
    const result = cb.call(undefined)

    transaction.run(key)

    return result
}

export const action = transaction

class Transaction {
    private readonly key: symbol
    private readonly queue = [] as Atom[]
    private readonly queueCandidates = new Set<Atom>()
    private readonly counters = new WeakMap<Atom, number>()
    private runned = false

    constructor(key: symbol) {
        this.key = key
    }

    isRunned() {
        return this.runned
    }

    add(atom: Atom) {
        if (!this.queue.includes(atom)) {
            this.queue.push(atom)
            this.addConsumers(atom.getConsumers())
        }
    }

    run(key: symbol) {
        if (key === this.key) {
            this.runned = true

            const { queue } = this

            let i = 0

            while (i < queue.length) {
                const atom = queue[i++]
                const oldCache = atom.getCache()

                atom.build()

                const newCache = atom.getCache()
                const consumers = atom.getConsumers()

                if (!newCache!.equal(oldCache)) {
                    for (const consumer of consumers) {
                        this.queueCandidates.add(consumer)
                    }
                }

                this.updateQueue(consumers)
            }

            CURRENT_TRANSACTION = null
        }
    }

    private addConsumers(consumers: Iterable<Atom>) {
        for (const consumer of consumers) {
            const counter = this.incrementCounter(consumer)

            if (counter > 1) {
                continue
            }

            this.addConsumers(consumer.getConsumers())
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

                this.updateQueue(consumer.getConsumers())
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
