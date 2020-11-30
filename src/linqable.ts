import { computed, Computed, ComputedOptions } from './computed'
import { observable, Observable } from './observable'
import { transaction } from './scheduler'
import { RootContext } from './context'
import { StreamGenerator, StreamGeneratorFunc } from './stream'

export interface LinqableOptions extends ComputedOptions {}

export abstract class Linqable<T, O extends LinqableOptions = LinqableOptions> extends Computed<T, O> {
    readonly linq: LinqFactory<this>
    readonly left: Observable<this | null>
    readonly right: Observable<this | null>

    constructor(options?: O) {
        super(options)
        this.linq = new LinqFactory(this as this)
        this.left = observable(null)
        this.right = observable(null)
    }

    private construct(options: O) {
        return new (this.constructor as new (o: O) => this)(options)
    }

    jump(length: number): this | null {
        if (length <= 0) {
            return this
        }

        const right = this.right.get()

        if (right) {
            return right.jump(length - 1)
        }

        return null
    }

    chain(options: O): this {
        return transaction(() => {
            let end: this = this

            while (end.right.get()) {
                end = end.right.get()!
            }

            const instance = this.construct(options)

            end.right.set(instance)
            instance.left.set(this)

            return instance
        })
    }

    after(arg: this | O) {
        return transaction(() => {
            const instance = arg instanceof this.constructor ? (arg as this) : this.construct(arg as O)

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

    before(arg: this | O) {
        return transaction(() => {
            const instance = arg instanceof this.constructor ? (arg as this) : this.construct(arg as O)

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
            const right = this.right.get()

            if (left) {
                left.right.set(right)
            }

            if (right) {
                right.left.set(left)
            }

            this.left.set(null)
            this.right.set(null)

            return this
        })
    }

    swap(instance: this) {
        return transaction(() => {
            const selfLeft = this.left.get()
            const selfRight = this.right.get()
            const instLeft = instance.left.get()
            const instRight = instance.right.get()

            if (selfLeft) {
                selfLeft.right.set(instance)
            }
            if (selfRight) {
                selfRight.left.set(instance)
            }
            if (instLeft) {
                instLeft.right.set(this)
            }
            if (instRight) {
                instRight.left.set(this)
            }

            this.left.set(instLeft)
            this.right.set(instRight)

            instance.left.set(selfLeft)
            instance.right.set(selfRight)

            return this
        })
    }

    *all() {
        const acc = [] as this[]

        let sibling: this | null = this

        do {
            acc.push(sibling)
            sibling = yield* sibling.right
        } while (sibling)

        return acc
    }

    *take(count: number) {
        return yield* this.slice(0, count)
    }

    *slice(start = 0, length = 0) {
        const acc = [] as this[]

        let sibling: this | null = this

        do {
            if (start-- <= 0) {
                acc.push(sibling)

                if (length-- === 0) {
                    break
                }
            }
            start--

            sibling = yield* sibling.right
        } while (sibling)

        return acc
    }

    *filter(generator: (item: this) => Generator<never, boolean>) {
        const acc = [] as this[]

        let sibling: this | null = this

        do {
            if (yield* generator(sibling)) {
                acc.push(sibling)
            }

            sibling = yield* sibling.right
        } while (sibling)

        return acc
    }

    *map<U>(generator: (item: this) => Generator<never, U>) {
        const acc = [] as U[]

        let sibling: this | null = this

        do {
            acc.push(yield* generator(sibling))
            sibling = yield* sibling.right
        } while (sibling)

        return acc
    }

    *every(generator: (item: this) => Generator<never, boolean>) {
        let sibling: this | null = this

        do {
            if (!(yield* generator(sibling))) {
                return false
            }

            sibling = yield* sibling.right
        } while (sibling)

        return true
    }

    *some(generator: (item: this) => Generator<never, boolean>) {
        let sibling: this | null = this

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

        let sibling: this | null = this

        do {
            i++
            sibling = yield* sibling.right
        } while (sibling)

        return i
    }
}

export type LinqGenerator<T> = (context: RootContext) => Generator<T[], never> | (() => Generator<T[], never>)

export interface LinqOptions extends ComputedOptions {}

export class LinqFactory<T extends Linqable<any>> {
    readonly root: T

    constructor(root: T) {
        this.root = root
    }
    all(): Linq<T, LinqOptions> {
        return Linq.all(this.root)
    }
    take(count: number): Linq<T, LinqOptions> {
        return Linq.take(this.root, count)
    }
    slice(start?: number, end?: number): Linq<T, LinqOptions> {
        return Linq.slice(this.root, start, end)
    }
    filter(generator: (item: T) => Generator<never, boolean>): Linq<T, LinqOptions> {
        return Linq.filter(this.root, generator)
    }
    map<U>(generator: (item: T) => Generator<never, U>): Linq<U, LinqOptions> {
        return Linq.map<T, U>(this.root, generator)
    }
    every(generator: (item: T) => Generator<never, boolean>): Computed<boolean> {
        return Linq.every(this.root, generator)
    }
    some(generator: (item: T) => Generator<never, boolean>): Computed<boolean> {
        return Linq.some(this.root, generator)
    }
    count(): Computed<number> {
        return Linq.count(this.root)
    }
}

export abstract class Linq<T, O extends LinqOptions = LinqOptions> extends Computed<T[], O> {
    static all<T extends Linqable<any>>(root: T) {
        return linq(function* () {
            while (true) {
                yield yield* root.all()
            }
        })
    }

    static take<T extends Linqable<any>>(root: T, count: number) {
        return linq(function* () {
            while (true) {
                yield yield* root.take(count)
            }
        })
    }

    static slice<T extends Linqable<any>>(root: T, start?: number, end?: number) {
        return linq(function* () {
            while (true) {
                yield yield* root.slice(start, end)
            }
        })
    }

    static filter<T extends Linqable<any>>(root: T, generator: (item: T) => Generator<never, boolean>) {
        return linq(function* () {
            while (true) {
                yield yield* root.filter(generator)
            }
        })
    }

    static map<T extends Linqable<any>, U>(root: T, generator: (item: T) => Generator<never, U>) {
        return linq(function* () {
            while (true) {
                yield yield* root.map(generator)
            }
        })
    }

    static every<T extends Linqable<any>>(root: T, generator: (item: T) => Generator<never, boolean>) {
        return computed(function* () {
            while (true) {
                yield yield* root.every(generator)
            }
        })
    }

    static some<T extends Linqable<any>>(root: T, generator: (item: T) => Generator<never, boolean>) {
        return computed(function* () {
            while (true) {
                yield yield* root.some(generator)
            }
        })
    }

    static count<T extends Linqable<any>>(root: T) {
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

    map<U>(generator: (item: T) => Generator<never, U>) {
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

    out<U = T>(generator: (item: T) => Generator<never, U> = defaultOutGenerator) {
        const self = this

        return {
            *[Symbol.iterator]() {
                const items = yield* self
                const acc = [] as U[]

                for (const item of items) {
                    acc.push(yield* generator(item))
                }

                return acc
            },
        }
    }
}

function* defaultOutGenerator<T, U>(item: T): Generator<never, U> {
    return yield* (item as any) as Generator<never, U>
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
