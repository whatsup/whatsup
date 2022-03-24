import { Stream, StreamGenerator, StreamGeneratorFunc } from './stream'
import { Context } from './context'
import { Cache } from './cache'
import { Atom } from './atom'
import { GenBuilder } from './builder'

export abstract class Cause<T> extends Stream<T> {
    private readonly atom: Atom<T>

    constructor() {
        super()
        const builder = new GenBuilder(this.whatsUp, this)
        const context = new Context()
        this.atom = new Atom(builder, context)
    }

    getAtomFor(): Atom<T> {
        return this.atom
    }

    *[Symbol.iterator](): Generator<never, T, Cache> {
        return this.atom.get()
    }
}

export function cause<T>(generator: StreamGeneratorFunc<T>, thisArg?: unknown): Cause<T> {
    return new (class extends Cause<T> {
        whatsUp(context: Context): StreamGenerator<T> {
            return generator.call(thisArg || this, context)
        }
    })()
}
