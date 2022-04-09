import { Delegation } from './delegation'
import { Mutator } from './mutator'
import { Atom } from './atom'

export type Payload<T> = T | Delegation<T> | Mutator<T>
export type PayloadIterator<T> = Iterator<Payload<T>, Payload<T>, unknown>
export type GnProducer<T> = () => PayloadIterator<T>
export type FnProducer<T> = () => Payload<T>
export type Producer<T> = GnProducer<T> | FnProducer<T>

export abstract class Atomic<T = unknown> {
    /* @internal */
    abstract readonly atom: Atom<T>
}
