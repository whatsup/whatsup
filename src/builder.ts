import { Atom } from './atom'
import { Cache, Data, Err } from './cache'
import { Command, GetConsumer } from './command'
import { Context } from './context'
//import { Delegation } from './delegation'
import { Mutator } from './mutator'
import { Stack } from './stack'
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
        this.atom.dependencies.watch()

        const iterator = this.atom.builder.iterator()

        let input = undefined

        while (true) {
            const { done, value } = iterator.next(input)

            if (done) {
                this.atom.dependencies.normalize()

                return (value as any) as Err | Data<T> // TODO: remove any
            }

            throw 'What`s up? It shouldn`t have happened'
        }
    }
}

export class GenBuilder<T = unknown> extends Builder<T> {
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
        return this.cache(this.source())
    }

    *cache(iterator: StreamIterator<T>): StreamIterator<T> {
        const { atom } = this

        let input: unknown

        while (true) {
            const { done, value } = iterator.next(input)

            if (value instanceof Mutator) {
                const prevValue = atom.hasCache() ? atom.getCache()!.value : undefined
                input = value.mutate(prevValue as T | undefined)
                continue
            }

            if (done) {
                return value as Payload<T>
            }

            input = yield value
        }
    }

    *source(): StreamIterator<T> {
        const { generator, thisArg, stack, atom } = this
        const { context } = atom

        if (stack.empty) {
            stack.push(generator.call(thisArg, context) as StreamIterator<T>)
        }

        let input: unknown

        while (true) {
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

            if (value instanceof GetConsumer) {
                input = atom
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

export class FunBuilder<T = unknown> extends Builder<T> {
    private readonly cb: (context?: Context) => T
    private readonly thisArg: unknown

    constructor(cb: (context?: Context) => T, thisArg: unknown) {
        super()
        this.cb = cb
        this.thisArg = thisArg
    }

    *iterator(): StreamIterator<T> {
        const { cb, thisArg, atom } = this

        let newCache: Cache<any> // | Err

        try {
            const value = cb.call(thisArg, atom.context)

            newCache = new Data(value)
        } catch (e) {
            newCache = new Err(e as Error)
        }

        return newCache as any // as Err | Data<T>
    }

    dispose(): void {
        //throw new Error('Method not implemented.')
    }
}
