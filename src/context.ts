import { Atom } from './atom'
import { Factor } from './factor'

export class Context {
    private readonly atom: Atom

    constructor(atom: Atom) {
        this.atom = atom
    }

    /** @internal */
    get parent(): Context | null {
        const { consumer, delegator } = this.atom
        return delegator?.context || consumer?.context || null
    }

    get<T>(factor: Factor<T>): T | undefined {
        return factor.get(this)
    }

    set<T>(factor: Factor<T>, value: T) {
        factor.set(this, value)
    }

    update() {
        return this.atom.update()
    }
}
