import { observable } from '../src/observable'
import { autorun } from '../src/reactions'

describe('Observable', () => {
    it(`should react on change`, () => {
        const mock = jest.fn()
        const num = observable(1)

        autorun(() => mock(num()))

        expect(mock).lastCalledWith(1)

        num(2)

        expect(mock).lastCalledWith(2)
    })

    it(`should return current value`, () => {
        const name = observable('John')

        expect(name()).toBe('John')
    })

    it(`should decorate`, () => {
        class User {
            @observable
            name = 'John'
        }

        const user = new User()
        const mock = jest.fn()

        autorun(() => mock(user.name))

        expect(mock).lastCalledWith('John')

        user.name = 'Barry'

        expect(mock).lastCalledWith('Barry')
    })
})
