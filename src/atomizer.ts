import { Stream } from './stream'
import { Atom } from './atom'

const GLOBAL_MULTI_MAP = new WeakMap<Stream<any>, Atom>()

export class Atomizer {
    static readonly multiMap = new WeakMap<Stream<any>, Atom>()

    private readonly root: Atom
    private readonly multiMap: WeakMap<Stream<any>, Atom>

    constructor(root: Atom) {
        this.root = root
        this.multiMap = new WeakMap()
    }

    get(stream: Stream<any>, multi: boolean): Atom {
        if (multi) {
            if (!this.multiMap.has(stream)) {
                const atom = new Atom(stream, this.root.context)
                this.multiMap.set(stream, atom)
            }

            return this.multiMap.get(stream)!
        }

        if (!GLOBAL_MULTI_MAP.has(stream)) {
            GLOBAL_MULTI_MAP.set(stream, new Atom(stream, null))
        }

        return GLOBAL_MULTI_MAP.get(stream)!
    }
}
