import { Stream } from './stream'
import { Atom } from './atom'

const GLOBAL_MAP = new WeakMap<Stream<unknown>, Atom>()

export class Atomizer<T> {
    private readonly root: Atom<T>
    private readonly map: WeakMap<Stream<T>, Atom>

    constructor(root: Atom) {
        this.root = root
        this.map = new WeakMap()
    }

    get(stream: Stream<T>, multi: boolean): Atom<T> {
        if (multi) {
            if (!this.map.has(stream)) {
                const atom = new Atom(stream, this.root.context)
                this.map.set(stream, atom)
            }

            return this.map.get(stream)!
        }

        if (!GLOBAL_MAP.has(stream)) {
            GLOBAL_MAP.set(stream, new Atom(stream, null))
        }

        return GLOBAL_MAP.get(stream)!
    }
}
