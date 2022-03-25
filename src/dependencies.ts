import { Atom } from './atom'

const WATCH_STACK = [] as Set<Atom>[]

export class Dependencies {
    private readonly atom: Atom
    private current: Set<Atom>
    private fusty: Set<Atom>

    constructor(atom: Atom) {
        this.atom = atom
        this.current = new Set<Atom>()
        this.fusty = new Set<Atom>()
    }

    watch() {
        const { current, fusty } = this
        this.current = fusty
        this.fusty = current

        WATCH_STACK.push(new Set())
    }

    register() {
        if (WATCH_STACK.length) {
            WATCH_STACK[WATCH_STACK.length - 1].add(this.atom)
            return true
        }
        return false
    }

    normalize() {
        const atoms = WATCH_STACK.pop()!

        for (const dependency of atoms) {
            this.current.add(dependency)
            this.fusty.delete(dependency)
            dependency.consumers.add(this.atom)
        }

        for (const atom of this.fusty) {
            atom.dispose(this.atom)
        }

        this.fusty.clear()
    }

    dispose() {
        for (const atom of this.current) {
            atom.dispose(this.atom)
        }
        this.current.clear()
    }
}
