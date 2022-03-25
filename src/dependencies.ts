import { Atom } from './atom'

const WATCH_STACK = [] as Set<Atom>[]

export class Dependencies {
    private readonly atom: Atom
    readonly consumers: Set<Atom>
    private dependencies: Set<Atom>
    private disposable: Set<Atom>

    constructor(atom: Atom) {
        this.atom = atom
        this.consumers = new Set<Atom>()
        this.dependencies = new Set<Atom>()
        this.disposable = new Set<Atom>()
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
        const { dependencies, disposable } = this

        this.dependencies = disposable
        this.disposable = dependencies

        WATCH_STACK.push(new Set())
    }

    link() {
        if (WATCH_STACK.length) {
            WATCH_STACK[WATCH_STACK.length - 1].add(this.atom)
            return true
        }
        return false
    }

    normalize() {
        const atoms = WATCH_STACK.pop()!

        for (const dependency of atoms) {
            this.dependencies.add(dependency)
            this.disposable.delete(dependency)
            dependency.relations.addConsumer(this.atom)
        }

        for (const dependency of this.disposable) {
            dependency.dispose(this.atom)
        }

        this.disposable.clear()
    }

    dispose() {
        for (const atom of this.dependencies) {
            atom.dispose(this.atom)
        }
        this.dependencies.clear()
    }
}
