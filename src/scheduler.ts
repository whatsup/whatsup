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

            if (atom.rebuild()) {
                for (const observer of atom.observers) {
                    this.queueCandidates.add(observer)
                }
            }

            this.decrementCounters(atom.observers)
        }
    }

    private incrementCounters(atom: Atom) {
        for (const observer of atom.observers) {
            const counter = this.incrementCounter(observer)

            if (counter > 1 || !observer.hasObservers()) {
                continue
            }

            this.incrementCounters(observer)
        }
    }

    private decrementCounters(observers: Iterable<Atom>) {
        for (const observer of observers) {
            const counter = this.decrementCounter(observer)

            if (counter === 0) {
                if (this.queueCandidates.has(observer)) {
                    this.queueCandidates.delete(observer)
                    this.queue.push(observer)
                    continue
                }

                this.decrementCounters(observer.observers)
            }
        }
    }

    private incrementCounter(observer: Atom) {
        const counter = this.counters.has(observer) ? this.counters.get(observer)! + 1 : 1

        this.counters.set(observer, counter)

        return counter
    }

    private decrementCounter(observer: Atom) {
        const counter = this.counters.get(observer)! - 1

        this.counters.set(observer, counter)

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

export const isBuildProcess = () => {
    return master !== null && !master.pending
}
