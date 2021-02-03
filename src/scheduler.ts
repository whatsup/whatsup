import { Atom } from './atom'

class Scheduler {
    private master: Transaction | null = null
    private slave: Transaction | null = null

    run<T>(action: (transaction: Transaction) => T): T {
        let key = Symbol('Transaction key')
        let transaction: Transaction

        if (!this.master) {
            transaction = this.master = new Transaction(key)
        } else if (this.master.state === State.Initial) {
            transaction = this.master
        } else if (!this.slave) {
            transaction = this.slave = new Transaction(key)
        } else if (this.slave.state === State.Initial) {
            transaction = this.slave
        } else {
            throw 'Transaction error'
        }

        const result = action(transaction)

        let counter = 0

        while (transaction === this.master) {
            if (counter > 100) {
                throw 'May be cycle?'
            }

            transaction.run(key)

            if (transaction.state === State.Completed) {
                this.master = this.slave
                this.slave = null

                if (this.master) {
                    transaction = this.master
                    key = transaction.key
                    counter++
                    continue
                }
            }

            break
        }

        return result
    }
}

export const SCHEDULER = new Scheduler()

enum State {
    Initial,
    Executing,
    Completed,
}

class Transaction {
    state = State.Initial
    readonly key: symbol
    private readonly queue = [] as Atom[]
    private readonly queueCandidates = new Set<Atom>()
    private readonly counters = new WeakMap<Atom, number>()
    //private readonly abortTimer: number

    constructor(key: symbol) {
        this.key = key
        //this.abortTimer = setImmediate(() => this.abort()) // TODO
    }

    // abort() {
    //     throw 'Aborted'
    // }

    add(atom: Atom) {
        if (!this.queue.includes(atom)) {
            this.queue.push(atom)
            this.addConsumers(atom.getConsumers())
        }
    }

    run(key: symbol) {
        if (key === this.key) {
            this.state = State.Executing

            const { queue } = this

            let i = 0

            while (i < queue.length) {
                const atom = queue[i++]
                const oldCache = atom.getCache()

                atom.build()

                const newCache = atom.getCache()!
                const consumers = atom.getConsumers()

                if (!newCache.equal(oldCache)) {
                    for (const consumer of consumers) {
                        this.queueCandidates.add(consumer)
                    }
                }

                this.updateQueue(consumers)
            }

            this.state = State.Completed

            //clearImmediate(this.abortTimer) // TODO Node.Immediate mzf
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

export function transaction<T>(cb: () => T) {
    return SCHEDULER.run(() => cb())
}
