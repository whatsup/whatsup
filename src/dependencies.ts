import { Atom } from './atom'

export class Dependencies {
    private readonly atom: Atom
    private readonly unsynchronized = new Set<Atom>()
    private current = new Map<Atom, number>()
    private fusty = new Map<Atom, number>()

    constructor(atom: Atom) {
        this.atom = atom
    }

    add(atom: Atom) {
        const revision = atom.getRevision()
        this.current.set(atom, revision)
    }

    addUnsynchronized(atom: Atom) {
        this.unsynchronized.add(atom)
    }

    clearCurrent() {
        this.current.clear()
    }

    swap() {
        const { current, fusty: fusty } = this
        this.current = fusty
        this.fusty = current
    }

    destroy() {
        this.current.forEach((_, atom) => atom.destroy())
        this.current.clear()
    }

    destroyUnused() {
        this.fusty.forEach((_, atom) => !this.current.has(atom) && atom.destroy())
        this.fusty.clear()
    }

    synchronize() {
        for (const atom of this.unsynchronized) {
            this.unsynchronized.delete(atom)

            if (this.current.has(atom)) {
                const revision = this.current.get(atom)

                if (atom.getRevision() !== revision) {
                    this.clearCurrent()
                    return false
                }
            }
            if (atom === this.atom) {
                return false
            }
        }
        return true
    }
}
