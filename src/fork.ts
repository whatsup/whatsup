import { Emitable, EmitIterator, Emitter } from './emitter'
import { Factor } from './factor'
import { Mutator } from './mutator'
import { ConsumerQuery } from './query'
import { Temporary } from './temporary'

const DESTROYER = Symbol('Destroy symbol')

export class Tree<T> {
    constructor(private readonly fork: Fork<T>) {
        this.fork = fork
    }

    get consumer(): Tree<any> | null {
        const { consumer } = this.fork
        return consumer && consumer.tree
    }

    get context(): Tree<any> | null {
        const { consumer, context } = this.fork
        const fork = context || consumer
        return fork && fork.tree
    }

    get<T>(factor: Factor<T>): T | undefined {
        return factor.get(this)
    }

    set<T>(factor: Factor<T>, value: T) {
        factor.set(this, value)
    }
}

export class Fork<T = any> {
    readonly emitter: Emitter<T>
    readonly consumer: Fork | null
    readonly context: Fork | null
    readonly tree: Tree<T> = new Tree(this)
    private readonly stack = [] as EmitIterator<T>[]
    private readonly forks = new WeakMap<Emitable<any>, Fork>()
    private readonly contextBounds = new WeakMap<Emitter<any>, ContextBound<T>>()
    private readonly dependencies = new Dependencies()
    private data!: T | ContextBound<T>
    private revision = 0
    private aliveId = 0
    private building = false

    constructor(emitter: Emitter<T>, consumer: Fork | null = null, context: Fork | null = null) {
        this.emitter = emitter
        this.consumer = consumer
        this.context = context
    }

    async live() {
        if (!this.aliveId) {
            this.aliveId = Math.random()
            await this.build()
        }
    }

    async *[Symbol.asyncIterator]() {
        await this.live()
        return yield this
    }

    update() {
        return this.rebuild()
    }

    async rebuild(initiator?: Fork) {
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
        this.aliveId = 0
        this.building = false
        this.revision = 0
        this.data = (void 0 as unknown) as T
        this.dependencies.destroy()

        while (this.stack.length) {
            this.stack.pop()!.return!()
        }
    }

    getFork<U>(key: Emitable<U>) {
        if (!this.forks.has(key)) {
            const fork = this.fork(key)
            this.forks.set(key, fork)
        }
        return this.forks.get(key)!
    }

    getRevision() {
        return this.revision
    }

    getData() {
        return this.data
    }

    protected setData(data: T | ContextBound<T>) {
        this.data = data
    }

    private destroyControl(aliveId: number) {
        if (this.aliveId !== aliveId) {
            throw DESTROYER
        }
    }

    private async build() {
        const { aliveId, stack, dependencies, emitter, tree } = this

        this.beforeBuild()

        let temporary: boolean

        main: while (true) {
            temporary = false

            if (!stack.length) {
                stack.push(emitter.collector(tree))
            }

            let input: any

            while (true) {
                const lastIndex = stack.length - 1
                const iterator = stack[lastIndex]
                const { done, value } = await iterator.next(input)

                this.destroyControl(aliveId)

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
                if (value instanceof Fork) {
                    const data = value.getData()

                    if (data instanceof ContextBound) {
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

                this.destroyControl(aliveId)

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

    private fork<U>(source: Emitable<U>): Fork<U> {
        if (source instanceof Emitter) {
            return new Fork<U>(source, this)
        }
        if (source instanceof ContextBound) {
            const { emitter, context } = source
            return new Fork<U>(emitter, this, context)
        }
        throw 'Unknown fork source'
    }

    private getContextBound(emitter: Emitter<T>) {
        if (!this.contextBounds.has(emitter)) {
            this.contextBounds.set(emitter, new ContextBound(emitter, this))
        }
        return this.contextBounds.get(emitter)!
    }

    private async prepareNewData(value: T | Temporary<T>): Promise<T | ContextBound<T>> {
        if (value instanceof Temporary) {
            return this.prepareNewData(await value.data)
        }

        if (value instanceof Mutator) {
            return value.mutate(this.data) as T
        }

        if (this.emitter.delegation && value instanceof Emitter) {
            return this.getContextBound(value)
        }

        return value
    }
}

class ContextBound<T> extends Emitable<T> {
    constructor(readonly emitter: Emitter<T>, readonly context: Fork<T>) {
        super()
    }

    iterator() {
        return this[Symbol.asyncIterator]()
    }
}

class Dependencies {
    private current = new Map<Fork, number>()
    private fusty = new Map<Fork, number>()
    private unsynchronized = new Set<Fork>()

    add(fork: Fork) {
        const revision = fork.getRevision()
        this.current.set(fork, revision)
    }

    addUnsynchronized(fork: Fork) {
        this.unsynchronized.add(fork)
    }

    clearCurrent() {
        this.current.clear()
    }

    swap() {
        const { current, fusty: fusty } = this
        this.current = fusty
        this.fusty = current
    }

    destroy() {
        this.current.forEach((_, fork) => fork.destroy())
        this.current.clear()
    }

    destroyUnused() {
        this.fusty.forEach((_, fork) => !this.current.has(fork) && fork.destroy())
        this.fusty.clear()
    }

    synchronize() {
        for (const fork of this.unsynchronized) {
            this.unsynchronized.delete(fork)

            if (this.current.has(fork)) {
                const revision = this.current.get(fork)

                if (fork.getRevision() !== revision) {
                    this.clearCurrent()
                    return false
                }
            }
        }
        return true
    }
}
