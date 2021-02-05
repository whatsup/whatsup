import { Atom } from './atom'
import { build } from './builder'
import { Stack } from './stack'

class Scheduler {
    private master: Task | null = null
    private slave: Task | null = null

    run<T>(action: (task: Task) => T): T {
        let key = Symbol('Task key')
        let task: Task

        if (!this.master) {
            task = this.master = new Task(key)
        } else if (this.master.state === State.Initial) {
            task = this.master
        } else if (!this.slave) {
            task = this.slave = new Task(key)
        } else if (this.slave.state === State.Initial) {
            task = this.slave
        } else {
            throw 'Task error'
        }

        const result = action(task)

        let counter = 0

        while (task === this.master) {
            if (counter > 100) {
                throw 'May be cycle?'
            }
            if (task.key === key) {
                task.run()
            }
            if (task.state === State.Completed) {
                this.master = this.slave
                this.slave = null

                if (this.master) {
                    task = this.master
                    key = task.key
                    counter++
                    continue
                }
            }

            break
        }

        return result
    }
}

enum State {
    Initial,
    Executing,
    Completed,
}

class Task {
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

    rebuild(atom: Atom) {
        if (!this.queue.includes(atom)) {
            this.queue.push(atom)

            const stack = new Stack<Iterator<Atom, any, any>, Atom, any, any>()

            main: while (true) {
                stack.push(atom.consumers[Symbol.iterator]())

                while (true) {
                    const { done, value } = stack.next(undefined)

                    if (done) {
                        stack.pop()

                        if (!stack.empty) {
                            continue
                        }

                        return value
                    }

                    const counter = this.incrementCounter(value)

                    if (counter > 1) {
                        continue
                    }

                    // if (value instanceof Atom) {
                    atom = value
                    continue main
                    //}

                    throw 'Maz Afa-ka'
                }
            }
        }
    }

    run() {
        this.state = State.Executing

        const { queue } = this

        let i = 0

        while (i < queue.length) {
            const atom = queue[i++]
            const consumers = atom.consumers
            const oldCache = atom.cache
            const newCache = build(atom, null, {
                useSelfStack: true,
                useDependencies: true,
                ignoreCacheOnce: true,
            })

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

    // private addConsumers(consumers: Iterable<Atom>) {
    //     for (const consumer of consumers) {
    //         const counter = this.incrementCounter(consumer)

    //         if (counter > 1) {
    //             continue
    //         }

    //         this.addConsumers(consumer.consumers)
    //     }
    // }

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

const SCHEDULER = new Scheduler()

export function task<T>(cb: (task: Task) => T) {
    return SCHEDULER.run(cb)
}

export function action<T>(cb: () => T) {
    return task(() => cb())
}
