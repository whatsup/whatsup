import { observable } from '../src/observable'
import { computed } from '../src/computed'
import { mutator, comparer, filter } from '../src/mutator'
import { autorun } from '../src/reactions'

describe('Mutators', () => {
    describe('test shorthand', () => {
        let result: any
        let kickstart: () => void
        const increment = mutator<number>((prev = 0) => prev + 1)
        const output = computed(function* () {
            const trigger = observable(0)

            kickstart = () => trigger(Math.random())

            while (true) {
                trigger()
                yield increment
            }
        })

        autorun(() => (result = output()))

        it(`should return 1`, () => {
            expect(result).toBe(1)
        })

        it(`should return 2`, () => {
            kickstart()
            expect(result).toBe(2)
        })

        it(`should return 3`, () => {
            kickstart()
            expect(result).toBe(3)
        })
    })

    it('should comparer prevent recalculations', () => {
        const eqArr = comparer<any[]>((n, p) => !!p && n.length === p.length && n.every((v, i) => p[i] === v))
        const mock = jest.fn()
        const input = observable([1, 2, 3])
        const output = computed(() => eqArr(input()))

        autorun(() => mock(output()))

        expect(mock).toBeCalledTimes(1)

        input([1, 2, 3])

        expect(mock).toBeCalledTimes(1)

        input([1, 2])

        expect(mock).toBeCalledTimes(2)

        input([1, 2])

        expect(mock).toBeCalledTimes(2)
    })

    it('should filter data', () => {
        const even = filter<number>((n) => n % 2 === 0)
        const mock = jest.fn()
        const input = observable(0)
        const output = computed(() => even(input()))

        autorun(() => mock(output()))

        expect(mock).toBeCalledTimes(1)
        expect(mock).toBeCalledWith(0)

        input(1)

        expect(mock).toBeCalledTimes(1)
        expect(mock).toBeCalledWith(0)

        input(2)

        expect(mock).toBeCalledTimes(2)
        expect(mock).toBeCalledWith(2)

        input(3)

        expect(mock).toBeCalledTimes(2)
        expect(mock).toBeCalledWith(2)
    })
})
