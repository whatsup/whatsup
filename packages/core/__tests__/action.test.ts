import { runInAction, action } from '../src/action'
import { observable } from '../src/observable'
import { computed } from '../src/computed'
import { autorun } from '../src/reactions'

describe('Action', () => {
    it(`Should run all changes in single transaction`, () => {
        const mock = jest.fn()
        const a = observable('a')
        const b = observable('b')
        const c = computed(function* () {
            while (true) {
                yield `${a.get()}${b.get()}c`
            }
        })
        autorun(() => mock(c.get()))

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith('abc')

        runInAction(() => {
            a.set('A')
            b.set('B')
        })
        expect(mock).toBeCalledTimes(2)
        expect(mock).nthCalledWith(2, 'ABc')
    })
    it(`Should decorate method and run all changes in single transaction`, () => {
        const mock = jest.fn()

        class User {
            @observable
            firstName = 'John'

            @observable
            lastName = 'Lennon'

            @computed
            get name() {
                return `${this.firstName} ${this.lastName}`
            }

            @action
            setName(firstName: string, lastName: string) {
                this.firstName = firstName
                this.lastName = lastName
            }
        }

        const user = new User()

        autorun(() => mock(user.name))

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith('John Lennon')

        user.setName('Barry', 'Chu')

        expect(mock).toBeCalledTimes(2)
        expect(mock).nthCalledWith(2, 'Barry Chu')
    })
    it(`Should create action method and run all changes in single transaction`, () => {
        const mock = jest.fn()

        class User {
            @observable
            firstName = 'John'

            @observable
            lastName = 'Lennon'

            @computed
            get name() {
                return `${this.firstName} ${this.lastName}`
            }
        }

        const user = new User()
        const setName = action((firstName: string, lastName: string) => {
            user.firstName = firstName
            user.lastName = lastName
        })

        autorun(() => mock(user.name))

        expect(mock).toBeCalledTimes(1)
        expect(mock).lastCalledWith('John Lennon')

        setName('Barry', 'Chu')

        expect(mock).toBeCalledTimes(2)
        expect(mock).nthCalledWith(2, 'Barry Chu')
    })
})
