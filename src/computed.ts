import { CommunalAtomizer } from './atomizer'
import { Context } from './context'
import { StreamOptions, Stream, StreamGenerator, StreamGeneratorFunc } from './stream'

export interface ComputedOptions extends StreamOptions {}

export abstract class Computed<T, O extends ComputedOptions = ComputedOptions> extends Stream<T> {
    readonly delegator = false
    protected readonly atomizer: CommunalAtomizer<T>

    constructor(options?: O) {
        super(options)
        this.atomizer = new CommunalAtomizer(this)
    }

    get atom() {
        return this.atomizer.get()
    }
}

export function computed<T>(generator: StreamGeneratorFunc<T>, options?: ComputedOptions): Computed<T> {
    return new (class extends Computed<T> {
        stream(context: Context): StreamGenerator<T> {
            return generator.call(this, context)
        }
    })(options)
}
