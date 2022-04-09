import { Atom } from './atom'

export interface Atomic<T = any> {
    readonly atom: Atom<T>
}
