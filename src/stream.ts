import { Err } from './result'
import { Context } from './context'
import { Command, InitCommand } from './query'
import { Delegation } from './delegation'
import { Mutator } from './mutator'

//export type StreamEmission<T> = T | Delegation<T> | Mutator<T>
export type StreamIterator<T> = Iterator<T | Delegation<T> | Mutator<T> | Command, T | Delegation<T> | Mutator<T>, any>
export type StreamGenerator<T> = Generator<
    T | Delegation<T> | Mutator<T>,
    T | Delegation<T> | Mutator<T> | void | never,
    any
>
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

export abstract class Stream<T> {
    abstract whatsUp(context?: Context): StreamGenerator<any>

    *[Symbol.iterator](command: InitCommand): Generator<never, T, any> {
        //                            this is ^^^^^^^^^^^^^^^^^^^^^^^^ for better type inference
        //                            really is Generator<T | Command, T, any> ... may be ;)
        const result = yield command as never

        if (result instanceof Err) {
            throw result.value
        }

        return result.value
    }
}
