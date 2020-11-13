import { Atom } from './atom'

export class Query<T> {
    async *[Symbol.asyncIterator](): AsyncGenerator<this, T, T> {
        return yield this
    }
}

export class ConsumerQuery extends Query<Atom> {}
