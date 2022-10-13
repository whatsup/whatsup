import { autorun } from '../src/reactions'
import { computed } from '../src/computed'
import { observable } from '../src/observable'

describe('Execution order', () => {
    it('should run build only in process', () => {
        const app = computed(function* App() {
            while (true) {
                yield two() + one()
            }
        })
        const one = computed(function* One() {
            while (true) {
                two(6)
                yield 3
            }
        })
        const two = observable(5)

        const mock = jest.fn()

        autorun(() => mock(app()))

        expect(mock).toBeCalledTimes(2)

        expect(mock.mock.calls).toEqual([
            [8], // First call
            [9], // Second call
        ])
    })
    it('normal updating from bottom to up', () => {
        const ids = [] as number[]
        const app = computed(function* () {
            while (true) {
                ids.push(1)
                yield one()
            }
        })
        const one = computed(function* () {
            while (true) {
                ids.push(2)
                yield two()
            }
        })
        const two = computed(function* () {
            while (true) {
                ids.push(3)
                yield hub()
            }
        })
        const hub = observable(1)
        const mock = jest.fn()

        autorun(() => mock(app()))

        expect(mock).lastCalledWith(1)
        expect(ids).toEqual(expect.arrayContaining([1, 2, 3]))

        hub(2)

        expect(mock).lastCalledWith(2)
        expect(ids).toEqual(expect.arrayContaining([1, 2, 3, 3, 2, 1]))
    })

    it(`should return 1, 2`, () => {
        const mock = jest.fn()
        const a = observable(1)

        autorun(() => mock(a()))

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith(1)

        a(2)

        expect(mock).toBeCalledTimes(2)
        expect(mock).lastCalledWith(2)
    })

    it(`should return 1 odd, 2 even, 3 odd`, () => {
        const mock = jest.fn()
        const a = observable(1)
        const b = computed(function* () {
            while (true) {
                yield a() % 2 === 0 ? 'even' : 'odd'
            }
        })
        const c = computed(function* () {
            while (true) {
                yield `${a()} ${b()}`
            }
        })

        autorun(() => mock(c()))

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith('1 odd')

        a(2)

        expect(mock).toBeCalledTimes(2)
        expect(mock).lastCalledWith('2 even')

        a(3)

        expect(mock).toBeCalledTimes(3)
        expect(mock).lastCalledWith('3 odd')
    })
})
