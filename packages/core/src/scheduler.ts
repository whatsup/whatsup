import { Atom, CacheState } from './atom'

export class Transaction {
    private readonly entries = new Set<Atom>()
    private readonly roots = new Set<Atom>()

    addEntry(atom: Atom) {
        this.entries.add(atom)
    }

    run() {
        for (const atom of this.entries) {
            this.findRoots(atom, CacheState.Dirty)
        }

        for (const atom of this.roots) {
            atom.rebuild()
        }
    }

    private findRoots(atom: Atom, state: CacheState) {
        atom.setCacheState(state)

        if (atom.hasObservers()) {
            for (const observer of atom.observers) {
                if (observer.isCacheState(CacheState.Actual)) {
                    this.findRoots(observer, CacheState.Check)
                }
            }
        } else {
            this.roots.add(atom)
        }
    }
}

let key: symbol | null = null
let trx: Transaction | null = null

export const transaction = <T>(cb: (transaction: Transaction) => T): T => {
    const localKey = Symbol()

    if (trx === null) {
        trx = new Transaction()

        if (key === null) {
            key = localKey
        }
    }

    const result = cb(trx)

    while (key === localKey) {
        const transaction = trx!

        trx = null

        transaction.run()

        if (trx === null) {
            key = null
        }
    }

    return result
}

export const isBuildProcess = () => {
    return key !== null
}
