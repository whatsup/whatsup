import { Atom } from './atom'
import { Atomizer } from './atomizer'
import { Controller, ContextController } from './controller'
import { Fractal } from './fractal'
import { ConsumerQuery } from './query'

export type Bubble<T> = T | Atom<any> | ConsumerQuery
export type CollectIterator<T> = Iterator<Bubble<T>, T, any>
export type CollectGenerator<T> = Generator<Bubble<T>, any, any>
export type CollectGeneratorFunc<T, C = Controller> =
    | ((controller: C) => CollectGenerator<T>)
    | (() => CollectGenerator<T>)

export const CONSUMER_QUERY = new ConsumerQuery()

export abstract class Streamable<T> {
    protected abstract getAtom(consumer: Atom): Atom<T>

    *[Symbol.iterator](): Generator<any, T, any> {
        const consumer = yield* CONSUMER_QUERY
        const atom = this.getAtom(consumer)

        atom.addConsumer(consumer)

        return yield* atom
    }
}

export interface StreamOptions {
    thisArg?: any
}

export abstract class Stream<T> extends Streamable<T> {
    protected abstract stream(controller?: Controller): CollectGenerator<T>
    private readonly options: StreamOptions

    constructor(options: StreamOptions = {}) {
        super()
        const { thisArg = this } = options
        this.options = { thisArg }
    }

    collect(controller: Controller) {
        const { thisArg } = this.options
        return this.stream.call(thisArg, controller)
    }
}

export class Delegation<T> extends Streamable<T> {
    private readonly atomizer: Atomizer<T>

    constructor(fractal: Fractal<T>, parentContext: ContextController) {
        super()
        this.atomizer = new Atomizer(fractal, parentContext)
    }

    protected getAtom(consumer: Atom) {
        return this.atomizer.get(consumer)
    }
}
