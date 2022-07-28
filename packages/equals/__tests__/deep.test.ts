import { autorun, computed, observable } from '@whatsup/core'
import { deep } from '../src/deep'

describe('Deep', () => {
    it('should prevent recalc deep arrays', () => {
        const mock = jest.fn()
        const input = observable([1, 2, [1, {}, null]])
        const output = computed(() => deep(input()))

        autorun(() => mock(output()))

        expect(mock).toBeCalledTimes(1)

        input([1, 2, [1, {}, null]])

        expect(mock).toBeCalledTimes(1)

        input([1, 2])

        expect(mock).toBeCalledTimes(2)

        input([1, 2])

        expect(mock).toBeCalledTimes(2)
    })
    it('should prevent recalc deep objects', () => {
        const mock = jest.fn()
        const input = observable<{}>({ a: 1, b: { a: [1, 2, 3] } })
        const output = computed(() => deep(input()))

        autorun(() => mock(output()))

        expect(mock).toBeCalledTimes(1)

        input({ a: 1, b: { a: [1, 2, 3] } })

        expect(mock).toBeCalledTimes(1)

        input({ b: 1 })

        expect(mock).toBeCalledTimes(2)

        input({ b: 1 })

        expect(mock).toBeCalledTimes(2)
    })
})
