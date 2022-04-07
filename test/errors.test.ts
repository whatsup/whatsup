import { delegate } from '../src/delegation'
import { observable } from '../src/observable'
import { computed } from '../src/computed'
import { whatsUp } from '../src/whatsup'

describe('Errors', () => {
    describe('test catch error on parent level', () => {
        const mock = jest.fn((v) => v)
        const balance = observable(33)
        const app = computed(function* () {
            while (true) yield `user ${user.get()}`
        })
        const user = computed(function* () {
            while (true) {
                try {
                    yield `wallet ${wallet.get()}`
                } catch (e) {
                    yield `Error in user ${e}`
                }
            }
        })
        const wallet = computed(function* () {
            while (true) {
                if (balance.get() <= 0) {
                    throw 'ZEROBALANCE'
                }
                yield `balance ${balance.get()}`
            }
        })

        whatsUp(app, mock)

        it(`mock called with "user wallet balance 33"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('user wallet balance 33')
        })

        it(`mock called with "user Error in user ZEROBALANCE"`, () => {
            balance.set(-1)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('user Error in user ZEROBALANCE')
        })

        it(`when data changed & the error is fixed - mock called with "user wallet balance 10"`, () => {
            balance.set(10)
            expect(mock).toBeCalledTimes(3)
            expect(mock).lastCalledWith('user wallet balance 10')
        })
    })

    describe('test catch error on other parent levels (error propagation)', () => {
        const mock = jest.fn((v) => v)
        const balance = observable(33)
        const app = computed(function* () {
            while (true) yield `Parent ${parent.get()}`
        })
        const parent = computed(function* () {
            while (true) {
                try {
                    yield `user ${user.get()}`
                } catch (e) {
                    yield `Error in parent ${e}`
                }
            }
        })
        const user = computed(function* () {
            while (true) {
                yield `wallet ${wallet.get()}`
            }
        })
        const wallet = computed(function* () {
            while (true) {
                if (balance.get() <= 0) {
                    throw 'ZEROBALANCE'
                }
                yield `balance ${balance.get()}`
            }
        })

        whatsUp(app, mock)

        it(`mock called with "Parent user wallet balance 33"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('Parent user wallet balance 33')
        })

        it(`mock called with "Parent Error in parent ZEROBALANCE"`, () => {
            balance.set(-1)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('Parent Error in parent ZEROBALANCE')
        })

        it(`when data changed & the error is fixed - mock called with "Parent user wallet balance 10"`, () => {
            balance.set(10)
            expect(mock).toBeCalledTimes(3)
            expect(mock).lastCalledWith('Parent user wallet balance 10')
        })
    })

    describe('test throw & catch error with alive error data', () => {
        const mock = jest.fn((v) => v)
        const balance = observable(10)
        const app = computed(function* () {
            while (true) yield `user ${user.get()}`
        })
        const user = computed(function* () {
            while (true) {
                try {
                    yield `wallet ${wallet.get()}`
                } catch (e) {
                    yield `Error in user ${e}`
                }
            }
        })
        const wallet = computed(function* () {
            while (true) {
                const bal = balance.get()
                if (bal <= 0) {
                    throw `ZEROBALANCE ${bal}`
                }
                yield `balance ${bal}`
            }
        })

        whatsUp(app, mock)

        it(`mock called with "user wallet balance 10"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('user wallet balance 10')
        })

        it(`mock called with "user Error in user ZEROBALANCE -5"`, () => {
            balance.set(-5)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('user Error in user ZEROBALANCE -5')
        })

        it(`change balance & mock called with "user Error in user ZEROBALANCE -10"`, () => {
            balance.set(-10)
            expect(mock).toBeCalledTimes(3)
            expect(mock).lastCalledWith('user Error in user ZEROBALANCE -10')
        })

        it(`change balance & the error is fixed - mock called with "user wallet balance 10"`, () => {
            balance.set(10)
            expect(mock).toBeCalledTimes(4)
            expect(mock).lastCalledWith('user wallet balance 10')
        })
    })

    describe('test throw & catch error with alive error & catcher data', () => {
        const mock = jest.fn((v) => v)
        const count = observable(0)
        const balance = observable(100)
        const app = computed(function* () {
            while (true) yield `user ${user.get()}`
        })
        const user = computed(function* () {
            while (true) {
                try {
                    yield `wallet ${wallet.get()}`
                } catch (e) {
                    yield `Error in user ${e} ${count.get()}`
                }
            }
        })
        const wallet = computed(function* () {
            while (true) {
                const bal = balance.get()
                if (bal <= 0) {
                    throw `ZEROBALANCE ${bal}`
                }
                yield `balance ${bal}`
            }
        })

        whatsUp(app, mock)

        it(`mock called with "user wallet balance 100"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('user wallet balance 100')
        })

        it(`mock called with "user Error in user ZEROBALANCE -5 0"`, () => {
            balance.set(-5)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('user Error in user ZEROBALANCE -5 0')
        })

        it(`change balance & mock called with "user Error in user ZEROBALANCE -10 0"`, () => {
            balance.set(-10)
            expect(mock).toBeCalledTimes(3)
            expect(mock).lastCalledWith('user Error in user ZEROBALANCE -10 0')
        })

        it(`change Count & mock called with "user Error in user ZEROBALANCE -10 1"`, () => {
            count.set(1)
            expect(mock).toBeCalledTimes(4)
            expect(mock).lastCalledWith('user Error in user ZEROBALANCE -10 1')
        })

        it(`change balance & the error is fixed - mock called with "user wallet balance 100"`, () => {
            balance.set(100)
            expect(mock).toBeCalledTimes(5)
            expect(mock).lastCalledWith('user wallet balance 100')
        })
    })

    describe('test catch error with delegating', () => {
        const mock = jest.fn((v) => v)
        const mock2 = jest.fn((v) => v)
        const toggle = observable(true)
        const balance = observable(33)
        const app = computed(function* () {
            while (true) {
                yield `user ${user.get()}`
            }
        })
        const user = computed(function* () {
            if (toggle.get()) {
                throw delegate(wallet)
            } else {
                return delegate(wallet)
            }
        })
        const wallet = computed(function* () {
            while (true) {
                yield `balance ${balance.get()}`
            }
        })

        whatsUp(app, mock, mock2)

        it(`mock called with "user balance 33"`, () => {
            expect(mock2).toBeCalledTimes(1)
            expect(mock2).lastCalledWith(delegate(wallet))
        })

        it(`mock called with "user balance 10" always`, () => {
            toggle.set(false)
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('user balance 33')
        })

        it(`mock called with "user balance 10"`, () => {
            balance.set(10)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('user balance 10')
        })
    })
})
