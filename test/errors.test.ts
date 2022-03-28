import { delegate } from '../src/delegation'
import { observable } from '../src/observable'
import { component } from '../src/component'
import { whatsUp } from '../src/whatsup'

describe('Errors', () => {
    describe('test catch error on parent level', () => {
        const mock = jest.fn((v) => v)
        const Balance = observable(33)
        const App = component(function* () {
            while (true) yield `User ${yield* User}`
        })
        const User = component(function* () {
            while (true) {
                try {
                    yield `Wallet ${yield* Wallet}`
                } catch (e) {
                    yield `Error in user ${e}`
                }
            }
        })
        const Wallet = component(function* () {
            while (true) {
                if ((yield* Balance) <= 0) {
                    throw 'ZEROBALANCE'
                }
                yield `Balance ${yield* Balance}`
            }
        })

        whatsUp(App, mock)

        it(`mock called with "User Wallet Balance 33"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User Wallet Balance 33')
        })

        it(`mock called with "User Error in user ZEROBALANCE"`, () => {
            Balance.set(-1)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('User Error in user ZEROBALANCE')
        })

        it(`when data changed & the error is fixed - mock called with "User Wallet Balance 10"`, () => {
            Balance.set(10)
            expect(mock).toBeCalledTimes(3)
            expect(mock).lastCalledWith('User Wallet Balance 10')
        })
    })

    describe('test catch error on other parent levels (error propagation)', () => {
        const mock = jest.fn((v) => v)
        const Balance = observable(33)
        const App = component(function* () {
            while (true) yield `Parent ${yield* Parent}`
        })
        const Parent = component(function* () {
            while (true) {
                try {
                    yield `User ${yield* User}`
                } catch (e) {
                    yield `Error in parent ${e}`
                }
            }
        })
        const User = component(function* () {
            while (true) {
                yield `Wallet ${yield* Wallet}`
            }
        })
        const Wallet = component(function* () {
            while (true) {
                if ((yield* Balance) <= 0) {
                    throw 'ZEROBALANCE'
                }
                yield `Balance ${yield* Balance}`
            }
        })

        whatsUp(App, mock)

        it(`mock called with "Parent User Wallet Balance 33"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('Parent User Wallet Balance 33')
        })

        it(`mock called with "Parent Error in parent ZEROBALANCE"`, () => {
            Balance.set(-1)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('Parent Error in parent ZEROBALANCE')
        })

        it(`when data changed & the error is fixed - mock called with "Parent User Wallet Balance 10"`, () => {
            Balance.set(10)
            expect(mock).toBeCalledTimes(3)
            expect(mock).lastCalledWith('Parent User Wallet Balance 10')
        })
    })

    describe('test throw & catch error with alive error data', () => {
        const mock = jest.fn((v) => v)
        const Balance = observable(10)
        const App = component(function* () {
            while (true) yield `User ${yield* User}`
        })
        const User = component(function* () {
            while (true) {
                try {
                    yield `Wallet ${yield* Wallet}`
                } catch (e) {
                    yield `Error in user ${e}`
                }
            }
        })
        const Wallet = component(function* () {
            while (true) {
                const balance = yield* Balance
                if (balance <= 0) {
                    throw `ZEROBALANCE ${balance}`
                }
                yield `Balance ${balance}`
            }
        })

        whatsUp(App, mock)

        it(`mock called with "User Wallet Balance 10"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User Wallet Balance 10')
        })

        it(`mock called with "User Error in user ZEROBALANCE -5"`, () => {
            Balance.set(-5)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('User Error in user ZEROBALANCE -5')
        })

        it(`change Balance & mock called with "User Error in user ZEROBALANCE -10"`, () => {
            Balance.set(-10)
            expect(mock).toBeCalledTimes(3)
            expect(mock).lastCalledWith('User Error in user ZEROBALANCE -10')
        })

        it(`change Balance & the error is fixed - mock called with "User Wallet Balance 10"`, () => {
            Balance.set(10)
            expect(mock).toBeCalledTimes(4)
            expect(mock).lastCalledWith('User Wallet Balance 10')
        })
    })

    describe('test throw & catch error with alive error & catcher data', () => {
        const mock = jest.fn((v) => v)
        const Count = observable(0)
        const Balance = observable(100)
        const App = component(function* () {
            while (true) yield `User ${yield* User}`
        })
        const User = component(function* () {
            while (true) {
                try {
                    yield `Wallet ${yield* Wallet}`
                } catch (e) {
                    yield `Error in user ${e} ${yield* Count}`
                }
            }
        })
        const Wallet = component(function* () {
            while (true) {
                const balance = yield* Balance
                if (balance <= 0) {
                    throw `ZEROBALANCE ${balance}`
                }
                yield `Balance ${balance}`
            }
        })

        whatsUp(App, mock)

        it(`mock called with "User Wallet Balance 100"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User Wallet Balance 100')
        })

        it(`mock called with "User Error in user ZEROBALANCE -5 0"`, () => {
            Balance.set(-5)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('User Error in user ZEROBALANCE -5 0')
        })

        it(`change Balance & mock called with "User Error in user ZEROBALANCE -10 0"`, () => {
            Balance.set(-10)
            expect(mock).toBeCalledTimes(3)
            expect(mock).lastCalledWith('User Error in user ZEROBALANCE -10 0')
        })

        it(`change Count & mock called with "User Error in user ZEROBALANCE -10 1"`, () => {
            Count.set(1)
            expect(mock).toBeCalledTimes(4)
            expect(mock).lastCalledWith('User Error in user ZEROBALANCE -10 1')
        })

        it(`change Balance & the error is fixed - mock called with "User Wallet Balance 100"`, () => {
            Balance.set(100)
            expect(mock).toBeCalledTimes(5)
            expect(mock).lastCalledWith('User Wallet Balance 100')
        })
    })

    describe('test catch error with delegating', () => {
        const mock = jest.fn((v) => v)
        const mock2 = jest.fn((v) => v)
        const Toggle = observable(true)
        const Balance = observable(33)
        const App = component(function* () {
            while (true) {
                yield `User ${yield* User}`
            }
        })
        const User = component(function* () {
            if (yield* Toggle) {
                throw delegate(Wallet)
            } else {
                return delegate(Wallet)
            }
        })
        const Wallet = component(function* () {
            while (true) {
                yield `Balance ${yield* Balance}`
            }
        })

        whatsUp(App, mock, mock2)

        it(`mock called with "User Balance 33"`, () => {
            expect(mock2).toBeCalledTimes(1)
            expect(mock2).lastCalledWith(delegate(Wallet))
        })

        it(`mock called with "User Balance 10" always`, () => {
            Toggle.set(false)
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User Balance 33')
        })

        it(`mock called with "User Balance 10"`, () => {
            Balance.set(10)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('User Balance 10')
        })
    })
})
