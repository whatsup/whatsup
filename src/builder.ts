import { Atom } from './atom'
import { Command, InitCommand } from './command'
import { Delegation } from './delegation'
import { Mutator } from './mutator'
import { Err, Data } from './result'
import { Stack } from './stack'
import { StreamGeneratorFunc, StreamIterator } from './stream'

type BuildOptions = {
    useSelfStack?: boolean
    useDependencies?: boolean
    ignoreCache?: boolean
    //ignoreCacheOnce?: boolean
}

export function build<T, U extends T>(
    atom: Atom<T>,
    generator: StreamGeneratorFunc<U> | null,
    options: BuildOptions = {}
): Err | Data<U> {
    const stack = new Stack<Generator<unknown, Err | Data<U>>>()

    //let isRoot = true

    // options.ignoreCacheOnce = true

    main: while (true) {
        // if (isRoot) {
        //     options = { ...options, ignoreCache: true }
        //     isRoot = false
        // }
        // TODO here we can control dependencies
        const iterator = generate<T, U>(atom, generator, options)

        stack.push(iterator)

        let input = undefined

        while (true) {
            const { done, value } = stack.peek().next(input)

            if (done) {
                stack.pop()

                if (!stack.empty) {
                    input = value
                    continue
                }

                return value as Err | Data<U>
            }

            if (value instanceof Atom) {
                if (!options.ignoreCache && value.cache) {
                    input = value.cache
                    continue
                }

                atom = value
                generator = value.stream.whatsUp
                continue main
            }

            throw 'What`s up? It shouldn`t have happened'
        }
    }
}

export function* generate<T, U extends T>(
    atom: Atom<T>,
    generator: StreamGeneratorFunc<U> | null,
    options: BuildOptions = {}
): Generator<unknown, Err | Data<U>> {
    const { useSelfStack = false, useDependencies = false, ignoreCache = false } = options

    // if (ignoreCacheOnce) {
    //     options.ignoreCacheOnce = false
    // } else if (!ignoreCache && atom.cache) {
    //     return atom.cache as Err | Data<U>
    // }

    const { context, stream } = atom
    const stack = useSelfStack ? atom.stack : new Stack<StreamIterator<U>>()

    useDependencies && atom.dependencies.swap()

    if (stack.empty) {
        if (!generator) {
            generator = atom.stream.whatsUp as StreamGeneratorFunc<U>
        }
        stack.push(generator!.call(stream, context) as StreamIterator<U>)
    }

    let input: unknown

    while (true) {
        let done: boolean
        let error: boolean
        let value: U | Command | Delegation<U> | Mutator<U>

        try {
            const result = stack.peek().next(input)

            done = result.done!
            error = false
            value = result.value!
        } catch (e) {
            done = false
            error = true
            value = e
        }

        if (done || error) {
            stack.pop()

            const result = error ? new Err(value as Error) : new Data(prepareNewData(atom, value as U, ignoreCache))

            if (!stack.empty) {
                input = result
                continue
            }

            useDependencies && atom.dependencies.disposeUnused()

            !ignoreCache && atom.setCache(result)

            return result
        }
        if (value instanceof InitCommand) {
            const { stream, multi } = value
            const subAtom = atom.atomizer.get(stream, multi)

            useDependencies && (atom.dependencies.add(subAtom), subAtom.consumers.add(atom))

            input = yield subAtom

            if (input instanceof Data && input.value instanceof Delegation) {
                stack.push(input.value.stream[Symbol.iterator]())
                input = undefined
            }
            continue
        }

        const data = prepareNewData(atom, value as U, ignoreCache)
        const result = new Data(data)

        useDependencies && atom.dependencies.disposeUnused()

        !ignoreCache && atom.setCache(result)

        return result
    }
}

// export function* extractor<T, U extends T>(
//     atom: Atom<T>,
//     generator: StreamGeneratorFunc<U>,
//     stack: Stack<StreamIterator<any>>
// ): Generator<unknown, Err | Data<U>> {
//     const { context, stream } = atom

//     if (stack.empty) {
//         if (!generator) {
//             generator = atom.stream.whatsUp as StreamGeneratorFunc<U>
//         }
//         stack.push(generator!.call(stream, context) as StreamIterator<U>)
//     }

//     let input: unknown

//     while (true) {
//         if (input instanceof Data && input.value instanceof Delegation) {
//             stack.push(input.value.stream[Symbol.iterator]())
//             input = undefined
//         }

//         let done: boolean
//         let error: boolean
//         let value: U | Command | Delegation<U> | Mutator<U>

//         try {
//             const result = stack.peek().next(input)

//             done = result.done!
//             error = false
//             value = result.value!
//         } catch (e) {
//             done = false
//             error = true
//             value = e
//         }

//         if (done || error) {
//             stack.pop()

//             if (error) {
//                 value = new Err(value as Error)
//             }

//             const result = error ? new Err(value as Error) : new Data(prepareNewData(atom, value as U, ignoreCache))

//             if (!stack.empty) {
//                 input = result
//                 continue
//             }

//             useDependencies && atom.dependencies.disposeUnused()

//             !ignoreCache && atom.setCache(result)

//             return result
//         }

//         input = yield value
//     }
// }

// function* dependencies<T, U extends T>(atom: Atom<T>, iterator: StreamIterator<U>): Generator<unknown, any> {
//     let input: unknown

//     atom.dependencies.swap()

//     while (true) {
//         const { done, value } = iterator.next(input)

//         if (done) {
//             atom.dependencies.disposeUnused()
//             return value
//         }

//         if (value instanceof Atom) {
//             atom.dependencies.add(value)
//             value.consumers.add(atom)
//         }

//         input = yield value
//     }
// }

// function* init<T, U extends T>(atom: Atom<T>, iterator: StreamIterator<U>): Generator<unknown, any> {
//     let input: unknown

//     while (true) {
//         const { done, value } = iterator.next(input)

//         if (done) {
//             return value
//         }

//         if (value instanceof InitCommand) {
//             const { stream, multi } = value
//             const subAtom = atom.atomizer.get(stream, multi)

//             input = yield subAtom
//             continue
//         }

//         input = yield value
//     }
// }

function prepareNewData<T, U extends T>(atom: Atom<T>, value: U | Mutator<U>, ignoreCache: boolean): U {
    if (value instanceof Mutator) {
        const oldValue = ignoreCache ? undefined : atom.cache && atom.cache!.value
        const newValue = value.mutate(oldValue as U) as U
        return newValue
    }

    return value
}
