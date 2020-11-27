import { ComputedAtom } from './atom'
import { RootContext } from './context'
import { StreamOptions, Stream, StreamGenerator, StreamGeneratorFunc } from './stream'

export interface ComputedOptions extends StreamOptions {}

export abstract class Computed<T, O extends ComputedOptions = ComputedOptions> extends Stream<T> {
    protected readonly atom: ComputedAtom
    protected abstract stream(context: RootContext): StreamGenerator<T>

    constructor(options?: O) {
        super(options)
        this.atom = new ComputedAtom(this)
    }

    protected getAtom() {
        return this.atom
    }
}

export function computed<T>(generator: StreamGeneratorFunc<T>, options?: ComputedOptions): Computed<T> {
    return new (class extends Computed<T> {
        stream(context: RootContext): StreamGenerator<T> {
            return generator.call(this, context)
        }
    })(options)
}
