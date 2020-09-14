import { fractal, Fractal, FractalOptions } from './fractal'
import { tmp } from './helpers'
import { Projection } from './typings'

export type IsFraction = typeof IsFraction
export const IsFraction = Symbol('This is fraction')

export interface Fraction<T> extends Fractal<T> {
    readonly [IsFraction]: IsFraction
    use(data: Projection<T>): void
}

export interface FractionOptions extends FractalOptions {}

export function fraction<T>(current: Projection<T>, options: FractionOptions = {}): Fraction<T> {
    let use: (data: Projection<T>) => void
    let next = function promise(): Promise<T | Fractal<T>> {
        return new Promise<T | Fractal<T>>((r) => (use = (v) => ((next = promise()), r(v))))
    }.call(void 0)

    return Object.defineProperties(
        fractal(async function* Fraction() {
            let data = current

            while (true) {
                yield tmp(data)
                data = next
            }
        }, options),
        {
            use: {
                value(data: Projection<T>) {
                    if (data !== current) use((current = data))
                },
            },
            [IsFraction]: {
                value: IsFraction,
            },
        }
    )
}

export function isFraction<T>(arg: any): arg is Fraction<T> {
    return arg != null && Object.hasOwnProperty.call(arg, IsFraction)
}
