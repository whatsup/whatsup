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

    destroy() {
        for (const atom of this.current) {
            atom.destroy(this.atom)
        }
        this.current.clear()
    }

    destroyUnused() {
        for (const atom of this.fusty) {
            atom.destroy(this.atom)
        }
        this.fusty.clear()
    }
}
