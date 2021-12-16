import { Context } from './context'
import { Atom } from './atom'
import { StreamLike } from './stream'

export class Command {}

export abstract class Handshake extends Command {
    protected stream!: StreamLike

    abstract do(atom: Atom): Atom

    // reusable
    // special for GC :)
    reuseWith(stream: StreamLike) {
        this.stream = stream
        return this
    }
}

export class SimpleHandshake extends Handshake {
    readonly map = new WeakMap<StreamLike, Atom>()

    do() {
        if (!this.map.has(this.stream)) {
            const context = new Context()
            const subatom = new Atom(this.stream, context)
            this.map.set(this.stream, subatom)
        }

        return this.map.get(this.stream)!
    }
}

export class MultiHandshake extends Handshake {
    readonly map = new WeakMap<StreamLike, WeakMap<Atom, Atom>>()

    do(atom: Atom) {
        if (!this.map.has(this.stream)) {
            this.map.set(this.stream, new WeakMap())
        }

        const submap = this.map.get(this.stream)!

        if (!submap.has(atom)) {
            const context = new Context(atom.context)
            const subatom = new Atom(this.stream, context)
            submap.set(atom, subatom)
        }

        return submap.get(atom)!
    }
}
