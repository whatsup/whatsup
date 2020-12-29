import { cause } from '../src/cause'
import { conse } from '../src/conse'
import { fractal } from '../src/fractal'
import { ActorController, ActorGenerator } from '../src/actor'
import { Stream } from '../src/stream'
import { whatsUp } from '../src/observer'
import { delegate } from '../src/delegation'

describe('Actor', () => {
    it(`should extract current value`, () => {
        const mock = jest.fn()
        let change: ActorController<any, any>

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

        change!.dispose()

        expect(() => change!('Double')).toThrow()
    })

    it(`should return some actor on sem sem generator`, () => {
        const mock = jest.fn()
        let def: ActorController<any, any>

        const ups = cause(function* (ctx) {
            const value = conse('Hello')

            const define: ActorGenerator<string, string> = function* (_, arg) {
                const newValue = (yield* value) + arg
                value.set(newValue)
                return newValue
            }

            while (true) {
                def = ctx.actor(define)

                yield yield* value
            }
        })

        whatsUp(ups, mock)

        expect(mock).lastCalledWith('Hello')

        const old = def!

        def!('World')

        expect(mock).lastCalledWith('HelloWorld')
        expect(def!).toBe(old)
    })

    it(`should extract from nested`, () => {
        const mock = jest.fn()
        let def: ActorController<any, any>

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
        let actorThis: Stream<any>
        let def: ActorController<any, any>

        const ups = cause(function* (this: Stream<any>, ctx) {
            const one = conse('one')

            sourceThis = this

            def = ctx.actor(function* (this: Stream<any>, _, arg) {
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
        let def: ActorController<any, any>

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
        let def: ActorController<any, any>

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

    it(`should throw already breaked`, () => {
        const mock = jest.fn()
        let change: ActorController<any, any>

        const ups = cause(function* (ctx) {
            const one = conse('one')

            change = ctx.actor(function* (_, arg: string) {
                one.set(arg)
                change.dispose()
            })

            while (true) {
                yield yield* one
            }
        })

        whatsUp(ups, mock)

        expect(mock).lastCalledWith('one')

        change!('two')

        expect(mock).lastCalledWith('two')
        expect(() => change!('thr')).toThrow('Already breaked')
    })

    it(`should break when atom dispose`, () => {
        const mock = jest.fn()
        const disposeMock = jest.fn()
        let change: ActorController<any, any>

        const ups = cause(function* (ctx) {
            try {
                const one = conse('one')

                change = ctx.actor(function* (_, arg: string) {
                    one.set(arg)
                })

                while (true) {
                    yield yield* one
                }
            } finally {
                disposeMock()
            }
        })

        const dispose = whatsUp(ups, mock)

        expect(mock).lastCalledWith('one')

        change!('two')

        expect(mock).lastCalledWith('two')

        dispose()

        expect(disposeMock).toBeCalled()

        expect(() => change!('thr')).toThrow('Already breaked')
    })

    // it(`should throw unknown value`, () => {
    //     const mock = jest.fn()
    //     let change: ActorController<any, any>

    //     const ups = cause(function* (ctx) {
    //         const one = conse('one')

    //         change = ctx.actor(function* (_, arg: string) {
    //             yield Symbol('WoW') as any
    //             one.set(arg)
    //         })

    //         while (true) {
    //             yield yield* one
    //         }
    //     })

    //     whatsUp(ups, mock)

    //     expect(mock).lastCalledWith('one')

    //     expect(() => change!('two')).toThrow('Unknown value')
    // })

    it(`should catch exception`, () => {
        const mock = jest.fn()
        let change: ActorController<any, any>

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
        let change: ActorController<any, any>

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
