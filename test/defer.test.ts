import { cause } from '../src/cause'
import { conse } from '../src/conse'
import { DeferActor } from '../src/defer'
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
    })
})
