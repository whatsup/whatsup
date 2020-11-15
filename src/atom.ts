import { Emitable, EmitIterator, Emitter } from './emitter'
import { Context } from './context'
import { Dependencies } from './dependencies'
import { ConsumerQuery } from './query'
import { Mutator } from './mutator'
import { Temporary } from './temporary'

const DESTROYER = Symbol('Destroy symbol')

export class Atom<T = any> {
    readonly emitter: Emitter<T>
    readonly consumer: Atom | null
    readonly delegator: Atom | null
    readonly context: Context = new Context(this)
    private readonly stack = [] as EmitIterator<T>[]
    private readonly subatoms = new WeakMap<Emitable<any>, Atom>()
    private readonly delegations = new WeakMap<Emitter<any>, Delegation<T>>()
    private readonly dependencies: Dependencies = new Dependencies(this)
    private activityId = 0
    private builded = false
    private revision = 0
    private nextBuildStarter?: () => void
    protected error?: unknown
    protected data?: T | Delegation<T>
    protected nextData?: Promise<T | Delegation<T>>

    constructor(emitter: Emitter<T>, consumer: Atom | null = null, delegator: Atom | null = null) {
        this.emitter = emitter
        this.consumer = consumer
        this.delegator = delegator
    }

    async activate() {
        if (!this.activityId) {
            this.activityId = Math.random()
            await this.build()
        }
    }

    async *[Symbol.asyncIterator]() {
        await this.activate()

        if (this.hasError()) {
            const e = yield this

            throw e
        }

        return yield this
    }

    update(): Promise<void> {
        return this.rebuild(this)
    }

    /** @internal */
    async rebuild(initiator: Atom) {
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

    destroy() {
        this.error = undefined
        this.activityId = 0
        this.builded = false
        this.revision = 0
        this.data = undefined
        this.nextData = undefined
        this.nextBuildStarter = undefined
        this.dependencies.destroy()

        while (this.stack.length) {
            this.stack.pop()!.return!()
        }
    }

    getSubatom<U>(key: Emitable<U>) {
        if (!this.subatoms.has(key)) {
            const atom = this.createSubatom(key)
            this.subatoms.set(key, atom)
        }
        return this.subatoms.get(key)!
    }

    getRevision() {
        return this.revision
    }

    getData() {
        return this.data
    }

    hasError() {
        return !!this.error
    }

    getError() {
        return this.error
    }

    private async build(): Promise<T | Delegation<T>> {
        const { activityId, stack, dependencies, emitter, context } = this

        dependencies.swap()

        main: while (true) {
            if (!stack.length) {
                stack.push(emitter.collector(context))
            }

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
                        if (value.hasError()) {
                            input = value.getError()
                        } else {
                            const data = value.getData()

                            if (data instanceof Delegation) {
                                stack.push(data.iterator())
                                input = undefined
                            } else {
                                input = data as T
                            }
                        }

                        dependencies.add(value)
                        continue
                    }
                    if (!dependencies.synchronize()) {
                        dependencies.reswap()
                        continue main
                    }

                    await this.updateData(value)

                    dependencies.destroyUnused()
                } catch (e) {
                    if (e !== DESTROYER) {
                        this.stack.pop()
                        this.updateError(e)
                    }

                    dependencies.destroyUnused()
                }

                return this.data!
            }
        }
    }

    private updateError(error: any) {
        const nextData = this.createNextDataStarter(false).then(() => this.build())

        if (this.builded) {
            if (this.consumer && error !== this.error) {
                this.consumer.rebuild(this)
            }
        } else {
            this.builded = true
        }

        this.error = error
        this.data = undefined
        this.nextData = nextData
        this.revision++
    }

    private async updateData(value: T | Temporary<T>) {
        const temporary = value instanceof Temporary
        const data = this.prepareNewData(temporary ? await (value as Temporary<T>).data : (value as T))
        const nextData = this.createNextDataStarter(temporary).then(() => this.build())

        if (this.builded) {
            if (this.consumer && data !== this.data) {
                this.consumer.rebuild(this)
            }
        } else {
            this.builded = true
        }

        this.error = undefined
        this.data = data
        this.nextData = nextData
        this.revision++
    }

    private prepareNewData(value: T): T | Delegation<T> {
        if (value instanceof Mutator) {
            return value.mutate(this.data) as T
        }
        if (this.emitter.delegation && value instanceof Emitter) {
            return this.getDelegation(value)
        }

        return value
    }

    private createNextDataStarter(temporary: boolean): Promise<void> {
        if (temporary) {
            return Promise.resolve()
        }
        return new Promise((r) => (this.nextBuildStarter = r))
    }

    private createSubatom<U>(source: Emitable<U>): Atom<U> {
        if (source instanceof Emitter) {
            return new Atom<U>(source, this)
        }
        if (source instanceof Delegation) {
            const { emitter, delegator } = source
            return new Atom<U>(emitter, this, delegator)
        }
        throw 'Unknown atom source'
    }

    private getDelegation(emitter: Emitter<T>) {
        if (!this.delegations.has(emitter)) {
            this.delegations.set(emitter, new Delegation(emitter, this))
        }
        return this.delegations.get(emitter)!
    }
}

class Delegation<T> extends Emitable<T> {
    constructor(readonly emitter: Emitter<T>, readonly delegator: Atom<T>) {
        super()
    }

    async *iterator() {
        return yield* this
    }
}
