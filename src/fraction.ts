import { Emitter, EmitterOptions } from './emitter'
import { Fork, Tree } from './fork'

export interface FractionOptions extends EmitterOptions {}

export class Fraction<T> extends Emitter<T> {
    private forks = new Set<Fork>()
    private data: T

    constructor(value: T, options: FractionOptions = {}) {
        super(options)
        this.data = value
    }

    async *collector(tree: Tree<T>) {
        this.forks.add(tree['fork'])

        try {
            while (true) {
                yield this.data
            }
        } finally {
            this.forks.delete(tree['fork'])
        }
    }

    use(value: T) {
        this.data = value

        for (const fork of this.forks) {
            fork.update()
        }
    }

    get() {
        return this.data
    }

    set(value: T) {
        this.use(value)
    }
}

export function fraction<T>(value: T, options?: FractionOptions) {
    return new Fraction(value, options)
}
