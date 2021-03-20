import { Delegation } from './delegation'
import { Mutator } from './mutator'
import { Atom } from './atom'
import { Command, Handshake } from './command'
import { Err, Data, Result } from './result'
import { Stack } from './stack'
import { StreamIterator } from './stream'

class Transaction {
    initializing = true
    readonly key: symbol
    private readonly queue = [] as Atom[]
    private readonly queueCandidates = new Set<Atom>()
    private readonly counters = new Map<Atom, number>()

    constructor() {
        this.key = Symbol('Transaction key')
    }

    take(atom: Atom) {
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

            build(memory.call(atom, relations.call(atom, source.call(atom, atom)), true)).next()

            const newCache = atom.cache!

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

function* build<T, U extends T>(iterator: Generator<unknown, Err | Data<U>>): any {
    const stack = new Stack<Generator<unknown, Err | Data<U>>>()

    main: while (true) {
        stack.push(iterator)

        let input = undefined

        while (true) {
            const { done, value } = stack.peek().next(input)

            if (done) {
                stack.pop()

                if (!stack.empty) {
                    input = value
                    continue
                }

                return value as Err | Data<U>
            }

            if (value instanceof Atom) {
                iterator = memory.call(value, relations.call(value, source.call(value, value)))
                continue main
            }

            return value as Err | Data<U>
        }
    }
}

export function* memory<T>(this: Atom, iterator: StreamIterator<T>, force = false): any {
    const hasCache = !!this.cache
    const oldValue = hasCache && this.cache?.value

    if (!force && hasCache) {
        return this.cache
    }

    let input: unknown

    while (true) {
        const { done, value } = iterator.next(input)

        if (value instanceof Result) {
            this.setCache(value)
        }

        if (value instanceof Mutator) {
            input = value.mutate(oldValue as T)
            continue
        }

        if (done) {
            return value
        }

        input = yield value
    }
}

export function* relations<T>(this: Atom, iterator: StreamIterator<T>): any {
    let input: unknown

    this.dependencies.swap()

    while (true) {
        const { done, value } = iterator.next(input)

        if (done) {
            this.dependencies.disposeUnused()
            return value
        }

        if (value instanceof Handshake) {
            const { stream, multi } = value
            const subAtom = this.atomizer.get(stream, multi)

            this.dependencies.add(subAtom)
            subAtom.consumers.add(this)

            input = yield subAtom
            continue
        }

        input = yield value
    }
}

function* source<T, U extends T>(this: Atom<T>, atom: Atom<T>): Generator<unknown, Err | Data<U>> {
    const { context, stream, stack } = atom

    if (stack.empty) {
        stack.push(stream.whatsUp!.call(stream, context) as StreamIterator<U>)
    }

    let input: unknown

    while (true) {
        if (input instanceof Data && input.value instanceof Delegation) {
            stack.push(input.value.stream[Symbol.iterator]())
            input = undefined
        }

        let done: boolean
        let error: boolean
        let value: U | Command | Delegation<U> | Mutator<U>

        try {
            const result = stack.peek().next(input)

            value = result.value!
            done = result.done!
            error = false
        } catch (e) {
            value = e
            done = true
            error = true
        }

        if (done) {
            stack.pop()
        }

        if (value instanceof Handshake) {
            input = yield value
            continue
        }

        if (error) {
            input = new Err(value as Error)
        } else if (value instanceof Mutator) {
            input = new Data(yield value)
        } else {
            input = new Data(value)
        }

        if (done && !stack.empty) {
            continue
        }

        return input as any
    }
}

//const MEMORY = new WeakMap<Atom>()

let master: Transaction | null = null
let slave: Transaction | null = null

export function transaction<T>(cb: (transaction: Transaction) => T): T {
    let key: symbol
    let transaction: Transaction

    if (master === null) {
        transaction = master = new Transaction()
        key = transaction.key
    } else if (master.initializing) {
        transaction = master
    } else if (slave === null) {
        transaction = slave = new Transaction()
        key = transaction.key
    } else if (slave.initializing) {
        transaction = slave
    } else {
        throw 'Task error'
    }

    const result = cb(transaction)

    while (transaction === master && transaction.key === key!) {
        transaction.run()

        master = slave
        slave = null

        if (master !== null) {
            transaction = master
            key = transaction.key
            continue
        }

        break
    }

    return result
}

export function action<T>(cb: () => T) {
    return transaction(() => cb())
}

/*

Кран раздает крипту FRL

Фракталы и фракции

Пользователь вкладывает деньги в распределенную сеть покупая на эти деньги
фьючерсы фракталов и фракций, которые торгуются на бирже 

Деньги идут на работу бота - каждая успешная операция бота 
генерирует новый фрактал, он делится на 100 000 000 фракций

Полученные деньги из цепочки распределяются между участниками
10% суммы делится между всеми участниками разработки
внесшими вклад на гитхаб получают процент
т.е. кто-то вкладывает, кто-то 

90% которых
распределяются на всех участников в процентном соотношении от вклада
вырученные деньги также делятся между всеми в процентном соотношении

исходный код бота открыт для всех по лицензии такой что
его можно копировать редактировать и использовать как либо только с целью
внести вклад в развитие проекта, никакого коммерческого использования,
создания "клонов" и т.д.

оставшиеся 10% распределяются между всеми участниками команды разработки - бонус

фракталы и фракции нужно добавить на биржу в начальном количестве 

как только фьючерсы откупились они становятся настоящими токенами

фьючерс - цепочка заранее предопределенных токенов 
еще не реализованая в сети но точно пойдущая по заранее заданному сценарию



*/
