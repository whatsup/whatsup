import { Atom } from './atom'
import { Context } from './context'
import { ConsumerQuery } from './query'

export type Bubble<T> = T | Atom<any> | ConsumerQuery
export type CollectIterator<T> = Iterator<Bubble<T>, T, any>
export type CollectGenerator<T> = Generator<Bubble<T>, any, any>
export type CollectGeneratorFunc<T> = ((context: Context) => CollectGenerator<T>) | (() => CollectGenerator<T>)

const CONSUMER_QUERY = new ConsumerQuery()

export abstract class Emitter<T> {
    *[Symbol.iterator](): Generator<any, T, any> {
        const consumer = yield* CONSUMER_QUERY
        return yield* consumer.getSubatom(this).emit()
    }
}

export interface FractalOptions {
    delegation?: boolean
}

export abstract class Fractal<T> extends Emitter<T> {
    readonly delegation: boolean
    abstract collector(context?: Context): CollectGenerator<T>

    constructor(options: FractalOptions = {}) {
        super()
        const { delegation = true } = options
        this.delegation = delegation
    }
}

export class EasyFractal<T> extends Fractal<T> {
    private readonly generator: CollectGeneratorFunc<T>

    constructor(generator: CollectGeneratorFunc<T>, options: FractalOptions = {}) {
        super(options)
        this.generator = generator
    }

    *collector(context: Context) {
        return yield* this.generator(context)
    }
}

export function fractal<T>(generator: CollectGeneratorFunc<T>, options?: FractalOptions) {
    return new EasyFractal(generator, options)
}
