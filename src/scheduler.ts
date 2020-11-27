import { Atom } from './atom'

class Scheduler {
    readonly queue = [] as Transaction[]
    private key!: symbol | null

    run<T>(action: (transaction: Transaction) => T): T {
        let transaction: Transaction | null = null

        for (const trn of this.queue) {
            if (trn.state === State.Initialization) {
                transaction = trn
            }
        }

        if (!transaction) {
            transaction = new Transaction()
            this.queue.push(transaction)
        }

        if (!this.key) {
            this.key = transaction.key
        }

        const result = action(transaction)

        while (true) {
            transaction.run(this.key)

            if (transaction.state === State.Completed) {
                this.key = null
                this.queue.splice(this.queue.indexOf(transaction), 1)

                if (this.queue.length) {
                    transaction = this.queue[0]
                    this.key = transaction.key
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
    Initialization,
    Executing,
    Completed,
}

class Transaction {
    state = State.Initialization
    readonly key = Symbol()
    private readonly queue = [] as Atom[]
    private readonly queueCandidates = new Set<Atom>()
    private readonly counters = new WeakMap<Atom, number>()
    private runned = false

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
            this.state = State.Executing

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

            this.state = State.Completed
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

export const action = transaction
