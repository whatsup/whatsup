import { cause } from '../src/cause'
import { conse } from '../src/conse'
import { DeferActor, DefGenerator } from '../src/defer'
import { Stream } from '../src/stream'
import { watch } from '../src/watcher'

describe('Defer', () => {
    it(`defer current value`, () => {
        const mock = jest.fn()
        let def: DeferActor<any>

        const f = cause(function* (ctx) {
            const value = conse('Hello')

            while (true) {
                def = ctx.defer(function* (_, arg) {
                    const newValue = (yield* value) + arg
                    value.set(newValue)
                    return newValue
                })

                yield yield* value
            }
        })

        watch(f, mock)

        expect(mock).lastCalledWith('Hello')

        const result = def!('World')

        expect(result).toBe('HelloWorld')
        expect(mock).lastCalledWith('HelloWorld')

        def!.break()

        expect(() => def!('Double')).toThrow()
    })

    it(`should return some actor on sem sem generator`, () => {
        const mock = jest.fn()
        let def: DeferActor<any>

        const ups = cause(function* (ctx) {
            const value = conse('Hello')

            const define: DefGenerator<never, any> = function* (_, arg) {
                const newValue = (yield* value) + arg
                value.set(newValue)
                return newValue
            }

            while (true) {
                def = ctx.defer(define)

                yield yield* value
            }
        })

        watch(ups, mock)

        expect(mock).lastCalledWith('Hello')

        const old = def!

        def!('World')

        expect(mock).lastCalledWith('HelloWorld')
        expect(def!).toBe(old)
    })

    it(`should extract from nested`, () => {
        const mock = jest.fn()
        let def: DeferActor<any>

        const ups = cause(function* (ctx) {
            const one = conse('one')
            const two = cause(function* () {
                while (true) {
                    yield '[' + (yield* one) + ']'
                }
            })

            def = ctx.defer(function* (_, arg) {
                const newValue = yield* two
                one.set(newValue + arg)
                return newValue
            })

            while (true) {
                yield yield* one
            }
        })

        watch(ups, mock)

        expect(mock).lastCalledWith('one')

        def!('thr')

        expect(mock).lastCalledWith('[one]thr')
    })

    it(`should keep context`, () => {
        const mock = jest.fn()
        let sourceThis: Stream<any>
        let deferThis: Stream<any>
        let def: DeferActor<any>

        const ups = cause(function* (this: Stream<any>, ctx) {
            const one = conse('one')

            sourceThis = this

            def = ctx.defer(function* (this: Stream<any>, _, arg) {
                deferThis = this

                const newValue = yield* one
                one.set(newValue + arg)
                return newValue
            })

            while (true) {
                yield yield* one
            }
        })

        watch(ups, mock)

        expect(mock).lastCalledWith('one')

        def!('thr')

        expect(mock).lastCalledWith('onethr')
        expect(sourceThis!).toBe(deferThis!)
    })
})
