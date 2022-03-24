import { Context } from './context'
import { Command } from './command'
import { Delegation } from './delegation'
import { Mutator } from './mutator'
import { Atom } from './atom'

export type Payload<T> = T | Delegation<T> | Mutator<T>
export type StreamIterator<T> = Iterator<Payload<T> | Command, Payload<T>, unknown>
export type StreamGenerator<T> = Generator<Payload<T>, Payload<T> | void | never>
export type StreamGeneratorFunc<T> = (context: Context) => StreamGenerator<T> //| (() => StreamGenerator<T>)

/*
// This is Name
const name = conse('John')

// This is User
const user = cause<{name: string}>(function*() { 
    // - Whats up User?
    while(true){
        // - Fine! 
            // - Whats up Name?
            const name = yield* Name
        // - Look: 
        yield { name }
    } 
})

whatsUp(user, (v)=> console.log(v))
//> {name: 'John'}
*/

export interface StreamLike<T = unknown> {
    whatsUp(context?: Context): StreamGenerator<T>
}

export const iterator = Symbol('whatsup iterator')

export abstract class Stream<T = unknown> implements StreamLike<T> {
    abstract getAtomFor(atom: Atom): Atom<T>
    abstract whatsUp(context?: Context): StreamGenerator<T>
    abstract [Symbol.iterator](): Generator<never, T, unknown>

    // *[iterator](command: Handshake): Generator<never, T, unknown> {
    //     //                            this is ^^^^^^^^^^^^^^^^^^^^^^^^ for better type inference
    //     //                            really is Generator<Command, T, Cache> ... may be ;)
    //     if (!command) {
    //         throw 'Initial command of stream iterator is undefined'
    //     }

    //     const result = (yield command as never) as Cache<T>

    //     if (result instanceof Err) {
    //         throw result.value
    //     }

    //     return result.value
    // }
}
