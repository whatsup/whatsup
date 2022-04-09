import { Atom } from './atom'

class Transaction {
    readonly key = Symbol('Transaction key')
    private readonly queue = [] as Atom[]
    private readonly queueCandidates = new Set<Atom>()
    private readonly counters = new Map<Atom, number>()
    private started = false

    get pending() {
        return !this.started
    }

    addEntry(atom: Atom) {
        if (!this.queue.includes(atom)) {
            this.queue.push(atom)
        }
    }

    run() {
        this.started = true

        const { queue } = this

        for (let atom of queue) {
            this.incrementCounters(atom)
        }

        let i = 0

        while (i < queue.length) {
            const atom = queue[i++]
            const consumers = atom.consumers

            if (atom.rebuild()) {
                for (const consumer of consumers) {
                    this.queueCandidates.add(consumer)
                }
            }

            this.decrementCounters(consumers)
        }
    }

    private incrementCounters(atom: Atom) {
        for (const consumer of atom.consumers) {
            const counter = this.incrementCounter(consumer)

            if (counter > 1 || !consumer.hasConsumers()) {
                continue
            }

            this.incrementCounters(consumer)
        }
    }

    private decrementCounters(consumers: Iterable<Atom>) {
        for (const consumer of consumers) {
            const counter = this.decrementCounter(consumer)

            if (counter === 0) {
                if (this.queueCandidates.has(consumer)) {
                    this.queueCandidates.delete(consumer)
                    this.queue.push(consumer)
                    continue
                }

                this.decrementCounters(consumer.consumers)
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

export const transaction = <T>(cb: (transaction: Transaction) => T): T => {
    let key: symbol
    let transaction: Transaction

    if (master === null) {
        transaction = master = new Transaction()
        key = transaction.key
    } else if (master.pending) {
        transaction = master
    } else if (slave === null) {
        transaction = slave = new Transaction()
        key = transaction.key
    } else if (slave.pending) {
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

export const action = <T>(cb: () => T) => {
    return transaction(() => cb())
}
