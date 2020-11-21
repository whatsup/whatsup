import { Atom } from './atom'

export class Query<T> {
    *[Symbol.iterator](): Generator<this, T, T> {
        return yield this
    }
}

export class ConsumerQuery extends Query<Atom> {}
