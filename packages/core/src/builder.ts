import { Atom, DIRTY, ACTUAL, CHECK, Node } from './atom'

class Process {
    private readonly entries = new Set<Atom>()
    private readonly roots = new Set<Atom>()

    rebuild(atom: Atom) {
        this.entries.add(atom)
    }

    run() {
        for (const atom of this.entries) {
            this.findRoots(atom, DIRTY)
        }

        for (const atom of this.roots) {
            atom.rebuild()
        }
    }

    private findRoots(atom: Atom, state: number) {
        atom.setCacheState(state)

        if (!atom.targetsHead) {
            this.roots.add(atom)
            return
        }

        for (let node: Node | undefined = atom.targetsHead; node; node = node.nextTarget) {
            if (node.target.isCacheState(ACTUAL)) {
                this.findRoots(node.target, CHECK)
            }
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
