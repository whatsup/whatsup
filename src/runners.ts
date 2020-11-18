import { CollectGeneratorFunc, Fractal, FractalOptions, EasyFractal } from './fractal'
import { Atom } from './atom'

class Root<T> extends Fractal<T> {
    readonly target: Fractal<T>

    constructor(target: Fractal<T>, options?: FractalOptions) {
        super(options)
        this.target = target
    }

    async *collector() {
        while (true) {
            yield yield* this.target
        }
    }
}

function normalizeSource<T>(source: Fractal<T> | CollectGeneratorFunc<T>) {
    if (source instanceof Fractal) {
        return source
    }
    return new EasyFractal(source)
}

export async function* stream<T>(source: Fractal<T> | CollectGeneratorFunc<T>) {
    const fractal = normalizeSource(source)
    const root = new Root(fractal)
    const atom = new Atom(root)

    return yield* atom
}

export async function live<T>(source: Fractal<T> | CollectGeneratorFunc<T>) {
    const fractal = normalizeSource(source)
    const root = new Root(fractal)
    const atom = new Atom(root)

    await atom.activate()

    return () => atom.destroy()
}
