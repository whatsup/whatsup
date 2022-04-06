import { computed } from '../src/computed'
import { observable } from '../src/observable'
import { whatsUp } from '../src/whatsup'

describe('Situations', () => {
    describe('test reactions with initial values', () => {
        const mock = jest.fn()
        const Name = observable('John')
        const Age = observable(33)
        const User = computed(function* () {
            while (true) yield `User ${yield* Name} ${yield* Age}`
        })

        whatsUp(User, mock)

        it(`mock called 1 time with "User John 33"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User John 33')
        })
    })

    describe('react only on connected computeds', () => {
        const mock = jest.fn()
        const Switch = observable(true)
        const Name = observable('John')
        const User = computed(function* () {
            while (true) {
                yield `User ${(yield* Switch) ? yield* Name : 'Default'}`
            }
        })

        whatsUp(User, mock)

        it(`mock called with "User John"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User John')
        })

        it(`change Switch to "false" and mock to be called with "User Default"`, () => {
            Switch.set(false)
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('User Default')
        })

        it(`change name to "Barry" and mock not to be called`, () => {
            Name.set('Barry')
            expect(mock).toBeCalledTimes(2)
        })

        it(`change Switch to "true" and mock to be called with "User Barry"`, () => {
            Switch.set(true)
            expect(mock).toBeCalledTimes(3)
            expect(mock).lastCalledWith('User Barry')
        })

        it(`change name to "Jessy" and mock to be called with "User Jessy"`, () => {
            Name.set('Jessy')
            expect(mock).toBeCalledTimes(4)
            expect(mock).lastCalledWith('User Jessy')
        })
    })

    describe('test reactions on unique values only', () => {
        const mock = jest.fn()
        const Name = observable<string>('John')
        const User = computed(function* () {
            while (true) yield `User ${yield* Name}`
        })

        whatsUp(User, mock)

        it(`mock to be called 1 time with "User John"`, () => {
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User John')
        })

        it(`again use "John" as Name and mock to not be called`, () => {
            Name.set('John')
            expect(mock).toBeCalledTimes(1)
            expect(mock).lastCalledWith('User John')
        })

        it(`use "Barry" as Name and mock to be called 1 time with "User Barry"`, () => {
            Name.set('Barry')
            expect(mock).toBeCalledTimes(2)
            expect(mock).lastCalledWith('User Barry')
        })
    })
})
