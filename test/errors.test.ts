import { fractal } from '../src/fractal'
import { fraction } from '../src/fraction'
import { live } from '../src/runners'

describe('Errors', () => {
    const delay = (time: number) => new Promise((r) => setTimeout(r, time))

    describe('test catch error on parent level', () => {
        const mock = jest.fn((v) => v)
        const Balance = fraction(33)
        const App = fractal(async function* () {
            while (true) yield mock(`User ${yield* User}`)
        })
        const User = fractal(async function* () {
            while (true) {
                try {
                    yield `Wallet ${yield* Wallet}`
                } catch (e) {
                    yield `Error in user ${e}`
                }
            }
        })
        const Wallet = fractal(async function* () {
            while (true) {
                if ((yield* Balance) <= 0) {
                    throw 'ZEROBALANCE'
                }
                yield `Balance ${yield* Balance}`
            }
        })

        it(`mock called with "User Wallet Balance 33"`, async () => {
            live(App)
            await delay(100)
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User Wallet Balance 33')
        })

        it(`mock called with "User Error in user ZEROBALANCE"`, async () => {
            Balance.set(-1)
            await delay(100)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('User Error in user ZEROBALANCE')
        })

        it(`when data changed & the error is fixed - mock called with "User Wallet Balance 10"`, async () => {
            Balance.set(10)
            await delay(100)
            expect(mock).toBeCalledTimes(3)
            expect(mock).lastCalledWith('User Wallet Balance 10')
        })
    })

    describe('test catch error on other parent levels (error propagation)', () => {
        const mock = jest.fn((v) => v)
        const Balance = fraction(33)
        const App = fractal(async function* () {
            while (true) yield mock(`Parent ${yield* Parent}`)
        })
        const Parent = fractal(async function* () {
            while (true) {
                try {
                    yield `User ${yield* User}`
                } catch (e) {
                    yield `Error in parent ${e}`
                }
            }
        })
        const User = fractal(async function* () {
            while (true) {
                yield `Wallet ${yield* Wallet}`
            }
        })
        const Wallet = fractal(async function* () {
            while (true) {
                if ((yield* Balance) <= 0) {
                    throw 'ZEROBALANCE'
                }
                yield `Balance ${yield* Balance}`
            }
        })

        it(`mock called with "Parent User Wallet Balance 33"`, async () => {
            live(App)
            await delay(100)
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('Parent User Wallet Balance 33')
        })

        it(`mock called with "Parent Error in parent ZEROBALANCE"`, async () => {
            Balance.set(-1)
            await delay(100)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('Parent Error in parent ZEROBALANCE')
        })

        it(`when data changed & the error is fixed - mock called with "Parent User Wallet Balance 10"`, async () => {
            Balance.set(10)
            await delay(100)
            expect(mock).toBeCalledTimes(3)
            expect(mock).lastCalledWith('Parent User Wallet Balance 10')
        })
    })

    describe('test throw & catch error with alive error data', () => {
        const mock = jest.fn((v) => v)
        const Balance = fraction(10)
        const App = fractal(async function* () {
            while (true) yield mock(`User ${yield* User}`)
        })
        const User = fractal(async function* () {
            while (true) {
                try {
                    yield `Wallet ${yield* Wallet}`
                } catch (e) {
                    yield `Error in user ${e}`
                }
            }
        })
        const Wallet = fractal(async function* () {
            while (true) {
                const balance = yield* Balance
                if (balance <= 0) {
                    throw `ZEROBALANCE ${balance}`
                }
                yield `Balance ${balance}`
            }
        })

        it(`mock called with "User Wallet Balance 10"`, async () => {
            live(App)
            await delay(100)
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User Wallet Balance 10')
        })

        it(`mock called with "User Error in user ZEROBALANCE -5"`, async () => {
            Balance.set(-5)
            await delay(100)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('User Error in user ZEROBALANCE -5')
        })

        it(`change Balance & mock called with "User Error in user ZEROBALANCE -10"`, async () => {
            Balance.set(-10)
            await delay(100)
            expect(mock).toBeCalledTimes(3)
            expect(mock).lastCalledWith('User Error in user ZEROBALANCE -10')
        })

        it(`change Balance & the error is fixed - mock called with "User Wallet Balance 10"`, async () => {
            Balance.set(10)
            await delay(100)
            expect(mock).toBeCalledTimes(4)
            expect(mock).lastCalledWith('User Wallet Balance 10')
        })
    })

    describe('test throw & catch error with alive error & catcher data', () => {
        const mock = jest.fn((v) => v)
        const Count = fraction(0)
        const Balance = fraction(100)
        const App = fractal(async function* () {
            while (true) yield mock(`User ${yield* User}`)
        })
        const User = fractal(async function* () {
            while (true) {
                try {
                    yield `Wallet ${yield* Wallet}`
                } catch (e) {
                    yield `Error in user ${e} ${yield* Count}`
                }
            }
        })
        const Wallet = fractal(async function* () {
            while (true) {
                const balance = yield* Balance
                if (balance <= 0) {
                    throw `ZEROBALANCE ${balance}`
                }
                yield `Balance ${balance}`
            }
        })

        it(`mock called with "User Wallet Balance 100"`, async () => {
            live(App)
            await delay(100)
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User Wallet Balance 100')
        })

        it(`mock called with "User Error in user ZEROBALANCE -5 0"`, async () => {
            Balance.set(-5)
            await delay(100)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('User Error in user ZEROBALANCE -5 0')
        })

        it(`change Balance & mock called with "User Error in user ZEROBALANCE -10 0"`, async () => {
            Balance.set(-10)
            await delay(100)
            expect(mock).toBeCalledTimes(3)
            expect(mock).lastCalledWith('User Error in user ZEROBALANCE -10 0')
        })

        it(`change Count & mock called with "User Error in user ZEROBALANCE -10 1"`, async () => {
            Count.set(1)
            await delay(100)
            expect(mock).toBeCalledTimes(4)
            expect(mock).lastCalledWith('User Error in user ZEROBALANCE -10 1')
        })

        it(`change Balance & the error is fixed - mock called with "User Wallet Balance 100"`, async () => {
            Balance.set(100)
            await delay(100)
            expect(mock).toBeCalledTimes(5)
            expect(mock).lastCalledWith('User Wallet Balance 100')
        })
    })
})
