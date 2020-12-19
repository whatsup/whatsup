import { Stream, StreamGenerator, StreamGeneratorFunc } from './stream'
import { CommunalAtomizer } from './atomizer'
import { Context } from './context'

export interface CauseOptions {
    thisArg?: any
}

export abstract class Cause<T> extends Stream<T> {
    protected readonly atomizer: CommunalAtomizer<T>

    constructor() {
        super()
        this.atomizer = new CommunalAtomizer(this)
    }

    protected get atom() {
        return this.atomizer.get()
    }
}

export function cause<T>(generator: StreamGeneratorFunc<T>, { thisArg }: CauseOptions = {}): Cause<T> {
    return new (class extends Cause<T> {
        stream(context: Context): StreamGenerator<T> {
            return generator.call(thisArg || this, context)
        }
    })()
}
