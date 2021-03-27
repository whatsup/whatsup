import { cause, fractal, factor, Context, Cause, Fractal, Stream, StreamGenerator, delegate } from 'whatsup'
import { pathname } from '@whatsup/browser-pathname'

export type RouteGeneratorFunc<T> =
    | ((context: Context, ...args: Cause<string>[]) => StreamGenerator<T>)
    | (() => StreamGenerator<T>)

export const PATHNAME = factor<Stream<string>>(undefined)
export const DEFAULT_ROUTE_VALUE = factor(null)

abstract class Route<T> extends Fractal<T> {
    protected abstract getNestedFractal(matched: Cause<boolean>, match: Cause<RegExpMatchArray | null>): Fractal<T>
    private readonly regexp: RegExp

    constructor(pattern: string | RegExp) {
        super()

        if (typeof pattern === 'string') {
            pattern = new RegExp(`^${pattern}`)
        }

        this.regexp = pattern
    }

    *whatsUp(ctx: Context) {
        const { regexp } = this
        const defaultValue = ctx.get(DEFAULT_ROUTE_VALUE)!
        const path = ctx.get(PATHNAME) || pathname
        const match = cause(function* () {
            while (true) {
                const result = (yield* path).match(regexp)

                if (result && result.index !== 0) {
                    throw `Matched substring must beginning from first char (current is ${result.index}). Check your RegExp.`
                }

                yield result
            }
        })
        const matched = cause(function* () {
            while (true) {
                yield (yield* match) !== null
            }
        })
        const tail = cause(function* () {
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
        const wrapped = fractal(function* (ctx) {
            ctx.share(PATHNAME, tail)

            while (true) {
                yield yield* nested
            }
        })

        while (true) {
            if (yield* matched) {
                yield delegate(wrapped)
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
    private readonly thisArg: unknown

    constructor(pattern: string | RegExp, target: RouteGeneratorFunc<T>, thisArg?: unknown) {
        super(pattern)
        this.target = target
        this.thisArg = thisArg
    }

    protected getNestedFractal(matched: Cause<boolean>, match: Cause<RegExpMatchArray | null>) {
        const { target, thisArg } = this
        const { length } = target
        const params = Array.from({ length }, (_, i) =>
            cause(function* () {
                while (true) {
                    if (yield* matched) {
                        yield (yield* match)![i + 1]
                        continue
                    }

                    yield ''
                }
            })
        )

        return fractal<T>(function* (this: typeof thisArg, context: Context) {
            return yield* target.call(this, context, ...params)
        }, thisArg)
    }
}

export function route<T>(pattern: string | RegExp, target: Fractal<T>): Route<T>
export function route<T>(pattern: string | RegExp, target: RouteGeneratorFunc<T>, thisArg?: unknown): Route<T>
export function route<T>(pattern: string | RegExp, target: Fractal<T> | RouteGeneratorFunc<T>, thisArg?: unknown) {
    if (target instanceof Fractal) {
        return new FromFractalRoute(pattern, target)
    }
    return new FromGeneratorRoute(pattern, target, thisArg)
}
