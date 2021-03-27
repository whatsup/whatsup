import { StreamIterator, StreamLike } from './stream'
import { Context } from './context'
import { Dependencies } from './dependencies'
import { Cache } from './cache'
import { Stack } from './stack'

export class Atom<T = unknown> {
    readonly stream: StreamLike<T>
    readonly context: Context
    readonly stack: Stack<StreamIterator<T>>
    readonly atomizer: Atomizer
    readonly consumers: Set<Atom>
    readonly dependencies: Dependencies
    private cache: Cache<T> | undefined

    constructor(stream: StreamLike<T>, parent: Atom | null) {
        this.stack = new Stack()
        this.stream = stream
        this.context = new Context(this, parent ? parent.context : null)
        this.atomizer = new Atomizer(this)
        this.consumers = new Set()
        this.dependencies = new Dependencies(this)
    }

    hasCache() {
        return this.cache !== undefined
    }

    getCache() {
        return this.cache
    }

    setCache(cache: Cache<T>) {
        return (this.cache = cache)
    }

    dispose(initiator?: Atom) {
        if (initiator) {
            this.consumers.delete(initiator)
        }
        if (this.consumers.size === 0) {
            this.cache = undefined
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
    static readonly map = new WeakMap<StreamLike, Atom>()

    private readonly atom: Atom
    private readonly map: WeakMap<StreamLike, Atom>

    constructor(atom: Atom) {
        this.atom = atom
        this.map = new WeakMap()
    }

    get<T>(stream: StreamLike<T>, multi: boolean): Atom<T> {
        if (multi) {
            if (!this.map.has(stream)) {
                const atom = new Atom(stream, this.atom)
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
