import type { Atom } from './atom'

export class Transaction {
    readonly key = Symbol('Transaction key')
    private readonly entries = [] as Atom[]
    private readonly roots = [] as Atom[]
    private started = false

    get pending() {
        return !this.started
    }

    addRoot(atom: Atom) {
        this.roots.push(atom)
    }

    addEntry(atom: Atom) {
        if (!this.entries.includes(atom)) {
            this.entries.push(atom)
        }
    }

    run() {
        this.started = true

        for (const atom of this.entries) {
            atom.preactualize(this)
        }

        for (const atom of this.roots) {
            atom.actualize()
        }
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

export const getCurrentTransaction = () => {
    // if (!isBuildProcess()) {
    //     throw Error('Actualization outside build process')
    // }

    return master!
}
