import { observable } from '../src/observable'
import { autorun } from '../src/reactions'

describe('Observable', () => {
    it(`should react on change`, () => {
        const mock = jest.fn()
        const num = observable(1)

        autorun(() => mock(num.get()))

        expect(mock).toBeCalledWith(1)

        num.set(2)

        expect(mock).toBeCalledWith(2)
    })

    it(`should return current value`, () => {
        const name = observable('John')

        expect(name.get()).toBe('John')
    })
})
