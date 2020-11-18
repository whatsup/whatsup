import { Factor, factor } from '../src/factor'
import { Event } from '../src/event'
import { Atom } from '../src/atom'
import { Fractal } from '../src/fractal'

describe('Context', () => {
    class TestFractal extends Fractal<any> {
        async *collector() {}
    }

    const testFractal = new TestFractal()
    const atom = new Atom(testFractal)
    const atom2 = atom.getSubatom(testFractal)
    const atom3 = atom2.getSubatom(testFractal)
    const atom4 = atom3.getSubatom(testFractal)

    const context1 = atom.context
    const context2 = atom2.context
    const context3 = atom3.context
    const context4 = atom4.context

    describe('Factors', () => {
        const testFactor = new Factor('default')

        it('should have defaultValue', () => {
            expect(testFactor.defaultValue).toBe('default')
        })

        it('should return defaultValue when factor is not defined', () => {
            const value = context1.get(testFactor)
            expect(value).toBe('default')
        })

        it('should return test value on child levels', () => {
            context1.set(testFactor, 'hello')

            expect(context2.get(testFactor)).toBe('hello')
            expect(context3.get(testFactor)).toBe('hello')
            expect(context4.get(testFactor)).toBe('hello')
        })

        it('should override factor for child levels', () => {
            context3.set(testFactor, 'world')

            expect(context2.get(testFactor)).toBe('hello')
            expect(context3.get(testFactor)).toBe('hello')
            expect(context4.get(testFactor)).toBe('world')
        })

        it('factor("test") should return instance of factor', () => {
            expect(factor('test')).toBeInstanceOf(Factor)
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
            context1.dispath(new TestEvent('hello'))

            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('hello')

            dispose()
        })

        it('mock should to be called with "world" when event dispatch in deep', () => {
            const mock = jest.fn()
            const dispose = context1.on(TestEvent, (e) => mock(e.payload))
            context3.dispath(new TestEvent('world'))

            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('world')

            dispose()
        })

        it('mocks should to be called with "world" on every level', () => {
            const mock1 = jest.fn()
            const mock2 = jest.fn()
            const dispose1 = context1.on(TestEvent, (e) => mock1(e.payload))
            const dispose2 = context2.on(TestEvent, (e) => mock2(e.payload))
            context3.dispath(new TestEvent('world'))

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
            context3.dispath(new TestEvent('world'))

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
            context3.dispath(new TestEvent('world'))

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
            context3.dispath(new TestEvent('world'))

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
            context2.dispath(new TestEvent('world'))

            expect(mock).toBeCalledTimes(0)
        })

        it('all mocks should not to be called because they removed through .off(ev) method', () => {
            const mock1 = jest.fn()
            const mock2 = jest.fn()
            context1.on(TestEvent, mock1)
            context1.on(TestEvent, mock2)
            context1.off(TestEvent)
            context2.dispath(new TestEvent('world'))

            expect(mock1).toBeCalledTimes(0)
            expect(mock2).toBeCalledTimes(0)
        })
    })
})
