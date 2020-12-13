import {
    computed,
    fractal,
    factor,
    Context,
    Computed,
    Fractal,
    FractalOptions,
    Stream,
    StreamGenerator,
} from '@fract/core'
import { pathname } from '@fract/browser-pathname'

export type RouteGeneratorFunc<T> =
    | ((context: Context, ...args: Computed<string>[]) => StreamGenerator<T>)
    | (() => StreamGenerator<T>)

export const PATHNAME = factor<Stream<string>>()
export const DEFAULT_ROUTE_VALUE = factor(null)

abstract class Route<T> extends Fractal<T> {
    protected abstract getNestedFractal(
        matched: Computed<boolean>,
        match: Computed<RegExpMatchArray | null>
    ): Fractal<T>
    private readonly regexp: RegExp

    constructor(pattern: string | RegExp) {
        super()

        if (typeof pattern === 'string') {
            pattern = new RegExp(`^${pattern}`)
        }

        this.regexp = pattern
    }

    protected *stream(ctx: Context) {
        const { regexp } = this
        const defaultValue = ctx.get(DEFAULT_ROUTE_VALUE)
        const path = ctx.get(PATHNAME) || pathname
        const match = computed(function* () {
            while (true) {
                const result = (yield* path).match(regexp)

                if (result && result.index !== 0) {
                    throw `Matched substring must beginning from first char (current is ${result.index}). Check your RegExp.`
                }

                yield result
            }
        })
        const matched = computed(function* () {
            while (true) {
                yield (yield* match) !== null
            }
        })
        const tail = computed(function* () {
            while (true) {
                if (yield* matched) {
                    const fullpath = yield* path
                    const subpath = (yield* match)![0]

                    yield fullpath.slice(subpath.length)
                    continue
                }

                yield ''
            }
        })
        const nested = this.getNestedFractal(matched, match)

        ctx.set(PATHNAME, tail)

        while (true) {
            if (yield* matched) {
                yield nested
                continue
            }

            yield defaultValue!
        }
    }
}

class FromFractalRoute<T> extends Route<T> {
    private readonly target: Fractal<T>

    constructor(pattern: string | RegExp, target: Fractal<T>) {
        super(pattern)
        this.target = target
    }

    protected getNestedFractal() {
        return this.target
    }
}

class FromGeneratorRoute<T> extends Route<T> {
    private readonly target: RouteGeneratorFunc<T>
    private readonly targetOptions: FractalOptions

    constructor(pattern: string | RegExp, target: RouteGeneratorFunc<T>, targetOptions: FractalOptions) {
        super(pattern)
        this.target = target
        this.targetOptions = targetOptions
    }

    protected getNestedFractal(matched: Computed<boolean>, match: Computed<RegExpMatchArray | null>) {
        const { target, targetOptions } = this
        const { length } = target
        const params = Array.from({ length }, (_, i) =>
            computed(function* () {
                while (true) {
                    if (yield* matched) {
                        yield (yield* match)![i + 1]
                        continue
                    }

                    yield ''
                }
            })
        )

        return fractal<T>(function* (this: typeof targetOptions.thisArg, context: Context) {
            return yield* target.call(this, context, ...params)
        }, targetOptions)
    }
}

export function route<T>(pattern: string | RegExp, target: Fractal<T>): Route<T>
export function route<T>(
    pattern: string | RegExp,
    target: RouteGeneratorFunc<T>,
    targetOptions?: FractalOptions
): Route<T>
export function route<T>(
    pattern: string | RegExp,
    target: Fractal<T> | RouteGeneratorFunc<T>,
    targetOptions: FractalOptions = {}
) {
    if (target instanceof Fractal) {
        return new FromFractalRoute(pattern, target)
    }
    return new FromGeneratorRoute(pattern, target, targetOptions)
}
