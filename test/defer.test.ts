import { cause } from '../src/cause'
import { conse } from '../src/conse'
import { DeferActor, DefGenerator } from '../src/defer'
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
})
