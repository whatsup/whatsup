import { Atom, CacheState } from './atom'

class Process {
    private readonly entries = new Set<Atom>()
    private readonly roots = new Set<Atom>()

    rebuild(atom: Atom) {
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
            for (const observer of atom.eachObservers()) {
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
let prc: Process | null = null

export const build = <T>(cb: (process: Process) => T): T => {
    const localKey = Symbol()

    if (prc === null) {
        prc = new Process()

        if (key === null) {
            key = localKey
        }
    }

    const result = cb(prc)

    while (key === localKey) {
        const process = prc!

        prc = null

        process.run()

        if (prc === null) {
            key = null
        }
    }

    return result
}

export const isBuildProcess = () => {
    return key !== null
}
