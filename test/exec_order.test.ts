import { computed } from '../src/computed'
import { observable } from '../src/observable'
import { whatsUp } from '../src/whatsup'

describe('Execution order', () => {
    it('should run build only in transaction', () => {
        const App = computed(function* App() {
            while (true) {
                yield (yield* Two) + (yield* One)
            }
        })
        const One = computed(function* One() {
            while (true) {
                Two.set(6)
                yield 3
            }
        })
        const Two = observable(5)

        const mock = jest.fn()

        whatsUp(App, mock)

        expect(mock).toBeCalledTimes(2)

        expect(mock.mock.calls).toEqual([
            [8], // First call
            [9], // Second call
        ])
    })
    it('normal updating from bottom to up', () => {
        const ids = [] as number[]
        const App = computed(function* () {
            while (true) {
                ids.push(1)
                yield yield* One
            }
        })
        const One = computed(function* () {
            while (true) {
                ids.push(2)
                yield yield* Two
            }
        })
        const Two = computed(function* () {
            while (true) {
                ids.push(3)
                yield yield* Hub
            }
        })
        const Hub = observable(1)
        const mock = jest.fn()

        whatsUp(App, mock)

        expect(mock).lastCalledWith(1)
        expect(ids).toEqual(expect.arrayContaining([1, 2, 3]))

        Hub.set(2)

        expect(mock).lastCalledWith(2)
        expect(ids).toEqual(expect.arrayContaining([1, 2, 3, 3, 2, 1]))
    })

    it(`should return 1, 2`, () => {
        const mock = jest.fn()
        const a = observable(1)

        whatsUp(a, mock)

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith(1)

        a.set(2)

        expect(mock).toBeCalledTimes(2)
        expect(mock).lastCalledWith(2)
    })

    it(`should return 1 odd, 2 even, 3 odd`, () => {
        const mock = jest.fn()
        const a = observable(1)
        const b = computed(function* () {
            while (true) {
                yield (yield* a) % 2 === 0 ? 'even' : 'odd'
            }
        })
        const c = computed(function* () {
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
})
