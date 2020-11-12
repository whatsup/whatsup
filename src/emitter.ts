import { Fork, Scope } from './fork'
import { ConsumerQuery } from './query'
import { Temporary } from './temporary'

export type Bubble<T> = T | Temporary<T> | Fork<any> | ConsumerQuery
export type EmitIterator<T> = AsyncIterator<Bubble<T>, T, any>
export type EmitGenerator<T> = AsyncGenerator<Bubble<T>, any, any>
export type EmitGeneratorFunc<T> = (context?: Scope<T>) => EmitGenerator<T>

const CONSUMER_QUERY = new ConsumerQuery()

export abstract class Emitable<T> {
    async *[Symbol.asyncIterator](): AsyncGenerator<any, T, any> {
        const consumer = yield* CONSUMER_QUERY
        return yield* consumer.getFork(this)
    }
}

export interface EmitterOptions {
    delegation?: boolean
}

export abstract class Emitter<T> extends Emitable<T> {
    readonly delegation: boolean
    abstract collector(context?: Scope<T>): EmitGenerator<T>

    constructor(options: EmitterOptions = {}) {
        super()
        const { delegation = true } = options
        this.delegation = delegation
    }
}
