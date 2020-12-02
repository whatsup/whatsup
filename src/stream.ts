import { Atom } from './atom'
import { Atomizer, ExclusiveAtomizer } from './atomizer'
import { Context } from './context'
import { ConsumerQuery } from './query'

export type Bubble<T> = T | Atom<any> | ConsumerQuery
export type StreamIterator<T> = Iterator<Bubble<T>, T, any>
export type StreamGenerator<T> = Generator<T, T | void, any>
export type StreamGeneratorFunc<T> = ((context: Context) => StreamGenerator<T>) | (() => StreamGenerator<T>)

export const CONSUMER_QUERY = new ConsumerQuery()

export abstract class Streamable<T> {
    protected abstract readonly atomizer: Atomizer<T>

    *[Symbol.iterator](): Generator<never, T, any> {
        //        this is ^^^^^^^^^^^^^^^^^^^^^^^^ for better type inference
        //        really is Generator<Bubble<T>, T, any>
        const consumer: Atom = yield CONSUMER_QUERY as never
        const atom = this.atomizer.get(consumer)

        atom.addConsumer(consumer)

        return yield* atom
    }
}

export interface StreamOptions {
    thisArg?: any
}

export abstract class Stream<T> extends Streamable<T> {
    abstract readonly delegator: boolean
    protected abstract stream(context?: Context): StreamGenerator<any>
    private readonly options: StreamOptions

    constructor(options: StreamOptions = {}) {
        super()
        const { thisArg = this } = options
        this.options = { thisArg }
    }

    iterate(context: Context) {
        const { thisArg } = this.options
        return this.stream.call(thisArg, context)
    }
}

export class Delegation<T> extends Streamable<T> {
    protected readonly atomizer: ExclusiveAtomizer<T>

    constructor(stream: Stream<T>, parentContext: Context) {
        super()
        this.atomizer = new ExclusiveAtomizer(stream, parentContext)
    }

    protected getAtom(consumer: Atom) {
        return this.atomizer.get(consumer)
    }
}
