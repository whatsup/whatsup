import { Atom } from './atom'
import { Atomizer, ExclusiveAtomizer } from './atomizer'
import { Context } from './context'
import { ConsumerQuery } from './query'

export type StreamIterator<T> = Iterator<T | ConsumerQuery | Atom<any>, T, any>
export type StreamGenerator<T> = Generator<T, T | void | never, any>
export type StreamGeneratorFunc<T> = ((context: Context) => StreamGenerator<T>) | (() => StreamGenerator<T>)

export const CONSUMER_QUERY = new ConsumerQuery()

export abstract class Streamable<T> {
    /**@internal */
    protected abstract readonly atomizer: Atomizer<T>

    *[Symbol.iterator](): Generator<never, T, any> {
        //        this is ^^^^^^^^^^^^^^^^^^^^^^^^ for better type inference
        //        really is Generator<T | ConsumerQuery | Atom<any>, T, any>
        const consumer: Atom = yield CONSUMER_QUERY as never
        const atom = this.atomizer.get(consumer)

        atom.addConsumer(consumer)

        return yield* atom
    }
}

export abstract class Stream<T> extends Streamable<T> {
    protected abstract whatsUp(context?: Context): StreamGenerator<any>

    /**@internal */
    iterate(context: Context) {
        return this.whatsUp(context)
    }
}

export abstract class DelegatingStream<T> extends Stream<T> {}

export class Delegation<T> extends Streamable<T> {
    protected readonly atomizer: ExclusiveAtomizer<T>

    constructor(stream: Stream<T>, parentContext: Context) {
        super()
        this.atomizer = new ExclusiveAtomizer(stream, parentContext)
    }
}
