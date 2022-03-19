import { Stream, StreamGenerator, StreamGeneratorFunc } from './stream'
import { Context } from './context'
import { Cache, Err } from './cache'
import { Atom } from './atom'
import { GenerativeBuilder } from './builder'
import { PushThrough } from './command'
import { spider } from './spider'

const pushThrough = new PushThrough()

export abstract class Cause<T> extends Stream<T> {
    private readonly atom: Atom

    constructor() {
        super()
        const builder = new GenerativeBuilder(this.whatsUp, this)
        const context = new Context()
        this.atom = new Atom(builder, context)
    }

    *[Symbol.iterator](): Generator<never, T, Cache> {
        spider.watch(this.atom)

        const result = yield pushThrough.reuseWith(this.atom) as never

        if (result instanceof Err) {
            throw result.value
        }

        return result.value as T
    }
}

export function cause<T>(generator: StreamGeneratorFunc<T>, thisArg?: unknown): Cause<T> {
    return new (class extends Cause<T> {
        whatsUp(context: Context): StreamGenerator<T> {
            return generator.call(thisArg || this, context)
        }
    })()
}
