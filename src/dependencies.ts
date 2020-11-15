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
        this.fusty.delete(atom)
    }

    addUnsynchronized(atom: Atom) {
        this.unsynchronized.add(atom)
    }

    swap() {
        const { current, fusty } = this
        this.current = fusty
        this.fusty = current
    }

    reswap() {
        this.current.forEach((revision, atom) => this.fusty.set(atom, revision))
        this.current.clear()
    }

    destroy() {
        this.current.forEach((_, atom) => atom.destroy())
        this.current.clear()
    }

    destroyUnused() {
        this.fusty.forEach((_, atom) => atom.destroy())
        this.fusty.clear()
    }

    synchronize() {
        for (const atom of this.unsynchronized) {
            this.unsynchronized.delete(atom)

            if (this.current.has(atom)) {
                const revision = this.current.get(atom)

                if (atom.getRevision() !== revision) {
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
