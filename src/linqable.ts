import { computed, Computed, ComputedOptions } from './computed'
import { observable, Observable } from './observable'
import { transaction } from './transaction'
import { RootContext } from './context'
import { StreamGenerator, StreamGeneratorFunc } from './stream'

export interface Linqable<T, O extends ComputedOptions = ComputedOptions> extends Computed<T, O> {
    constructor: new <O>(o?: O) => Linqable<T, O>
}

export interface LinqableOptions extends ComputedOptions {}

export abstract class Linqable<T, O extends LinqableOptions = LinqableOptions> extends Computed<T, O> {
    readonly linq: LinqFactory<T>
    readonly left: Observable<Linqable<T, O> | null>
    readonly right: Observable<Linqable<T, O> | null>

    constructor(options?: O) {
        super(options)
        this.linq = new LinqFactory(this)
        this.left = observable(null)
        this.right = observable(null)
    }

    chain(options?: O): Linqable<T, O> {
        return transaction(() => {
            let end: Linqable<T, O> = this

            while (end.right.get()) {
                end = end.right.get()!
            }

            const instance = new this.constructor(options)

            end.right.set(instance)

            return instance
        })
    }

    after(arg: Linqable<T, O> | O) {
        return transaction(() => {
            const instance = arg instanceof this.constructor ? (arg as Linqable<T, O>) : new this.constructor(arg)

            const right = this.right.get()

            if (right) {
                right.left.set(instance)
                instance.right.set(right)
            }

            this.right.set(instance)
            instance.left.set(this)

            return instance
        })
    }

    before(arg: Linqable<T, O> | O) {
        return transaction(() => {
            const instance = arg instanceof this.constructor ? (arg as Linqable<T, O>) : new this.constructor(arg)

            const left = this.left.get()

            if (left) {
                left.right.set(instance)
                instance.left.set(left)
            }

            this.left.set(instance)
            instance.right.set(this)

            return instance
        })
    }

    cut() {
        return transaction(() => {
            const left = this.left.get()
            if (left) {
                left.right.set(this.right.get())
            }

            const right = this.right.get()

            if (right) {
                right.left.set(this.left.get())
            }

            this.left.set(null)
            this.right.set(null)

            return this
        })
    }

    swap(instance: Linqable<T, O>) {
        return transaction(() => {
            const selfLeft = this.left.get()
            const selfRight = this.right.get()
            const instLeft = instance.left.get()
            const instRight = instance.right.get()

            this.left.set(instLeft)
            this.right.set(instRight)
            instance.left.set(selfLeft)
            instance.right.set(selfRight)

            return this
        })
    }

    *all() {
        const acc = [] as T[]

        let sibling: Linqable<T, O> | null = this

        do {
            acc.push(yield* sibling!)
            sibling = yield* sibling.right
        } while (sibling)

        return acc
    }

    *take(count: number) {
        return yield* this.slice(0, count)
    }

    *slice(start = 0, length = 0) {
        const acc = [] as T[]

        let sibling: Linqable<T, O> | null = this

        do {
            if (start-- <= 0) {
                acc.push(yield* sibling!)

                if (length-- === 0) {
                    break
                }
            }
            start--

            sibling = yield* sibling.right
        } while (sibling)

        return acc
    }

    *filter(generator: (item: Linqable<T, O>) => Generator<never, boolean>) {
        const acc = [] as Linqable<T, O>[]

        let sibling: Linqable<T, O> | null = this

        do {
            if (!(yield* generator(sibling))) {
                acc.push(sibling)
            }

            sibling = yield* sibling.right
        } while (sibling)

        return acc
    }

    *map<U extends T>(generator: (item: Linqable<T, O>) => Generator<never, U>) {
        const acc = [] as U[]

        let sibling: Linqable<T, O> | null = this

        do {
            acc.push(yield* generator(sibling))
            sibling = yield* sibling.right
        } while (sibling)

        return acc
    }

    *every(generator: (item: Linqable<T, O>) => Generator<never, boolean>) {
        let sibling: Linqable<T, O> | null = this

        do {
            if (!(yield* generator(sibling))) {
                return false
            }

            sibling = yield* sibling.right
        } while (sibling)

        return true
    }

    *some(generator: (item: Linqable<T, O>) => Generator<never, boolean>) {
        let sibling: Linqable<T, O> | null = this

        do {
            if (yield* generator(sibling)) {
                return true
            }

            sibling = yield* sibling.right
        } while (sibling)

        return false
    }

    *count() {
        let i = 0

        let sibling: Linqable<T, O> | null = this

        do {
            i++
            sibling = yield* sibling.right
        } while (sibling)

        return i
    }
}

export type LinqGenerator<T> = (context: RootContext) => Generator<T[], never> | (() => Generator<T[], never>)

export interface LinqOptions extends ComputedOptions {}

export class LinqFactory<T> {
    readonly root: Linqable<T>

