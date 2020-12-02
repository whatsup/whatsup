import { StreamOptions, Stream, StreamGenerator, StreamGeneratorFunc } from './stream'
import { CommunalAtomizer } from './atomizer'
import { Context } from './context'

export interface SingularityOptions extends StreamOptions {}

export abstract class Singularity<T, O extends SingularityOptions = SingularityOptions> extends Stream<T> {
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

export function sing<T>(generator: StreamGeneratorFunc<T>, options?: SingularityOptions): Singularity<T> {
    return new (class extends Singularity<T> {
        stream(context: Context): StreamGenerator<T> {
            return generator.call(this, context)
        }
    })(options)
}
