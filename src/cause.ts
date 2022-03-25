import { Stream, StreamGenerator, StreamGeneratorFunc } from './stream'
import { Context } from './context'
import { Cache } from './cache'
import { Atom } from './atom'

export abstract class Cause<T> extends Stream<T> {
    private readonly atom: Atom<T>

    constructor() {
        super()
        this.atom = Atom.create(null, this.whatsUp, this) as Atom<T>
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
        *whatsUp(context: Context): StreamGenerator<T> {
            return yield* generator.call(thisArg || this, context)
        }
    })()
}
