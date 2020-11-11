import { Fork } from './fork';

export class Query<T> {
    async *[Symbol.asyncIterator](): AsyncGenerator<this, T, T> {
        return yield this
    }
}

export class ConsumerQuery extends Query<Fork> {}