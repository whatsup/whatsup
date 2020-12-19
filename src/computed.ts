import { Stream, StreamGenerator, StreamGeneratorFunc } from './stream'
import { CommunalAtomizer } from './atomizer'
import { Context } from './context'

export interface ComputedOptions {
    thisArg?: any
}

export abstract class Computed<T> extends Stream<T> {
    protected readonly atomizer: CommunalAtomizer<T>

    constructor() {
        super()
        this.atomizer = new CommunalAtomizer(this)
    }

    protected get atom() {
        return this.atomizer.get()
    }
}

export function computed<T>(generator: StreamGeneratorFunc<T>, { thisArg }: ComputedOptions = {}): Computed<T> {
    return new (class extends Computed<T> {
        stream(context: Context): StreamGenerator<T> {
            return generator.call(thisArg || this, context)
        }
    })()
}
