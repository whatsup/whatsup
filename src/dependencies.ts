import { Atom } from './atom'

const STACK = [] as Set<Atom>[]

export class Dependencies {
    private readonly atom: Atom
    private current = new Set<Atom>()
    private fusty = new Set<Atom>()

    constructor(atom: Atom) {
        this.atom = atom
    }

    watch() {
        STACK.push(new Set())
        this.swap()
    }

    register() {
        if (STACK.length) {
            STACK[STACK.length - 1].add(this.atom)
            return true
        }
        return false
    }

    normalize() {
        const atoms = STACK.pop()!

        for (const dependency of atoms) {
            this.add(dependency)
            dependency.consumers.add(this.atom)
        }

        this.disposeUnused()
    }

    dispose() {
        for (const atom of this.current) {
            atom.dispose(this.atom)
        }
        this.current.clear()
    }

    private add(atom: Atom) {
        this.current.add(atom)
        this.fusty.delete(atom)
    }

    private swap() {
        const { current, fusty } = this
        this.current = fusty
        this.fusty = current
    }

    private disposeUnused() {
        for (const atom of this.fusty) {
            atom.dispose(this.atom)
        }
        this.fusty.clear()
    }
}
