import { cause } from '../src/cause'
import { conse } from '../src/conse'
import { fractal } from '../src/fractal'
import { Stream, StreamLike } from '../src/stream'
import { whatsUp } from '../src/whatsup'
import { delegate } from '../src/delegation'

describe('Actor', () => {
    it(`should extract current value`, () => {
        const mock = jest.fn()
        let change: (arg: any) => void

        const f = cause(function* (ctx) {
            const value = conse('Hello')

            while (true) {
                change = ctx.actor(function* (_, arg) {
                    const oldValue = yield* value
                    const newValue = oldValue + arg
                    value.set(newValue)
                    return newValue
                })

                yield yield* value
            }
        })

        whatsUp(f, mock)

        expect(mock).lastCalledWith('Hello')

        const result = change!('World')

        expect(result).toBe('HelloWorld')
        expect(mock).lastCalledWith('HelloWorld')
    })

    it(`should extract from nested`, () => {
        const mock = jest.fn()
        let def: (arg: any) => void

        const ups = cause(function* (ctx) {
            const one = conse('one')
            const two = cause(function* () {
                while (true) {
                    yield '[' + (yield* one) + ']'
                }
            })

            def = ctx.actor(function* (_, arg: string) {
                const newValue = yield* two
                one.set(newValue + arg)
                return newValue
            })

            while (true) {
                yield yield* one
            }
        })

        whatsUp(ups, mock)

        expect(mock).lastCalledWith('one')

        def!('thr')

        expect(mock).lastCalledWith('[one]thr')
    })

    it(`should keep context`, () => {
        const mock = jest.fn()
        let sourceThis: Stream<any>
        let actorThis: StreamLike<any>
        let def: (arg: any) => void

        const ups = cause(function* (this: Stream<any>, ctx) {
            const one = conse('one')

            sourceThis = this

            def = ctx.actor(function* (this: StreamLike<any>, _, arg) {
                actorThis = this

                const newValue = yield* one
                one.set(newValue + arg)
                return newValue
            })

            const subcause = cause(function* () {
                return yield* one
            })

            while (true) {
                yield yield* subcause
            }
        })

        whatsUp(ups, mock)

        expect(mock).lastCalledWith('one')

        def!('thr')

        expect(mock).lastCalledWith('onethr')
        expect(sourceThis!).toBe(actorThis!)
    })

    it(`should extract delegation`, () => {
        const mock = jest.fn()
        let def: (arg: any) => void

        const ups = cause(function* (ctx) {
            const one = conse('one')
            const two = fractal<string>(function* () {
                while (true) yield delegate(one)
            } as any)

            def = ctx.actor(function* (_, arg) {
                const newValue = yield* two
                one.set(newValue + arg)
                return newValue
            })

            while (true) {
                yield yield* one
            }
        })

        whatsUp(ups, mock)

        expect(mock).lastCalledWith('one')

        def!('thr')

        expect(mock).lastCalledWith('onethr')
    })

    it(`should extract error from delegation`, () => {
        const mock = jest.fn()
        const errMock = jest.fn()
        let def: (arg: any) => void

        const ups = cause(function* (ctx) {
            const one = conse('one')
            const two = fractal<string>(function* () {
                while (true) yield delegate(thr)
            } as any)
            const thr = fractal<string>(function* () {
                throw 'THR'
            } as any)

            def = ctx.actor(function* (_, arg) {
                try {
                    const newValue = yield* two
                    one.set(newValue + arg)
                    return newValue
                } catch (e) {
                    errMock(e)
                    return
                }
            })

            while (true) {
                yield yield* one
            }
        })

        whatsUp(ups, mock)

        expect(mock).lastCalledWith('one')

        def!('thr')

        expect(errMock).lastCalledWith('THR')
    })

    it(`should catch exception`, () => {
        const mock = jest.fn()
        let change: (arg: any) => void

        const ups = cause(function* (ctx) {
            const one = conse('one')

            change = ctx.actor(function* () {
                throw 'WoW'
            })

            while (true) {
                yield yield* one
            }
        })

        whatsUp(ups, mock)

        expect(mock).lastCalledWith('one')

        expect(() => change!('two')).toThrow('WoW')
    })

    it(`should catch nested exception`, () => {
        const mock = jest.fn()
        let change: (arg: any) => void

        const nested = cause(function* () {
            throw 'WoW'
        })
        const ups = cause(function* (ctx) {
            const one = conse('one')

            change = ctx.actor(function* () {
                return yield* nested
            })

            while (true) {
                yield yield* one
            }
        })

        whatsUp(ups, mock)

        expect(mock).lastCalledWith('one')

        expect(() => change!('two')).toThrow('WoW')
    })
})
