import { Factor } from './factor'
import { Fork } from './fork'

export class Context {
    private readonly fork: Fork

    constructor(fork: Fork) {
        this.fork = fork
    }

    /** @internal */
    get parent(): Context | null {
        const { consumer, delegator } = this.fork
        return delegator?.context || consumer?.context || null
    }

    get<T>(factor: Factor<T>): T | undefined {
        return factor.get(this)
    }

    set<T>(factor: Factor<T>, value: T) {
        factor.set(this, value)
    }
}
