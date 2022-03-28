import { Context } from './context'
import { Delegation } from './delegation'
import { Mutator } from './mutator'
import { Atom } from './atom'

export type Payload<T> = T | Delegation<T> | Mutator<T>
export type StreamIterator<T> = Iterator<Payload<T> | Symbol, Payload<T>, unknown>
export type StreamGenerator<T> = Generator<Payload<T>, Payload<T> | void | never>
export type StreamGeneratorFunc<T> = (ctx: Context) => StreamGenerator<T>  
export type GenProducer<T> = (ctx: Context) => StreamGenerator<T>
export type FunProducer<T> = (ctx: Context) => Payload<T>
export type Producer<T> = GenProducer<T> | FunProducer<T>

export abstract class Stream<T = unknown> {
    abstract getAtomFor(atom: Atom): Atom<T>
    abstract [Symbol.iterator](): Generator<any, T, any>
}
