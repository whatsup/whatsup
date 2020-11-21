import { Atom } from './atom'

export class Dependencies {
    private current = new Map<Atom, number>()
    private fusty = new Map<Atom, number>()

    add(atom: Atom) {
        const revision = atom.getRevision()
        this.current.set(atom, revision)
        this.fusty.delete(atom)
    }

    swap() {
        const { current, fusty } = this
        this.current = fusty
        this.fusty = current
    }

    destroy() {
        this.current.forEach((_, atom) => atom.destroy())
        this.current.clear()
    }

    destroyUnused() {
        this.fusty.forEach((_, atom) => atom.destroy())
        this.fusty.clear()
    }
}
