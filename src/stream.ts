import { Err } from './result'
import { Atom } from './atom'
//import { Atomizer, ExclusiveAtomizer } from './atomizer'
import { Context } from './context'
import { Command, InitCommand } from './query'

export type StreamIterator<T> = Iterator<T | Command | Atom<any>, T, any>
export type StreamGenerator<T> = Generator<T, T | void | never, any>
export type StreamGeneratorFunc<T> = ((context: Context) => StreamGenerator<T>) | (() => StreamGenerator<T>)

//export const CONSUMER_QUERY = new InitCommand()
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

whatsUp(user, (v)=> cosnole.log(v))
//> {name: 'John'}

*/

export abstract class Streamable<T> {
    // /**@internal */
    // protected abstract readonly atomizer: Atomizer<T>

    *[Symbol.iterator](command: InitCommand): Generator<never, T, any> {
        const result = yield command as never

        if (result instanceof Err) {
            throw result.value
        }

        return result.value
        //        this is ^^^^^^^^^^^^^^^^^^^^^^^^ for better type inference
        //        really is Generator<T | ConsumerQuery | Atom<any>, T, any>
        // const consumer: Atom = yield command as never // CONSUMER_QUERY as never
        // const atom = this.atomizer.get(consumer)

        // atom.addConsumer(consumer)

        // return yield* atom
    }
}

export abstract class Stream<T> extends Streamable<T> {
    abstract whatsUp(context?: Context): StreamGenerator<any>

    /**@internal */
    iterate(context: Context) {
        return this.whatsUp(context)
    }
}

export abstract class DelegatingStream<T> extends Stream<T> {}

export class Delegation<T> extends Streamable<T> {
    // protected readonly atomizer: ExclusiveAtomizer<T>
    // constructor(stream: Stream<T>, parentContext: Context) {
    //     super()
    //     this.atomizer = new ExclusiveAtomizer(stream, parentContext)
    // }
}
