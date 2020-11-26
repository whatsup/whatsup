import { ComputedAtom } from './atom'
import { RootContext } from './context'
import { StreamOptions, Stream, StreamGenerator, StreamGeneratorFunc } from './stream'

export interface ComputedOptions extends StreamOptions {}

type Sibling<T extends Computed<any, any>> = T & {
    constructor: new <O>(o?: O) => Sibling<any>
    removed: Observable<boolean>
}

export abstract class Computed<T, O extends ComputedOptions = ComputedOptions> extends Stream<T> {
    protected readonly atom: ComputedAtom
    protected abstract stream(context: RootContext): StreamGenerator<T>

    constructor(options?: O) {
        super(options)
        this.atom = new ComputedAtom(this)
    }

    protected getAtom() {
        return this.atom
    }
}

export abstract class Linqable<T, O extends ComputedOptions = ComputedOptions> extends Computed<T, O> {
    left: Observable<Sibling<this> | null>
    right: Observable<Sibling<this> | null>

    constructor(options?: O) {
        super(options)
        this.left = observable(null)
        this.right = observable(null)
    }

    chain(this: Sibling<this>, options?: O): Sibling<this> {
        let sibling: Sibling<this> | null = this

        do {
            sibling = sibling.right.get()
        } while (sibling)

        const instance = new this.constructor(options)

        this.right.set(instance)

        return instance
    }

    after(this: Sibling<this>, arg: Sibling<this> | O) {
        const instance = arg instanceof this.constructor ? (arg as Sibling<this>) : new this.constructor(arg)

        const right = this.right.get()

        if (right) {
            right.left.set(instance)
            instance.right.set(right)
        }

        this.right.set(instance)
        instance.left.set(this)

        return instance
    }

    before(this: Sibling<this>, arg: Sibling<this> | O) {
        const instance = arg instanceof this.constructor ? (arg as Sibling<this>) : new this.constructor(arg)

        const left = this.left.get()

        if (left) {
            left.right.set(instance)
            instance.left.set(left)
        }

        this.left.set(instance)
        instance.right.set(this)

        return instance
    }

    cut(this: Sibling<this>) {
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
    }

    swap(this: Sibling<this>, instance: Sibling<this>) {
        const selfLeft = this.left.get()
        const selfRight = this.right.get()
        const instLeft = instance.left.get()
        const instRight = instance.right.get()

        this.left.set(instLeft)
        this.right.set(instRight)
        instance.left.set(selfLeft)
        instance.right.set(selfRight)

        return this
    }

    *all(this: Sibling<this>, limit: number) {
        const acc = [] as T[]

        let sibling: Sibling<this> | null = this

        do {
            acc.push(yield* sibling!)
            sibling = yield* sibling.right

            if (limit-- === 0) {
                break
            }
        } while (sibling)

        return acc
    }

    *take(this: Sibling<this>, count: number) {
        return yield* this.slice(0, count)
    }

    *slice(this: Sibling<this>, start = 0, length = 0) {
        const acc = [] as T[]

        let sibling: Sibling<this> | null = this

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

    *filter(this: Sibling<this>, generator: (v: T) => Generator<never, boolean>) {
        const acc = [] as T[]

        let sibling: Sibling<this> | null = this

        do {
            const item = yield* sibling

            if (!(yield* generator(item))) {
                acc.push(item)
            }
        } while (sibling)

        return acc
    }
}

export type LinqGenerator<T> = () => Generator<never, T[]>

export interface LinqOptions extends ComputedOptions {}

export class Linq<T, O extends LinqOptions = LinqOptions> extends Computed<T[], O> {
    static from<T, O extends LinqOptions = LinqOptions>(root: Linqable<T, O> | null, options: LinqOptions) {
        return new Linq<T>(function* () {
            const acc = [] as T[]

            while (root) {
                acc.push(yield* root)
                root = yield* root.right
            }

            return acc
        }, options)
    }

    readonly generator: LinqGenerator<T>

    constructor(generator: LinqGenerator<T>, options?: O) {
        super(options)
        this.generator = generator
    }

    *stream() {
        while (true) {
            yield yield* this.generator()
        }
    }

    link(generator: LinqGenerator<T>, options?: LinqOptions) {
        return new Linq(generator, options)
    }

    slice(start?: number, end?: number) {
        return this.link(
            function* (this: Linq<T>) {
                const items = yield* this
                return items.slice(start, end)
            },
            { thisArg: this }
        )
    }

    filter(generator: (v: T) => Generator<never, boolean>) {
        return this.link(
            function* (this: Linq<T>) {
                const items = yield* this
                return items.filter(generator)
            },
            { thisArg: this }
        )
    }
}

export function computed<T>(generator: StreamGeneratorFunc<T>, options?: ComputedOptions): Computed<T> {
    return new (class extends Linqable<T> {
        stream(context: RootContext): StreamGenerator<T> {
            return generator.call(this, context)
        }
    })(options)
}

export class Observable<T> extends Computed<T> {
    private value: T

    constructor(value: T) {
        super()
        this.value = value
    }

    *stream() {
        while (true) yield this.value
    }

    get() {
        return this.value
    }

    set(value: T) {
        this.value = value
        this.atom.update()
    }
}

export function observable<T>(value: T) {
    return new Observable(value)
}
