import { fractal } from '../src/fractal'
import { fraction } from '../src/fraction'
import { live } from '../src/runners'

describe('synchronization', () => {
    const delay = (time: number) => new Promise((r) => setTimeout(r, time))

    describe('scenario 1', () => {
        const mock = jest.fn()
        const One = fraction(10)
        const Thr = fractal(async function* () {
            while (true) {
                const one = yield* One
                await delay(200)
                yield one
            }
        })
        const Root = fractal(async function* () {
            while (true) {
                yield mock(yield* Thr)
            }
        })

        it(`should call mock with 10`, async () => {
            live(Root)
            await delay(250)
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith(10)
        })

        it(`should call mock with 30`, async () => {
            One.set(20)
            await delay(100)
            One.set(30)
            await delay(500)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith(30)
        })

        it(`should call mock with 50`, async () => {
            One.set(40)
            One.set(50)
            await delay(250)
            expect(mock).toBeCalledTimes(3)
            expect(mock).lastCalledWith(50)
        })
    })

    describe('scenario 2', () => {
        const mock = jest.fn()
        const One = fraction(1)
        const Two = fraction(1)
        const Thr = fractal(async function* () {
            while (true) {
                const one = yield* One

                if (one > 0) {
                    const two = yield* Two
                    yield one + two
                } else {
                    await delay(200)
                    yield one
                }
            }
        })
        const Root = fractal(async function* () {
            while (true) {
                yield mock(yield* Thr)
            }
        })

        it(`should call mock with 2`, async () => {
            live(Root)
            await delay(100)
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith(2)
        })

        it(`should call mock with -2`, async () => {
            One.set(-2)
            await delay(100)
            Two.set(3)
            await delay(200)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith(-2)
        })
    })

    describe('scenario 3', () => {
        const mock = jest.fn()
        const One = fraction(100)
        const Two = fractal(async function* () {
            while (true) {
                yield (yield* One) + 100
            }
        })
        const Thr = fractal(async function* () {
            while (true) {
                yield (yield* One) + (yield* Two)
            }
        })
        const Root = fractal(async function* () {
            while (true) {
                yield mock(yield* Thr)
            }
        })

        it(`should call mock with 300`, async () => {
            live(Root)
            await delay(100)
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith(300)
        })

        it(`should call mock with 500`, async () => {
            One.set(200)
            await delay(100)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith(500)
        })
    })
})