    constructor(root: Linqable<T>) {
        this.root = root
    }
    all() {
        return Linq.all(this.root)
    }
    take(count: number) {
        return Linq.take(this.root, count)
    }
    slice(start?: number, end?: number) {
        return Linq.slice(this.root, start, end)
    }
    filter(generator: (item: Linqable<T>) => Generator<never, boolean>) {
        return Linq.filter(this.root, generator)
    }
    map<U extends T>(generator: (item: Linqable<T>) => Generator<never, U>) {
        return Linq.map<T, U>(this.root, generator)
    }
    every(generator: (item: Linqable<T>) => Generator<never, boolean>) {
        return Linq.every(this.root, generator)
    }
    some(generator: (item: Linqable<T>) => Generator<never, boolean>) {
        return Linq.some(this.root, generator)
    }
    count() {
        return Linq.count(this.root)
    }
}

export abstract class Linq<T, O extends LinqOptions = LinqOptions> extends Computed<T[], O> {
    static all<T>(root: Linqable<T>) {
        return linq(function* () {
            while (true) {
                yield yield* root.all()
            }
        })
    }

    static take<T>(root: Linqable<T>, count: number) {
        return linq(function* () {
            while (true) {
                yield yield* root.take(count)
            }
        })
    }

    static slice<T>(root: Linqable<T>, start?: number, end?: number) {
        return linq(function* () {
            while (true) {
                yield yield* root.slice(start, end)
            }
        })
    }

    static filter<T>(root: Linqable<T>, generator: (item: Linqable<T>) => Generator<never, boolean>) {
        return linq(function* () {
            while (true) {
                yield yield* root.filter(generator)
            }
        })
    }

    static map<T, U extends T>(root: Linqable<T>, generator: (item: Linqable<T>) => Generator<never, U>) {
        return linq(function* () {
            while (true) {
                yield yield* root.map(generator)
            }
        })
    }

    static every<T>(root: Linqable<T>, generator: (item: Linqable<T>) => Generator<never, boolean>) {
        return computed(function* () {
            while (true) {
                yield yield* root.every(generator)
            }
        })
    }

    static some<T>(root: Linqable<T>, generator: (item: Linqable<T>) => Generator<never, boolean>) {
        return computed(function* () {
            while (true) {
                yield yield* root.some(generator)
            }
        })
    }

    static count<T>(root: Linqable<T>) {
        return computed(function* () {
            while (true) {
                yield yield* root.count()
            }
        })
    }

    take(count: number) {
        return this.slice(0, count)
    }

    slice(start?: number, end?: number) {
        return linq(
            function* (this: Linq<T>) {
                while (true) {
                    const items = yield* this
                    yield items.slice(start, end)
                }
            },
            { thisArg: this }
        )
    }

    filter(generator: (v: T) => Generator<never, boolean>) {
        return linq(
            function* (this: Linq<T>) {
                while (true) {
                    const items = yield* this
                    const acc = [] as T[]

                    for (const item of items) {
                        if (yield* generator(item)) {
                            acc.push(item)
                        }
                    }

                    yield acc
                }
            },
            { thisArg: this }
        )
    }

    map<U extends T>(generator: (item: T) => Generator<never, U>) {
        return linq<U>(
            function* (this: Linq<T>) {
                while (true) {
                    const items = yield* this
                    const acc = [] as U[]

                    for (const item of items) {
                        acc.push(yield* generator(item))
                    }

                    yield acc
                }
            },
            { thisArg: this }
        )
    }

    every(generator: (item: T) => Generator<never, boolean>) {
        return computed<boolean>(
            function* (this: Linq<T>) {
                while (true) {
                    const items = yield* this
                    let result: boolean = true

                    for (const item of items) {
                        if (!(yield* generator(item))) {
                            result = false
                        }
                    }

                    yield result
                }
            },
            { thisArg: this }
        )
    }

    some(generator: (item: T) => Generator<never, boolean>) {
        return computed<boolean>(
            function* (this: Linq<T>) {
                while (true) {
                    const items = yield* this
                    let result = false

                    for (const item of items) {
                        if (yield* generator(item)) {
                            result = true
                        }
                    }

                    yield result
                }
            },
            { thisArg: this }
        )
    }

    count() {
        return computed<number>(
            function* (this: Linq<T>) {
                while (true) {
                    const items = yield* this
                    yield items.length
                }
            },
            { thisArg: this }
        )
    }
}

export function linq<T>(generator: StreamGeneratorFunc<T[]>, options?: LinqOptions): Linq<T> {
    return new (class extends Linq<T> {
        stream(context: RootContext) {
            return generator.call(this, context)
        }
    })(options)
}

export function linqable<T>(generator: StreamGeneratorFunc<T>, options?: LinqableOptions): Computed<T> {
    return new (class extends Linqable<T> {
        stream(context: RootContext): StreamGenerator<T> {
            return generator.call(this, context)
        }
    })(options)
}
