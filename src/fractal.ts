import { Context, createContext } from './context'
import { ContextQuery, BuilderQuery } from './queries'
import { Builder } from './builders'
import { Bubble } from './typings'

export type IsFractal = typeof IsFractal
export const IsFractal = Symbol('This is fractal')

export interface Fractal<T> {
    (): never
    readonly name: string
    readonly [IsFractal]: IsFractal
    [Symbol.asyncIterator](): AsyncGenerator<never /** Really is Bubble<T> */, T>
}

export interface FractalOptions {
    name?: string
}

export function fractal<T>(generator: () => AsyncGenerator<Bubble<T>, T>, params: FractalOptions = {}): Fractal<T> {
    if (generator.length > 0) {
        throw new Error(
            'Using args in generator not implemented, maybe we will discuss it in issues https://github.com/fract/core/issues'
        )
    }

    const { name = generator.name || 'Fractal' } = params
    const CONTEXTS = new WeakMap<Context<any>, Context<T>>()

    function mrFractal() {
        throw new Error(
            'Сall functionality not implemented, maybe we will discuss it in issues https://github.com/fract/core/issues'
        )
    }

    return Object.defineProperties(mrFractal, {
        [Symbol.asyncIterator]: {
            async *value() {
                const parent: Context<any> = yield ContextQuery
                const builder: Builder<T> = yield BuilderQuery

                if (!CONTEXTS.has(parent)) {
                    const ctx = createContext(parent, generator, { name })
                    CONTEXTS.set(parent, ctx)
                }

                const ctx = CONTEXTS.get(parent)!

                return yield builder(ctx)
            },
        },
        [IsFractal]: {
            value: IsFractal,
        },
        name: {
            value: name,
        },
        toString: {
            value() {
                return `[fractal ${name}]`
            },
        },
    })
}

export function isFractal<T>(arg: any): arg is Fractal<T> {
    return arg != null && Object.hasOwnProperty.call(arg, IsFractal)
}
