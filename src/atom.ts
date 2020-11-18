import { Emitter, CollectIterator, Fractal } from './fractal'
import { Context } from './context'
import { Dependencies } from './dependencies'
import { ConsumerQuery } from './query'
import { Mutator } from './mutator'
import { Temporary } from './temporary'

const DESTROYER = Symbol('Destroy symbol')

export class Atom<T = any> {
    readonly fractal: Fractal<T>
    readonly consumer: Atom | null
    readonly delegator: Atom | null
    readonly context: Context = new Context(this)
    private readonly stack = [] as CollectIterator<T>[]
    private readonly subatoms = new WeakMap<Emitter<any>, Atom>()
    private readonly delegations = new WeakMap<Fractal<any>, Delegation<T>>()
    private readonly dependencies: Dependencies = new Dependencies(this)
    private activityId = 0
    private revision = 0
    private data?: T | Delegation<T> | Error
    private dataIsError?: boolean
    private initialBuild = true
    private nextBuildPromise?: Promise<void>
    private nextBuildStarter?: () => void

    constructor(fractal: Fractal<T>, consumer: Atom | null = null, delegator: Atom | null = null) {
        this.fractal = fractal
        this.consumer = consumer
        this.delegator = delegator
    }

    async *[Symbol.asyncIterator]() {
        try {
            await this.activate()

            while (true) {
                if (this.dataIsError) {
                    throw this.data
                }

                yield this.data
                await this.nextBuildPromise
            }
        } finally {
            this.destroy()
        }
    }

    update() {
        this.rebuild(this)
    }

    destroy() {
        this.activityId = 0
        this.initialBuild = true
        this.revision = 0
        this.data = undefined
        this.dataIsError = undefined
        this.nextBuildPromise = undefined
        this.nextBuildStarter = undefined
        this.dependencies.destroy()

        while (this.stack.length) {
            this.stack.pop()!.return!()
        }
    }

    async activate() {
        if (!this.activityId) {
            this.activityId = Math.random()
            await this.build()
        }
    }

    /** @internal */
    async *emit() {
        await this.activate()

        const result = yield this

        if (this.dataIsError) {
            throw result
        }

        return result
    }

    /** @internal */
    getRevision() {
        return this.revision
    }

    /** @internal */
    getData() {
        return this.data
    }

    /** @internal */
    getSubatom<U>(key: Emitter<U>) {
        if (!this.subatoms.has(key)) {
            const atom = this.createSubatom(key)
            this.subatoms.set(key, atom)
        }
        return this.subatoms.get(key)!
    }

    private rebuild(initiator: Atom) {
        if (!this.activityId) {
            throw new Error('Atom is not active')
        }
        if (this.nextBuildStarter) {
            this.nextBuildStarter()
            this.nextBuildStarter = undefined
        } else {
            this.dependencies.addUnsynchronized(initiator)
        }
    }

    private async build() {
        const { activityId, stack, dependencies, fractal, context } = this

        dependencies.swap()

        main: while (true) {
            if (!stack.length) {
                stack.push(fractal.collector(context))
            }

            let data: T | Delegation<T> | Error
            let dataIsError: boolean
            let temporary: boolean
            let input: any

            while (true) {
                const lastIndex = stack.length - 1
                const iterator = stack[lastIndex]

                try {
                    const { done, value } = await iterator.next(input)

                    if (this.activityId !== activityId) {
                        throw DESTROYER
                    }
                    if (done) {
                        stack.pop()

                        if (stack.length) {
                            input = value
                            continue
                        }
                    }
                    if (value instanceof ConsumerQuery) {
                        input = this
                        continue
                    }
                    if (value instanceof Atom) {
                        const data = value.getData()

                        if (data instanceof Delegation) {
                            stack.push(data.emit())
                            input = undefined
                        } else {
                            input = data as T
                        }

                        dependencies.add(value)
                        continue
                    }
                    if (!dependencies.synchronize()) {
                        dependencies.reswap()
                        continue main
                    }

                    temporary = value instanceof Temporary
                    data = this.prepareNewData(temporary ? (value as Temporary<T>).data : (value as T))
                    dataIsError = false
                } catch (error) {
                    if (error === DESTROYER) {
                        return
                    }

                    this.stack.pop()

                    temporary = false
                    data = error
                    dataIsError = true
                }

                dependencies.destroyUnused()

                if (this.initialBuild) {
                    this.initialBuild = false
                } else if (this.consumer && (data !== this.data || dataIsError !== this.dataIsError)) {
                    this.consumer.rebuild(this)
                }

                this.data = data
                this.dataIsError = dataIsError
                this.nextBuildPromise = this.createNextBuildStarter(temporary).then(() => this.build())
                this.revision++

                return
            }
        }
    }

    private prepareNewData(value: T): T | Delegation<T> {
        if (value instanceof Mutator) {
            return value.mutate(this.data) as T
        }
        if (this.fractal.delegation && value instanceof Fractal) {
            return this.getDelegation(value)
        }

        return value
    }

    private createNextBuildStarter(temporary: boolean): Promise<void> {
        if (temporary) {
            return Promise.resolve()
        }
        return new Promise((r) => (this.nextBuildStarter = r))
    }

    private createSubatom<U>(source: Emitter<U>): Atom<U> {
        if (source instanceof Fractal) {
            return new Atom<U>(source, this)
        }
        if (source instanceof Delegation) {
            const { fractal, delegator } = source
            return new Atom<U>(fractal, this, delegator)
        }
        throw 'Unknown atom source'
    }

    private getDelegation(fractal: Fractal<T>) {
        if (!this.delegations.has(fractal)) {
            this.delegations.set(fractal, new Delegation(fractal, this))
        }
        return this.delegations.get(fractal)!
    }
}

class Delegation<T> extends Emitter<T> {
    constructor(readonly fractal: Fractal<T>, readonly delegator: Atom<T>) {
        super()
    }

    async *emit() {
        return yield* this
    }
}
