import { Atom } from './atom'
import { build } from './builder'
import { Stack } from './stack'

class Task {
    initializing = true
    readonly key: symbol
    private readonly queue = [] as Atom[]
    private readonly queueCandidates = new Set<Atom>()
    private readonly counters = new Map<Atom, number>()

    constructor() {
        this.key = Symbol('task key')
    }

    rebuild(atom: Atom) {
        if (!this.queue.includes(atom)) {
            this.queue.push(atom)

            const stack = new Stack<Iterator<Atom>>()

            main: while (true) {
                stack.push(atom.consumers[Symbol.iterator]())

                while (true) {
                    const { done, value } = stack.peek().next()

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

                    atom = value
                    continue main
                }
            }
        }
    }

    run() {
        this.initializing = false

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

let master: Task | null = null
let slave: Task | null = null

export function task<T>(action: (task: Task) => T): T {
    let key: symbol
    let task: Task

    if (master === null) {
        task = master = new Task()
        key = task.key
    } else if (master.initializing) {
        task = master
    } else if (slave === null) {
        task = slave = new Task()
        key = task.key
    } else if (slave.initializing) {
        task = slave
    } else {
        throw 'Task error'
    }

    const result = action(task)

    while (task === master && task.key === key!) {
        task.run()

        master = slave
        slave = null

        if (master !== null) {
            task = master
            key = task.key
            continue
        }

        break
    }

    return result
}

export function action<T>(cb: () => T) {
    return task(() => cb())
}
