import { transaction } from '../src/scheduler'
import { observable } from '../src/observable'
import { computed } from '../src/computed'
import { watch } from '../src'

describe('Scheduler', () => {
    it(`Should run every change in personal transaction`, () => {
        const mock = jest.fn()
        const a = observable('a')
        const b = observable('b')
        const c = computed(function* () {
            while (true) {
                yield `${yield* a}${yield* b}c`
            }
        })
        watch(c, mock)

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith('abc')

        a.set('A')
        b.set('B')

        expect(mock).toBeCalledTimes(3)
        expect(mock).nthCalledWith(2, 'Abc')
        expect(mock).nthCalledWith(3, 'ABc')
    })

    it(`Should run all changes in single transaction`, () => {
        const mock = jest.fn()
        const a = observable('a')
        const b = observable('b')
        const c = computed(function* () {
            while (true) {
                yield `${yield* a}${yield* b}c`
            }
        })
        watch(c, mock)

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith('abc')

        transaction(() => {
            a.set('A')
            b.set('B')
        })
        expect(mock).toBeCalledTimes(2)
        expect(mock).nthCalledWith(2, 'ABc')
    })

    it(`Should create slave transaction when call 'transaction' inside transaction`, () => {
        const mockB = jest.fn()
        const mockC = jest.fn()
        const a = observable('a')
        const b = computed(function* () {
            while (true) {
                c.set(`${yield* a}b`)
                yield `${yield* a}b`
            }
        })
        const c = observable('c')

        watch(c, mockC)

        expect(mockC).toBeCalledTimes(1)
        expect(mockC).lastCalledWith('c')

        watch(b, mockB)

        expect(mockB).toBeCalledTimes(1)
        expect(mockB).lastCalledWith('ab')

        a.set('A')

        expect(mockB).toBeCalledTimes(2)
        expect(mockB).lastCalledWith('Ab')
        expect(mockC).toBeCalledTimes(3)
        expect(mockC).lastCalledWith('Ab')
    })

    it(`Should create & add atoms to current slave transaction when call 'transaction' inside transaction`, () => {
        const mockB = jest.fn()
        const mockC = jest.fn()
        const mockD = jest.fn()
        const a = observable('a')
        const b = computed(function* () {
            while (true) {
                c.set(`${yield* a}b`)
                d.set(`${yield* a}b`)
                yield `${yield* a}b`
            }
        })
        const c = observable('c')
        const d = observable('d')

        watch(d, mockD)

        expect(mockD).toBeCalledTimes(1)
        expect(mockD).lastCalledWith('d')

        watch(c, mockC)

        expect(mockC).toBeCalledTimes(1)
        expect(mockC).lastCalledWith('c')

        watch(b, mockB)

        expect(mockB).toBeCalledTimes(1)
        expect(mockB).lastCalledWith('ab')

        a.set('A')

        expect(mockB).toBeCalledTimes(2)
        expect(mockB).lastCalledWith('Ab')
        expect(mockD).toBeCalledTimes(3)
        expect(mockD).lastCalledWith('Ab')
        expect(mockD).toBeCalledTimes(3)
        expect(mockD).lastCalledWith('Ab')
    })
})
