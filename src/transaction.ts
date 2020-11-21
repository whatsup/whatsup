import { Atom } from './atom'

type Initiator = object | symbol

let CURRENT_TRANSACTION: Transaction | null = null

export function createTransactionKey() {
    return Symbol('Transaction key')
}

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
    private queue = [] as Atom[]

    constructor(initiator: Initiator) {
        this.initiator = initiator
    }

    add(atom: Atom) {
        this.queue.push(atom)

        let { consumer } = atom

        while (consumer) {
            consumer.transactCounter++

            if (consumer.transactCounter > 1) {
                break
            }

            consumer = consumer.consumer
        }
    }

    run(initiator: Initiator) {
        if (initiator === this.initiator) {
            const { queue } = this

            let i = 0

            while (i < queue.length) {
                const atom = queue[i++]
                const { data, dataIsError } = atom
                let { consumer } = atom

                atom.build()

                if (consumer) {
                    if (data !== atom.data || dataIsError !== atom.dataIsError) {
                        consumer.transactNeedUpdate = true
                    }

                    while (--consumer.transactCounter === 0) {
                        if (consumer.transactNeedUpdate) {
                            queue.push(consumer)
                            break
                        }

                        if (consumer.consumer) {
                            consumer = consumer.consumer
                            continue
                        }

                        break
                    }
                }
            }

            CURRENT_TRANSACTION = null
        }
    }
}
