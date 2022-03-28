import { Atom } from './atom'

const WATCH_STACK = [] as Set<Atom>[]

export class Relations {
    readonly consumers: Set<Atom>
    private readonly atom: Atom
    private dependencies: Set<Atom>
    private garbage: Set<Atom>

    constructor(atom: Atom) {
        this.atom = atom
        this.consumers = new Set<Atom>()
        this.dependencies = new Set<Atom>()
        this.garbage = new Set<Atom>()
    }

    hasConsumers() {
        return this.consumers.size > 0
    }

    addConsumer(atom: Atom) {
        this.consumers.add(atom)
    }

    deleteConsumer(atom: Atom) {
        this.consumers.delete(atom)
    }

    collect() {
        const { dependencies, garbage } = this

        this.dependencies = garbage
        this.garbage = dependencies

        WATCH_STACK.push(new Set())
    }

    link() {
        if (WATCH_STACK.length > 0) {
            WATCH_STACK[WATCH_STACK.length - 1].add(this.atom)
            return true
        }

        return false
    }

    normalize() {
        const atoms = WATCH_STACK.pop()!

        for (const dependency of atoms) {
            this.dependencies.add(dependency)
            this.garbage.delete(dependency)

            dependency.relations.addConsumer(this.atom)
        }

        for (const dependency of this.garbage) {
            dependency.dispose(this.atom)
        }

        this.garbage.clear()
    }

    dispose() {
        for (const atom of this.dependencies) {
            atom.dispose(this.atom)
        }

        this.dependencies.clear()
    }
}
