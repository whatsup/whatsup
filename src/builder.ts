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
    ignoreCacheOnce?: boolean
}

export function build<T, U extends T>(
    atom: Atom<T>,
    generator: StreamGeneratorFunc<U> | null,
    options: BuildOptions = {}
): Err | Data<U> {
    const { useSelfStack = false, useDependencies = false, ignoreCacheOnce = false, ignoreCache = false } = options

    if (ignoreCacheOnce) {
        options.ignoreCacheOnce = false
    } else if (!ignoreCache && atom.cache) {
        return atom.cache as Err | Data<U>
    }

    const { context, stream } = atom
    const stack = useSelfStack ? atom.stack : new Stack<StreamIterator<U>>()
    const dependencies = useDependencies ? atom.dependencies : null

    dependencies && dependencies.swap()

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
            const result = stack.last.next(input)

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

            !ignoreCache && atom.setCache(result)

            return result
        }
        if (value instanceof InitCommand) {
            const { stream, multi } = value
            const subAtom = atom.atomizer.get(stream, multi)

            dependencies && (dependencies.add(subAtom), subAtom.consumers.add(atom))

            input = build(subAtom, null, options)

            if (input instanceof Data && input.value instanceof Delegation) {
                stack.push(input.value.stream[Symbol.iterator]())
                input = undefined
            }
            continue
        }

        dependencies && dependencies.disposeUnused()

        const data = prepareNewData(atom, value as U, ignoreCache)
        const result = new Data(data)

        !ignoreCache && atom.setCache(result)

        return result
    }
}

function prepareNewData<T, U extends T>(atom: Atom<T>, value: U | Mutator<U>, ignoreCache: boolean): U {
    if (value instanceof Mutator) {
        const oldValue = ignoreCache ? undefined : atom.cache && atom.cache!.value
        const newValue = value.mutate(oldValue as U) as U
        return newValue
    }

    return value
}
