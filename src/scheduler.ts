import { Atom } from './atom'
import { Command, InitCommand } from './command'
import { Delegation } from './delegation'
import { Mutator } from './mutator'
import { Err, Data } from './result'
import { Stack } from './stack'
import { StreamGeneratorFunc, StreamIterator } from './stream'

class Scheduler {
    private master: Transaction | null = null
    private slave: Transaction | null = null

    run<T>(action: (transaction: Transaction) => T): T {
        let key = Symbol('Transaction key')
        let transaction: Transaction

        if (!this.master) {
            transaction = this.master = new Transaction(key)
        } else if (this.master.state === State.Initial) {
            transaction = this.master
        } else if (!this.slave) {
            transaction = this.slave = new Transaction(key)
        } else if (this.slave.state === State.Initial) {
            transaction = this.slave
        } else {
            throw 'Transaction error'
        }

        const result = action(transaction)

        let counter = 0

        while (transaction === this.master) {
            if (counter > 100) {
                throw 'May be cycle?'
            }

            transaction.run(key)

            if (transaction.state === State.Completed) {
                this.master = this.slave
                this.slave = null

                if (this.master) {
                    transaction = this.master
                    key = transaction.key
                    counter++
                    continue
                }
            }

            break
        }

        return result
    }

    do<T, U extends T>(atom: Atom<T>, generator: StreamGeneratorFunc<U>, options: DoOptions = {}): Err | Data<U> {
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
            stack.push(generator.call(stream, context) as StreamIterator<U>)
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

                const result = error
                    ? new Err(value as Error)
                    : new Data(this.prepareNewData(atom, value as U, ignoreCache))

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

                input = this.do(subAtom, subAtom.stream.whatsUp, options)

                if (input instanceof Data && input.value instanceof Delegation) {
                    stack.push(input.value.stream[Symbol.iterator]())
                    input = undefined
                }
                continue
            }

            dependencies && dependencies.disposeUnused()

            const data = this.prepareNewData(atom, value as U, ignoreCache)
            const result = new Data(data)

            !ignoreCache && atom.setCache(result)

            return result
        }
    }

    private prepareNewData<T, U extends T>(atom: Atom<T>, value: U | Mutator<U>, ignoreCache: boolean): U {
        if (value instanceof Mutator) {
            const oldValue = ignoreCache ? undefined : atom.cache && atom.cache!.value
            const newValue = value.mutate(oldValue as U) as U
            return newValue
        }

        return value
    }
}

export const SCHEDULER = new Scheduler()

enum State {
    Initial,
    Executing,
    Completed,
}

class Transaction {
    state = State.Initial
    readonly key: symbol
    private readonly queue = [] as Atom[]
    private readonly queueCandidates = new Set<Atom>()
    private readonly counters = new WeakMap<Atom, number>()
    //private readonly abortTimer: number

    constructor(key: symbol) {
        this.key = key
        //this.abortTimer = setImmediate(() => this.abort()) // TODO
    }

    // abort() {
    //     throw 'Aborted'
    // }

    add(atom: Atom) {
        if (!this.queue.includes(atom)) {
            this.queue.push(atom)
            this.addConsumers(atom.consumers)
        }
    }

    run(key: symbol) {
        if (key === this.key) {
            this.state = State.Executing

            const { queue } = this

            let i = 0

            while (i < queue.length) {
                const atom = queue[i++]
                const oldCache = atom.cache

                SCHEDULER.do(atom, atom.stream.whatsUp, {
                    useSelfStack: true,
                    useDependencies: true,
                    ignoreCacheOnce: true,
                })

                const newCache = atom.cache!
                const consumers = atom.consumers

                if (!newCache.equal(oldCache)) {
                    for (const consumer of consumers) {
                        this.queueCandidates.add(consumer)
                    }
                }

                this.updateQueue(consumers)
            }

            this.state = State.Completed

            //clearImmediate(this.abortTimer) // TODO Node.Immediate mzf
        }
    }

    private addConsumers(consumers: Iterable<Atom>) {
        for (const consumer of consumers) {
            const counter = this.incrementCounter(consumer)

            if (counter > 1) {
                continue
            }

            this.addConsumers(consumer.consumers)
        }
    }

    private updateQueue(consumers: Iterable<Atom>) {
        for (const consumer of consumers) {
            const counter = this.decrementCounter(consumer)

            if (counter === 0) {
                if (this.queueCandidates.has(consumer)) {
                    this.queueCandidates.delete(consumer)
                    this.queue.push(consumer)
                    continue
                }

                this.updateQueue(consumer.consumers)
            }
        }
    }

    private incrementCounter(consumer: Atom) {
        const counter = this.counters.has(consumer) ? this.counters.get(consumer)! + 1 : 1

        this.counters.set(consumer, counter)

        return counter
    }

    private decrementCounter(consumer: Atom) {
        const counter = this.counters.get(consumer)! - 1

        this.counters.set(consumer, counter)

        return counter
    }
}

type DoOptions = {
    useSelfStack?: boolean
    useDependencies?: boolean
    ignoreCache?: boolean
    ignoreCacheOnce?: boolean
}

export function transaction<T>(cb: () => T) {
    return SCHEDULER.run(() => cb())
}
