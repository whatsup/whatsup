import { StreamIterator, Stream } from './stream'
import { Context } from './context'
import { Dependencies } from './dependencies'
import { SCHEDULER } from './scheduler'
import { Err, Data } from './result'
import { Stack } from './stack'

export class Atom<T = unknown> {
    readonly stream: Stream<T>
    readonly context: Context
    readonly stack: Stack<StreamIterator<T>>
    readonly atomizer: Atomizer
    readonly consumers: Set<Atom>
    readonly dependencies: Dependencies
    private _cache: Err | Data<T> | undefined

    constructor(stream: Stream<T>, parent: Atom | null) {
        this.stack = new Stack()
        this.stream = stream
        this.context = new Context(this, parent && parent.context)
        this.atomizer = new Atomizer(this)
        this.consumers = new Set()
        this.dependencies = new Dependencies(this)
    }

    addConsumer(consumer: Atom) {
        this.consumers.add(consumer)
    }

    getConsumers() {
        return this.consumers
    }

    get cache() {
        return this._cache
    }

    setCache(cache: Err | Data<T>) {
        return (this._cache = cache)
    }

    update() {
        SCHEDULER.run((transaction) => transaction.add(this))
    }

    dispose(initiator?: Atom) {
        if (initiator) {
            this.consumers.delete(initiator)
        }
        if (this.consumers.size === 0) {
            this._cache = undefined
            this.context.dispose()
            this.dependencies.dispose()

            while (!this.stack.empty) {
                this.stack.pop()!.return!()
            }
        }
    }
}

// class AtomMap {
//     readonly key = Symbol()

//     has<T>(stream: Stream<T>) {
//         return Reflect.has(stream, this.key)
//     }

//     get<T>(stream: Stream<T>) {
//         return Reflect.get(stream, this.key)
//     }

//     set<T>(stream: Stream<T>, atom: Atom<T>) {
//         return Reflect.set(stream, this.key, atom)
//     }
// }

class Atomizer {
    static readonly map = new WeakMap<Stream, Atom>()

    private readonly root: Atom
    private readonly map: WeakMap<Stream, Atom>

    constructor(root: Atom) {
        this.root = root
        this.map = new WeakMap()
    }

    get<T>(stream: Stream<T>, multi: boolean): Atom<T> {
        if (multi) {
            if (!this.map.has(stream)) {
                const atom = new Atom(stream, this.root)
                this.map.set(stream, atom)
            }

            return this.map.get(stream) as Atom<T>
        }

        if (!Atomizer.map.has(stream)) {
            Atomizer.map.set(stream, new Atom(stream, null))
        }

        return Atomizer.map.get(stream) as Atom<T>
    }
}
