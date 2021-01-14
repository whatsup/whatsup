import { fractal } from '../src/fractal'
import { conse } from '../src/conse'
import { cause } from '../src/cause'
import { whatsUp } from '../src/observer'

describe('Execution order', () => {
    it('normal updating from bottom to up', async () => {
        const ids = [] as number[]
        const App = fractal(function* () {
            while (true) {
                ids.push(1)
                yield yield* One
            }
        })
        const One = fractal(function* () {
            while (true) {
                ids.push(2)
                yield yield* Two
            }
        })
        const Two = fractal(function* () {
            while (true) {
                ids.push(3)
                yield yield* Hub
            }
        })
        const Hub = conse(1)
        const mock = jest.fn()

        whatsUp(App, mock)

        expect(mock).lastCalledWith(1)
        expect(ids).toEqual(expect.arrayContaining([1, 2, 3]))

        Hub.set(2)

        expect(mock).lastCalledWith(2)
        expect(ids).toEqual(expect.arrayContaining([1, 2, 3, 3, 2, 1]))
    })

    it(`should return 1, 2`, async () => {
        const mock = jest.fn()
        const a = conse(1)

        whatsUp(a, mock)

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith(1)

        a.set(2)

        expect(mock).toBeCalledTimes(2)
        expect(mock).lastCalledWith(2)
    })

    it(`should return 1 odd, 2 even, 3 odd`, async () => {
        const mock = jest.fn()
        const a = conse(1)
        const b = cause(function* () {
            while (true) {
                yield (yield* a) % 2 === 0 ? 'even' : 'odd'
            }
        })
        const c = cause(function* () {
            while (true) {
                yield `${yield* a} ${yield* b}`
            }
        })

        whatsUp(c, mock)

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith('1 odd')

        a.set(2)

        expect(mock).toBeCalledTimes(2)
        expect(mock).lastCalledWith('2 even')

        a.set(3)

        expect(mock).toBeCalledTimes(3)
        expect(mock).lastCalledWith('3 odd')
    })

    it(`should dispose deps`, async () => {
        const mock = jest.fn()
        const mockA = jest.fn()
        const mockB = jest.fn()
        const mockC = jest.fn()
        const a = cause(function* () {
            try {
                while (true) {
                    yield 'A'
                }
            } finally {
                mockA()
            }
        })
        const b = cause(function* () {
            try {
                while (true) {
                    yield `${yield* a}B`
                }
            } finally {
                mockB()
            }
        })
        const c = cause(function* () {
            try {
                while (true) {
                    yield `${yield* a}${yield* b}C`
                }
            } finally {
                mockC()
            }
        })

        const dispose = whatsUp(c, mock)

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith('AABC')

        dispose()

        expect(mockA).toBeCalledTimes(1)
        expect(mockB).toBeCalledTimes(1)
        expect(mockC).toBeCalledTimes(1)
    })
})
