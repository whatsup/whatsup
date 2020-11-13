import { Context } from './context'
import { Dependencies } from './dependencies'
import { Emitable, EmitIterator, Emitter } from './emitter'
import { Mutator } from './mutator'
import { ConsumerQuery } from './query'
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
    private readonly dependencies = new Dependencies()
    private data!: T | Delegation<T>
    private revision = 0
    private activityId = 0
    private building = false

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
        return yield this
    }

    update() {
        return this.rebuild()
    }

    async rebuild(initiator?: Atom) {
        if (this.building) {
            if (initiator) {
                this.dependencies.addUnsynchronized(initiator)
            }
            return
        }

        const oldData = this.data

        try {
            await this.build()

            if (this.consumer && this.data !== oldData) {
                this.consumer.rebuild(this)
            }
        } catch (e) {
            if (e !== DESTROYER) {
                throw e
            }
        }
    }

    destroy() {
        this.activityId = 0
        this.building = false
        this.revision = 0
        this.data = (void 0 as unknown) as T
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

    protected setData(data: T | Delegation<T>) {
        this.data = data
    }

    private activityThreadControl(activityId: number) {
        if (this.activityId !== activityId) {
            throw DESTROYER
        }
    }

    private async build() {
        const { activityId, stack, dependencies, emitter, context } = this

        this.beforeBuild()

        let temporary: boolean

        main: while (true) {
            temporary = false

            if (!stack.length) {
                stack.push(emitter.collector(context))
            }

            let input: any

            while (true) {
                const lastIndex = stack.length - 1
                const iterator = stack[lastIndex]
                const { done, value } = await iterator.next(input)

                this.activityThreadControl(activityId)

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
                        stack.push(data.iterator())
                        input = void 0
                    } else {
                        input = data as T
                    }

                    dependencies.add(value)
                    continue
                }
                if (value instanceof Temporary) {
                    temporary = true
                }

                const newData = await this.prepareNewData(value)

                this.activityThreadControl(activityId)

                if (!dependencies.synchronize()) {
                    continue main
                }

                this.setData(newData)

                break
            }
            break
        }

        this.afterBuild()

        if (temporary) {
            this.update()
        }
    }

    private beforeBuild() {
        this.building = true
        this.dependencies.swap()
    }

    private afterBuild() {
        this.dependencies.destroyUnused()
        this.revision++
        this.building = false
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

    private async prepareNewData(value: T | Temporary<T>): Promise<T | Delegation<T>> {
        if (value instanceof Temporary) {
            return this.prepareNewData(await value.data)
        }

        if (value instanceof Mutator) {
            return value.mutate(this.data) as T
        }

        if (this.emitter.delegation && value instanceof Emitter) {
            return this.getDelegation(value)
        }

        return value
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
