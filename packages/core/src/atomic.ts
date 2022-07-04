import { Atom } from './atom'

export interface Atomic<T = any> {
    /* @internal */
    readonly atom: Atom<T>
}
