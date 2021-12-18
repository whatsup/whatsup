import { Atom } from './atom'
import { Cache, Data, Err } from './cache'
import { Command, Handshake } from './command'
import { Context } from './context'
import { Delegation } from './delegation'
import { Mutator } from './mutator'
import { Stack } from './stack'
import { spider } from './spider'
import { Payload, StreamIterator, StreamGeneratorFunc } from './stream'

export abstract class Builder<T = unknown> {
    abstract iterator(): StreamIterator<T>
    abstract dispose(): void

    protected atom!: Atom<T>

    /** @internal */
    attachTo(atom: Atom<T>) {
        if (this.atom) {
            throw new Error(`Builder already attached to another Atom`)
        }

        this.atom = atom

        return this
    }

    build(): Err | Data<T> {
        let { atom } = this

        const stack = new Stack<StreamIterator<T>>()

        main: while (true) {
            const iterator = atom.builder.iterator()

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

                    return value as Err | Data<T>
                }

                if (value instanceof Atom) {
                    atom = value
                    continue main
                }

                throw 'What`s up? It shouldn`t have happened'
            }
        }
    }
}

export class GenerativeBuilder<T = unknown> extends Builder<T> {
    private readonly stack: Stack<StreamIterator<T>>
    private readonly generator: StreamGeneratorFunc<T>
    private readonly thisArg: unknown

    constructor(generator: StreamGeneratorFunc<T>, thisArg: unknown) {
        super()
        this.stack = new Stack()
        this.generator = generator
        this.thisArg = thisArg
    }

    iterator(): StreamIterator<T> {
        return this.cache(this.relations(this.source()))
    }

    *cache(iterator: StreamIterator<T>): StreamIterator<T> {
        const { atom } = this

        let input: unknown

        while (true) {
            const { done, value } = iterator.next(input)

            if (value instanceof Cache) {
                atom.setCache(value)
            }

            if (value instanceof Mutator) {
                const prevValue = atom.hasCache() ? atom.getCache()!.value : undefined
                input = value.mutate(prevValue as T | undefined)
                continue
            }

            if (value instanceof Atom && value.hasCache()) {
                input = value.getCache()
                continue
            }

            if (done) {
                return value as Payload<T>
            }

            input = yield value
        }
    }

    *relations(iterator: StreamIterator<T>): StreamIterator<T> {
        const { atom } = this

        let input: unknown

        spider.start()
        atom.dependencies.swap()

        while (true) {
            const { done, value } = iterator.next(input)

            if (done) {
                for (const dependency of spider.stop()) {
                    atom.dependencies.add(dependency)
                    dependency.consumers.add(atom)
                }

                atom.dependencies.disposeUnused()
                return value as Payload<T>
            }

            if (value instanceof Handshake) {
                const subAtom = value.do(atom)

                atom.dependencies.add(subAtom)
                subAtom.consumers.add(atom)

                input = yield subAtom
                continue
            }

            input = yield value
        }
    }

    *source(): StreamIterator<T> {
        const { generator, thisArg, stack } = this
        const { context } = this.atom

        if (stack.empty) {
            stack.push(generator.call(thisArg, context) as StreamIterator<T>)
        }

        let input: unknown

        while (true) {
            if (input instanceof Data && input.value instanceof Delegation) {
                stack.push(input.value.stream[Symbol.iterator]())
                input = undefined
            }

            let done: boolean
            let error: boolean
            let value: Command | Payload<T> | Error

            try {
                const result = stack.peek().next(input)

                value = result.value!
                done = result.done!
                error = false
            } catch (e) {
                value = e as Error
                done = true
                error = true
            }

            if (done) {
                stack.pop()
            }

            if (value instanceof Command) {
                input = yield value
                continue
            }

            if (error) {
                input = new Err(value as Error)
            } else if (value instanceof Mutator) {
                input = new Data(yield value)
            } else {
                input = new Data(value)
            }

            if (done && !stack.empty) {
                continue
            }

            return input as Payload<T>
        }
    }

    dispose() {
        while (!this.stack.empty) {
            this.stack.pop()!.return!()
        }
    }
}

export class FunctionalBuilder<T = unknown> extends Builder<T> {
    private readonly cb: (context?: Context) => T
    private readonly thisArg: unknown

    constructor(cb: (context?: Context) => T, thisArg: unknown) {
        super()
        this.cb = cb
        this.thisArg = thisArg
    }

    calc() {
        const { cb, thisArg, atom } = this

        return cb.call(thisArg, atom.context)
    }

    *iterator(): StreamIterator<T> {
        const { atom } = this

        atom.dependencies.swap()

        spider.start()

        let newCache: Cache<any> // | Err

        try {
            const value = this.calc()

            newCache = new Data(value)
        } catch (e) {
            newCache = new Err(e as Error)
        }

        for (const dependency of spider.stop()) {
            atom.dependencies.add(dependency)
            dependency.consumers.add(atom)
        }

        atom.setCache(newCache)
        atom.dependencies.disposeUnused()

        return newCache as any // as Err | Data<T>
    }

    dispose(): void {
        //throw new Error('Method not implemented.')
    }
}
