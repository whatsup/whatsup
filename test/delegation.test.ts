import { delegate } from '../src/delegation'
import { fractal } from '../src/fractal'
import { fraction } from '../src/fraction'
import { whatsUp } from '../src/observer'

describe('Delegating', () => {
    describe('test delegation', () => {
        const mock1 = jest.fn((v) => v)
        const mock2 = jest.fn((v) => v)
        const Trigger1 = fraction(1)
        const Trigger2 = fraction(2)
        const Trigger3 = fraction(3)
        const One = fractal(function* () {
            while (true) {
                if (mock1(yield* Trigger1) > 0) {
                    yield delegate(Two)
                } else {
                    yield delegate(Trigger3)
                }
            }
        })
        const Two = fractal(function* () {
            while (true) yield yield* Trigger2
        })
        const App = fractal(function* () {
            return mock2(yield* One)
        })

        whatsUp(App, () => {})

        it(`mock1 to be called with "1" mock2 to be called with "2"`, () => {
            expect(mock1).toBeCalledTimes(1)
            expect(mock1).lastCalledWith(1)
            expect(mock2).toBeCalledTimes(1)
            expect(mock2).lastCalledWith(2)
        })

        it(`change Trigger2 - mock1 not to be called, mock2 to be called with "22"`, () => {
            Trigger2.set(22)
            expect(mock1).toBeCalledTimes(1)
            expect(mock2).toBeCalledTimes(2)
            expect(mock2).lastCalledWith(22)
        })

        it(`change Trigger1 - mock1 to be called with "11", mock2 not to be called`, () => {
            Trigger1.set(11)
            expect(mock1).toBeCalledTimes(2)
            expect(mock1).lastCalledWith(11)
            expect(mock2).toBeCalledTimes(2)
            expect(mock2).lastCalledWith(22)
        })

        it(`change Trigger1 - mock1 to be called with "-11", mock2 to be called with "3"`, () => {
            Trigger1.set(-11)
            expect(mock1).toBeCalledTimes(3)
            expect(mock1).lastCalledWith(-11)
            expect(mock2).toBeCalledTimes(3)
            expect(mock2).lastCalledWith(3)
        })
    })

    describe('test when executor throw excepton', () => {
        const mock1 = jest.fn((v) => v)
        const mock2 = jest.fn((v) => v)
        const Trigger1 = fraction(false)
        const Trigger2 = fraction(2)
        const One = fractal(function* () {
            while (true) {
                if (yield* Trigger1) {
                    yield delegate(Two)
                } else {
                    yield delegate(Trigger2)
                }
            }
        })
        const Two = fractal(function* () {
            throw 'TWO_ERROR'
        })
        const App = fractal(function* () {
            return yield* One
        })

        whatsUp(App, mock1, mock2)

        it(`mock1 to be called with "1"`, () => {
            expect(mock1).toBeCalledTimes(1)
            expect(mock1).lastCalledWith(2)
        })

        it(`change Trigger2 - mock2 to be called with "22"`, () => {
            Trigger2.set(22)
            expect(mock1).toBeCalledTimes(2)
            expect(mock1).lastCalledWith(22)
        })

        it(`change Trigger1 - mock1 not to be called, mock2 to be called 1 time with "TWO_ERROR"`, () => {
            Trigger1.set(true)
            expect(mock1).toBeCalledTimes(2)
            expect(mock1).lastCalledWith(22)
            expect(mock2).toBeCalledTimes(1)
            expect(mock2).lastCalledWith('TWO_ERROR')
        })

        it(`change Trigger1 - mock1 to be called with "22", mock2 not to be called`, () => {
            Trigger1.set(false)
            expect(mock1).toBeCalledTimes(3)
            expect(mock1).lastCalledWith(22)
            expect(mock2).toBeCalledTimes(1)
            expect(mock2).lastCalledWith('TWO_ERROR')
        })
    })
})
