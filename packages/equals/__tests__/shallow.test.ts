import { autorun, computed, observable } from '@whatsup/core'
import { shallow } from '../src/shallow'

describe('Shallow', () => {
    it('should prevent recalc shallow arrays', () => {
        const mock = jest.fn()
        const input = observable([1, 2, 3])
        const output = computed(() => shallow(input()))

        autorun(() => mock(output()))

        expect(mock).toBeCalledTimes(1)

        input([1, 2, 3])

        expect(mock).toBeCalledTimes(1)

        input([1, 2])

        expect(mock).toBeCalledTimes(2)

        input([1, 2])

        expect(mock).toBeCalledTimes(2)
    })
    it('should prevent recalc shallow objects', () => {
        const mock = jest.fn()
        const input = observable<{}>({ a: 1 })
        const output = computed(() => shallow(input()))

        autorun(() => mock(output()))

        expect(mock).toBeCalledTimes(1)

        input({ a: 1 })

        expect(mock).toBeCalledTimes(1)

        input({ b: 1 })

        expect(mock).toBeCalledTimes(2)

        input({ b: 1 })

        expect(mock).toBeCalledTimes(2)
    })
})
