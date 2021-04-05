import { Factor, factor } from '../src/factor'
import { Event } from '../src/event'
import { fractal } from '../src/fractal'
import { Context } from '../src/context'
import { whatsUp } from '../src/whatsup'

describe('Context', () => {
    let context1: Context
    let context2: Context
    let context3: Context
    let context4: Context

    const test1 = fractal(function* (ctx) {
        context1 = ctx
        while (true) {
            yield yield* test2
        }
    })
    const test2 = fractal(function* (ctx) {
        context2 = ctx
        while (true) {
            yield yield* test3
        }
    })
    const test3 = fractal(function* (ctx) {
        context3 = ctx
        while (true) {
            yield yield* test4
        }
    })
    const test4 = fractal(function* (ctx) {
        context4 = ctx
        while (true) {
            yield 'Hello'
        }
    })

    whatsUp(test1, () => {})

    describe('Sharing', () => {
        const testFactor = new Factor('default')

        it('should have defaultValue', () => {
            expect(testFactor.defaultValue).toBe('default')
        })

        it('should return defaultValue when factor is not defined', () => {
            const value = context1.get(testFactor)
            expect(value).toBe('default')
        })

        it('should throw error when factor without defaultValue not exist in context', () => {
            const testFactor = new Factor()
            expect(() => context2.get(testFactor)).toThrow()
        })

        it('should return test value on child levels', () => {
            context1.share(testFactor, 'hello')

            expect(context2.get(testFactor)).toBe('hello')
            expect(context3.get(testFactor)).toBe('hello')
            expect(context4.get(testFactor)).toBe('hello')
        })

        it('should override factor for child levels', () => {
            context3.share(testFactor, 'world')

            expect(context2.get(testFactor)).toBe('hello')
            expect(context3.get(testFactor)).toBe('hello')
            expect(context4.get(testFactor)).toBe('world')
        })

        it('factor("test") should return instance of factor', () => {
            expect(factor('test')).toBeInstanceOf(Factor)
        })

        it('should share instance to children', () => {
            class Instance {}
            const instance = new Instance()

            context1.share(instance)

            expect(context2.get(Instance)).toBe(instance)
            expect(context3.get(Instance)).toBe(instance)
            expect(context4.get(Instance)).toBe(instance)
        })

        it('should throw error when shared instance not exist', () => {
            class Instance {}

            expect(() => context2.get(Instance)).toThrow()
            expect(() => context3.get(Instance)).toThrow()
            expect(() => context4.get(Instance)).toThrow()
        })

        it('should find instance in context', () => {
            class Base {}
            class Local extends Base {}

            const instance = new Local()

            context1.share(instance)

            expect(context2.find(Base)).toBe(instance)
            expect(context3.find(Base)).toBe(instance)
            expect(context4.find(Base)).toBe(instance)
        })

        it('should find instance in context', () => {
            class Base {}
            class Local extends Base {}

            const instance = new Local()

            context1.share(instance)

            expect(context2.find(Base)).toBe(instance)
            expect(context3.find(Base)).toBe(instance)
            expect(context4.find(Base)).toBe(instance)
        })

        it('should throw error when shared instance not found', () => {
            class Instance {}

            expect(() => context2.find(Instance)).toThrow()
            expect(() => context3.find(Instance)).toThrow()
            expect(() => context4.find(Instance)).toThrow()
        })
    })

    describe('Events', () => {
        class TestEvent extends Event {
            constructor(readonly payload: string) {
                super()
            }
        }

        it('mock should to be called with "hello"', () => {
            const mock = jest.fn()
            const dispose = context1.on(TestEvent, (e) => mock(e.payload))
            context1.dispatch(new TestEvent('hello'))

            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('hello')

            dispose()
        })

        it('mock should to be called with "world" when event dispatch in deep', () => {
            const mock = jest.fn()
            const dispose = context1.on(TestEvent, (e) => mock(e.payload))
            context3.dispatch(new TestEvent('world'))

            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('world')

            dispose()
        })

        it('mocks should to be called with "world" on every level', () => {
            const mock1 = jest.fn()
            const mock2 = jest.fn()
            const dispose1 = context1.on(TestEvent, (e) => mock1(e.payload))
            const dispose2 = context2.on(TestEvent, (e) => mock2(e.payload))
            context3.dispatch(new TestEvent('world'))

            expect(mock1).toBeCalledTimes(1)
            expect(mock1).lastCalledWith('world')
            expect(mock2).toBeCalledTimes(1)
            expect(mock2).lastCalledWith('world')

            dispose1()
            dispose2()
        })

        it('mocks should to be called with "world" on every callback', () => {
            const mock1 = jest.fn()
            const mock2 = jest.fn()
            const dispose1 = context1.on(TestEvent, (e) => mock1(e.payload))
            const dispose2 = context1.on(TestEvent, (e) => mock2(e.payload))
            context3.dispatch(new TestEvent('world'))

            expect(mock1).toBeCalledTimes(1)
            expect(mock1).lastCalledWith('world')
            expect(mock2).toBeCalledTimes(1)
            expect(mock2).lastCalledWith('world')

            dispose1()
            dispose2()
        })

        it('mock2 should to be called & mock1 should not to be called (stopPropagation)', () => {
            const mock1 = jest.fn()
            const mock2 = jest.fn()
            const dispose1 = context1.on(TestEvent, (e) => mock1(e.payload))
            const dispose2 = context2.on(TestEvent, (e) => {
                mock2(e.payload)
                e.stopPropagation()
            })
            context3.dispatch(new TestEvent('world'))

            expect(mock1).toBeCalledTimes(0)
            expect(mock2).toBeCalledTimes(1)
            expect(mock2).lastCalledWith('world')

            dispose1()
            dispose2()
        })

        it('mock2 should to be called & mock1, mock2 should not to be called (stopImmediatePropagation)', () => {
            const mock1 = jest.fn()
            const mock2 = jest.fn()
            const mock3 = jest.fn()
            const dispose1 = context1.on(TestEvent, (e) => mock1(e.payload))
            const dispose2 = context2.on(TestEvent, (e) => {
                mock2(e.payload)
                e.stopImmediatePropagation()
            })
            const dispose3 = context2.on(TestEvent, (e) => mock3(e.payload))
            context3.dispatch(new TestEvent('world'))

            expect(mock1).toBeCalledTimes(0)
            expect(mock2).toBeCalledTimes(1)
            expect(mock2).lastCalledWith('world')
            expect(mock3).toBeCalledTimes(0)

            dispose1()
            dispose2()
            dispose3()
        })

        it('mock should not to be called because it removed through .off(ev, li) method', () => {
            const mock = jest.fn()
            context1.on(TestEvent, mock)
            context1.off(TestEvent, mock)
            context2.dispatch(new TestEvent('world'))

            expect(mock).toBeCalledTimes(0)
        })

        it('all mocks should not to be called because they removed through .off(ev) method', () => {
            const mock1 = jest.fn()
            const mock2 = jest.fn()
            context1.on(TestEvent, mock1)
            context1.on(TestEvent, mock2)
            context1.off(TestEvent)
            context2.dispatch(new TestEvent('world'))

            expect(mock1).toBeCalledTimes(0)
            expect(mock2).toBeCalledTimes(0)
        })
    })
})
