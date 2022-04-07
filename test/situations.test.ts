import { computed } from '../src/computed'
import { observable } from '../src/observable'
import { whatsUp } from '../src/whatsup'

describe('Situations', () => {
    describe('test reactions with initial values', () => {
        const mock = jest.fn()
        const name = observable('John')
        const age = observable(33)
        const user = computed(function* () {
            while (true) yield `user ${name.get()} ${age.get()}`
        })

        whatsUp(user, mock)

        it(`mock called 1 time with "user John 33"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('user John 33')
        })
    })

    describe('react only on connected computeds', () => {
        const mock = jest.fn()
        const toggle = observable(true)
        const name = observable('John')
        const user = computed(function* () {
            while (true) {
                yield `user ${toggle.get() ? name.get() : 'Default'}`
            }
        })

        whatsUp(user, mock)

        it(`mock called with "user John"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('user John')
        })

        it(`change toggle to "false" and mock to be called with "user Default"`, () => {
            toggle.set(false)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('user Default')
        })

        it(`change name to "Barry" and mock not to be called`, () => {
            name.set('Barry')
            expect(mock).toBeCalledTimes(2)
        })

        it(`change toggle to "true" and mock to be called with "user Barry"`, () => {
            toggle.set(true)
            expect(mock).toBeCalledTimes(3)
            expect(mock).lastCalledWith('user Barry')
        })

        it(`change name to "Jessy" and mock to be called with "user Jessy"`, () => {
            name.set('Jessy')
            expect(mock).toBeCalledTimes(4)
            expect(mock).lastCalledWith('user Jessy')
        })
    })

    describe('test reactions on unique values only', () => {
        const mock = jest.fn()
        const name = observable<string>('John')
        const user = computed(function* () {
            while (true) yield `user ${name.get()}`
        })

        whatsUp(user, mock)

        it(`mock to be called 1 time with "user John"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('user John')
        })

        it(`again use "John" as name and mock to not be called`, () => {
            name.set('John')
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('user John')
        })

        it(`use "Barry" as name and mock to be called 1 time with "user Barry"`, () => {
            name.set('Barry')
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('user Barry')
        })
    })
})
