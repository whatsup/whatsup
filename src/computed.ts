import { Atom } from './atom'
import { Context } from './context'
import { StreamOptions, Stream, StreamGenerator, StreamGeneratorFunc } from './stream'

export interface ComputedOptions extends StreamOptions {}

export abstract class Computed<T, O extends ComputedOptions = ComputedOptions> extends Stream<T> {
    readonly delegator = false
    protected readonly atom: Atom

    constructor(options?: O) {
        super(options)
        this.atom = new Atom(this)
    }

    protected getAtom() {
        return this.atom
    }
}

export function computed<T>(generator: StreamGeneratorFunc<T>, options?: ComputedOptions): Computed<T> {
    return new (class extends Computed<T> {
        stream(context: Context): StreamGenerator<T> {
            return generator.call(this, context)
        }
    })(options)
}
