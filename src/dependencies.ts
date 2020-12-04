import { Atom } from './atom'

export class Dependencies {
    private readonly atom: Atom
    private current = new Set<Atom>()
    private fusty = new Set<Atom>()

    constructor(atom: Atom) {
        this.atom = atom
    }

    add(atom: Atom) {
        this.current.add(atom)
        this.fusty.delete(atom)
    }

    swap() {
        const { current, fusty } = this
        this.current = fusty
        this.fusty = current
    }

    dispose() {
        for (const atom of this.current) {
            atom.dispose(this.atom)
        }
        this.current.clear()
    }

    disposeUnused() {
        for (const atom of this.fusty) {
            atom.dispose(this.atom)
        }
        this.fusty.clear()
    }
}
