import { Err, Result } from './result'
import { Context } from './context'
import { Command, InitCommand } from './command'
import { Delegation } from './delegation'
import { Mutator } from './mutator'

export type Payload<T> = T | Delegation<T> | Mutator<T>
export type StreamIterator<T> = Iterator<Payload<T> | Command, Payload<T>, unknown>
export type StreamGenerator<T> = Generator<Payload<T>, Payload<T> | void | never>
export type StreamGeneratorFunc<T> = ((context: Context) => StreamGenerator<T>) | (() => StreamGenerator<T>)

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

export abstract class Stream<T = unknown> {
    abstract whatsUp(context?: Context): StreamGenerator<T>

    *[Symbol.iterator](command?: InitCommand): Generator<never, T, Result> {
        //                            this is ^^^^^^^^^^^^^^^^^^^^^^^^ for better type inference
        //                            really is Generator<Command, T, any> ... may be ;)
        if (!command) {
            throw 'Initial command of stream iterator is undefined'
        }

        const result = (yield command as never) as Result<T>

        if (result instanceof Err) {
            throw result.value
        }

        return result.value
    }
}
