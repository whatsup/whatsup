import { cause } from '../src/cause'
import { conse } from '../src/conse'
import { delegate } from '../src/delegation'
import { whatsUp } from '../src/whatsup'

describe('Disposing', () => {
    it(`should dispose deps when dispose callback called`, () => {
        const mock = jest.fn()
        const mockA = jest.fn()
        const a = cause(function* () {
            try {
                while (true) {
                    yield 'A'
                }
            } finally {
                mockA()
            }
        })

        const dispose = whatsUp(a, mock)

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith('A')

        dispose()

        expect(mockA).toBeCalledTimes(1)
    })

    it(`should dispose nested deps when dispose callback called`, () => {
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

    it(`should dispose unused deps`, () => {
        const mock = jest.fn()
        const mockB = jest.fn()
        const toggle = conse(true)
        const a = cause(function* () {
            while (true) {
                yield (yield* toggle) ? yield* b : 'A'
            }
        })
        const b = cause(function* () {
            try {
                while (true) {
                    yield 'B'
                }
            } finally {
                mockB()
            }
        })

        const dispose = whatsUp(a, mock)

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith('B')

        toggle.set(false)

        expect(mockB).toBeCalledTimes(1)

        dispose()
    })

    it(`should dispose unused deps when inside generator used delegation`, () => {
        const mock = jest.fn()
        const mockB = jest.fn()
        const toggle = conse(true)
        const a = cause(function* () {
            while (true) {
                yield (yield* toggle) ? yield delegate(b) : 'A'
            }
        })
        const b = cause(function* () {
            try {
                while (true) {
                    yield 'B'
                }
            } finally {
                mockB()
            }
        })

        const dispose = whatsUp(a, mock)

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith('B')

        toggle.set(false)

        expect(mockB).toBeCalledTimes(1)

        dispose()
    })

    it(`should dispose unused deps when inside generator used return statement `, () => {
        const mock = jest.fn()
        const mockB = jest.fn()
        const toggle = conse(true)
        const a = cause(function* () {
            return (yield* toggle) ? yield* b : 'A'
        })
        const b = cause(function* () {
            try {
                while (true) {
                    yield 'B'
                }
            } finally {
                mockB()
            }
        })

        const dispose = whatsUp(a, mock)

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith('B')

        toggle.set(false)

        expect(mockB).toBeCalledTimes(1)

        dispose()
    })

    it(`should dispose unused deps when inside generator used return statement & delegation`, () => {
        const mock = jest.fn()
        const mockB = jest.fn()
        const toggle = conse(true)
        const a = cause(function* () {
            return (yield* toggle) ? yield delegate(b) : 'A'
        })
        const b = cause(function* () {
            try {
                while (true) {
                    yield 'B'
                }
            } finally {
                mockB()
            }
        })

        const dispose = whatsUp(a, mock)

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith('B')

        toggle.set(false)

        expect(mockB).toBeCalledTimes(1)

        dispose()
    })
})
