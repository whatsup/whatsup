import { Atom } from './atom'

type Initiator = object | symbol

let CURRENT_TRANSACTION: Transaction | null = null

export function initTransaction(initiator: Initiator) {
    if (!CURRENT_TRANSACTION) {
        CURRENT_TRANSACTION = new Transaction(initiator)
    }

    return CURRENT_TRANSACTION
}

export function transaction<T>(cb: () => T) {
    const initiator = Symbol()
    const transaction = initTransaction(initiator)
    const result = cb()

    transaction.run(initiator)

    return result
}

export const action = transaction

class Transaction {
    private initiator: Initiator
    private indexes = new Map<Atom, number>()
    private queue = [] as (Atom | null)[]

    constructor(initiator: Initiator) {
        this.initiator = initiator
    }

    add(atom: Atom) {
        if (this.indexes.has(atom)) {
            const index = this.indexes.get(atom)!
            this.queue[index] = null
        }

        const index = this.queue.push(atom)

        this.indexes.set(atom, index)

        if (atom.consumer) {
            this.add(atom.consumer)
        }
    }

    run(initiator: Initiator) {
        if (initiator === this.initiator) {
            for (const atom of this.queue) {
                if (atom) {
                    atom.build()
                }
            }

            CURRENT_TRANSACTION = null
        }
    }
}
