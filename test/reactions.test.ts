import { hole } from '../src/hole'
import { sing } from '../src/singularity'
import { watch } from '../src/watcher'

describe('Reactions', () => {
    it(`should return 1, 2`, async () => {
        const mock = jest.fn()
        const a = hole(1)

        watch(a, mock)

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith(1)

        a.set(2)

        expect(mock).toBeCalledTimes(2)
        expect(mock).lastCalledWith(2)
    })

    it(`should return 1 odd, 2 even, 3 odd`, async () => {
        const mock = jest.fn()
        const a = hole(1)
        const b = sing(function* () {
            while (true) {
                yield (yield* a) % 2 === 0 ? 'even' : 'odd'
            }
        })
        const c = sing(function* () {
            while (true) {
                yield `${yield* a} ${yield* b}`
            }
        })

        watch(c, mock)

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith('1 odd')

        a.set(2)

        expect(mock).toBeCalledTimes(2)
        expect(mock).lastCalledWith('2 even')

        a.set(3)

        expect(mock).toBeCalledTimes(3)
        expect(mock).lastCalledWith('3 odd')
    })

    it(`should destroy deps`, async () => {
        const mock = jest.fn()
        const mockA = jest.fn()
        const mockB = jest.fn()
        const mockC = jest.fn()
        const a = sing(function* () {
            try {
                while (true) {
                    yield 'A'
                }
            } finally {
                mockA()
            }
        })
        const b = sing(function* () {
            try {
                while (true) {
                    yield `${yield* a}B`
                }
            } finally {
                mockB()
            }
        })
        const c = sing(function* () {
            try {
                while (true) {
                    yield `${yield* a}${yield* b}C`
                }
            } finally {
                mockC()
            }
        })

        const destroy = watch(c, mock)

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith('AABC')

        destroy()

        expect(mockA).toBeCalledTimes(1)
        expect(mockB).toBeCalledTimes(1)
        expect(mockC).toBeCalledTimes(1)
    })
})
