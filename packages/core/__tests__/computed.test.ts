import { autorun } from '../src/reactions'
import { observable } from '../src/observable'
import { computed } from '../src/computed'

describe('Computed', () => {
    it(`should react on observable change`, () => {
        const mock = jest.fn()
        const source = observable(1)
        const cell = computed(() => source() + 1)

        autorun(() => mock(cell()))

        expect(mock).lastCalledWith(2)

        source(2)

        expect(mock).lastCalledWith(3)
    })

    it(`no react after disposed`, () => {
        const mock = jest.fn()
        const source = observable(1)
        const cell = computed(() => {
            mock()
            return source() + 1
        })

        const dispose = autorun(() => cell())

        expect(mock).toBeCalledTimes(1)

        source(2)

        expect(mock).toBeCalledTimes(2)

        dispose()

        source(3)

        expect(mock).toBeCalledTimes(2)
    })

    it(`no recalc when observed`, () => {
        const mock = jest.fn()
        const source = observable(1)
        const cell = computed(() => {
            mock()
            return source() + 1
        })

        const dispose = autorun(() => cell())

        expect(mock).toBeCalledTimes(1)

        cell()

        expect(mock).toBeCalledTimes(1)

        dispose()

        cell()

        expect(mock).toBeCalledTimes(2)
    })

    it(`recalc when not observed`, () => {
        const mock = jest.fn()
        const source = observable(1)
        const cell = computed(() => {
            mock()
            return source() + 1
        })

        cell()

        expect(mock).toBeCalledTimes(1)

        cell()

        expect(mock).toBeCalledTimes(2)

        autorun(() => cell())

        expect(mock).toBeCalledTimes(3)

        cell()

        expect(mock).toBeCalledTimes(3)
    })

    it(`should react on many observables`, () => {
        const mock = jest.fn()
        const one = observable(1)
        const two = observable(2)
        const cell = computed(() => one() + two())

        autorun(() => mock(cell()))

        expect(mock).lastCalledWith(3)

        one(2)

        expect(mock).lastCalledWith(4)

        two(3)

        expect(mock).lastCalledWith(5)
    })

    it(`should decorate`, () => {
        class User {
            @observable
            firstName = 'John'

            @observable
            lastName = 'Lennon'

            @computed
            get name() {
                thisMock(this)
                return `${this.firstName} ${this.lastName}`
            }
        }

        const user = new User()
        const mock = jest.fn()
        const thisMock = jest.fn()

        autorun(() => mock(user.name))

        expect(mock).lastCalledWith('John Lennon')
        expect(thisMock).lastCalledWith(user)

        user.firstName = 'Barry'

        expect(mock).lastCalledWith('Barry Lennon')

        user.lastName = 'Don'

        expect(mock).lastCalledWith('Barry Don')
    })
})
